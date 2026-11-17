BEGIN;

CREATE TABLE IF NOT EXISTS public.security_defects (
  id uuid PRIMARY KEY,
  ticket_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 6 AND 30),
  company text NOT NULL DEFAULT '' CHECK (char_length(company) <= 160),
  category text NOT NULL CHECK (category IN ('Identity Verification','Authentication','Access Control','Account Security','Other Security Issues')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 160),
  description text NOT NULL CHECK (char_length(description) BETWEEN 20 AND 8000),
  priority text NOT NULL CHECK (priority IN ('Low','Medium','High','Critical')),
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Review','In Progress','Resolved','Closed')),
  attachment_path text,
  attachment_name text,
  attachment_type text CHECK (attachment_type IN ('application/pdf','image/webp')),
  payload_hash text NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT security_attachment_shape CHECK (
    (attachment_path IS NULL AND attachment_name IS NULL AND attachment_type IS NULL) OR
    (attachment_path IS NOT NULL AND attachment_name IS NOT NULL AND attachment_type IS NOT NULL
     AND attachment_path ~ ('^security/' || user_id::text || '/' || id::text || '/[a-f0-9]{64}\.(pdf|webp)$'))
  )
);
CREATE INDEX IF NOT EXISTS security_defects_owner_date ON public.security_defects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_defects_queue ON public.security_defects(status, created_at DESC);
ALTER TABLE public.security_defects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_defects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.security_defects TO authenticated;
GRANT ALL ON public.security_defects TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.security_defects_ticket_number_seq TO service_role;
DROP POLICY IF EXISTS "Customers read their own security reports" ON public.security_defects;
CREATE POLICY "Customers read their own security reports" ON public.security_defects
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('security-defect-attachments','security-defect-attachments',false,5242880,ARRAY['application/pdf','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false, file_size_limit=5242880, allowed_mime_types=EXCLUDED.allowed_mime_types;
-- Keep this bucket private even if a legacy permissive policy covers other uploads.
DROP POLICY IF EXISTS "Security report attachments require the server" ON storage.objects;
CREATE POLICY "Security report attachments require the server" ON storage.objects
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'security-defect-attachments')
  WITH CHECK (bucket_id <> 'security-defect-attachments');

CREATE OR REPLACE FUNCTION public.submit_security_defect(p_id uuid, p_user_id uuid, p_hash text, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE existing public.security_defects; created public.security_defects;
BEGIN
  -- Serialize retries and per-account rate limits across all application servers.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 5717));
  SELECT * INTO existing FROM public.security_defects WHERE id=p_id;
  IF FOUND THEN
    IF existing.user_id <> p_user_id OR existing.payload_hash <> p_hash THEN
      RAISE EXCEPTION 'Report conflict' USING ERRCODE='23505';
    END IF;
    RETURN jsonb_build_object('id',existing.id,'ticket_number',existing.ticket_number,'status',existing.status,'created_at',existing.created_at,'created',false);
  END IF;
  IF (SELECT count(*) FROM public.security_defects WHERE user_id=p_user_id AND created_at > now() - interval '1 hour') >= 6 THEN
    RAISE EXCEPTION 'Report limit reached' USING ERRCODE='P0001';
  END IF;
  INSERT INTO public.security_defects(id,user_id,full_name,email,phone,company,category,title,description,priority,attachment_path,attachment_name,attachment_type,payload_hash)
  VALUES(p_id,p_user_id,p_payload->>'fullName',p_payload->>'email',p_payload->>'phone',coalesce(p_payload->>'company',''),p_payload->>'category',p_payload->>'title',p_payload->>'description',p_payload->>'priority',p_payload->>'attachment_path',p_payload->>'attachment_name',p_payload->>'attachment_type',p_hash)
  RETURNING * INTO created;
  RETURN jsonb_build_object('id',created.id,'ticket_number',created.ticket_number,'status',created.status,'created_at',created.created_at,'created',true);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_security_defect(uuid,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_security_defect(uuid,uuid,text,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
