-- Apply after 20261026120000_dual_gateway_tracking.sql. No existing rows change.
BEGIN;
CREATE TABLE public.icici_uat_checkouts (
  id uuid PRIMARY KEY,
  token_hash text NOT NULL CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  booking_data jsonb NOT NULL,
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  merchant_reference text NOT NULL UNIQUE CHECK (merchant_reference ~ '^[A-Za-z0-9]{1,20}$'),
  booking_id text UNIQUE REFERENCES public.consultation_bookings(booking_id) ON DELETE RESTRICT,
  gateway text CHECK (gateway IN ('razorpay','icici')),
  state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready','initiating','pending','paid','failed','cancelled')),
  gateway_order_id text,
  gateway_transaction_id text,
  redirect_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state = 'ready' AND gateway IS NULL) OR (state <> 'ready' AND gateway IS NOT NULL))
);
CREATE UNIQUE INDEX icici_uat_checkout_transaction_unique
  ON public.icici_uat_checkouts(gateway, gateway_transaction_id) WHERE gateway_transaction_id IS NOT NULL;
ALTER TABLE public.icici_uat_checkouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.icici_uat_checkouts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.icici_uat_checkouts TO service_role;

CREATE FUNCTION public.guard_icici_uat_checkout() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF OLD.state <> 'ready' AND (NEW.gateway IS DISTINCT FROM OLD.gateway
    OR NEW.amount_paise IS DISTINCT FROM OLD.amount_paise OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.merchant_reference IS DISTINCT FROM OLD.merchant_reference
    OR NEW.booking_data IS DISTINCT FROM OLD.booking_data OR NEW.token_hash IS DISTINCT FROM OLD.token_hash)
    THEN RAISE EXCEPTION 'An initiated checkout cannot change provider or booking details'; END IF;
  IF OLD.state = 'paid' AND (NEW.state <> 'paid' OR NEW.booking_id IS DISTINCT FROM OLD.booking_id
    OR NEW.gateway_order_id IS DISTINCT FROM OLD.gateway_order_id
    OR NEW.gateway_transaction_id IS DISTINCT FROM OLD.gateway_transaction_id)
    THEN RAISE EXCEPTION 'A settled checkout cannot be changed'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_icici_uat_checkout() FROM PUBLIC;
CREATE TRIGGER icici_uat_checkout_guard BEFORE UPDATE ON public.icici_uat_checkouts
  FOR EACH ROW EXECUTE FUNCTION public.guard_icici_uat_checkout();

-- Settlement is one database transaction; the caller first verifies the bank's
-- independent STATUS response. Anonymous/browser roles cannot invoke this RPC.
CREATE FUNCTION public.settle_icici_uat_checkout(
  checkout_uuid uuid, merchant_ref text, transaction_ref text,
  verified_amount_paise integer, verified_status text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE checkout public.icici_uat_checkouts%ROWTYPE;
BEGIN
  IF verified_status NOT IN ('paid','failed','pending') THEN RAISE EXCEPTION 'Invalid verified status'; END IF;
  SELECT * INTO checkout FROM public.icici_uat_checkouts WHERE id = checkout_uuid FOR UPDATE;
  IF NOT FOUND OR checkout.gateway <> 'icici' OR checkout.state = 'ready'
    OR checkout.merchant_reference <> merchant_ref OR checkout.amount_paise <> verified_amount_paise
    OR checkout.booking_id IS NULL THEN RAISE EXCEPTION 'Checkout does not match verification'; END IF;
  IF checkout.gateway_transaction_id IS NOT NULL AND transaction_ref IS NOT NULL
    AND checkout.gateway_transaction_id <> transaction_ref THEN RAISE EXCEPTION 'Transaction cannot be replaced'; END IF;
  IF checkout.state = 'paid' THEN
    IF verified_status = 'paid' AND checkout.gateway_transaction_id IS DISTINCT FROM transaction_ref
      THEN RAISE EXCEPTION 'Settled transaction mismatch'; END IF;
    RETURN false;
  END IF;
  IF verified_status = 'paid' THEN
    IF transaction_ref IS NULL OR transaction_ref !~ '^[A-Za-z0-9]{1,24}$'
      THEN RAISE EXCEPTION 'Verified transaction is required'; END IF;
    UPDATE public.consultation_bookings SET
      gateway_transaction_id = transaction_ref, payment_status = 'PAID', booking_status = 'CONFIRMED'
      WHERE booking_id = checkout.booking_id AND payment_gateway = 'icici'
        AND gateway_order_id = merchant_ref AND amount * 100 = verified_amount_paise AND currency = 'INR';
    IF NOT FOUND THEN RAISE EXCEPTION 'Booking could not be settled'; END IF;
  ELSIF verified_status = 'failed' THEN
    UPDATE public.consultation_bookings SET payment_status = 'FAILED'
      WHERE booking_id = checkout.booking_id AND payment_gateway = 'icici' AND payment_status <> 'PAID';
  END IF;
  UPDATE public.icici_uat_checkouts SET state = verified_status,
    gateway_transaction_id = COALESCE(transaction_ref, gateway_transaction_id), updated_at = now()
    WHERE id = checkout_uuid;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.settle_icici_uat_checkout(uuid,text,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_icici_uat_checkout(uuid,text,text,integer,text) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
