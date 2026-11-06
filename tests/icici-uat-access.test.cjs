const assert = require("node:assert/strict");
const { test } = require("node:test");
const { z } = require("zod");
const load = require("./helpers/load-server.cjs");

const origin = "https://uat.example.test";
const defaults = {
  NODE_ENV: "production", // A deployed UAT app uses a production Next.js build.
  ICICI_ENVIRONMENT: "uat",
  ICICI_MERCHANT_ID: "fixture-merchant",
  ICICI_SECRET_KEY: "fixture-signing-secret",
  ICICI_SIGNING_MODE: "sorted-fields",
  ICICI_RETURN_URL: `${origin}/api/payments/icici/callback`,
  ICICI_UAT_ENABLED: "true",
  ICICI_UAT_MERCHANT_CONFIRMED: "true",
  ICICI_UAT_TESTS_PASSED: "false",
  ICICI_UAT_TEST_MODE: "true",
  SUPABASE_URL: "https://database.example.test",
  SUPABASE_SERVICE_ROLE_KEY: "fixture-service-secret",
};

function harness(patch = {}, { authFails = false, notAdmin = false } = {}) {
  const env = { ...defaults, ...patch };
  const effects = { prepared: 0, initiated: 0, validated: 0, authorized: 0 };
  const globals = {
    process: { env },
    fetch: () => assert.fail("Access checks must never contact the bank"),
  };
  const bank = load("src/lib/icici.server.ts", {}, globals);
  const schema = z.object({ id: z.string() });
  const mocks = {
    "@/lib/icici.server": bank,
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        auth: {
          getUser: async (token) => {
            effects.validated++;
            return authFails || token !== "fixture-user-token"
              ? { data: { user: null }, error: { message: defaults.ICICI_SECRET_KEY } }
              : { data: { user: { id: "fixture-user-id" } }, error: null };
          },
        },
        from: () => ({
          select: () => ({
            limit: () => ({ abortSignal: async () => ({ error: null }) }),
          }),
        }),
      },
    },
    "@/lib/payment-database.server": {
      paymentAdmin: {
        from: () => ({
          select: () => ({ limit: () => ({ abortSignal: async () => ({ error: null }) }) }),
        }),
      },
    },
    "@/lib/backend/handlers/consultations": {},
    "@/lib/rbac.server": {
      authorizeSuper: async (id) => {
        assert.equal(id, "fixture-user-id");
        effects.authorized++;
        if (notAdmin) throw new Error(defaults.ICICI_SECRET_KEY);
      },
    },
  };
  const checkout = load("src/lib/icici-checkout.server.ts", mocks, globals);
  const routes = Object.fromEntries(
    ["checkout", "initiate"].map((name) => [
      name,
      load(
        `src/app/api/payments/icici/${name}/route.ts`,
        {
          ...mocks,
          "@/lib/icici-checkout.server": {
            checkoutPreparationSchema: schema,
            checkoutInitiationSchema: schema,
            prepareCheckout: async () => {
              effects.prepared++;
              return { amount_paise: 250000, currency: "INR", merchant_reference: "ICFIXTURE" };
            },
            startCheckout: async () => {
              effects.initiated++;
              return { gateway: "icici", redirectUrl: "https://pgpayuat.icicibank.com/fixture" };
            },
          },
        },
        globals,
      ),
    ]),
  );
  const request = (path, token, host = origin, headers = {}) =>
    new Request(`${host}/api/payments/icici/${path}`, {
      method: "POST",
      headers: {
        origin: host,
        "x-aa-rpc": "1",
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: JSON.stringify({ id: "fixture-checkout" }),
    });
  return {
    env,
    effects,
    request,
    availability: (token, host, headers) =>
      checkout.iciciAvailability(request("availability", token, host, headers)),
    post: (name, token, host, headers) => routes[name].POST(request(name, token, host, headers)),
  };
}

test("a verified super admin can start controlled UAT before tests pass, including on a deployed build", async () => {
  const h = harness();
  assert.equal((await h.availability("fixture-user-token")).available, true);
  for (const name of ["checkout", "initiate"])
    assert.equal((await h.post(name, "fixture-user-token")).status, 200);
  assert.equal(h.env.ICICI_UAT_TESTS_PASSED, "false", "Testing never records UAT approval");
  assert.deepEqual(h.effects, { prepared: 1, initiated: 1, validated: 3, authorized: 3 });
});

