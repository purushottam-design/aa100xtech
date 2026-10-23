-- AA100XTech full schema (combined migrations)
-- Run this in Supabase Dashboard -> SQL Editor of project ryircgxjsieovvbmprqv

-- ===== 20260816202015_68f20ca3-c552-4882-bf23-f9690bb862d9.sql =====
CREATE TABLE public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  country text,
  platforms text,
  handle text,
  followers text,
  niche text,
  target_level text,
  motivation text,
  referrer text,
  created_at timestamptz not null default now()
);
GRANT INSERT ON public.partner_applications TO anon, authenticated;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a partner application"
  ON public.partner_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.candidate_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  role_applied text,
  task_title text,
  hours_needed text,
  availability text,
  expected_cost text,
  deliverables text,
  portfolio_url text,
  file_path text,
  created_at timestamptz not null default now()
);
GRANT INSERT ON public.candidate_submissions TO anon, authenticated;
GRANT ALL ON public.candidate_submissions TO service_role;
ALTER TABLE public.candidate_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit candidate task details"
  ON public.candidate_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can upload candidate files"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'candidate-uploads');
-- ===== 20260816204057_73022ce3-c175-42a1-a70a-52805bc8fb8f.sql =====
CREATE TYPE public.app_role AS ENUM ('supreme_admin', 'employee', 'customer', 'job_seeker');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text,
  must_change_password boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'supreme_admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'supreme_admin'))
WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'supreme_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'supreme_admin'));

CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  requested_role public.app_role NOT NULL,
  company text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.access_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request access"
ON public.access_requests FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Supreme admins can view access requests"
ON public.access_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'));

CREATE POLICY "Supreme admins can update access requests"
ON public.access_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'))
WITH CHECK (public.has_role(auth.uid(), 'supreme_admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
-- ===== 20260816204124_2cee04e2-964c-4162-a8d4-1352c25908cb.sql =====
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- ===== 20260816204720_d7cfccbc-714c-49f5-93c5-1aa4a90ff1e4.sql =====
DELETE FROM public.access_requests;
DELETE FROM auth.users WHERE email IN ('seeker1@example.com', 'supreme@aa100xtech.test');
-- ===== 20260817104238_2ab046ed-1a54-49c2-97df-f977ef7ad082.sql =====
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';
-- ===== 20260817104331_47584599-1db3-4839-80a6-326be53c52b5.sql =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS joined_at date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS target_label text,
  ADD COLUMN IF NOT EXISTS target_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_of_month_for text,
  ADD COLUMN IF NOT EXISTS bio text;

CREATE POLICY "Company members can view team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'employee') OR public.has_role(auth.uid(), 'supreme_admin'));

CREATE POLICY "Company members can view team roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'employee') OR public.has_role(auth.uid(), 'supreme_admin'));
-- ===== 20260818070311_12ed10bc-ae4a-4ffc-9149-e69bec07ecec.sql =====
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
ON public.consultation_bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'::app_role));

CREATE TRIGGER consultation_bookings_set_updated_at
BEFORE UPDATE ON public.consultation_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX consultation_bookings_order_idx ON public.consultation_bookings (razorpay_order_id);
-- ===== 20260818073507_2bbde1fb-3c56-46e6-9801-0b506383cba7.sql =====
-- Tighten candidate-uploads storage policies
DROP POLICY IF EXISTS "Anyone can upload candidate files" ON storage.objects;

CREATE POLICY "Public can upload candidate files with constraints"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (
  bucket_id = 'candidate-uploads'
  AND (storage.foldername(name))[1] = 'submissions'
  AND lower(storage.extension(name)) IN ('pdf','doc','docx','png','jpg','jpeg','zip','txt','md','ppt','pptx','xls','xlsx')
  AND octet_length(name) < 300
);

CREATE POLICY "Supreme admins can read candidate files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'candidate-uploads' AND public.has_role(auth.uid(), 'supreme_admin'::app_role));

CREATE POLICY "Supreme admins can delete candidate files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'candidate-uploads' AND public.has_role(auth.uid(), 'supreme_admin'::app_role));

-- Trigger-only SECURITY DEFINER-ish helper should not be callable by API roles
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- ===== 20260818073550_a40ea3fa-5739-4dd2-856b-5e1440847321.sql =====
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
-- ===== 20260818073840_211b46d5-b2eb-4f6d-a715-16e55a826a4b.sql =====
-- has_role must stay callable by authenticated because RLS policies evaluate it as the caller.
-- Harden it so it can only ever answer about the calling user, removing any ability to
-- probe other users' roles through the SECURITY DEFINER boundary.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN auth.uid() IS NOT NULL AND _user_id <> auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
  END
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
-- ===== 20260819193023_d75f85d2-c42a-47c6-a863-69d83a7672d1.sql =====
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS plan_id text,
  ADD COLUMN IF NOT EXISTS plan_name text,
  ADD COLUMN IF NOT EXISTS affiliate_platforms text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

DROP POLICY IF EXISTS "Supreme user can read partner applications" ON public.partner_applications;
CREATE POLICY "Supreme user can read partner applications"
ON public.partner_applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'));

DROP POLICY IF EXISTS "Supreme user can review partner applications" ON public.partner_applications;
CREATE POLICY "Supreme user can review partner applications"
ON public.partner_applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'))
WITH CHECK (public.has_role(auth.uid(), 'supreme_admin'));

GRANT SELECT, UPDATE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;
-- ===== 20260822084500_112edf6d-7cb6-4e40-b2bf-4fcd4fb037a3.sql =====
-- CATALOG
CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'service',
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text,
  description text,
  landing_url text NOT NULL,
  default_commission_type text NOT NULL DEFAULT 'percent',
  default_commission_value numeric NOT NULL DEFAULT 10,
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  recurring boolean NOT NULL DEFAULT false,
  cookie_duration_days integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalog_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_items TO service_role;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active catalog items" ON public.catalog_items FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(), 'supreme_admin'));
CREATE POLICY "Supreme admin manages catalog" ON public.catalog_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'supreme_admin')) WITH CHECK (public.has_role(auth.uid(), 'supreme_admin'));
CREATE TRIGGER catalog_items_set_updated_at BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AFFILIATES
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  affiliate_code text NOT NULL UNIQUE,
  entity_type text NOT NULL DEFAULT 'individual',
  full_name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text,
  country text,
  audience_note text,
  kyc_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  payout_method text,
  status text NOT NULL DEFAULT 'pending',
  tier text NOT NULL DEFAULT 'bronze',
  custom_commission_type text,
  custom_commission_value numeric,
  min_payout_threshold numeric NOT NULL DEFAULT 1000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.affiliates TO authenticated;
