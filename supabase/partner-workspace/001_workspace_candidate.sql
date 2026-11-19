-- REVIEW CANDIDATE ONLY. Not an automatic Supabase migration.
-- Reconcile with the actual source + master live schemas before approval/application.
-- Implements a bounded native foundation, NOT the 56-table source migration.
BEGIN;
CREATE TABLE public.cm365_memberships (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL CHECK(role IN ('admin','imtm','lead_team','influencer')),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','disabled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_team_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  name text NOT NULL, active boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_lead_team_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  name text NOT NULL, active boolean NOT NULL DEFAULT false,
  lead_domain text NOT NULL CHECK(lead_domain IN ('influencer','gamer')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_influencer_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '', country text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
  socials jsonb NOT NULL CHECK(jsonb_typeof(socials)='array' AND jsonb_array_length(socials) BETWEEN 1 AND 10),
  platforms text[] NOT NULL, max_followers bigint NOT NULL DEFAULT 0 CHECK(max_followers>=0),
  status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','converted','rejected')),
  created_by_user_id uuid NOT NULL REFERENCES auth.users(id), source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_gamer_leads (LIKE public.cm365_influencer_leads INCLUDING ALL);
ALTER TABLE public.cm365_gamer_leads ADD FOREIGN KEY(created_by_user_id) REFERENCES auth.users(id);
CREATE TABLE public.cm365_influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), lead_id uuid UNIQUE REFERENCES public.cm365_influencer_leads(id),
  name text NOT NULL, email text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '', socials jsonb NOT NULL,
  platforms text[] NOT NULL, max_followers bigint NOT NULL DEFAULT 0,
  assigned_to uuid REFERENCES public.cm365_team_accounts(id), assigned_at timestamptz,
  review_started_at timestamptz, paused_seconds bigint NOT NULL DEFAULT 0 CHECK(paused_seconds>=0),
  stage text NOT NULL DEFAULT 'new' CHECK(stage IN ('new','contacted','follow_up','negotiating','deal_ready','pending_approval','changes_requested','approved','rejected','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_influencer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  influencer_id uuid NOT NULL UNIQUE REFERENCES public.cm365_influencers(id), active boolean NOT NULL DEFAULT false
);
CREATE TABLE public.cm365_influencer_identities (
  domain text NOT NULL CHECK(domain IN ('influencer','gamer')), platform text NOT NULL, handle text NOT NULL,
  lead_id uuid NOT NULL, PRIMARY KEY(domain,platform,handle)
);
CREATE TABLE public.cm365_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor uuid NOT NULL REFERENCES auth.users(id), action text NOT NULL,
  entity text NOT NULL, entity_id uuid, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_influencer_assignment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), influencer_id uuid NOT NULL REFERENCES public.cm365_influencers(id),
  assigned_to uuid REFERENCES public.cm365_team_accounts(id), actor uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_influencer_comm_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), influencer_id uuid NOT NULL REFERENCES public.cm365_influencers(id),
  actor uuid NOT NULL REFERENCES auth.users(id), channel text NOT NULL CHECK(channel IN ('call','whatsapp','instagram','email','meeting','other')),
  notes text NOT NULL CHECK(length(notes) BETWEEN 1 AND 4000), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), influencer_id uuid NOT NULL REFERENCES public.cm365_influencers(id),
  assigned_to uuid NOT NULL REFERENCES public.cm365_team_accounts(id), next_action text NOT NULL,
  due_at timestamptz NOT NULL, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, brand text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, sku text NOT NULL UNIQUE,
  stock integer NOT NULL DEFAULT 0 CHECK(stock>=0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.cm365_products(id),
  quantity integer NOT NULL CHECK(quantity<>0), reason text NOT NULL, actor uuid NOT NULL REFERENCES auth.users(id),
  request_id uuid NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), influencer_id uuid NOT NULL REFERENCES public.cm365_influencers(id),
  tracking_number text NOT NULL DEFAULT '', carrier text NOT NULL DEFAULT '',
  status text NOT NULL CHECK(status IN ('preparing','shipped','delivered','returned')), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_influencer_deal_drafts (
  influencer_id uuid PRIMARY KEY REFERENCES public.cm365_influencers(id), revision integer NOT NULL DEFAULT 1,
  terms jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cm365_deal_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), influencer_id uuid NOT NULL REFERENCES public.cm365_influencers(id),
  revision integer NOT NULL, snapshot jsonb NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','changes_requested')),
  submitted_by uuid NOT NULL REFERENCES auth.users(id), reviewed_by uuid REFERENCES auth.users(id),
  review_note text, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz,
  UNIQUE(influencer_id,revision)
);
CREATE UNIQUE INDEX cm365_one_pending_approval ON public.cm365_deal_approvals(influencer_id) WHERE status='pending';
CREATE TABLE public.cm365_deal_approval_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), approval_id uuid NOT NULL REFERENCES public.cm365_deal_approvals(id),
  actor uuid NOT NULL REFERENCES auth.users(id), decision text NOT NULL, note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);

