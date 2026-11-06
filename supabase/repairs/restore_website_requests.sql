-- Careers PDF upload and website request recovery.
-- Run in the confirmed development project ryircgxjsieovvbmprqv SQL Editor.
-- Existing business records and storage objects are retained.
BEGIN;
SET LOCAL lock_timeout = '10s';

-- Source: supabase/migrations/20261103110000_website_content_prerequisites.sql
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

-- Source: supabase/migrations/20261103120000_website_requests.sql
CREATE TABLE IF NOT EXISTS public.website_requests (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK(kind IN ('proposal','influencer','contact','career')),
  payload jsonb NOT NULL,
  payload_hash text NOT NULL,
  email_hash text NOT NULL,
  recipient text NOT NULL,
  notification_status text NOT NULL DEFAULT 'pending' CHECK(notification_status IN ('pending','sent','failed','not_configured')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS website_requests_email_created ON public.website_requests(email_hash, created_at DESC);
ALTER TABLE public.website_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.website_requests FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.website_requests TO service_role;

CREATE OR REPLACE FUNCTION public.submit_website_request(request_id uuid, request_kind text, request_payload jsonb, request_hash text, sender_hash text, destination text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE existing_hash text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(sender_hash,0));
  SELECT payload_hash INTO existing_hash FROM public.website_requests WHERE id=request_id;
  IF FOUND THEN
    IF existing_hash <> request_hash THEN RAISE EXCEPTION 'Request conflict' USING ERRCODE='23505'; END IF;
    RETURN false;
  END IF;
  IF (SELECT count(*) FROM public.website_requests WHERE email_hash=sender_hash AND created_at > now()-interval '15 minutes') >= 3
    THEN RAISE EXCEPTION 'Request limit' USING ERRCODE='P0001'; END IF;
  INSERT INTO public.website_requests(id,kind,payload,payload_hash,email_hash,recipient)
    VALUES(request_id,request_kind,request_payload,request_hash,sender_hash,destination);
  IF request_kind='career' THEN
    INSERT INTO public.candidate_submissions(id,full_name,email,phone,role_applied,task_title,hours_needed,availability,expected_cost,deliverables,portfolio_url,file_path)
    VALUES(request_id,request_payload->>'name',request_payload->>'email',request_payload->>'phone',request_payload->>'role',
      request_payload->>'requirements',request_payload->>'hours',request_payload->>'availability',request_payload->>'expectedCost',
      concat_ws(E'\n',request_payload->>'experience',request_payload->>'message'),request_payload->>'portfolio',request_payload->>'filePath');
  ELSE
    INSERT INTO public.contact_messages(id,name,email,phone,company,service,message)
    VALUES(request_id,request_payload->>'name',request_payload->>'email',request_payload->>'phone',request_payload->>'company',
      request_kind || ':' || (request_payload->>'selectedPlan'),concat_ws(E'\n\n',request_payload->>'requirements',request_payload->>'message'));
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_website_request(uuid,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_website_request(uuid,text,jsonb,text,text,text) TO service_role;
NOTIFY pgrst,'reload schema';

-- Source: supabase/migrations/20261103121000_website_resume_storage.sql
-- A new private bucket; historical candidate uploads are untouched.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('website-resumes','website-resumes',false,5242880,ARRAY['application/pdf'])
ON CONFLICT(id) DO UPDATE
SET public=false, file_size_limit=5242880, allowed_mime_types=ARRAY['application/pdf'];

-- Fail atomically if an existing legacy table is incompatible. Do not leave a
-- partially repaired bucket/function after discovering missing columns.
DO $$
BEGIN
  PERFORM id,name,email,phone,company,service,message,status,created_at
    FROM public.contact_messages LIMIT 0;
  PERFORM id,full_name,email,phone,role_applied,task_title,hours_needed,availability,
    expected_cost,deliverables,portfolio_url,file_path,created_at
    FROM public.candidate_submissions LIMIT 0;
  PERFORM id,kind,payload,payload_hash,email_hash,recipient,notification_status,created_at
    FROM public.website_requests LIMIT 0;
END;
$$;

COMMIT;

-- Read-only verification. All fields should be true after COMMIT.
SELECT
  to_regclass('public.contact_messages') IS NOT NULL AS contact_storage_ready,
  to_regclass('public.candidate_submissions') IS NOT NULL AS candidate_storage_ready,
  to_regclass('public.website_requests') IS NOT NULL AS request_storage_ready,
  to_regprocedure('public.submit_website_request(uuid,text,jsonb,text,text,text)') IS NOT NULL AS submission_function_ready,
  coalesce((SELECT NOT public AND file_size_limit=5242880 AND allowed_mime_types=ARRAY['application/pdf']
    FROM storage.buckets WHERE id='website-resumes'), false) AS private_pdf_bucket_ready;
