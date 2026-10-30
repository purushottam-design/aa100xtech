-- Additive and rerunnable. Existing profiles, applications, affiliates and payments are untouched.
BEGIN;
CREATE TABLE IF NOT EXISTS public.influencer_client_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.influencer_profiles(id) ON DELETE RESTRICT,
  client_reference text NOT NULL CHECK (client_reference ~ '^[a-z0-9][a-z0-9._:-]{2,99}$'),
  evidence_reference text NOT NULL DEFAULT '' CHECK (length(evidence_reference) <= 250),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','converted','rejected','reversed')),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, client_reference),
  CHECK (status <> 'converted' OR (confirmed_at IS NOT NULL AND confirmed_by IS NOT NULL
    AND length(trim(evidence_reference)) >= 3))
);
-- One genuinely converted business client gets one attribution, even across partners.
CREATE UNIQUE INDEX IF NOT EXISTS influencer_one_converted_client
  ON public.influencer_client_referrals(client_reference) WHERE status = 'converted';
CREATE INDEX IF NOT EXISTS influencer_referrals_profile_status
  ON public.influencer_client_referrals(profile_id, status);
ALTER TABLE public.influencer_client_referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.influencer_client_referrals FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.influencer_client_referrals TO service_role;

CREATE TABLE IF NOT EXISTS public.influencer_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.influencer_profiles(id) ON DELETE RESTRICT,
  quote text NOT NULL CHECK (length(trim(quote)) BETWEEN 20 AND 600),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft','published','unpublished')),
  consent_confirmed boolean NOT NULL DEFAULT false,
  approved_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (publication_status <> 'published' OR consent_confirmed)
);
ALTER TABLE public.influencer_testimonials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.influencer_testimonials FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, profile_id, quote, created_at, publication_status, consent_confirmed)
  ON public.influencer_testimonials TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.influencer_testimonials TO service_role;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
    AND tablename = 'influencer_testimonials' AND policyname = 'Consented published partner stories') THEN
    CREATE POLICY "Consented published partner stories" ON public.influencer_testimonials
      FOR SELECT TO anon, authenticated USING (
        publication_status = 'published' AND consent_confirmed AND EXISTS (
          SELECT 1 FROM public.influencer_profiles p WHERE p.id = profile_id
            AND p.publication_status = 'published' AND p.consent_confirmed
            AND public.influencer_application_is_public(p.application_id)
        )
      );
  END IF;
END $$;

-- Only aggregates and a public profile ID/date leave this boundary; never client or evidence IDs.
CREATE OR REPLACE FUNCTION public.get_influencer_partner_stats()
RETURNS TABLE(profile_id uuid, total_leads integer, converted_clients integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.id, count(r.id)::integer,
    count(r.id) FILTER (WHERE r.status = 'converted' AND r.confirmed_at IS NOT NULL
      AND r.confirmed_by IS NOT NULL AND length(trim(r.evidence_reference)) >= 3)::integer,
    p.created_at
  FROM public.influencer_profiles p
  LEFT JOIN public.influencer_client_referrals r ON r.profile_id = p.id
  WHERE p.publication_status = 'published' AND p.consent_confirmed
    AND public.influencer_application_is_public(p.application_id)
  GROUP BY p.id, p.created_at;
$$;
REVOKE ALL ON FUNCTION public.get_influencer_partner_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_influencer_partner_stats() TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