test("anonymous, forged-token and non-admin requests cannot prepare or initiate initial UAT", async () => {
  for (const [options, token] of [
    [{}, undefined],
    [{}, "forged-token"],
    [{ authFails: true }, "fixture-user-token"],
    [{ notAdmin: true }, "fixture-user-token"],
  ]) {
    const h = harness({}, options);
    const available = await h.availability(token);
    assert.equal(available.available, false);
    assert.equal(available.code, "ICICI_UAT_TEST_ACCESS_REQUIRED");
    for (const name of ["checkout", "initiate"]) {
      const response = await h.post(name, token);
      assert.equal(response.status, 403);
      assert.equal(
        JSON.stringify(await response.json()).includes(defaults.ICICI_SECRET_KEY),
        false,
      );
    }
    assert.equal(h.effects.prepared, 0);
    assert.equal(h.effects.initiated, 0);
  }
});

test("controlled UAT cannot bypass bank activation, approved origin or the live-environment ban", async () => {
  for (const patch of [
    { ICICI_UAT_MERCHANT_CONFIRMED: "false" },
    { ICICI_UAT_ENABLED: "false" },
    { ICICI_ENVIRONMENT: "production", ICICI_UAT_TESTS_PASSED: "true" },
    { ICICI_RETURN_URL: "http://localhost:3000/api/payments/icici/callback" },
    { ICICI_BASE_URL: "https://pgpay.icicibank.com/tsp/pg/api/v2/initiateSale" },
    { ICICI_UAT_TEST_MODE: "false" },
  ]) {
    const h = harness(patch);
    assert.equal((await h.availability("fixture-user-token")).available, false);
    for (const name of ["checkout", "initiate"])
      assert.equal((await h.post(name, "fixture-user-token")).status, 503);
    assert.equal(h.effects.prepared, 0);
    assert.equal(h.effects.initiated, 0);
  }
  const h = harness();
  assert.equal(
    (await h.post("initiate", "fixture-user-token", "https://other.example.test")).status,
    403,
  );
  assert.equal(h.effects.initiated, 0);
});

test("the retired local guest flag cannot authorize a UAT payment", async () => {
  const h = harness({
    NODE_ENV: "development",
    ICICI_UAT_GUEST_CHECKOUT: "true",
    ICICI_TRUST_PROXY: "true",
    DEV_TUNNEL_ORIGIN: origin,
  });
  const headers = {
    origin,
    "x-forwarded-host": new URL(origin).host,
    "x-forwarded-proto": "https",
  };
  assert.equal(
    (await h.availability(undefined, "http://localhost:3000", headers)).available,
    false,
  );
  for (const name of ["checkout", "initiate"])
    assert.equal((await h.post(name, undefined, "http://localhost:3000", headers)).status, 403);
  assert.deepEqual(h.effects, { prepared: 0, initiated: 0, validated: 0, authorized: 0 });
  assert.equal(h.env.ICICI_UAT_TESTS_PASSED, "false");
});

test("local guest opt-in cannot bypass deployment, activation, tunnel, CSRF or HTTPS checks", async () => {
  const local = {
    NODE_ENV: "development",
    ICICI_UAT_GUEST_CHECKOUT: "true",
    ICICI_TRUST_PROXY: "true",
    DEV_TUNNEL_ORIGIN: origin,
  };
  const headers = {
    origin,
    "x-forwarded-host": new URL(origin).host,
    "x-forwarded-proto": "https",
  };
  for (const patch of [
    { NODE_ENV: "production" },
    { ICICI_UAT_GUEST_CHECKOUT: "false" },
    { DEV_TUNNEL_ORIGIN: undefined },
    { DEV_TUNNEL_ORIGIN: "https://other.example.test" },
    { ICICI_TRUST_PROXY: "false" },
    { ICICI_UAT_TEST_MODE: "false" },
    { ICICI_UAT_ENABLED: "false" },
    { ICICI_UAT_MERCHANT_CONFIRMED: "false" },
    { ICICI_ENVIRONMENT: "production" },
  ]) {
    const h = harness({ ...local, ...patch });
    assert.equal(
      (await h.availability(undefined, "http://localhost:3000", headers)).available,
      false,
    );
    for (const name of ["checkout", "initiate"])
      assert.ok((await h.post(name, undefined, "http://localhost:3000", headers)).status >= 400);
    assert.equal(h.effects.prepared + h.effects.initiated, 0);
  }
  for (const patch of [
    { origin: "https://attacker.example.test" },
    { "x-forwarded-host": "attacker.example.test" },
    { "x-forwarded-proto": "http" },
    { "sec-fetch-site": "cross-site" },
    { "x-aa-rpc": "0" },
  ]) {
    const h = harness(local);
    assert.equal(
      (await h.post("initiate", undefined, "http://localhost:3000", { ...headers, ...patch }))
        .status,
      403,
    );
    assert.equal(h.effects.initiated, 0);
  }
});

