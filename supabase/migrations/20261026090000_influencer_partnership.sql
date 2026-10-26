-- Extend the existing application workflow; preserve every existing submission.
BEGIN;
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS is_influencer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS influencer_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS influencer_review_status text NOT NULL DEFAULT 'pending' CHECK (influencer_review_status IN ('pending','under_review','approved','rejected')),
  ADD COLUMN IF NOT EXISTS processing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS publication_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz,
  ADD COLUMN IF NOT EXISTS partnership_type text,
  ADD COLUMN IF NOT EXISTS collaboration_progress text,
  ADD COLUMN IF NOT EXISTS information_request text;

-- Public applications go through validated server endpoints. Retain direct
-- inserts for the unrelated, existing affiliate application form, but allow
-- only pending submissions without publication/consent privileges.
DROP POLICY IF EXISTS "Anyone can submit a partner application" ON public.partner_applications;
CREATE POLICY "Anyone can submit a partner application" ON public.partner_applications
  FOR INSERT TO anon, authenticated WITH CHECK (
    NOT is_influencer AND status = 'pending' AND influencer_review_status = 'pending'
    AND NOT publication_consent AND NOT processing_consent
    AND reviewed_by IS NULL AND reviewed_at IS NULL
  );

CREATE TABLE public.influencer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.partner_applications(id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 2 AND 100),
  display_name text NOT NULL, city text NOT NULL, state text NOT NULL, category text NOT NULL,
  biography text NOT NULL, specialization text NOT NULL DEFAULT '', journey text NOT NULL DEFAULT '',
  achievements text NOT NULL DEFAULT '', collaboration_intro text NOT NULL DEFAULT '', partnership_description text NOT NULL DEFAULT '',
  socials jsonb NOT NULL DEFAULT '{}'::jsonb, portfolio_url text NOT NULL DEFAULT '',
  profile_image text, cover_image text, gallery text[] NOT NULL DEFAULT '{}', video_urls text[] NOT NULL DEFAULT '{}',
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','unpublished')),
  consent_confirmed boolean NOT NULL DEFAULT false, featured boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX influencer_profiles_directory ON public.influencer_profiles (publication_status, category);
CREATE INDEX influencer_applications_queue ON public.partner_applications (influencer_review_status, created_at DESC) WHERE is_influencer;

-- This function exposes one boolean, never the underlying private application.
CREATE FUNCTION public.influencer_application_is_public(application_uuid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_applications a WHERE a.id = application_uuid
    AND a.is_influencer AND a.status = 'approved'
    AND a.influencer_review_status = 'approved' AND a.publication_consent AND a.processing_consent);
$$;
REVOKE ALL ON FUNCTION public.influencer_application_is_public(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.influencer_application_is_public(uuid) TO anon, authenticated, service_role;
ALTER TABLE public.influencer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.influencer_profiles FROM anon, authenticated;
GRANT SELECT ON public.influencer_profiles TO anon, authenticated;
GRANT ALL ON public.influencer_profiles TO service_role;
CREATE POLICY "Only approved consented published influencers are public" ON public.influencer_profiles
  FOR SELECT TO anon, authenticated USING (
    publication_status = 'published' AND consent_confirmed
    AND public.influencer_application_is_public(application_id)
  );
-- All writes use the existing server RBAC boundary, never browser table writes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('influencer-media', 'influencer-media', false, 3145728, ARRAY['image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Atomic per-hour throttling; only the server role can call it. Store only an
-- HMAC of the client address, never raw addresses. Expired rows are pruned.
CREATE TABLE public.influencer_submission_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
CREATE INDEX influencer_submission_limits_expiry ON public.influencer_submission_limits (expires_at);
ALTER TABLE public.influencer_submission_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.influencer_submission_limits FROM anon, authenticated;
GRANT ALL ON public.influencer_submission_limits TO service_role;
CREATE FUNCTION public.take_influencer_submission_slot(rate_key text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE attempts integer;
BEGIN
  DELETE FROM public.influencer_submission_limits WHERE expires_at < now();
  INSERT INTO public.influencer_submission_limits AS limits (key, count, expires_at)
    VALUES (rate_key, 1, now() + interval '1 hour')
    ON CONFLICT (key) DO UPDATE SET count = limits.count + 1 RETURNING count INTO attempts;
  RETURN attempts <= 5;
END;
$$;
REVOKE ALL ON FUNCTION public.take_influencer_submission_slot(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.take_influencer_submission_slot(text) TO service_role;
COMMIT;
