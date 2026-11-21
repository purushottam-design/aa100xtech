"use strict";

// Read-only. Never prints credentials, tokens, database rows, or Auth user details.
const { loadEnvConfig } = require("@next/env");
const { lookup } = require("node:dns/promises");
const { validateSupabaseIdentity } = require("./environment.cjs");

async function main() {
  const args = (process.argv ?? []).slice(2);
  const target = args.length === 1 ? /^--target-ref=([a-z0-9]{20})$/.exec(args[0])?.[1] : undefined;
  if (args.length && !target) {
    console.error(
      "Usage: node scripts/partner-workspace/diagnose.cjs [--target-ref=<owner-confirmed-ref>]",
    );
    process.exitCode = 2;
    return;
  }
  loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  const env = process.env;
  // Explicit read-only probe of an owner-confirmed target. Never rewrites runtime env.
  const probeUrl = target ? `https://${target}.supabase.co` : env.SUPABASE_URL;
  const identity = validateSupabaseIdentity(env, {
    expectedMasterRef: target ?? env.CM365_EXPECTED_MASTER_REF,
  });
  const report = {
    mode: "read-only-development-diagnostic",
    ...(target ? { targetProbeRef: target, runtimeConfigurationChanged: false } : {}),
    identity,
    keyPresence: {
      browser: Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
      server: Boolean(env.SUPABASE_PUBLISHABLE_KEY),
      service: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    dns: "not-checked",
    checks: [],
  };
  if (!target && identity.runtimeStatus !== "RUNTIME_CONSISTENT") {
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  try {
    await lookup(new URL(probeUrl).hostname);
    report.dns = "resolved";
  } catch (error) {
    report.dns = error.code === "ENOTFOUND" ? "ENOTFOUND" : "lookup-failed";
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
    return;
  }
  for (const [name, key, endpoint, privileged] of [
    ["auth-health", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "/auth/v1/health", false],
    ["auth-settings", env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, "/auth/v1/settings", false],
    [
      "memberships-schema",
      env.SUPABASE_SERVICE_ROLE_KEY,
      "/rest/v1/cm365_memberships?select=*&limit=0",
      true,
    ],
  ]) {
    if (!key) {
      report.checks.push({ name, status: "missing-key" });
      continue;
    }
    if (target && privileged && key.split(".").length === 3) {
      try {
        const claimedRef = JSON.parse(Buffer.from(key.split(".")[1], "base64url")).ref;
        if (claimedRef && claimedRef !== target) {
          report.checks.push({ name, status: "credential-project-mismatch" });
          continue;
        }
      } catch {
        report.checks.push({ name, status: "invalid-credential-format" });
        continue;
      }
    }
    try {
      const response = await fetch(probeUrl + endpoint, {
        // Opaque sb_secret_ keys are API keys, not bearer JWTs.
        headers: {
          apikey: key,
          ...(privileged && !key.startsWith("sb_") ? { Authorization: `Bearer ${key}` } : {}),
        },
        signal: AbortSignal.timeout(10_000),
      });
      const body = await response.json().catch(() => ({}));
      report.checks.push({
        name,
        status: response.status,
        code: typeof body.code === "string" && /^[A-Za-z0-9_]+$/.test(body.code) ? body.code : null,
      });
    } catch {
      report.checks.push({ name, status: "network-failure" });
    }
  }
  console.log(JSON.stringify(report, null, 2));
  if (report.checks.some(({ status }) => status !== 200)) process.exitCode = 1;
}

main().catch(() => {
  console.error("Diagnostic failed; no credentials or data have been changed.");
  process.exitCode = 1;
});
