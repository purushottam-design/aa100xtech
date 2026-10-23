CREATE TABLE public.consultation_bookings (
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
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  timezone text NOT NULL,
  meeting_platform text NOT NULL,
  project_description text NOT NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_status text NOT NULL DEFAULT 'PENDING',
  booking_status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.consultation_bookings TO service_role;
GRANT SELECT ON public.consultation_bookings TO authenticated;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supreme admins can view consultation bookings"
ON public.consultation_bookings FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'supreme_admin'::public.app_role));
CREATE TRIGGER consultation_bookings_set_updated_at
BEFORE UPDATE ON public.consultation_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX consultation_bookings_order_idx ON public.consultation_bookings (razorpay_order_id);