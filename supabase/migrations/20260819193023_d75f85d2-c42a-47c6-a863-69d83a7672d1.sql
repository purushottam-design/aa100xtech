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