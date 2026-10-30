const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

const origin = "https://uat.example.test";
const configuredEnv = {
  NODE_ENV: "development",
  ICICI_MERCHANT_ID: "fixture-merchant",
  ICICI_SECRET_KEY: "fixture-secret-never-public",
  ICICI_ENVIRONMENT: "sandbox",
  ICICI_SIGNING_MODE: "sorted-fields",
  ICICI_RETURN_URL: `${origin}/api/payments/icici/callback`,
  ICICI_UAT_ENABLED: "true",
  ICICI_UAT_MERCHANT_CONFIRMED: "true",
  ICICI_UAT_TESTS_PASSED: "true",
  SUPABASE_URL: "https://database.example.test",
  SUPABASE_SERVICE_ROLE_KEY: "fixture-database-secret-never-public",
};

function harness(patch = {}, failures = {}) {
  const env = { ...configuredEnv, ...patch };
  const reads = [];
  const logs = [];
  const database = {
    from(table) {
      reads.push(table);
      const query = {
        select(columns) {
          assert.equal(
            columns,
            table === "icici_uat_checkouts"
              ? "id"
              : "payment_gateway,gateway_order_id,gateway_transaction_id,paid_at",
          );
          return query;
        },
        limit(count) {
          assert.equal(count, 0); // Read schema readiness, never customer records.
          return query;
        },
        abortSignal() {
          if (failures.throw) throw new Error(configuredEnv.ICICI_SECRET_KEY);
          return Promise.resolve({ error: failures[table] ?? null });
        },
      };
      return query;
    },
  };
  const globals = {
    process: { env },
    console: { warn: (...args) => logs.push(args), log() {} },
    fetch: () => assert.fail("Availability must never call the bank"),
  };
  const checkout = load(
    "src/lib/icici-checkout.server.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: database },
      "@/lib/payment-database.server": { paymentAdmin: database },
      "@/lib/backend/handlers/consultations": {},
    },
    globals,
  );
  const route = load(
    "src/app/api/payments/icici/availability/route.ts",
    { "@/lib/icici-checkout.server": checkout },
    globals,
  );
  return {
    env,
    reads,
    logs,
    checkout,
    request: (host = origin) => route.GET(new Request(`${host}/api/payments/icici/availability`)),
  };
}

test("availability diagnoses absent configuration without treating completed UAT as a prerequisite for testing", async () => {
  const missing = [
    "ICICI_SIGNING_MODE",
    "ICICI_RETURN_URL",
    "ICICI_UAT_ENABLED",
    "ICICI_UAT_MERCHANT_CONFIRMED",
  ];
  const h = harness({
    ...Object.fromEntries(missing.map((name) => [name, undefined])),
    ICICI_UAT_TESTS_PASSED: undefined,
  });
  const response = await h.request("http://localhost:3000");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.available, false);
  assert.equal(body.icici, false);
  assert.equal(body.reason, "Missing ICICI configuration");
  assert.deepEqual(body.missing, missing);
  assert.deepEqual(h.reads, []);
  assert.equal(h.logs.length, 1);
  for (const value of [
    configuredEnv.ICICI_MERCHANT_ID,
    configuredEnv.ICICI_SECRET_KEY,
    configuredEnv.SUPABASE_SERVICE_ROLE_KEY,
    configuredEnv.ICICI_RETURN_URL,
  ]) {
    assert.equal(JSON.stringify([body, h.logs]).includes(value), false);
  }
});

test("each required credential is rejected when absent, empty or whitespace-only", async () => {
  for (const name of ["ICICI_MERCHANT_ID", "ICICI_SECRET_KEY", "ICICI_RETURN_URL"]) {
    for (const value of [undefined, "", "   "]) {
      const h = harness({ [name]: value });
      const body = await (await h.request()).json();
      assert.equal(body.available, false);
      assert.equal(body.reason, `${name} is missing`);
      assert.deepEqual(body.missing, [name]);
      assert.deepEqual(h.reads, []);
    }
  }
});