-- No metadata roles, no implicit supreme_admin grant. Membership + canonical account required.
CREATE FUNCTION public.cm365_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT m.role FROM cm365_memberships m WHERE m.user_id=auth.uid() AND m.status='approved' AND (
   (m.role IN ('admin','imtm') AND EXISTS(SELECT 1 FROM cm365_team_accounts a WHERE a.user_id=m.user_id AND a.active)) OR
   (m.role='lead_team' AND EXISTS(SELECT 1 FROM cm365_lead_team_accounts a WHERE a.user_id=m.user_id AND a.active)) OR
   (m.role='influencer' AND EXISTS(SELECT 1 FROM cm365_influencer_accounts a WHERE a.user_id=m.user_id AND a.active))
 )
$$;
CREATE FUNCTION public.cm365_can_work(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(cm365_role()='admin' OR (cm365_role()='imtm' AND EXISTS (
 SELECT 1 FROM cm365_influencers i JOIN cm365_team_accounts a ON a.id=i.assigned_to WHERE i.id=p_id AND a.user_id=auth.uid() AND a.active)),false)
$$;
CREATE FUNCTION public.cm365_can_negotiate(p_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT coalesce(cm365_role()='admin' OR (cm365_can_work(p_id) AND EXISTS(SELECT 1 FROM cm365_influencers i WHERE i.id=p_id
 AND i.stage NOT IN ('pending_approval','approved','rejected','closed') AND i.assigned_at IS NOT NULL
 AND now() <= i.assigned_at + interval '7 days' + make_interval(secs=>i.paused_seconds::double precision))),false)
$$;
CREATE FUNCTION public.cm365_require_admin() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN IF cm365_role() IS DISTINCT FROM 'admin' THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF; END $$;

-- Read access is independent of API/menu visibility. Writes use checked atomic RPCs only.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['memberships','team_accounts','lead_team_accounts','influencer_accounts','influencer_leads','gamer_leads','influencers','influencer_identities','activity_logs','influencer_assignment_history','influencer_comm_log','follow_up_tasks','campaigns','projects','products','inventory_movements','shipments','influencer_deal_drafts','deal_approvals','deal_approval_events'] LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY','cm365_'||t);
   EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated','cm365_'||t);
   EXECUTE format('GRANT SELECT ON public.%I TO authenticated','cm365_'||t);
   EXECUTE format('GRANT ALL ON public.%I TO service_role','cm365_'||t);
 END LOOP;
END $$;
CREATE POLICY cm365_membership_read ON public.cm365_memberships FOR SELECT TO authenticated USING(user_id=auth.uid() OR cm365_role()='admin');
CREATE POLICY cm365_team_read ON public.cm365_team_accounts FOR SELECT TO authenticated USING(user_id=auth.uid() OR cm365_role()='admin');
CREATE POLICY cm365_lead_account_read ON public.cm365_lead_team_accounts FOR SELECT TO authenticated USING(user_id=auth.uid() OR cm365_role()='admin');
CREATE POLICY cm365_creator_account_read ON public.cm365_influencer_accounts FOR SELECT TO authenticated USING(user_id=auth.uid() OR cm365_role()='admin');
CREATE POLICY cm365_lead_read ON public.cm365_influencer_leads FOR SELECT TO authenticated USING(cm365_role()='admin' OR (created_by_user_id=auth.uid() AND (cm365_role()='imtm' OR (cm365_role()='lead_team' AND EXISTS(SELECT 1 FROM cm365_lead_team_accounts WHERE user_id=auth.uid() AND lead_domain='influencer' AND active)))));
CREATE POLICY cm365_gamer_read ON public.cm365_gamer_leads FOR SELECT TO authenticated USING(cm365_role()='admin' OR (created_by_user_id=auth.uid() AND cm365_role()='lead_team' AND EXISTS(SELECT 1 FROM cm365_lead_team_accounts WHERE user_id=auth.uid() AND lead_domain='gamer' AND active)));
CREATE POLICY cm365_roster_read ON public.cm365_influencers FOR SELECT TO authenticated USING(cm365_can_work(id));
CREATE POLICY cm365_communication_read ON public.cm365_influencer_comm_log FOR SELECT TO authenticated USING(cm365_can_work(influencer_id));
CREATE POLICY cm365_followup_read ON public.cm365_follow_up_tasks FOR SELECT TO authenticated USING(cm365_can_work(influencer_id) AND (cm365_role()='admin' OR assigned_to IN(SELECT id FROM cm365_team_accounts WHERE user_id=auth.uid())));
CREATE POLICY cm365_draft_read ON public.cm365_influencer_deal_drafts FOR SELECT TO authenticated USING(cm365_can_work(influencer_id));
CREATE POLICY cm365_approval_read ON public.cm365_deal_approvals FOR SELECT TO authenticated USING(cm365_can_work(influencer_id));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['influencer_identities','activity_logs','influencer_assignment_history','campaigns','projects','products','inventory_movements','shipments','deal_approval_events'] LOOP
 EXECUTE format('CREATE POLICY cm365_admin_read ON public.%I FOR SELECT TO authenticated USING(public.cm365_role()=''admin'')','cm365_'||t);
 END LOOP;
END $$;

CREATE FUNCTION public.cm365_add_lead(p_domain text,p_lead jsonb,p_source text DEFAULT 'manual') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rid uuid:=gen_random_uuid(); s jsonb; platforms text[]:='{}'; followers bigint:=0; role_name text:=cm365_role();
BEGIN
 IF p_domain IS NULL OR p_domain NOT IN ('influencer','gamer') OR role_name IS NULL OR NOT(role_name='admin' OR (role_name='imtm' AND p_domain='influencer') OR (role_name='lead_team' AND EXISTS(SELECT 1 FROM cm365_lead_team_accounts WHERE user_id=auth.uid() AND active AND lead_domain=p_domain))) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF length(trim(p_lead->>'name')) NOT BETWEEN 2 AND 200 OR jsonb_typeof(p_lead->'socials') IS DISTINCT FROM 'array' OR jsonb_array_length(p_lead->'socials') NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'Invalid lead' USING ERRCODE='22023'; END IF;
 FOR s IN SELECT value FROM jsonb_array_elements(p_lead->'socials') LOOP
   IF s->>'platform' NOT IN ('instagram','youtube','facebook','x','tiktok','twitch','other') OR length(s->>'handle') NOT BETWEEN 1 AND 120 OR s->>'url' NOT LIKE 'https://%' OR (s->>'followers')::bigint<0 THEN RAISE EXCEPTION 'Invalid social profile' USING ERRCODE='22023'; END IF;
   INSERT INTO cm365_influencer_identities(domain,platform,handle,lead_id) VALUES(p_domain,s->>'platform',lower(ltrim(s->>'handle','@')),rid);
   platforms:=array_append(platforms,s->>'platform'); followers:=greatest(followers,(s->>'followers')::bigint);
 END LOOP;
 IF p_domain='influencer' THEN
 INSERT INTO cm365_influencer_leads(id,name,email,phone,city,country,category,notes,socials,platforms,max_followers,created_by_user_id,source) VALUES(rid,p_lead->>'name',coalesce(p_lead->>'email',''),coalesce(p_lead->>'phone',''),coalesce(p_lead->>'city',''),coalesce(p_lead->>'country',''),coalesce(p_lead->>'category',''),coalesce(p_lead->>'notes',''),p_lead->'socials',platforms,followers,auth.uid(),p_source);
 ELSE
 INSERT INTO cm365_gamer_leads(id,name,email,phone,city,country,category,notes,socials,platforms,max_followers,created_by_user_id,source) VALUES(rid,p_lead->>'name',coalesce(p_lead->>'email',''),coalesce(p_lead->>'phone',''),coalesce(p_lead->>'city',''),coalesce(p_lead->>'country',''),coalesce(p_lead->>'category',''),coalesce(p_lead->>'notes',''),p_lead->'socials',platforms,followers,auth.uid(),p_source);
 END IF;
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'lead.created',p_domain||'_lead',rid);
 RETURN rid;
END $$;
CREATE FUNCTION public.cm365_convert_lead(p_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE l cm365_influencer_leads; rid uuid;
BEGIN
 PERFORM cm365_require_admin(); SELECT * INTO l FROM cm365_influencer_leads WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR l.status='rejected' THEN RAISE EXCEPTION 'Lead not eligible'; END IF;
 SELECT id INTO rid FROM cm365_influencers WHERE lead_id=p_id; IF rid IS NOT NULL THEN RETURN rid; END IF;
 INSERT INTO cm365_influencers(lead_id,name,email,phone,city,country,category,socials,platforms,max_followers) VALUES(l.id,l.name,l.email,l.phone,l.city,l.country,l.category,l.socials,l.platforms,l.max_followers) RETURNING id INTO rid;
 UPDATE cm365_influencer_leads SET status='converted' WHERE id=p_id;
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'lead.converted','influencer',rid); RETURN rid;
END $$;
CREATE FUNCTION public.cm365_assign(p_id uuid,p_account uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM cm365_require_admin(); PERFORM 1 FROM cm365_influencers WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing influencer'; END IF;
 IF EXISTS(SELECT 1 FROM cm365_deal_approvals WHERE influencer_id=p_id AND status='pending') THEN RAISE EXCEPTION 'Decide pending approval before reassignment'; END IF;
 IF NOT EXISTS(SELECT 1 FROM cm365_team_accounts a JOIN cm365_memberships m ON m.user_id=a.user_id WHERE a.id=p_account AND a.active AND m.status='approved' AND m.role='imtm') THEN RAISE EXCEPTION 'Invalid assignee' USING ERRCODE='22023'; END IF;
 UPDATE cm365_influencers SET assigned_to=p_account,assigned_at=now(),paused_seconds=0,review_started_at=null WHERE id=p_id;
 UPDATE cm365_follow_up_tasks SET assigned_to=p_account WHERE influencer_id=p_id AND completed_at IS NULL;
 INSERT INTO cm365_influencer_assignment_history(influencer_id,assigned_to,actor) VALUES(p_id,p_account,auth.uid());
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'influencer.assigned','influencer',p_id);
END $$;
CREATE FUNCTION public.cm365_log_contact(p_id uuid,p_channel text,p_notes text,p_due timestamptz DEFAULT NULL,p_action text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a uuid;
BEGIN
 PERFORM 1 FROM cm365_influencers WHERE id=p_id FOR UPDATE;
 IF NOT cm365_can_negotiate(p_id) THEN RAISE EXCEPTION 'Forbidden or assignment expired' USING ERRCODE='42501'; END IF;
 SELECT assigned_to INTO a FROM cm365_influencers WHERE id=p_id;
 INSERT INTO cm365_influencer_comm_log(influencer_id,actor,channel,notes) VALUES(p_id,auth.uid(),p_channel,p_notes);
 IF p_due IS NOT NULL THEN
 IF a IS NULL OR length(trim(p_action)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'A follow-up requires an assignee and next action' USING ERRCODE='22023'; END IF;
 INSERT INTO cm365_follow_up_tasks(influencer_id,assigned_to,next_action,due_at) VALUES(p_id,a,p_action,p_due); END IF;
 UPDATE cm365_influencers SET stage=CASE WHEN p_due IS NULL THEN 'contacted' ELSE 'follow_up' END WHERE id=p_id;
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'contact.logged','influencer',p_id);
END $$;
CREATE FUNCTION public.cm365_complete_task(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE t cm365_follow_up_tasks;
BEGIN
 SELECT * INTO t FROM cm365_follow_up_tasks WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT cm365_can_work(t.influencer_id) OR NOT (cm365_role()='admin' OR t.assigned_to IN(SELECT id FROM cm365_team_accounts WHERE user_id=auth.uid())) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 UPDATE cm365_follow_up_tasks SET completed_at=coalesce(completed_at,now()) WHERE id=p_id;
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'followup.completed','follow_up',p_id);
END $$;
CREATE FUNCTION public.cm365_save_draft(p_id uuid,p_revision integer,p_terms jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE current_revision integer; next_revision integer;
BEGIN
 PERFORM 1 FROM cm365_influencers WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT cm365_can_negotiate(p_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM cm365_deal_approvals WHERE influencer_id=p_id AND status='pending') THEN RAISE EXCEPTION 'Review is pending'; END IF;
 IF jsonb_typeof(p_terms) IS DISTINCT FROM 'object' OR length(p_terms::text)>100000 THEN RAISE EXCEPTION 'Invalid draft' USING ERRCODE='22023'; END IF;
 SELECT revision INTO current_revision FROM cm365_influencer_deal_drafts WHERE influencer_id=p_id;
 IF coalesce(current_revision,0)<>p_revision THEN RAISE EXCEPTION 'Stale draft'; END IF;
 next_revision:=coalesce(current_revision,0)+1;
 INSERT INTO cm365_influencer_deal_drafts(influencer_id,revision,terms) VALUES(p_id,next_revision,p_terms) ON CONFLICT(influencer_id) DO UPDATE SET revision=excluded.revision,terms=excluded.terms,updated_at=now();
 RETURN next_revision;
END $$;
CREATE FUNCTION public.cm365_submit_deal(p_id uuid,p_revision integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE d cm365_influencer_deal_drafts; rid uuid; item jsonb;
BEGIN
 PERFORM 1 FROM cm365_influencers WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT cm365_can_negotiate(p_id) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO d FROM cm365_influencer_deal_drafts WHERE influencer_id=p_id;
 IF NOT FOUND OR d.revision<>p_revision THEN RAISE EXCEPTION 'Stale or missing draft'; END IF;
 IF NOT (d.terms ?& ARRAY['collaboration','currency','summary','agreementStatus','amount','advance','deliverables']) OR d.terms->>'collaboration' IS NULL OR d.terms->>'currency' IS NULL OR jsonb_typeof(d.terms->'amount') IS DISTINCT FROM 'number' OR jsonb_typeof(d.terms->'advance') IS DISTINCT FROM 'number' OR d.terms->>'collaboration' NOT IN ('paid','barter','affiliate','hybrid') OR d.terms->>'currency' !~ '^[A-Z]{3}$' OR coalesce(length(trim(d.terms->>'summary')),0)<20 OR d.terms->>'agreementStatus' IS DISTINCT FROM 'agreed' OR (d.terms->>'amount')::numeric<0 OR (d.terms->>'advance')::numeric<0 OR (d.terms->>'advance')::numeric>(d.terms->>'amount')::numeric OR ((d.terms->>'collaboration') IN ('paid','hybrid') AND (d.terms->>'amount')::numeric<=0) OR jsonb_typeof(d.terms->'deliverables') IS DISTINCT FROM 'array' OR jsonb_array_length(d.terms->'deliverables') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Incomplete deal terms' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(d.terms->'deliverables') LOOP
 IF NOT (item ?& ARRAY['quantity','platform','type','dueDate']) OR jsonb_typeof(item->'quantity') IS DISTINCT FROM 'number' OR (item->>'quantity')::integer<1 OR coalesce(length(item->>'platform'),0)=0 OR coalesce(length(item->>'type'),0)=0 OR (item->>'dueDate')::date IS NULL THEN RAISE EXCEPTION 'Invalid deliverable' USING ERRCODE='22023'; END IF;
 END LOOP;
 INSERT INTO cm365_deal_approvals(influencer_id,revision,snapshot,submitted_by) VALUES(p_id,d.revision,d.terms,auth.uid()) RETURNING id INTO rid;
 UPDATE cm365_influencers SET stage='pending_approval',review_started_at=now() WHERE id=p_id;
 INSERT INTO cm365_deal_approval_events(approval_id,actor,decision) VALUES(rid,auth.uid(),'submitted');
 RETURN rid;
END $$;
CREATE FUNCTION public.cm365_decide_deal(p_id uuid,p_decision text,p_note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a cm365_deal_approvals;
BEGIN
 PERFORM cm365_require_admin();
 -- Lock the influencer first, matching submission's lock order.
 PERFORM 1 FROM cm365_influencers WHERE id=(SELECT influencer_id FROM cm365_deal_approvals WHERE id=p_id) FOR UPDATE;
 SELECT * INTO a FROM cm365_deal_approvals WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR a.status<>'pending' THEN RAISE EXCEPTION 'Stale approval'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approved','rejected','changes_requested') OR length(trim(p_note)) NOT BETWEEN 3 AND 1000 THEN RAISE EXCEPTION 'Decision note required' USING ERRCODE='22023'; END IF;
 UPDATE cm365_deal_approvals SET status=p_decision,review_note=p_note,reviewed_by=auth.uid(),reviewed_at=now() WHERE id=p_id;
 UPDATE cm365_influencers SET stage=p_decision,paused_seconds=paused_seconds+greatest(0,extract(epoch FROM now()-review_started_at)::bigint),review_started_at=null WHERE id=a.influencer_id;
 INSERT INTO cm365_deal_approval_events(approval_id,actor,decision,note) VALUES(p_id,auth.uid(),p_decision,p_note);
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'deal.'||p_decision,'approval',p_id);
END $$;
CREATE FUNCTION public.cm365_create_operation(p_kind text,p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE rid uuid;
BEGIN
 PERFORM cm365_require_admin(); IF length(trim(p_data->>'name')) NOT BETWEEN 2 AND 200 THEN RAISE EXCEPTION 'Name required' USING ERRCODE='22023'; END IF;
 IF p_kind='campaigns' THEN INSERT INTO cm365_campaigns(name,brand,status) VALUES(p_data->>'name',coalesce(p_data->>'brand',''),p_data->>'status') RETURNING id INTO rid;
 ELSIF p_kind='projects' THEN INSERT INTO cm365_projects(name,status) VALUES(p_data->>'name',p_data->>'status') RETURNING id INTO rid;
 ELSIF p_kind='products' THEN INSERT INTO cm365_products(name,sku) VALUES(p_data->>'name',p_data->>'sku') RETURNING id INTO rid;
 ELSE RAISE EXCEPTION 'Unsupported operation' USING ERRCODE='22023'; END IF;
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'record.created',p_kind,rid); RETURN rid;
END $$;
CREATE FUNCTION public.cm365_adjust_stock(p_id uuid,p_quantity integer,p_reason text,p_request uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 PERFORM cm365_require_admin(); PERFORM 1 FROM cm365_products WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Missing product'; END IF;
 IF EXISTS(SELECT 1 FROM cm365_inventory_movements WHERE request_id=p_request) THEN
 IF NOT EXISTS(SELECT 1 FROM cm365_inventory_movements WHERE request_id=p_request AND product_id=p_id AND quantity=p_quantity AND reason=p_reason AND actor=auth.uid()) THEN RAISE EXCEPTION 'Idempotency conflict'; END IF;
 RETURN; END IF;
 IF p_quantity=0 OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Invalid adjustment' USING ERRCODE='22023'; END IF;
 UPDATE cm365_products SET stock=stock+p_quantity WHERE id=p_id;
 INSERT INTO cm365_inventory_movements(product_id,quantity,reason,actor,request_id) VALUES(p_id,p_quantity,p_reason,auth.uid(),p_request);
 INSERT INTO cm365_activity_logs(actor,action,entity,entity_id) VALUES(auth.uid(),'inventory.adjusted','product',p_id);
END $$;

CREATE FUNCTION public.cm365_dashboard(p_start date) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE result jsonb; lead_count bigint; closed_count bigint;
BEGIN
 IF cm365_role() IS NULL OR cm365_role() NOT IN ('admin','imtm') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_start<current_date-366 OR p_start>current_date THEN RAISE EXCEPTION 'Invalid date range' USING ERRCODE='22023'; END IF;
 SELECT count(*) INTO lead_count FROM cm365_influencer_leads;
 SELECT count(*) INTO closed_count FROM cm365_deal_approvals WHERE status='approved';
 SELECT jsonb_build_object(
 'influencers',(SELECT count(*) FROM cm365_influencers),
 'campaigns',(SELECT count(*) FROM cm365_campaigns WHERE status='active'),
 'pending',(SELECT count(*) FROM cm365_deal_approvals WHERE status='pending'),
 'due',(SELECT count(*) FROM cm365_follow_up_tasks WHERE completed_at IS NULL AND due_at<=now()),
 'leads',lead_count,'inProgress',(SELECT count(*) FROM cm365_influencers WHERE stage IN ('negotiating','deal_ready','pending_approval','changes_requested')),
 'closed',closed_count,'conversion',CASE WHEN lead_count=0 THEN 0 ELSE round(100.0*(SELECT count(DISTINCT a.influencer_id) FROM cm365_deal_approvals a JOIN cm365_influencers i ON i.id=a.influencer_id JOIN cm365_influencer_leads l ON l.id=i.lead_id WHERE a.status='approved')/lead_count,1) END,
 'activity',(SELECT coalesce(jsonb_agg(x ORDER BY x.date),'[]'::jsonb) FROM (
 SELECT to_char(day,'YYYY-MM-DD') AS date,
 (SELECT count(*) FROM cm365_influencer_leads WHERE created_at>=day AND created_at<day+interval '1 day') AS leads,
 (SELECT count(*) FROM cm365_campaigns WHERE created_at>=day AND created_at<day+interval '1 day') AS campaigns
 FROM generate_series(p_start::timestamptz,current_date::timestamptz,interval '1 day') AS day) x)
 ) INTO result;
 RETURN result;
END $$;

-- Revoke PostgreSQL's default PUBLIC function execution, including helpers.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'cm365\_%' ESCAPE '\' LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon',f.signature);
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',f.signature);
 END LOOP;
END $$;
CREATE INDEX cm365_lead_owner_date ON public.cm365_influencer_leads(created_by_user_id,created_at DESC);
CREATE INDEX cm365_gamer_owner_date ON public.cm365_gamer_leads(created_by_user_id,created_at DESC);
CREATE INDEX cm365_roster_assignee ON public.cm365_influencers(assigned_to);
CREATE INDEX cm365_followup_due ON public.cm365_follow_up_tasks(assigned_to,due_at) WHERE completed_at IS NULL;
COMMIT;
