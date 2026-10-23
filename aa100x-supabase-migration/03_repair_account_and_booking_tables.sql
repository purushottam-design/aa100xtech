-- AA100XTech: additive repair for Supabase project ryircgxjsieovvbmprqv
-- Preserves public.profiles and every existing row. Safe to run repeatedly.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM (
      'supreme_admin', 'employee', 'customer', 'job_seeker', 'partner'
    );
  END IF;
END
$$;

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supreme_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employee';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'job_seeker';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

COMMIT;

BEGIN;

-- Keep the existing legacy columns (name/avatar_url) and add only the fields
-- required by the existing account, dashboard, settings, and team code.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS joined_at date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS target_label text,
  ADD COLUMN IF NOT EXISTS target_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employee_of_month_for text,
  ADD COLUMN IF NOT EXISTS bio text;

-- The legacy table requires name. A default lets existing server-side account
-- creation remain compatible without dropping or renaming the legacy column.
ALTER TABLE public.profiles ALTER COLUMN name SET DEFAULT '';

UPDATE public.profiles
SET full_name = COALESCE(NULLIF(BTRIM(full_name), ''), name, '')
WHERE full_name IS NULL OR BTRIM(full_name) = '';

-- The UUID suffix makes generated usernames deterministic and collision-safe.
UPDATE public.profiles
SET username = CONCAT(
  COALESCE(
    NULLIF(REGEXP_REPLACE(LOWER(SPLIT_PART(email, '@', 1)), '[^a-z0-9._-]+', '', 'g'), ''),
    'member'
  ),
  '-',
  LEFT(REPLACE(id::text, '-', ''), 8)
)
WHERE username IS NULL OR BTRIM(username) = '';

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (username);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles (role);

CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  requested_role public.app_role NOT NULL,
  company text,
  message text,
  status text NOT NULL DEFAULT 'pending'
    CONSTRAINT access_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  first_name text,
  middle_name text,
  last_name text,
  personal_email text,
  company_email text,
  whatsapp_number text,
  telegram_number text
);

CREATE INDEX IF NOT EXISTS access_requests_status_created_at_idx
  ON public.access_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS access_requests_email_idx
  ON public.access_requests (email);

CREATE TABLE IF NOT EXISTS public.consultation_bookings (
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
  amount integer NOT NULL CONSTRAINT consultation_bookings_amount_check CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR'
    CONSTRAINT consultation_bookings_currency_check CHECK (currency = 'INR'),
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  timezone text NOT NULL,
  meeting_platform text NOT NULL,
  project_description text NOT NULL,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text UNIQUE,
  razorpay_signature text,
  payment_status text NOT NULL DEFAULT 'PENDING'
    CONSTRAINT consultation_bookings_payment_status_check
      CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED')),
  booking_status text NOT NULL DEFAULT 'PENDING'
    CONSTRAINT consultation_bookings_booking_status_check
      CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS consultation_bookings_order_idx
  ON public.consultation_bookings (razorpay_order_id);
CREATE INDEX IF NOT EXISTS consultation_bookings_created_at_idx
  ON public.consultation_bookings (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NULL THEN false
    WHEN auth.uid() IS NOT NULL AND _user_id <> auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
  END
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS consultation_bookings_set_updated_at ON public.consultation_bookings;
CREATE TRIGGER consultation_bookings_set_updated_at
BEFORE UPDATE ON public.consultation_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.profiles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name, name, phone, bio, must_change_password,
  job_title, department, joined_at, target_label,
  target_percent, employee_of_month_for
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT INSERT ON public.access_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;

GRANT SELECT ON public.consultation_bookings TO authenticated;
GRANT ALL ON public.consultation_bookings TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'supreme_admin'));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'supreme_admin'))
WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'supreme_admin'));

DROP POLICY IF EXISTS "Company members can view team profiles" ON public.profiles;
CREATE POLICY "Company members can view team profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee')
  OR public.has_role(auth.uid(), 'supreme_admin')
);

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'supreme_admin'));

DROP POLICY IF EXISTS "Company members can view team roles" ON public.user_roles;
CREATE POLICY "Company members can view team roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'employee')
  OR public.has_role(auth.uid(), 'supreme_admin')
);

DROP POLICY IF EXISTS "Anyone can request access" ON public.access_requests;
CREATE POLICY "Anyone can request access"
ON public.access_requests FOR INSERT TO anon, authenticated
WITH CHECK (
  requested_role <> 'supreme_admin'
  AND status = 'pending'
  AND review_note IS NULL
  AND reviewed_at IS NULL
  AND reviewed_by IS NULL
  AND created_user_id IS NULL
);

DROP POLICY IF EXISTS "Supreme admins can view access requests" ON public.access_requests;
CREATE POLICY "Supreme admins can view access requests"
ON public.access_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'));

DROP POLICY IF EXISTS "Supreme admins can update access requests" ON public.access_requests;
CREATE POLICY "Supreme admins can update access requests"
ON public.access_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'))
WITH CHECK (public.has_role(auth.uid(), 'supreme_admin'));

DROP POLICY IF EXISTS "Supreme admins can view consultation bookings"
  ON public.consultation_bookings;
CREATE POLICY "Supreme admins can view consultation bookings"
ON public.consultation_bookings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'supreme_admin'));

COMMIT;

NOTIFY pgrst, 'reload schema';
