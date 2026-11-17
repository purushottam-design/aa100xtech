// Project-scoped, additive database setup. Defaults to a read-only readiness check.
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

async function main() {
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  const url = new URL(process.env.SUPABASE_URL);
  const ref = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1];
  if (!ref || url.protocol !== "https:" || url.username || url.password || url.port)
    throw new Error("A hosted Supabase project URL is required.");
  if (process.env.SUPABASE_PROJECT_ID && process.env.SUPABASE_PROJECT_ID !== ref)
    throw new Error("Supabase project IDs differ; no changes were sent.");
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin !== url.origin
  )
    throw new Error("Server and browser Supabase projects differ; no changes were sent.");
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN with database read/write access is required.");
  async function query(sql, readOnly) {
    let response;
    try {
      response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: "POST",
        redirect: "error",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, read_only: readOnly }),
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error(
        "Database connectivity could not be confirmed. No successful migration has been verified.",
      );
    }
    if (!response.ok)
      throw new Error(
        `Database setup could not be confirmed (HTTP ${response.status}). Verify the project token's database permissions.`,
      );
    return response.json();
  }
  const [prerequisites] = await query(
    "SELECT to_regclass('auth.users') IS NOT NULL AS auth, to_regclass('storage.buckets') IS NOT NULL AS storage, to_regclass('public.security_defects') IS NOT NULL AS tickets",
    true,
  );
  console.log("Security report schema:", JSON.stringify(prerequisites));
  if (!prerequisites.auth || !prerequisites.storage)
    throw new Error("Existing Supabase auth and storage schemas are required.");
  if (process.argv.includes("--apply")) {
    await query(
      fs.readFileSync(
        path.join(__dirname, "../supabase/migrations/20261117140000_security_identity_defects.sql"),
        "utf8",
      ),
      false,
    );
  } else if (!prerequisites.tickets) {
    console.log("Read-only check complete. Use --apply to install the security report migration.");
    return;
  }
  const [verified] = await query(
    `SELECT
    (SELECT relrowsecurity FROM pg_class WHERE oid='public.security_defects'::regclass) AS row_security,
    (SELECT NOT public FROM storage.buckets WHERE id='security-defect-attachments') AS private_attachments,
    has_table_privilege('authenticated','public.security_defects','SELECT') AND NOT has_table_privilege('authenticated','public.security_defects','INSERT,UPDATE,DELETE') AS customer_read_only,
    NOT has_function_privilege('authenticated','public.submit_security_defect(uuid,uuid,text,jsonb)','EXECUTE') AND has_function_privilege('service_role','public.submit_security_defect(uuid,uuid,text,jsonb)','EXECUTE') AS server_only_submission,
    EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Security report attachments require the server' AND permissive='RESTRICTIVE') AS server_only_attachments`,
    true,
  );
  if (!Object.values(verified).every((value) => value === true))
    throw new Error("Security report database verification failed.");
  console.log("Security report database verified:", JSON.stringify(verified));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
