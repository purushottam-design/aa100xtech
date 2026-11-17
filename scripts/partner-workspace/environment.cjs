"use strict";

const REF_RE = /^[a-z0-9]{20}$/;
const URL_RE = /^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/;

function parseRef(value) {
  return typeof value === "string" && value.length === 20 && REF_RE.test(value) ? value : null;
}

function parseUrlRef(value) {
  if (typeof value !== "string") return null;
  const match = URL_RE.exec(value);
  return match && match[0] === value ? match[1] : null;
}

// Local identity checks only. Success does not attest to credentials, deployed
// settings, schema, permissions, reconciliation, or approval to migrate/cut over.
function validateSupabaseIdentity(env = {}, options = {}) {
  const codes = [];
  const server = parseUrlRef(env.SUPABASE_URL);
  const browser = parseUrlRef(env.NEXT_PUBLIC_SUPABASE_URL);
  const expectedMaster = parseRef(options.expectedMasterRef);
  const source = parseRef(options.sourceRef);
  if (!server) codes.push("SERVER_URL_INVALID_OR_MISSING");
  if (!browser) codes.push("BROWSER_URL_INVALID_OR_MISSING");
  if (server && browser && server !== browser) codes.push("RUNTIME_PROJECT_MISMATCH");
  for (const [key, actual, label] of [
    ["SUPABASE_PROJECT_ID", server, "SERVER"],
    ["NEXT_PUBLIC_SUPABASE_PROJECT_ID", browser, "BROWSER"],
  ]) {
    if (env[key] === undefined) continue;
    const ref = parseRef(env[key]);
    if (!ref) codes.push(`${label}_PROJECT_ID_INVALID`);
    else if (actual && ref !== actual) codes.push(`${label}_PROJECT_ID_MISMATCH`);
  }
  const runtimeStatus = codes.length ? "MISCONFIGURED" : "RUNTIME_CONSISTENT";
  let targetStatus = "MISCONFIGURED";
  if (options.expectedMasterRef === undefined) {
    codes.push("MASTER_CONFIRMATION_REQUIRED");
    if (runtimeStatus === "RUNTIME_CONSISTENT") targetStatus = "AWAITING_MASTER_CONFIRMATION";
  } else if (!expectedMaster) codes.push("MASTER_REF_INVALID");
  else if (
    runtimeStatus !== "RUNTIME_CONSISTENT" ||
    expectedMaster !== server ||
    expectedMaster !== browser
  )
    codes.push("MASTER_RUNTIME_MISMATCH");
  else targetStatus = "TARGET_CONFIRMED";
  if (options.sourceRef === undefined) codes.push("SOURCE_REF_REQUIRED");
  else if (!source) codes.push("SOURCE_REF_INVALID");
  const sourceCollision = Boolean(source && [server, browser, expectedMaster].includes(source));
  if (sourceCollision) codes.push("SOURCE_TARGET_COLLISION");
  return {
    runtimeStatus,
    targetStatus,
    identityReady: targetStatus === "TARGET_CONFIRMED" && source !== null && !sourceCollision,
    refs: { server, browser, expectedMaster, source },
    codes,
  };
}

module.exports = { validateSupabaseIdentity };
