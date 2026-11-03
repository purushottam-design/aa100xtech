BEGIN;
-- Restore only missing website modules. Existing rows and tables are retained.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL,
  phone text, company text, service text, message text NOT NULL,
  status text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.candidate_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, email text NOT NULL,
  phone text, role_applied text, task_title text, hours_needed text, availability text,
  expected_cost text, deliverables text, portfolio_url text, file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid REFERENCES auth.users(id)
);
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), block_type text NOT NULL DEFAULT 'section',
  slug text NOT NULL UNIQUE, title text NOT NULL, subtitle text, body text, image_url text,
  link_url text, link_label text, placement text NOT NULL DEFAULT 'home', position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false, published_at timestamptz,
  created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
-- Public intake goes through the validated/rate-limited server endpoint.
REVOKE INSERT ON public.contact_messages, public.candidate_submissions FROM anon,authenticated;
GRANT ALL ON public.contact_messages, public.candidate_submissions, public.app_settings, public.content_blocks TO service_role;
CREATE INDEX IF NOT EXISTS content_blocks_placement_active ON public.content_blocks(placement,active,position);
NOTIFY pgrst,'reload schema';
COMMIT;
