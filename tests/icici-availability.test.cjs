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
          const required =
            table === "icici_uat_checkouts"
              ? [
                  "id",
                  "token_hash",
                  "booking_data",
                  "amount_paise",
                  "merchant_reference",
                  "state",
                  "expires_at",
                  "redirect_url",
                ]
              : [
                  "booking_id",
                  "customer_name",
                  "email",
                  "plan_id",
                  "preferred_date",
                  "payment_gateway",
                  "gateway_order_id",
                  "gateway_transaction_id",
                  "paid_at",
                  "payment_status",
                  "booking_status",
                ];
          for (const name of required) assert.ok(columns.split(",").includes(name), name);
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
    request: (host = origin, init) =>
      route.GET(new Request(`${host}/api/payments/icici/availability`, init)),
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
      origins: { configured: origin, request: origin, transport: origin, source: "request-url" },
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
  assert.deepEqual(body.origins, {
    configured: origin,
    request: "http://localhost:3000",
    transport: "http://localhost:3000",
    source: "request-url",
  });
  assert.deepEqual(h.reads, []);
});

test("explicitly trusted HTTPS forwarding supports a pinned UAT tunnel and deployed staging domain", async () => {
  for (const publicOrigin of [
    "https://uat-tunnel.example.test",
    "https://staging.example.test",
    "https://staging.example.test:8443",
    "https://production.example.test",
  ]) {
    const h = harness({
      ICICI_RETURN_URL: `${publicOrigin}/api/payments/icici/callback`,
      ICICI_TRUST_PROXY: "true",
    });
    const transport = "http://localhost:3000";
    const response = await h.request(transport, {
      headers: {
        "x-forwarded-host": new URL(publicOrigin).host,
        "x-forwarded-proto": "https",
      },
    });
    const body = await response.json();
    assert.equal(body.available, true);
    assert.deepEqual(body.origins, {
      configured: publicOrigin,
      request: publicOrigin,
      transport,
      source: "trusted-proxy",
    });
    assert.equal(JSON.stringify([body, h.logs]).includes(configuredEnv.ICICI_SECRET_KEY), false);
    assert.equal(
      JSON.stringify([body, h.logs]).includes(configuredEnv.SUPABASE_SERVICE_ROLE_KEY),
      false,
    );
  }
});

test("Next.js internal request URL and nextUrl do not override the pinned HTTPS proxy origin", () => {
  const { NextRequest } = require("next/server");
  const { iciciRequestOrigin } = load(
    "src/lib/icici-origin.server.ts",
    {},
    {
      process: { env: { ...configuredEnv, ICICI_TRUST_PROXY: "true" } },
    },
  );
  for (const protocol of ["http", "https"]) {
    const request = new NextRequest(
      `${protocol}://localhost:3000/api/payments/icici/availability`,
      {
        headers: {
          host: new URL(origin).host,
          "x-forwarded-host": new URL(origin).host,
          "x-forwarded-proto": "https",
        },
      },
    );
    assert.equal(new URL(request.url).origin, `${protocol}://localhost:3000`);
    assert.equal(request.nextUrl.origin, `${protocol}://localhost:3000`);
    assert.equal(iciciRequestOrigin(request), origin);
  }
  for (const host of [
    "attacker.example.test",
    "uat.example.test.attacker.test",
    "uat.example.test.",
  ]) {
    const request = new NextRequest("http://localhost:3000/api/payments/icici/availability", {
      headers: {
        host,
        origin: `https://${host}`,
        "x-forwarded-host": host,
        "x-forwarded-proto": "https",
      },
    });
    assert.equal(iciciRequestOrigin(request), null);
  }
});

test("forwarding headers and browser Origin cannot opt a request into proxy trust", async () => {
  for (const setting of [undefined, "false", "1"]) {
    const h = harness({ ICICI_TRUST_PROXY: setting });
    const body = await (
      await h.request("http://localhost:3000", {
        headers: {
          origin,
          "x-forwarded-host": new URL(origin).host,
          "x-forwarded-proto": "https",
          forwarded: `host=${new URL(origin).host};proto=https`,
        },
      })
    ).json();
    assert.equal(body.code, "ICICI_WRONG_ORIGIN");
    assert.equal(body.origins.request, "http://localhost:3000");
    assert.deepEqual(h.reads, []);
  }
});

test("proxy mode fails closed for absent, ambiguous, malformed, HTTP or mismatched forwarding", async () => {
  for (const [host, protocol] of [
    [undefined, undefined],
    ["uat.example.test", undefined],
    [undefined, "https"],
    ["uat.example.test", "http"],
    ["uat.example.test", "https,http"],
    ["uat.example.test,attacker.example.test", "https"],
    ["attacker.example.test", "https"],
    ["uat.example.test:444", "https"],
    ["uat.example.test@attacker.example.test", "https"],
    ["uat.example.test/path?secret=must-not-leak", "https"],
    ["uat.example.test#fragment", "https"],
    ["%75at.example.test", "https"],
    ["uat.example.test\\attacker", "https"],
  ]) {
    const h = harness({ ICICI_TRUST_PROXY: "true" });
    const body = await (
      await h.request(origin, {
        headers: {
          ...(host ? { "x-forwarded-host": host } : {}),
          ...(protocol ? { "x-forwarded-proto": protocol } : {}),
        },
      })
    ).json();
    assert.equal(body.available, false);
    assert.equal(body.code, "ICICI_WRONG_ORIGIN");
    assert.deepEqual(h.reads, []);
    assert.equal(JSON.stringify([body, h.logs]).includes("must-not-leak"), false);
  }
  const h = harness({ ICICI_TRUST_PROXY: "true" });
  assert.equal(
    (
      await (
        await h.request("http://localhost:3000", {
          headers: { "x-forwarded-host": "UAT.EXAMPLE.TEST:443", "x-forwarded-proto": "https" },
        })
      ).json()
    ).available,
    true,
  );
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
  h.env.ICICI_TRUST_PROXY = "true";
  for (const host of [new URL(origin).host, "attacker.example.test"]) {
    const response = await h.request("http://localhost:3000", {
      headers: { "x-forwarded-host": host, "x-forwarded-proto": "https" },
    });
    const body = await response.json();
    assert.equal(body.available, host === new URL(origin).host);
    assert.equal(body.origins, undefined);
    assert.equal(response.headers.get("vary"), "Authorization");
  }
  assert.deepEqual(h.logs, []);
});
