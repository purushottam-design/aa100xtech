-- The existing partner form writes with the signed-in user's session.
-- Preserve its pending-only RLS checks and existing submissions.
BEGIN;
REVOKE INSERT ON TABLE public.partner_applications FROM anon, PUBLIC;
COMMIT;
