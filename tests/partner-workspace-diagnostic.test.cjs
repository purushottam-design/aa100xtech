const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

async function diagnose({
  dnsError = null,
  runtimeStatus = "RUNTIME_CONSISTENT",
  missingTable = false,
  serviceKey = "private-fixture-key",
  targetRef,
} = {}) {
  const output = [],
    calls = [];
  const processStub = {
    argv: ["node", "diagnose.cjs", ...(targetRef ? [`--target-ref=${targetRef}`] : [])],
    cwd: () => ".",
    env: {
      SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-fixture-key",
      SUPABASE_PUBLISHABLE_KEY: "server-fixture-key",
      SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    },
  };
  load(
    "scripts/partner-workspace/diagnose.cjs",
    {
      "@next/env": { loadEnvConfig() {} },
      "node:dns/promises": {
        async lookup() {
          if (dnsError) throw { code: dnsError };
        },
      },
      "./environment.cjs": { validateSupabaseIdentity: () => ({ runtimeStatus }) },
    },
    {
      process: processStub,
      console: { log: (value) => output.push(value), error: (value) => output.push(value) },
      fetch: async (url, options) => {
        calls.push({ url, options });
        return new Response(
          JSON.stringify(
            missingTable && url.includes("/rest/v1/")
              ? { code: "PGRST205", message: "private server details" }
              : {},
          ),
          {
            status: missingTable && url.includes("/rest/v1/") ? 404 : 200,
          },
        );
      },
    },
  );
  await new Promise(setImmediate);
  return {
    report: JSON.parse(output[0]),
    output: output.join(""),
    calls,
    exitCode: processStub.exitCode,
  };
}

test("diagnostic stops before network requests on inconsistent configuration or DNS failure", async () => {
  const invalid = await diagnose({ runtimeStatus: "MISCONFIGURED" });
  assert.equal(invalid.calls.length, 0);
  assert.equal(invalid.exitCode, 1);
  const offline = await diagnose({ dnsError: "ENOTFOUND" });
  assert.equal(offline.report.dns, "ENOTFOUND");
  assert.equal(offline.calls.length, 0);
  assert.equal(offline.exitCode, 1);
});

test("diagnostic only reads health, settings and zero membership rows, with no secrets in output", async () => {
  const result = await diagnose();
  assert.equal(result.calls.length, 3);
  assert.equal(result.report.dns, "resolved");
  for (const { url, options } of result.calls) {
    assert.equal(options.method, undefined); // fetch defaults to GET.
    assert.equal(options.body, undefined);
    if (url.includes("/rest/v1/")) assert.match(url, /cm365_memberships\?select=\*&limit=0$/);
    else assert.equal(options.headers.Authorization, undefined);
  }
  assert.doesNotMatch(result.output, /fixture-key|private server details/);
});

test("a missing table is reported as a schema failure, never as an empty membership", async () => {
  const result = await diagnose({ missingTable: true });
  assert.equal(result.report.checks[2].code, "PGRST205");
  assert.equal(result.report.checks[2].status, 404);
  assert.equal(result.exitCode, 1);
  assert.doesNotMatch(result.output, /private server details/);
});

test("opaque service credentials are never sent as bearer JWTs", async () => {
  const result = await diagnose({ serviceKey: "sb_secret_fixture" });
  const schema = result.calls.find((call) => call.url.includes("/rest/v1/"));
  assert.equal(schema.options.headers.apikey, "sb_secret_fixture");
  assert.equal(schema.options.headers.Authorization, undefined);
  assert.doesNotMatch(result.output, /sb_secret_fixture/);
});

test("explicit target probe never rewrites runtime configuration or sends a mismatched service JWT", async () => {
  const targetRef = "xkzxtosqaqxxfezicthy";
  const jwt = `header.${Buffer.from(JSON.stringify({ ref: "ryircgxjsieovvbmprqv" })).toString("base64url")}.signature`;
  const result = await diagnose({ targetRef, serviceKey: jwt });
  assert.equal(result.report.targetProbeRef, targetRef);
  assert.equal(result.report.runtimeConfigurationChanged, false);
  assert.equal(result.calls.length, 2);
  assert.ok(
    result.calls.every((call) => new URL(call.url).hostname === `${targetRef}.supabase.co`),
  );
  assert.equal(result.report.checks[2].status, "credential-project-mismatch");
  assert.equal(result.exitCode, 1);
  assert.doesNotMatch(result.output, /header\.|signature/);
});
