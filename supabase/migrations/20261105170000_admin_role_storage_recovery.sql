-- Apply only to the confirmed development project after the read-only
-- diagnostics. Restores storage, never assigns any account an admin role.
-- Does not recreate/replace profiles or rewrite Auth users/passwords.
BEGIN;
DO $$
BEGIN
  IF to_regtype('public.app_role') IS NULL THEN
    CREATE TYPE public.app_role AS ENUM (
      'supreme_admin', 'employee', 'customer', 'job_seeker', 'partner',
      'company_admin', 'interview_admin', 'marketing_admin', 'business_admin', 'manager'
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' AND t.typname='app_role' AND e.enumlabel='supreme_admin'
  ) THEN
    RAISE EXCEPTION 'Existing app_role is incompatible; inspect original role migrations before recovery';
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_roles' AND column_name='user_id' AND udt_name='uuid')
     OR NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_roles' AND column_name='role' AND udt_schema='public' AND udt_name='app_role') THEN
    RAISE EXCEPTION 'Existing user_roles is incompatible; no automatic conversion or row deletion is allowed';
  END IF;
END $$;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO service_role;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='admin_role_recovery_read_own') THEN
    CREATE POLICY admin_role_recovery_read_own ON public.user_roles
      FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
