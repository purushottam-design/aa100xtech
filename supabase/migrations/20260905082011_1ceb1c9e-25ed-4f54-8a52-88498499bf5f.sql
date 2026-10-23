CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin_account(_user_id uuid)
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
REVOKE ALL ON FUNCTION private.is_admin_account(uuid) FROM PUBLIC, anon, authenticated;

ALTER POLICY "own or admin read tickets" ON public.support_tickets
  USING (requester_id = auth.uid() OR private.is_admin_account(auth.uid()));
ALTER POLICY "create own ticket" ON public.support_tickets
  WITH CHECK (requester_id = auth.uid() OR private.is_admin_account(auth.uid()));
ALTER POLICY "admins update tickets" ON public.support_tickets
  USING (private.is_admin_account(auth.uid())) WITH CHECK (private.is_admin_account(auth.uid()));

ALTER POLICY "read ticket messages" ON public.ticket_messages
  USING (
    private.is_admin_account(auth.uid())
    OR (is_internal = false AND EXISTS (
      SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.requester_id = auth.uid()
    ))
  );
ALTER POLICY "write ticket messages" ON public.ticket_messages
  WITH CHECK (
    private.is_admin_account(auth.uid())
    OR (is_internal = false AND EXISTS (
      SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.requester_id = auth.uid()
    ))
  );

ALTER POLICY "read sent notifications" ON public.notifications
  USING (status = 'sent' OR private.is_admin_account(auth.uid()));
ALTER POLICY "admins insert notifications" ON public.notifications
  WITH CHECK (private.is_admin_account(auth.uid()));
ALTER POLICY "admins update notifications" ON public.notifications
  USING (private.is_admin_account(auth.uid())) WITH CHECK (private.is_admin_account(auth.uid()));
ALTER POLICY "admins delete notifications" ON public.notifications
  USING (private.is_admin_account(auth.uid()));

ALTER POLICY "admins read templates" ON public.notification_templates
  USING (private.is_admin_account(auth.uid()));
ALTER POLICY "admins write templates" ON public.notification_templates
  WITH CHECK (private.is_admin_account(auth.uid()));
ALTER POLICY "admins update templates" ON public.notification_templates
  USING (private.is_admin_account(auth.uid())) WITH CHECK (private.is_admin_account(auth.uid()));
ALTER POLICY "admins delete templates" ON public.notification_templates
  USING (private.is_admin_account(auth.uid()));

ALTER POLICY "authenticated read blocks" ON public.content_blocks
  USING (active = true OR private.is_admin_account(auth.uid()));
ALTER POLICY "admins insert blocks" ON public.content_blocks
  WITH CHECK (private.is_admin_account(auth.uid()));
ALTER POLICY "admins update blocks" ON public.content_blocks
  USING (private.is_admin_account(auth.uid())) WITH CHECK (private.is_admin_account(auth.uid()));
ALTER POLICY "admins delete blocks" ON public.content_blocks
  USING (private.is_admin_account(auth.uid()));

DROP FUNCTION IF EXISTS public.is_admin_account(uuid);
