// Uses the same project-scoped Management API credentials as repair-influencers.
// Defaults to a read-only prerequisite check. --apply installs this migration.
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
  const query = async (sql, read_only) => {
    let response;
    try {
      response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql, read_only }),
        redirect: "error",
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error(
        "Could not confirm the database request. Check connectivity and trusted CA configuration before retrying.",
      );
    }
    if (!response.ok)
      throw new Error(
        `Supabase database access failed (HTTP ${response.status}). Verify the configured token has database_read and database_write permissions. Alternatively, run supabase/migrations/20261105120000_marketing_intake.sql in this project's Supabase SQL editor. No successful migration has been confirmed.`,
      );
    return response.json();
  };
  const [state] = await query(
    "SELECT to_regclass('public.partner_applications') IS NOT NULL AS applications, to_regprocedure('public.take_influencer_submission_slot(text)') IS NOT NULL AS rate_limit, to_regclass('public.brand_campaign_inquiries') IS NOT NULL AS campaigns, to_regprocedure('public.save_marketing_intake(text,uuid,text,jsonb)') IS NOT NULL AS intake",
    true,
  );
  console.log("Marketing schema prerequisites:", JSON.stringify(state));
  if (!state.applications || !state.rate_limit)
    throw new Error("Apply the existing influencer partnership migration before this migration.");
  if (!process.argv.includes("--apply")) {
    console.log("Read-only check complete. Use --apply to install the marketing intake migration.");
    return;
  }
  await query(
    fs.readFileSync(
      path.join(
        __dirname,
        process.argv.includes("--recover")
          ? "../supabase/migrations/20261105143000_marketing_intake_recovery.sql"
          : "../supabase/migrations/20261105120000_marketing_intake.sql",
      ),
      "utf8",
    ),
    false,
  );
  const [verified] = await query(
    "SELECT to_regclass('public.brand_campaign_inquiries') IS NOT NULL AS campaigns, to_regprocedure('public.save_marketing_intake(text,uuid,text,jsonb)') IS NOT NULL AS intake, (SELECT NOT public FROM storage.buckets WHERE id='influencer-media-kits') AS private_kits",
    true,
  );
  if (!verified.campaigns || !verified.intake || !verified.private_kits)
    throw new Error("Database verification did not confirm all intake objects.");
  console.log("Marketing intake migration applied and verified:", JSON.stringify(verified));
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
