-- Add provider-neutral fields without renaming/removing Razorpay fields.
-- Do not reset the database. Duplicate transaction references fail this
-- migration transaction for manual review; existing payments are never deleted.
BEGIN;
ALTER TABLE public.consultation_bookings
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_gateway text NOT NULL DEFAULT 'razorpay' CHECK (payment_gateway IN ('razorpay','icici')),
  ADD COLUMN IF NOT EXISTS gateway_order_id text,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Historical values stay in their original columns. The read model falls
-- back to those columns, avoiding writes that would change updated_at.

CREATE UNIQUE INDEX consultation_gateway_transaction_unique
  ON public.consultation_bookings (payment_gateway, gateway_transaction_id)
  WHERE gateway_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX consultation_razorpay_transaction_unique
  ON public.consultation_bookings (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX consultation_gateway_date ON public.consultation_bookings (payment_gateway, created_at DESC);

CREATE FUNCTION public.guard_consultation_payment_tracking()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  -- Existing Razorpay handlers keep writing their existing fields. Mirror
  -- those fields atomically instead of requiring a new Razorpay schema/API.
  IF NEW.payment_gateway = 'razorpay' THEN
    NEW.gateway_order_id := COALESCE(NEW.razorpay_order_id, NEW.gateway_order_id);
    NEW.gateway_transaction_id := COALESCE(NEW.razorpay_payment_id, NEW.gateway_transaction_id);
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF upper(OLD.payment_status) IN ('PAID','REFUNDED') OR OLD.paid_at IS NOT NULL THEN
      IF NEW.payment_gateway IS DISTINCT FROM OLD.payment_gateway
        OR NEW.gateway_order_id IS DISTINCT FROM COALESCE(OLD.gateway_order_id, CASE WHEN OLD.payment_gateway = 'razorpay' THEN OLD.razorpay_order_id END)
        OR NEW.gateway_transaction_id IS DISTINCT FROM COALESCE(OLD.gateway_transaction_id, CASE WHEN OLD.payment_gateway = 'razorpay' THEN OLD.razorpay_payment_id END)
        OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
        OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
        OR NEW.amount IS DISTINCT FROM OLD.amount OR NEW.currency IS DISTINCT FROM OLD.currency
        OR upper(NEW.payment_status) NOT IN ('PAID','REFUNDED') THEN
        RAISE EXCEPTION 'A settled payment cannot be replaced, downgraded or charged through another gateway';
      END IF;
      IF upper(OLD.payment_status) = 'REFUNDED' AND upper(NEW.payment_status) = 'PAID' THEN
        RAISE EXCEPTION 'A refunded payment cannot be reused to settle another charge';
      END IF;
      NEW.paid_at := OLD.paid_at;
    END IF;
  END IF;
  IF upper(NEW.payment_status) = 'PAID' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.gateway_transaction_id IS NULL OR NEW.gateway_order_id IS NULL THEN
        RAISE EXCEPTION 'A verified gateway order and transaction are required for settlement';
      END IF;
      NEW.paid_at := COALESCE(NEW.paid_at, now());
    ELSIF upper(OLD.payment_status) <> 'PAID' THEN
      IF NEW.gateway_transaction_id IS NULL OR NEW.gateway_order_id IS NULL THEN
        RAISE EXCEPTION 'A verified gateway order and transaction are required for settlement';
      END IF;
      NEW.paid_at := COALESCE(NEW.paid_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_consultation_payment_tracking() FROM PUBLIC;
CREATE TRIGGER consultation_payment_tracking_guard
BEFORE INSERT OR UPDATE ON public.consultation_bookings
FOR EACH ROW EXECUTE FUNCTION public.guard_consultation_payment_tracking();
COMMIT;
