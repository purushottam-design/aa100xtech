-- Standalone missing-table repair. Does not touch public.bookings or its rows.
-- Safe to run again: existing consultation tables/records/policies are preserved.
BEGIN;
DO $migration$
BEGIN
  IF to_regclass('public.consultation_bookings') IS NULL THEN
    CREATE TABLE public.consultation_bookings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id text NOT NULL UNIQUE,
      customer_name text NOT NULL,
      company_name text,
      email text NOT NULL,
      phone text NOT NULL,
      country text NOT NULL,
      service text NOT NULL,
      plan_id text NOT NULL,
      consultation_plan text NOT NULL,
      consultation_type text NOT NULL,
      duration text NOT NULL,
      amount integer NOT NULL CHECK (amount > 0),
      currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
      preferred_date date NOT NULL,
      preferred_time text NOT NULL CHECK (preferred_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
      timezone text NOT NULL,
      meeting_platform text NOT NULL,
      project_description text NOT NULL,
      razorpay_order_id text UNIQUE,
      razorpay_payment_id text UNIQUE,
      razorpay_signature text,
      payment_status text NOT NULL DEFAULT 'PENDING'
        CHECK (payment_status IN ('PENDING','PAID','FAILED','CANCELLED','REFUNDED')),
      booking_status text NOT NULL DEFAULT 'PENDING'
        CHECK (booking_status IN ('PENDING','CONFIRMED','CANCELLED')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
    -- Guest submissions and authenticated administration use validated server
    -- handlers. No browser role receives private customer/payment access.
    REVOKE ALL ON public.consultation_bookings FROM PUBLIC, anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_bookings TO service_role;
  END IF;
END;
$migration$;

-- Also repair server access if the table exists physically but was hidden from
-- the service role's REST schema. Preserve all existing row policies and data.
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultation_bookings TO service_role;

CREATE INDEX IF NOT EXISTS consultation_bookings_order_idx
  ON public.consultation_bookings(razorpay_order_id);
CREATE INDEX IF NOT EXISTS consultation_bookings_created_at_idx
  ON public.consultation_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS consultation_bookings_status_idx
  ON public.consultation_bookings(payment_status, booking_status);

DO $migration$
BEGIN
  IF to_regprocedure('public.touch_consultation_bookings_updated_at()') IS NULL THEN
    CREATE FUNCTION public.touch_consultation_bookings_updated_at()
    RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $function$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $function$;
    REVOKE ALL ON FUNCTION public.touch_consultation_bookings_updated_at() FROM PUBLIC;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.consultation_bookings'::regclass
      AND tgname = 'consultation_bookings_set_updated_at' AND NOT tgisinternal
  ) THEN
    CREATE TRIGGER consultation_bookings_set_updated_at
      BEFORE UPDATE ON public.consultation_bookings
      FOR EACH ROW EXECUTE FUNCTION public.touch_consultation_bookings_updated_at();
  END IF;
END;
$migration$;

NOTIFY pgrst, 'reload schema';
COMMIT;
