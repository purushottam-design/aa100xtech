-- Read-only. Run in the confirmed development project's SQL editor.
SELECT to_regclass('public.user_roles') AS role_table,
       to_regtype('public.app_role') AS role_type;
SELECT c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'user_roles';
SELECT column_name, data_type, udt_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_roles';
SELECT policyname, roles, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles';
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'user_roles';
-- Do not select Auth secrets or all users. Role assignment is a separate,
-- account-specific operator command after confirming the development target.