GRANT ALL ON public.affiliates TO service_role;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own record" ON public.affiliates FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'supreme_admin'));
CREATE POLICY "Affiliates create own record" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Affiliates update own record" ON public.affiliates FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'supreme_admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'supreme_admin'));
CREATE TRIGGER affiliates_set_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REFERRAL LINKS
CREATE TABLE public.referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  unique_slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (affiliate_id, catalog_item_id)
);
GRANT SELECT ON public.referral_links TO authenticated;
GRANT ALL ON public.referral_links TO service_role;
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own links" ON public.referral_links FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- COUPONS
CREATE TABLE public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupon_codes TO authenticated;
GRANT ALL ON public.coupon_codes TO service_role;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own coupons" ON public.coupon_codes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- CLICKS
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  referral_link_id uuid REFERENCES public.referral_links(id) ON DELETE SET NULL,
  coupon_code_id uuid REFERENCES public.coupon_codes(id) ON DELETE SET NULL,
  ip_hash text,
  device text,
  source text,
  is_duplicate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT ALL ON public.affiliate_clicks TO service_role;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own clicks" ON public.affiliate_clicks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- CONVERSIONS
CREATE TABLE public.conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  coupon_code_id uuid REFERENCES public.coupon_codes(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'sale',
  order_id text NOT NULL,
  order_value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  commission_earned numeric NOT NULL DEFAULT 0,
  is_recurring boolean NOT NULL DEFAULT false,
  attribution text NOT NULL DEFAULT 'link',
  status text NOT NULL DEFAULT 'pending',
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, catalog_item_id, is_recurring, created_at)
);
GRANT SELECT ON public.conversions TO authenticated;
GRANT ALL ON public.conversions TO service_role;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own conversions" ON public.conversions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE TRIGGER conversions_set_updated_at BEFORE UPDATE ON public.conversions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYOUTS
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  method text,
  reference text,
  note text,
  status text NOT NULL DEFAULT 'requested',
  requested_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates view own payouts" ON public.payouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supreme_admin') OR affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE POLICY "Affiliates request own payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));
CREATE TRIGGER payouts_set_updated_at BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_conversions_affiliate ON public.conversions(affiliate_id, created_at DESC);
CREATE INDEX idx_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at DESC);

-- Seed catalog with the current aa100xtech offerings
INSERT INTO public.catalog_items (type, name, slug, category, description, landing_url, default_commission_type, default_commission_value, recurring, cookie_duration_days) VALUES
('website', 'AA100XTech Main Website', 'aa100xtech-website', 'Websites', 'Flagship site — any enquiry or purchase from it counts.', 'https://aa100xtech.com/', 'percent', 10, false, 30),
('service', 'Web & App Development', 'web-app-development', 'Services', 'Custom websites, web apps and mobile apps.', 'https://aa100xtech.com/services', 'percent', 12, false, 60),
('service', 'Real Estate AI Video & Avatar Tours', 'real-estate-ai', 'Real Estate', 'Photos to cinematic video plus AI avatar walkthroughs.', 'https://aa100xtech.com/real-estate', 'percent', 15, false, 45),
('service', 'Consultation Bookings', 'consultation', 'Consulting', 'Paid strategy consultations booked online.', 'https://aa100xtech.com/consultation', 'percent', 20, false, 30),
('service', 'Competitor Spy & Autopilot Content Engine', 'competitor-spy-content-engine', 'AI & Automation', 'Monthly subscription content automation engine.', 'https://aa100xtech.com/services/competitor-spy-content-engine', 'percent', 15, true, 60),
('product', 'Be The One — Personal Brand Package', 'be-the-one', 'Digital Products', 'Identity, website, app and social launch package.', 'https://aa100xtech.com/be-the-one', 'percent', 18, false, 90);
-- ===== 20260822145706_47d042bf-f5cb-4d15-bf52-bc9a38a5b3c4.sql =====
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS telegram_number text;

UPDATE public.access_requests
SET personal_email = COALESCE(personal_email, email),
    whatsapp_number = COALESCE(whatsapp_number, phone);
-- ===== 20260824101710_1663b767-09e3-4f17-b0c4-99d5f34ed182.sql =====
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
