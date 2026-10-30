// Read-only checks: never prints keys, URLs, submitted applications or DB errors.
const { loadEnvConfig } = require("@next/env");
async function inspect(label, key, resource, { root, fetchImpl }) {
  if (!root?.trim() || !key?.trim())
    return { check: label, ready: false, reason: "Missing configuration" };
  try {
    const headers = { apikey: key };
    if (!/^sb_(publishable|secret)_/.test(key)) headers.Authorization = `Bearer ${key}`;
    const response = await fetchImpl(new URL(resource, root), {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    let body;
    try {
      body = await response.json();
    } catch {}
    const result = { check: label, ready: response.ok, status: response.status };
    if (label === "Server application schema" && response.ok) {
      result.applicationTable = !!body?.paths?.["/partner_applications"];
      result.rateLimitFunction = !!body?.paths?.["/rpc/take_influencer_submission_slot"];
      result.ready = result.applicationTable && result.rateLimitFunction;
    }
    if (typeof body?.code === "string" && /^[A-Z0-9]{5,12}$/.test(body.code))
      result.databaseCode = body.code;
    return result;
  } catch (error) {
    const tls = /CERT|SIGNATURE/.test(error?.cause?.code ?? "");
    return {
      check: label,
      ready: false,
      reason: tls ? "TLS trust failure; check system CA support" : "Connection failed or timed out",
    };
  }
}

async function diagnoseInfluencers({ env = process.env, fetchImpl = fetch } = {}) {
  const options = { root: env.SUPABASE_URL, fetchImpl };
  return Promise.all([
    // REST metadata can be denied even when a publishable key is valid.
    // Auth settings validates the key independently of database objects/grants.
    inspect(
      "Public database credential",
      env.SUPABASE_PUBLISHABLE_KEY,
      "/auth/v1/settings",
      options,
    ),
    inspect("Server application schema", env.SUPABASE_SERVICE_ROLE_KEY, "/rest/v1/", options),
    inspect(
      "Application columns",
      env.SUPABASE_SERVICE_ROLE_KEY,
      "/rest/v1/partner_applications?select=id,status,is_influencer,influencer_data,influencer_review_status,processing_consent,publication_consent,consent_recorded_at&limit=0",
      options,
    ),
    inspect(
      "Public influencer profiles",
      env.SUPABASE_PUBLISHABLE_KEY,
      "/rest/v1/influencer_profiles?select=id&limit=0",
      options,
    ),
  ]);
}

async function main() {
  const loaded = loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
    info() {},
    error() {},
  });
  console.log("Environment files:", loaded.loadedEnvFiles.map((file) => file.path).join(", "));
  const results = await diagnoseInfluencers();
  results.forEach((result) => console.log(JSON.stringify(result)));
  if (results.some((result) => !result.ready)) {
    console.log(
      "See docs/influencer-partner-program.md. For missing application objects, preview npm run repair:influencers, then run it with -- --apply using a project-authorized SUPABASE_ACCESS_TOKEN.",
    );
    process.exitCode = 1;
  }
}
module.exports = { diagnoseInfluencers };
if (require.main === module)
  main().catch(() => {
    console.error("Diagnostics could not complete.");
    process.exitCode = 1;
  });
