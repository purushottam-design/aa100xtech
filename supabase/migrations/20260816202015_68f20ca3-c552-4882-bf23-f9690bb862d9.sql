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