test("valid confirmed UAT becomes available at runtime without optional base URL or aggregator ID", async () => {
  for (const mode of ["sorted-fields", "json-v2"]) {
    const h = harness({ ICICI_SIGNING_MODE: mode, ICICI_UAT_ENABLED: "false" });
    assert.equal((await (await h.request()).json()).available, false);
    h.env.ICICI_UAT_ENABLED = "true";
    assert.deepEqual(await (await h.request()).json(), {
      icici: true,
      environment: "uat",
      available: true,
    });
    assert.deepEqual(h.reads, ["icici_uat_checkouts", "consultation_bookings"]);
  }
});

test("false approval flags, unsupported environments and invalid URLs remain unavailable", async () => {
  for (const name of [
    "ICICI_UAT_ENABLED",
    "ICICI_UAT_MERCHANT_CONFIRMED",
    "ICICI_UAT_TESTS_PASSED",
  ]) {
    const h = harness({ [name]: "false" });
    const body = await (await h.request()).json();
    assert.equal(body.available, false);
    assert.deepEqual(body.blocked, [name]);
    assert.match(body.reason, new RegExp(name));
    assert.deepEqual(h.reads, []);
  }
  for (const [name, value] of [
    ["ICICI_ENVIRONMENT", "production"],
    ["ICICI_SIGNING_MODE", "auto"],
    ["ICICI_BASE_URL", "https://untrusted.example.test/"],
    ["ICICI_RETURN_URL", "not-a-url"],
    ["ICICI_RETURN_URL", "http://localhost:3000/api/payments/icici/callback"],
    ["ICICI_RETURN_URL", `${origin}/wrong-path`],
    ["ICICI_RETURN_URL", `${origin}/api/payments/icici/callback?secret=never-return-this`],
  ]) {
    const h = harness({ [name]: value });
    const body = await (await h.request()).json();
    assert.equal(body.available, false);
    assert.deepEqual(body.invalid, [name]);
    if (name.endsWith("_URL")) assert.equal(JSON.stringify([body, h.logs]).includes(value), false);
  }
});

test("localhost and other origins cannot enable an HTTPS UAT callback configuration", async () => {
  const h = harness();
  const body = await (await h.request("http://localhost:3000")).json();
  assert.equal(body.available, false);
  assert.equal(body.code, "ICICI_WRONG_ORIGIN");
  assert.match(body.reason, /origin.*ICICI_RETURN_URL/);
  assert.deepEqual(h.reads, []);
});

test("missing database settings, schema and database failures remain unavailable with safe reasons", async () => {
  const h = harness({ SUPABASE_SERVICE_ROLE_KEY: "" });
  const missing = await (await h.request()).json();
  assert.deepEqual(missing.missing, ["SUPABASE_SERVICE_ROLE_KEY"]);
  assert.deepEqual(h.reads, []);
  for (const [table, code, expected] of [
    ["icici_uat_checkouts", "PGRST205", /20261027150000_icici_uat_checkouts/],
    ["consultation_bookings", "42703", /20261026120000_dual_gateway_tracking/],
    ["icici_uat_checkouts", "PGRST301", /verify Supabase server access/],
    ["consultation_bookings", "42501", /verify Supabase server access/],
  ]) {
    const failed = harness({}, { [table]: { code, message: configuredEnv.ICICI_SECRET_KEY } });
    const body = await (await failed.request()).json();
    assert.equal(body.available, false);
    assert.match(body.reason, expected);
    assert.equal(
      JSON.stringify([body, failed.logs]).includes(configuredEnv.ICICI_SECRET_KEY),
      false,
    );
  }
  const thrown = harness({}, { throw: true });
  const body = await (await thrown.request()).json();
  assert.equal(body.code, "ICICI_AVAILABILITY_CHECK_FAILED");
  assert.equal(JSON.stringify([body, thrown.logs]).includes(configuredEnv.ICICI_SECRET_KEY), false);
});

test("production responses hide configuration diagnostics while retaining actual availability", async () => {
  const h = harness({ NODE_ENV: "production", ICICI_SECRET_KEY: "" });
  assert.deepEqual(await (await h.request()).json(), {
    icici: false,
    environment: "uat",
    available: false,
    reason: "ICICI Bank payments are currently unavailable.",
  });
  assert.deepEqual(h.logs, []);
  h.env.ICICI_SECRET_KEY = configuredEnv.ICICI_SECRET_KEY;
  assert.deepEqual(await (await h.request()).json(), {
    icici: true,
    environment: "uat",
    available: true,
  });
});
