BEGIN;
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
COMMIT;
