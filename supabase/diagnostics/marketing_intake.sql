-- Read-only: run in the SAME SQL Editor project as SUPABASE_URL.
-- This distinguishes absent SQL objects from stale/inaccessible API metadata.
SELECT current_database() AS database_name, current_schema() AS current_schema,
 to_regclass('public.brand_campaign_inquiries') AS campaign_table,
 to_regclass('public.marketing_intake_receipts') AS receipt_table,
 to_regprocedure('public.save_marketing_intake(text,uuid,text,jsonb)') AS save_function,
 to_regprocedure('public.take_influencer_submission_slot(text)') AS rate_function;
SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns
 WHERE table_schema='public' AND table_name IN ('brand_campaign_inquiries','marketing_intake_receipts') ORDER BY table_name,ordinal_position;
SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname IN ('brand_campaign_inquiries','marketing_intake_receipts');
SELECT routine_name,grantee,privilege_type FROM information_schema.routine_privileges
 WHERE routine_schema='public' AND routine_name IN ('save_marketing_intake','take_influencer_submission_slot');
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='influencer-media-kits';
