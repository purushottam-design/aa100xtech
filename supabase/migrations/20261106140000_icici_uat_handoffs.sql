-- Independent, server-only authorizations. No Supabase sessions or bank secrets.
BEGIN;
CREATE TABLE IF NOT EXISTS public.icici_uat_handoffs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_origin text NOT NULL CHECK (source_origin IN ('http://127.0.0.1:3000','http://localhost:3000')),
  destination_origin text NOT NULL CHECK (destination_origin ~ '^https://[a-z0-9-]+\.ngrok-free\.dev$'),
  ticket_hash text NOT NULL UNIQUE CHECK (ticket_hash ~ '^[a-f0-9]{64}$'),
  booking_data jsonb NOT NULL,
  state text NOT NULL DEFAULT 'issued' CHECK (state IN ('issued','presented','active')),
  browser_hash text UNIQUE,
  csrf_hash text,
  checkout_id uuid NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '90 seconds',
  lease_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.icici_uat_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.icici_uat_handoffs FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.icici_uat_handoffs TO service_role;
CREATE INDEX IF NOT EXISTS icici_uat_handoffs_expiry ON public.icici_uat_handoffs(expires_at);
NOTIFY pgrst,'reload schema';
COMMIT;