test("a completed UAT flag never substitutes for a legitimate Super Admin session", async () => {
  const h = harness({ ICICI_UAT_TESTS_PASSED: "true", ICICI_UAT_TEST_MODE: "false" });
  assert.equal((await h.availability()).available, false);
  assert.equal((await h.post("initiate")).status, 403);
  assert.equal((await h.post("initiate", "fixture-user-token")).status, 200);
  assert.equal(h.effects.validated, 1);
  assert.equal(h.effects.initiated, 1);
});

test("trusted forwarding is shared by availability, tester access, preparation and initiation", async () => {
  const h = harness({ ICICI_TRUST_PROXY: "true" });
  const internal = "http://localhost:3000";
  const headers = {
    origin,
    "x-forwarded-host": new URL(origin).host,
    "x-forwarded-proto": "https",
  };
  assert.equal((await h.availability("fixture-user-token", internal, headers)).available, true);
  for (const name of ["checkout", "initiate"])
    assert.equal((await h.post(name, "fixture-user-token", internal, headers)).status, 200);
  // Passing the origin check never substitutes for authenticated tester access.
  assert.equal((await h.post("initiate", undefined, internal, headers)).status, 403);
  assert.equal(h.effects.initiated, 1);
});

test("proxy-aware JSON requests retain CSRF, HTTPS, host and activation checks before side effects", async () => {
  for (const headers of [
    { origin: "https://attacker.example.test" },
    { origin: "null" },
    { "sec-fetch-site": "cross-site" },
    { "x-aa-rpc": "0" },
    { "x-forwarded-host": "attacker.example.test" },
    { "x-forwarded-host": "uat.example.test,attacker.example.test" },
    { "x-forwarded-proto": "http" },
  ]) {
    const h = harness({ ICICI_TRUST_PROXY: "true", ICICI_UAT_TESTS_PASSED: "true" });
    const response = await h.post("initiate", undefined, "http://localhost:3000", {
      origin,
      "x-forwarded-host": new URL(origin).host,
      "x-forwarded-proto": "https",
      ...headers,
    });
    assert.equal(response.status, 403);
    assert.equal(h.effects.initiated, 0);
    assert.equal(h.effects.validated, 0);
  }
});

test("the ICICI browser client forwards its existing session for availability and initiation", async () => {
  const requests = [];
  const client = load(
    "src/lib/icici-checkout.ts",
    {
      "@/integrations/supabase/auth-attacher": {
        attachSupabaseAuth: async () => new Headers({ authorization: "Bearer fixture-user-token" }),
      },
    },
    {
      fetch: async (url, init) => {
        requests.push({ url, init });
        return Response.json({ ok: true });
      },
    },
  );
  await client.fetchIciciAvailability();
  await client.iciciRequest("initiate", { id: "fixture-checkout" });
  for (const { init } of requests) {
    assert.equal(init.headers.get("authorization"), "Bearer fixture-user-token");
    assert.equal(init.credentials, "same-origin");
    assert.equal(init.cache, "no-store");
  }
  assert.equal(requests[1].init.headers.get("x-aa-rpc"), "1");
  assert.equal(requests[1].init.headers.get("content-type"), "application/json");
});

test("the shared JSON route rejects a handoff used for a different checkout before any action", async () => {
  const route = load(
    "src/lib/icici-routes.server.ts",
    {
      "@/lib/icici-checkout.server": {},
      "@/lib/icici-uat-access.server": {
        assertIciciCheckoutAccess: async () => ({ checkoutId: "authorized-checkout" }),
      },
    },
    { process: { env: defaults } },
  );
  let actions = 0;
  const invoke = (id) =>
    route.iciciJsonRequest(
      new Request(origin + "/api/payments/icici/initiate", {
        method: "POST",
        headers: { origin, "x-aa-rpc": "1", "content-type": "application/json" },
        body: JSON.stringify({ id }),
      }),
      z.object({ id: z.string() }),
      async () => {
        actions++;
        return {};
      },
      { requireCheckoutAccess: true },
    );
  const denied = await invoke("another-checkout");
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).code, "ICICI_HANDOFF_SCOPE");
  assert.equal(actions, 0);
  assert.equal((await invoke("authorized-checkout")).status, 200);
  assert.equal(actions, 1);
});
