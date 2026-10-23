-- 1. Manager role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';

-- helper: is the caller an admin-level account?
CREATE OR REPLACE FUNCTION public.is_admin_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('supreme_admin','company_admin','interview_admin','marketing_admin','business_admin','manager')
  )
$$;

-- 2. Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no text NOT NULL UNIQUE DEFAULT ('TKT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  requester_id uuid,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  last_reply_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read tickets" ON public.support_tickets FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin_account(auth.uid()));
CREATE POLICY "create own ticket" ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() OR public.is_admin_account(auth.uid()));
CREATE POLICY "admins update tickets" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.is_admin_account(auth.uid())) WITH CHECK (public.is_admin_account(auth.uid()));
CREATE TRIGGER support_tickets_set_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX support_tickets_status_idx ON public.support_tickets (status, created_at DESC);

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid,
  author_name text,
  author_email text,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read ticket messages" ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    public.is_admin_account(auth.uid())
    OR (is_internal = false AND EXISTS (
      SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.requester_id = auth.uid()
    ))
  );
CREATE POLICY "write ticket messages" ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_account(auth.uid())
    OR (is_internal = false AND EXISTS (
      SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.requester_id = auth.uid()
    ))
  );
CREATE INDEX ticket_messages_ticket_idx ON public.ticket_messages (ticket_id, created_at);

-- 3. Notifications and templates
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  channel text NOT NULL DEFAULT 'in_app',
  link_url text,
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read sent notifications" ON public.notifications FOR SELECT TO authenticated
  USING (status = 'sent' OR public.is_admin_account(auth.uid()));
CREATE POLICY "admins insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_account(auth.uid()));
CREATE POLICY "admins update notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (public.is_admin_account(auth.uid())) WITH CHECK (public.is_admin_account(auth.uid()));
CREATE POLICY "admins delete notifications" ON public.notifications FOR DELETE TO authenticated
  USING (public.is_admin_account(auth.uid()));
CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read templates" ON public.notification_templates FOR SELECT TO authenticated
  USING (public.is_admin_account(auth.uid()));
CREATE POLICY "admins write templates" ON public.notification_templates FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_account(auth.uid()));
CREATE POLICY "admins update templates" ON public.notification_templates FOR UPDATE TO authenticated
  USING (public.is_admin_account(auth.uid())) WITH CHECK (public.is_admin_account(auth.uid()));
CREATE POLICY "admins delete templates" ON public.notification_templates FOR DELETE TO authenticated
  USING (public.is_admin_account(auth.uid()));
CREATE TRIGGER notification_templates_set_updated_at BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Content blocks (CMS)
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type text NOT NULL DEFAULT 'banner',
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  body text,
  image_url text,
  link_url text,
  link_label text,
  placement text NOT NULL DEFAULT 'home',
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT SELECT ON public.content_blocks TO anon;
GRANT ALL ON public.content_blocks TO service_role;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active blocks" ON public.content_blocks FOR SELECT TO anon
  USING (active = true);
CREATE POLICY "authenticated read blocks" ON public.content_blocks FOR SELECT TO authenticated
  USING (active = true OR public.is_admin_account(auth.uid()));
CREATE POLICY "admins insert blocks" ON public.content_blocks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_account(auth.uid()));
CREATE POLICY "admins update blocks" ON public.content_blocks FOR UPDATE TO authenticated
  USING (public.is_admin_account(auth.uid())) WITH CHECK (public.is_admin_account(auth.uid()));
CREATE POLICY "admins delete blocks" ON public.content_blocks FOR DELETE TO authenticated
  USING (public.is_admin_account(auth.uid()));
CREATE TRIGGER content_blocks_set_updated_at BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Two-factor authentication
CREATE TABLE public.admin_2fa (
  user_id uuid PRIMARY KEY,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  recovery_codes text[] NOT NULL DEFAULT '{}',
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_2fa TO authenticated;
GRANT ALL ON public.admin_2fa TO service_role;
ALTER TABLE public.admin_2fa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own 2fa row" ON public.admin_2fa FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER admin_2fa_set_updated_at BEFORE UPDATE ON public.admin_2fa
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
