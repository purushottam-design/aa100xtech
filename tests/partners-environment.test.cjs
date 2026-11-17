const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const {
  validateSupabaseIdentity: validate,
} = require("../scripts/partner-workspace/environment.cjs");

const master = "xkzxtosqaqxxfezicthy";
const source = "hvcznonjilfmyizlmlkq";
const local = "ryircgxjsieovvbmprqv";
const envFor = (ref) => ({
  SUPABASE_URL: `https://${ref}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
});

test("an explicitly pinned mismatching master stops the launcher before Next starts", () => {
  const result = spawnSync(process.execPath, ["scripts/next.cjs", "build"], {
    env: { ...process.env, ...envFor(local), CM365_EXPECTED_MASTER_REF: master },
    encoding: "utf8",
    windowsHide: true,
    timeout: 15_000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Partners master configuration rejected:.*MASTER_RUNTIME_MISMATCH/);
  assert.equal(result.stdout.includes("Creating an optimized production build"), false);
});

test("matching local projects do not imply the verified deployed master", () => {
  const result = validate(envFor(local), { expectedMasterRef: master, sourceRef: source });
  assert.equal(result.runtimeStatus, "RUNTIME_CONSISTENT");
  assert.equal(result.targetStatus, "MISCONFIGURED");
  assert.equal(result.identityReady, false);
  assert.ok(result.codes.includes("MASTER_RUNTIME_MISMATCH"));
  assert.equal(
    validate(envFor(master), { sourceRef: source }).targetStatus,
    "AWAITING_MASTER_CONFIRMATION",
  );
});

test("identity readiness requires matching browser, server, optional IDs and a distinct source", () => {
  const correct = {
    ...envFor(master),
    SUPABASE_PROJECT_ID: master,
    NEXT_PUBLIC_SUPABASE_PROJECT_ID: master,
  };
  assert.equal(
    validate(correct, { expectedMasterRef: master, sourceRef: source }).identityReady,
    true,
  );
  for (const changed of [
    { NEXT_PUBLIC_SUPABASE_URL: `https://${local}.supabase.co` },
    { SUPABASE_PROJECT_ID: local },
    { NEXT_PUBLIC_SUPABASE_PROJECT_ID: local },
    { SUPABASE_PROJECT_ID: "" },
  ])
    assert.equal(
      validate({ ...correct, ...changed }, { expectedMasterRef: master, sourceRef: source })
        .identityReady,
      false,
    );
  for (const sourceRef of [undefined, "invalid", master])
    assert.equal(validate(correct, { expectedMasterRef: master, sourceRef }).identityReady, false);
});

test("hostile or ambiguous URLs fail without emitting supplied values or secrets", () => {
  const host = `${master}.supabase.co`;
  for (const url of [
    `http://${host}`,
    `https://${host}:443`,
    `https://name:secret@${host}`,
    `https://${host}/rest/v1`,
    `https://${host}/?key=secret`,
    `https://${host}/#secret`,
    `https://${host}.evil.example`,
    `https://${host.toUpperCase()}`,
    `https://${host}\n`,
    `https://${host} `,
    `https://${host.replace("supabase", "supabаse")}`,
    `https://%78${master.slice(1)}.supabase.co`,
  ]) {
    const result = validate(
      { ...envFor(master), SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: "DO-NOT-OUTPUT-SECRET" },
      { expectedMasterRef: master, sourceRef: source },
    );
    assert.equal(result.identityReady, false);
    assert.equal(result.refs.server, null);
    assert.equal(JSON.stringify(result).includes(url), false);
    assert.equal(JSON.stringify(result).includes("DO-NOT-OUTPUT-SECRET"), false);
  }
  assert.equal(
    validate(
      { ...envFor(master), SUPABASE_URL: `https://${host}/` },
      { expectedMasterRef: master, sourceRef: source },
    ).identityReady,
    true,
  );
});
