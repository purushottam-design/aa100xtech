ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);
GRANT SELECT ON public.admin_permissions TO authenticated;
GRANT ALL ON public.admin_permissions TO service_role;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own permissions" ON public.admin_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'supreme_admin'::app_role));

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  module text NOT NULL,
  description text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_activity_log TO authenticated;
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own activity" ON public.admin_activity_log
  FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR private.has_role(auth.uid(), 'supreme_admin'::app_role));
CREATE INDEX IF NOT EXISTS admin_activity_log_created_idx ON public.admin_activity_log (created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  status text NOT NULL DEFAULT 'success',
  ip_address text,
  user_agent text,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  logged_out_at timestamptz
);
GRANT SELECT ON public.admin_login_history TO authenticated;
GRANT ALL ON public.admin_login_history TO service_role;
ALTER TABLE public.admin_login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own login history" ON public.admin_login_history
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'supreme_admin'::app_role));
CREATE INDEX IF NOT EXISTS admin_login_history_time_idx ON public.admin_login_history (logged_in_at DESC);