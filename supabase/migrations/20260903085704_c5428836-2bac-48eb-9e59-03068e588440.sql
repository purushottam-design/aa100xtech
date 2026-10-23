CREATE TABLE public.partner_applications (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, phone text,
  country text, platforms text, handle text, followers text, niche text, target_level text,
  motivation text, referrer text, plan_id text, plan_name text, affiliate_platforms text,
  status text NOT NULL DEFAULT 'pending', review_note text, reviewed_at timestamptz, reviewed_by uuid,
  created_at timestamptz not null default now()
);
GRANT INSERT ON public.partner_applications TO anon, authenticated;
GRANT SELECT, UPDATE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a partner application" ON public.partner_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Supreme user can read partner applications" ON public.partner_applications FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin'));
CREATE POLICY "Supreme user can review partner applications" ON public.partner_applications FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'supreme_admin')) WITH CHECK (private.has_role(auth.uid(), 'supreme_admin'));

CREATE TABLE public.candidate_submissions (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, phone text,
  role_applied text, task_title text, hours_needed text, availability text, expected_cost text,
  deliverables text, portfolio_url text, file_path text, created_at timestamptz not null default now()
);
GRANT INSERT ON public.candidate_submissions TO anon, authenticated;
GRANT ALL ON public.candidate_submissions TO service_role;
ALTER TABLE public.candidate_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit candidate task details" ON public.candidate_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS telegram_number text;