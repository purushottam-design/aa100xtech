// Read-only checks. Never fetch applicant rows, invoke submission functions,
// list private files, or print credentials, URLs or raw database errors.
const { loadEnvConfig } = require("@next/env");
const requiredPaths = [
  ["Influencer applications", "/partner_applications"],
  ["Campaign inquiries", "/brand_campaign_inquiries"],
  ["Submission receipts", "/marketing_intake_receipts"],
  ["Submission rate limiter", "/rpc/take_influencer_submission_slot"],
  ["Marketing submission function", "/rpc/save_marketing_intake"],
];
async function diagnoseMarketing({ env = process.env, fetchImpl = fetch } = {}) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!env.SUPABASE_URL?.trim() || !key)
    return [
      {
        check: "Server configuration",
        ready: false,
        reason: "Missing Supabase server configuration",
      },
    ];
  const headers = { apikey: key };
  if (key.startsWith("sbp_") || key.startsWith("sb_publishable_"))
    return [
      {
        check: "Server credential type",
        ready: false,
        reason:
          "Use a server secret/service-role key, not a personal access token or publishable key",
      },
    ];
  try {
    if (JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === "anon")
      return [
        {
          check: "Server credential type",
          ready: false,
          reason: "An anon key cannot perform private server writes",
        },
      ];
  } catch {}
  if (!/^sb_(secret|publishable)_/.test(key)) headers.Authorization = `Bearer ${key}`;
  const get = async (resource) => {
    try {
      const response = await fetchImpl(new URL(resource, env.SUPABASE_URL), {
        headers,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      const body = await response.json().catch(() => null);
      return { response, body };
    } catch {
      return null;
    }
  };
  const schema = await get("/rest/v1/");
  if (!schema?.response.ok)
    return [
      {
        check: "Server database access",
        ready: false,
        ...(schema
          ? { status: schema.response.status }
          : { reason: "Connection failed; check network and trusted CA configuration" }),
      },
    ];
  const results = requiredPaths.map(([check, resource]) => ({
    check,
    ready: !!schema.body?.paths?.[resource],
  }));
  // Check actual columns with a zero-row query, not a successful metadata response alone.
  const columns = await get(
    "/rest/v1/brand_campaign_inquiries?select=id,data,status,notes,created_at,updated_at,reviewed_by,notification_status&limit=0",
  );
  results.push({
    check: "Campaign columns and server grants",
    ready: !!columns?.response.ok,
    ...(columns
      ? {
          status: columns.response.status,
          ...(typeof columns.body?.code === "string" && /^[A-Z0-9]{5,12}$/.test(columns.body.code)
            ? { databaseCode: columns.body.code }
            : {}),
        }
      : {}),
  });
  const bucket = await get("/storage/v1/bucket/influencer-media-kits");
  results.push({
    check: "Private media-kit storage",
    ready:
      !!bucket?.response.ok &&
      bucket.body?.public === false &&
      bucket.body?.file_size_limit === 5242880,
  });
  return results;
}
module.exports = { diagnoseMarketing };
if (require.main === module) {
  const loaded = loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  try {
    console.log(
      JSON.stringify({
        check: "Active server project",
        project: new URL(process.env.SUPABASE_URL).hostname.split(".")[0],
        environmentFiles: loaded.loadedEnvFiles.map((file) => file.path),
      }),
    );
  } catch {}
  diagnoseMarketing()
    .then((results) => {
      results.forEach((result) => console.log(JSON.stringify(result)));
      if (results.some((result) => !result.ready)) {
        console.log(
          "The API cannot confirm the marketing schema. If the migration was already run, verify SQL-side objects with supabase/diagnostics/marketing_intake.sql and use the additive 20261105143000_marketing_intake_recovery.sql migration to restore grants and reload the API cache. CLI project_admin_read permission is separate from these runtime checks.",
        );
        process.exitCode = 1;
      }
    })
    .catch(() => {
      console.error("Marketing diagnostics could not complete.");
      process.exitCode = 1;
    });
}
