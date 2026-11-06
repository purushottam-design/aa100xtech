BEGIN;
CREATE TABLE IF NOT EXISTS public.brand_campaign_inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
 data jsonb NOT NULL, status text NOT NULL DEFAULT 'New' CHECK (status IN ('New','Contacted','Proposal Sent','In Negotiation','Confirmed','Closed')),
 notes text NOT NULL DEFAULT '', reviewed_by uuid REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now(),
 notification_status text NOT NULL DEFAULT 'not_configured'
);
CREATE TABLE IF NOT EXISTS public.marketing_intake_receipts (
 token uuid PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('creator','brand')), payload_hash text NOT NULL,
 reference uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_campaign_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_intake_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.brand_campaign_inquiries, public.marketing_intake_receipts FROM anon, authenticated;
GRANT ALL ON public.brand_campaign_inquiries, public.marketing_intake_receipts TO service_role;
CREATE INDEX IF NOT EXISTS brand_campaign_queue ON public.brand_campaign_inquiries(status, created_at DESC);
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('influencer-media-kits','influencer-media-kits',false,5242880,ARRAY['application/pdf','image/webp'])
ON CONFLICT (id) DO UPDATE SET public=false, file_size_limit=5242880, allowed_mime_types=EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.save_marketing_intake(p_kind text, p_token uuid, p_hash text, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE receipt public.marketing_intake_receipts; ref uuid;
BEGIN
 IF p_kind NOT IN ('creator','brand') THEN RAISE EXCEPTION 'Invalid kind'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_token::text, 0));
 SELECT * INTO receipt FROM public.marketing_intake_receipts WHERE token=p_token;
 IF FOUND THEN
  IF receipt.kind <> p_kind OR receipt.payload_hash <> p_hash THEN RAISE EXCEPTION 'Submission conflict' USING ERRCODE='23505'; END IF;
  RETURN jsonb_build_object('reference',receipt.reference,'created',false);
 END IF;
 IF p_kind='creator' THEN
  IF p_payload->>'processing_consent' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Consent required'; END IF;
  INSERT INTO public.partner_applications(full_name,email,phone,country,platforms,handle,niche,motivation,target_level,is_influencer,status,influencer_review_status,processing_consent,publication_consent,consent_recorded_at,influencer_data)
  VALUES(p_payload->>'full_name',p_payload->>'email',p_payload->>'phone',p_payload->>'country',p_payload->>'platforms',p_payload->>'handle',p_payload->>'category',p_payload->>'biography','Paid promotion collaboration',true,'pending','pending',true,coalesce((p_payload->>'publication_consent')::boolean,false),now(),p_payload) RETURNING id INTO ref;
 ELSE
  IF p_payload->>'privacy' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Consent required'; END IF;
  INSERT INTO public.brand_campaign_inquiries(data) VALUES(p_payload) RETURNING id INTO ref;
 END IF;
 INSERT INTO public.marketing_intake_receipts(token,kind,payload_hash,reference) VALUES(p_token,p_kind,p_hash,ref);
 RETURN jsonb_build_object('reference',ref,'created',true);
END;
$$;
REVOKE ALL ON FUNCTION public.save_marketing_intake(text,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_marketing_intake(text,uuid,text,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
