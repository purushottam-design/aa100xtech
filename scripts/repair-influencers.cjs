// Preview by default. --apply installs only the two existing influencer repairs.
// The Management API needs a personal access token, not a project service key.
const fs = require("node:fs");
const path = require("node:path");
const { loadEnvConfig } = require("@next/env");

const repairs = [
  "supabase/repairs/restore_influencer_applications.sql",
  "supabase/migrations/20261030190000_influencer_partner_program.sql",
];

function repairQuery(root) {
  const statements = repairs.map((file) => {
    const sql = fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
    if (sql.match(/^BEGIN;$/gm)?.length !== 1 || sql.match(/^COMMIT;$/gm)?.length !== 1)
      throw new Error("Unexpected repair transaction boundaries; no changes were made.");
    return sql.replace(/^BEGIN;$/m, "").replace(/^COMMIT;$/m, "");
  });
  return ["BEGIN;", "SET LOCAL lock_timeout = '10s';", ...statements, "COMMIT;"].join("\n");
}

async function repairInfluencers({
  env = process.env,
  apply = false,
  root = path.join(__dirname, ".."),
  fetchImpl = fetch,
  log = console.log,
} = {}) {
  let url;
  try {
    url = new URL(env.SUPABASE_URL);
  } catch {
    throw new Error("Set SUPABASE_URL to the intended Supabase project's HTTPS URL.");
  }
  const match = url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
  if (!match || url.protocol !== "https:" || url.port || url.username || url.password)
    throw new Error("Repair requires a hosted Supabase project URL; no changes were made.");
  const ref = match[1];
  if (env.SUPABASE_PROJECT_ID && env.SUPABASE_PROJECT_ID !== ref)
    throw new Error("SUPABASE_PROJECT_ID and SUPABASE_URL differ; no changes were made.");
  if (env.NEXT_PUBLIC_SUPABASE_URL && new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin !== url.origin)
    throw new Error("Server and browser Supabase projects differ; no changes were made.");

  const query = repairQuery(root);
  log(`Target project from SUPABASE_URL: ${ref}`);
  repairs.forEach((file) => log(`Repair: ${file}`));
  if (!apply) {
    log("Preview only. Run npm run repair:influencers -- --apply to install these objects.");
    return { applied: false, project: ref };
  }
  const token = env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token)
    throw new Error(
      "Set SUPABASE_ACCESS_TOKEN in .env.local to a personal access token with database write access. A service-role key cannot apply SQL migrations.",
    );
  const request = async (resource, init = {}) => {
    let response;
    try {
      response = await fetchImpl(`https://api.supabase.com/v1/projects/${ref}${resource}`, {
        ...init,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new Error(
        "The repair request could not be confirmed. Run npm run diagnose:influencers before retrying; check network connectivity and trusted CA configuration.",
      );
    }
    if (response.status === 403) {
      const body = await response.json().catch(() => null);
      const description = [body?.message, body?.error]
        .filter((value) => typeof value === "string")
        .join(" ");
      const missing = ["database_read", "database_write"].filter((permission) =>
        new RegExp(`\\b${permission}\\b`).test(description),
      );
      const detail = missing.length ? ` Missing permission(s): ${missing.join(", ")}.` : "";
      throw new Error(
        `Supabase denied database access (HTTP 403).${detail} Scope SUPABASE_ACCESS_TOKEN to the configured project with both Database Read and Read-write permissions, using an account with database access.`,
      );
    }
    if (!response.ok)
      throw new Error(
        `Supabase Management API returned HTTP ${response.status}. Verify token permissions and project access. Run npm run diagnose:influencers before retrying.`,
      );
    return response;
  };
  // Check this project's database access without requiring Project Settings
  // permissions, which a token scoped only to database writes need not have.
  const access = await (
    await request("/database/query", {
      method: "POST",
      body: JSON.stringify({ query: "SELECT true AS influencer_repair_access", read_only: true }),
    })
  )
    .json()
    .catch(() => null);
  if (!Array.isArray(access) || access[0]?.influencer_repair_access !== true)
    throw new Error("The database did not confirm repair access; no schema changes were sent.");
  await request("/database/query", {
    method: "POST",
    body: JSON.stringify({ query, read_only: false }),
  });
  log("Influencer schema repair applied. Run npm run diagnose:influencers to verify API access.");
  return { applied: true, project: ref };
}

module.exports = { repairInfluencers, repairQuery };
if (require.main === module) {
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  repairInfluencers({ apply: process.argv.includes("--apply") }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
