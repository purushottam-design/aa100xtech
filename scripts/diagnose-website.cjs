// Read-only readiness checks. Never creates tables, submits forms or sends mail.
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
async function diagnoseWebsite(env = process.env, log = console.log) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Configure the server Supabase connection.");
  if (
    env.NEXT_PUBLIC_SUPABASE_URL &&
    new URL(env.SUPABASE_URL).origin !== new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin
  )
    throw new Error("Browser and server Supabase projects differ. No requests were sent.");
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let ready = true;
  for (const [table, columns] of [
    ["contact_messages", "id,name,email,phone,company,service,message,status,created_at"],
    [
      "candidate_submissions",
      "id,full_name,email,phone,role_applied,task_title,hours_needed,availability,expected_cost,deliverables,portfolio_url,file_path,created_at",
    ],
    [
      "content_blocks",
      "id,block_type,slug,title,subtitle,body,image_url,link_url,link_label,placement,position,active,published_at",
    ],
    ["app_settings", "key,value,updated_at,updated_by"],
    [
      "website_requests",
      "id,kind,payload,payload_hash,email_hash,recipient,notification_status,created_at",
    ],
  ]) {
    const { error, status } = await client
      .from(table)
      .select(columns)
      .limit(0)
      .abortSignal(AbortSignal.timeout(5000));
    if (error) ready = false;
    log(JSON.stringify({ table, status, ready: !error, ...(error ? { code: error.code } : {}) }));
  }
  const { data: bucket, error: bucketError } = await client.storage.getBucket("website-resumes");
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY };
  if (!env.SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_"))
    headers.Authorization = `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`;
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers,
    signal: AbortSignal.timeout(5000),
  });
  const schema = await response.json().catch(() => null);
  const rpcReady = !!(response.ok && schema?.paths?.["/rpc/submit_website_request"]?.post);
  ready &&= rpcReady;
  log(JSON.stringify({ requestRpcPresent: rpcReady }));
  const privateBucket = !!bucket && !bucket.public && !bucketError;
  ready &&= privateBucket;
  log(
    JSON.stringify({
      privateResumeBucket: privateBucket,
      notificationsConfigured: !!(env.RESEND_API_KEY && env.NOTIFICATION_FROM_EMAIL),
      hrDestination: "hr@aa100xtech.com",
    }),
  );
  return ready;
}
if (require.main === module) {
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  diagnoseWebsite()
    .then((ready) => {
      if (!ready) process.exitCode = 1;
    })
    .catch(() => {
      console.error(
        "Website readiness could not be verified. Check server configuration, schema and database access.",
      );
      process.exitCode = 1;
    });
}
module.exports = { diagnoseWebsite };
