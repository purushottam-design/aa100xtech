-- Read-only. Paste this entire file into Supabase SQL Editor.
-- No table, payment, role, policy, index or migration history is changed.
BEGIN TRANSACTION READ ONLY;

-- Version history is not exposed through this project's PostgREST API.
SELECT version
FROM supabase_migrations.schema_migrations
WHERE version IN ('20261026120000', '20261027150000')
ORDER BY version;

WITH required(table_name, column_name) AS (
  VALUES
    ('consultation_bookings', 'customer_id'),
    ('consultation_bookings', 'payment_gateway'),
    ('consultation_bookings', 'gateway_order_id'),
    ('consultation_bookings', 'gateway_transaction_id'),
    ('consultation_bookings', 'paid_at'),
    ('icici_uat_checkouts', 'id'),
    ('icici_uat_checkouts', 'token_hash'),
    ('icici_uat_checkouts', 'booking_data'),
    ('icici_uat_checkouts', 'amount_paise'),
    ('icici_uat_checkouts', 'currency'),
    ('icici_uat_checkouts', 'merchant_reference'),
    ('icici_uat_checkouts', 'booking_id'),
    ('icici_uat_checkouts', 'gateway'),
    ('icici_uat_checkouts', 'state'),
    ('icici_uat_checkouts', 'gateway_order_id'),
    ('icici_uat_checkouts', 'gateway_transaction_id'),
    ('icici_uat_checkouts', 'redirect_url'),
    ('icici_uat_checkouts', 'created_at'),
    ('icici_uat_checkouts', 'updated_at'),
    ('icici_uat_checkouts', 'expires_at')
)
SELECT r.table_name, r.column_name, c.column_name IS NOT NULL AS present,
       c.data_type, c.is_nullable, c.column_default
FROM required r
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = r.table_name AND c.column_name = r.column_name
ORDER BY r.table_name, r.column_name;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('consultation_bookings', 'icici_uat_checkouts')
ORDER BY tablename, indexname;

SELECT c.relname AS table_name, t.tgname AS trigger_name,
       t.tgenabled AS enabled, pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND NOT t.tgisinternal
  AND c.relname IN ('consultation_bookings', 'icici_uat_checkouts');

SELECT c.relname AS table_name, con.conname AS constraint_name,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('consultation_bookings', 'icici_uat_checkouts');

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled,
       has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_read,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_can_read,
       has_table_privilege('service_role', c.oid, 'SELECT,INSERT,UPDATE') AS server_can_access
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'icici_uat_checkouts';

SELECT p.proname AS function_name, p.prosecdef AS security_definer,
       p.proconfig AS function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS server_can_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'settle_icici_uat_checkout';

COMMIT;
