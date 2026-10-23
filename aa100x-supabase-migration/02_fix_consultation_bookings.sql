-- Apply this file in the SQL Editor of project ryircgxjsieovvbmprqv.
-- It is intentionally standalone and safe to run more than once.

CREATE TABLE IF NOT EXISTS public.consultation_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
  preferred_time text NOT NULL,
  timezone text NOT NULL,
  meeting_platform text NOT NULL,
  project_description text NOT NULL,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature text,
  payment_status text NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  booking_status text NOT NULL DEFAULT 'PENDING'
    CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.consultation_bookings TO service_role;
GRANT SELECT ON public.consultation_bookings TO authenticated;

ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS consultation_bookings_order_idx
  ON public.consultation_bookings (razorpay_order_id);

CREATE INDEX IF NOT EXISTS consultation_bookings_created_at_idx
  ON public.consultation_bookings (created_at DESC);

NOTIFY pgrst, 'reload schema';