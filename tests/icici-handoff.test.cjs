const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");

const origin = "https://fixture.ngrok-free.dev";
const local = "http://127.0.0.1:3000";
const userId = "00000000-0000-4000-8000-000000000001";
const schemaSql = fs.readFileSync(
  "supabase/migrations/20261106140000_icici_uat_handoffs.sql",
  "utf8",
);
const envDefaults = {
  NODE_ENV: "development",
  ICICI_UAT_ENABLED: "true",
  ICICI_UAT_MERCHANT_CONFIRMED: "true",
  ICICI_UAT_TEST_MODE: "true",
  ICICI_UAT_TESTS_PASSED: "false",
  ICICI_ENVIRONMENT: "uat",
  ICICI_SIGNING_MODE: "sorted-fields",
  ICICI_MERCHANT_ID: "fixture-merchant",
  ICICI_SECRET_KEY: "fixture-bank-secret-never-shared",
  ICICI_RETURN_URL: origin + "/api/payments/icici/callback",
  ICICI_TRUST_PROXY: "true",
  DEV_TUNNEL_ORIGIN: origin,
};

async function harness() {
  const database = await PGlite.create();
  await database.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    INSERT INTO auth.users VALUES('${userId}');`);
  await database.exec(schemaSql);
  const env = { ...envDefaults };
  let admin = true,
    confirmed = true;
  const preparations = [];
  const client = {
    auth: {
      getUser: async (token) => ({
        data: { user: token === "source-session" ? { id: userId } : null },
        error: null,
      }),
      admin: {
        getUserById: async () => ({
          data: { user: { id: userId, email_confirmed_at: confirmed ? "2026-01-01" : null } },
          error: null,
        }),
      },
    },
    from(table) {
      assert.equal(table, "icici_uat_handoffs");
      let mode = "select",
        values,
        columns = "*",
        limit;
      const conditions = [];
      const builder = {
        select(c) {
          columns = c;
          return builder;
        },
        insert(v) {
          mode = "insert";
          values = v;
          return builder;
        },
        update(v) {
          mode = "update";
          values = v;
          return builder;
        },
        eq(k, v) {
          conditions.push([k, "=", v]);
          return builder;
        },
        gt(k, v) {
          conditions.push([k, ">", v]);
          return builder;
        },
        limit(count) {
          assert.equal(count, 0, "Readiness must not read authorization rows");
          limit = count;
          return builder;
        },
        abortSignal() {
          return builder.execute();
        },
        async execute(single = false) {
          const parameters = [];
          const bind = (v) => {
            parameters.push(typeof v === "object" ? JSON.stringify(v) : v);
            return "$" + parameters.length;
          };
          const identifier = (name) => {
            assert.match(name, /^[a-z_]+$/);
            return '"' + name + '"';
          };
          let sql;
          if (mode === "insert")
            sql = `INSERT INTO icici_uat_handoffs(${Object.keys(values).map(identifier).join(",")}) VALUES(${Object.values(values).map(bind).join(",")})`;
          if (mode === "update")
            sql =
              "UPDATE icici_uat_handoffs SET " +
              Object.entries(values)
                .map(([k, v]) => identifier(k) + "=" + bind(v))
                .join(",");
          if (mode === "select") sql = "SELECT " + columns + " FROM icici_uat_handoffs";
          if (conditions.length)
            sql +=
              " WHERE " +
              conditions.map(([k, op, v]) => identifier(k) + op + bind(v)).join(" AND ");
          if (mode === "update") sql += " RETURNING " + columns;
          if (mode === "select" && limit !== undefined) sql += " LIMIT " + limit;
          const result = await database.query(sql, parameters);
          return { data: single ? (result.rows[0] ?? null) : result.rows, error: null };
        },
        maybeSingle() {
          return builder.execute(true);
        },
        then(resolve, reject) {
          return builder.execute().then(resolve, reject);
        },
      };
      return builder;
    },
  };
  const globals = { process: { env }, fetch: () => assert.fail("Handoffs never contact the bank") };
  const bank = load("src/lib/icici.server.ts", {}, globals);
  const module = load(
    "src/lib/icici-handoff.server.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: client },
      "@/lib/rbac.server": {
        authorizeSuper: async () => {
          if (!admin) throw Error("Access revoked");
          return { isSuper: true };
        },
      },
      "@/lib/icici-checkout.server": {
        prepareCheckout: async (input) => {
          preparations.push(input);
          return { amount_paise: 250000, currency: "INR", merchant_reference: "ICFIXTURE" };
        },
      },
    },
    globals,
  );
  const data = load("src/data/consultations.ts");
  const booking = {
    planId: "quick",
    fullName: "Test Administrator",
    companyName: "Test",
    email: "uat@example.test",
    phone: "+910000000000",
    country: "India",
    service: data.consultationServices[0],
    preferredDate: "2030-01-07",
    preferredTime: "11:00",
    timezone: "Asia/Calcutta",
    meetingPlatform: data.meetingPlatforms[0],
    projectDescription: "Synthetic controlled ICICI UAT consultation.",
  };
  const sourceRequest = (headers = {}, body = booking) =>
    new Request(local + "/api/payments/icici/transition", {
      method: "POST",
      headers: {
        origin: local,
        "x-aa-rpc": "1",
        "content-type": "application/json",
        authorization: "Bearer source-session",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  const destinationRequest = (body, source = origin, cookie, extra = {}) =>
    new Request("http://localhost:3000/api/payments/icici/handoff", {
      method: "POST",
      headers: {
        host: new URL(origin).host,
        "x-forwarded-host": new URL(origin).host,
        "x-forwarded-proto": "https",
        origin: source,
        "content-type": "application/x-www-form-urlencoded",
        ...(cookie ? { cookie } : {}),
        ...extra,
      },
      body: new URLSearchParams(body),
    });
  const issue = () => module.issueUatHandoff(sourceRequest());
  const present = (ticket) => module.receiveUatHandoff(destinationRequest({ ticket }, local));
  const activate = async (ticket) => {
    const page = await present(ticket);
    const cookie = page.headers.get("set-cookie").split(";")[0];
    const html = await page.text();
    const id = html.match(/name="id" value="([^"]+)"/)[1];
    const csrf = html.match(/name="csrf" value="([^"]+)"/)[1];
    return {
      cookie,
      id,
      csrf,
      html,
      confirm: () => module.receiveUatHandoff(destinationRequest({ id, csrf }, origin, cookie)),
    };
  };
  return {
    database,
    env,
    module,
    bank,
    booking,
    preparations,
    sourceRequest,
    destinationRequest,
    issue,
    present,
    activate,
    revoke: () => {
      admin = false;
    },
    unconfirm: () => {
      confirmed = false;
    },
    close: () => database.close(),
  };
}

test("an authorized one-time handoff creates independent HTTPS authorization bound to one checkout", async () => {
  const h = await harness();
  try {
    const issued = await h.issue();
    assert.equal(issued.destination, origin + "/api/payments/icici/handoff");
    const tab = await h.activate(issued.ticket);
    assert.match(tab.cookie, /^__Host-aa-icici-uat=/);
    assert.doesNotMatch(tab.html, /source-session|fixture-bank-secret/);
    assert.equal(h.preparations.length, 0);
    const accepted = await tab.confirm();
    assert.equal(accepted.status, 303);
    assert.equal(
      new URL(accepted.headers.get("location")).searchParams.get("icici_handoff"),
      tab.id,
    );
    assert.match(accepted.headers.get("set-cookie"), /HttpOnly; Secure; SameSite=Strict/);
    assert.doesNotMatch(accepted.headers.get("set-cookie"), /Domain=/i);
    assert.equal(accepted.headers.get("referrer-policy"), "no-referrer");
    await assert.rejects(h.present(issued.ticket));
    await assert.rejects(tab.confirm());
    const request = h.destinationRequest({}, origin, tab.cookie, { "x-aa-rpc": "1" });
    const grant = await h.module.authorizeUatHandoff(request);
    await assert.rejects(
      h.module.authorizeUatHandoff(request, "00000000-0000-4000-8000-000000000099"),
    );
    const resume = new Request(request.url, {
      method: "POST",
      headers: { ...Object.fromEntries(request.headers), "content-type": "application/json" },
      body: JSON.stringify({ id: tab.id }),
    });
    const result = await h.module.resumeUatHandoff(resume);
    assert.equal(result.capability.id, grant.checkout_id);
    assert.match(result.capability.token, /^[a-f0-9]{64}$/);
    assert.equal(h.preparations.length, 1);
    const stored = JSON.stringify(
      (await h.database.query("SELECT * FROM icici_uat_handoffs")).rows,
    );
    for (const value of [
      issued.ticket,
      tab.csrf,
      tab.cookie.split("=")[1],
      "source-session",
      envDefaults.ICICI_SECRET_KEY,
    ])
      assert.equal(stored.includes(value), false);
  } finally {
    await h.close();
  }
});

test("source auth, exact origins, destination pinning and production guards fail closed", async () => {
  const h = await harness();
  try {
    for (const headers of [
      { authorization: "" },
      { authorization: "Bearer forged" },
      { origin: "https://attacker.test" },
      { origin: "" },
      { "x-aa-rpc": "0" },
      { "sec-fetch-site": "cross-site" },
      { "x-forwarded-proto": "https" },
    ]) {
      await assert.rejects(h.module.issueUatHandoff(h.sourceRequest(headers)));
    }
    assert.equal(
      (await h.database.query("SELECT count(*) AS n FROM icici_uat_handoffs")).rows[0].n,
      0,
    );
    for (const patch of [
      { NODE_ENV: "production" },
      { DEV_TUNNEL_ORIGIN: "https://attacker.test" },
      { ICICI_TRUST_PROXY: "false" },
      { ICICI_UAT_TEST_MODE: "false" },
      { ICICI_UAT_ENABLED: "false" },
      { ICICI_RETURN_URL: "http://localhost:3000/consultation" },
    ]) {
      Object.assign(h.env, envDefaults, patch);
      await assert.rejects(h.issue());
    }
    Object.assign(h.env, envDefaults);
    h.revoke();
    await assert.rejects(h.issue());
  } finally {
    await h.close();
  }
});

test("ticket and confirmation races admit one browser, reject CSRF, and revalidate active authorization", async () => {
  const h = await harness();
  try {
    const issued = await h.issue();
    await assert.rejects(
      h.module.receiveUatHandoff(
        h.destinationRequest({ ticket: issued.ticket }, "https://attacker.test"),
      ),
    );
    const attempts = await Promise.allSettled([h.present(issued.ticket), h.present(issued.ticket)]);
    assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
    const page = attempts.find((r) => r.status === "fulfilled").value;
    const cookie = page.headers.get("set-cookie").split(";")[0],
      html = await page.text();
    const id = html.match(/name="id" value="([^"]+)"/)[1],
      csrf = html.match(/name="csrf" value="([^"]+)"/)[1];
    for (const [source, ck, token] of [
      [local, cookie, csrf],
      [origin, undefined, csrf],
      [origin, cookie, "f".repeat(64)],
    ]) {
      await assert.rejects(
        h.module.receiveUatHandoff(h.destinationRequest({ id, csrf: token }, source, ck)),
      );
    }
    const confirms = await Promise.allSettled([
      h.module.receiveUatHandoff(h.destinationRequest({ id, csrf }, origin, cookie)),
      h.module.receiveUatHandoff(h.destinationRequest({ id, csrf }, origin, cookie)),
    ]);
    assert.equal(confirms.filter((r) => r.status === "fulfilled").length, 1);
    h.revoke();
    await assert.rejects(
      h.module.authorizeUatHandoff(h.destinationRequest({}, origin, cookie, { "x-aa-rpc": "1" })),
    );
    assert.equal(h.preparations.length, 0);
  } finally {
    await h.close();
  }
});

test("expired tickets and leases cannot authorize payments and browser roles cannot read grants", async () => {
  const h = await harness();
  try {
    const issued = await h.issue();
    await h.database.exec("UPDATE icici_uat_handoffs SET expires_at=now()-interval '1 second'");
    await assert.rejects(h.present(issued.ticket));
    const fresh = await h.issue(),
      tab = await h.activate(fresh.ticket);
    await tab.confirm();
    await h.database.exec(
      "UPDATE icici_uat_handoffs SET lease_expires_at=now()-interval '1 second'",
    );
    await assert.rejects(
      h.module.authorizeUatHandoff(
        h.destinationRequest({}, origin, tab.cookie, { "x-aa-rpc": "1" }),
      ),
    );
    for (const role of ["anon", "authenticated"]) {
      await h.database.exec(`SET ROLE ${role}`);
      await assert.rejects(
        h.database.query("SELECT * FROM icici_uat_handoffs"),
        /permission denied/,
      );
      await assert.rejects(
        h.database.exec("UPDATE icici_uat_handoffs SET state='active'"),
        /permission denied/,
      );
      await h.database.exec("RESET ROLE");
    }
    await h.database.exec(schemaSql);
  } finally {
    await h.close();
  }
});

test("local UAT transfer readiness requires usable storage while simulation stays independent", async () => {
  const h = await harness();
  try {
    const ready = await h.module.iciciLocalTestingAvailability(h.sourceRequest());
    assert.equal(ready.mock, true);
    assert.equal(ready.transition, true);
    h.env.ICICI_UAT_ENABLED = "false";
    const disabled = await h.module.iciciLocalTestingAvailability(h.sourceRequest());
    assert.equal(disabled.mock, true);
    assert.equal(disabled.transition, false);
    h.env.NODE_ENV = "production";
    assert.equal(await h.module.iciciLocalTestingAvailability(h.sourceRequest()), null);
    Object.assign(h.env, envDefaults);
    assert.equal(await h.module.iciciLocalTestingAvailability(new Request(origin)), null);
    assert.equal(h.preparations.length, 0);
  } finally {
    await h.close();
  }
});

test("missing and incomplete handoff tables disable transfer without leaking details or breaking mock UI", async () => {
  const h = await harness();
  try {
    await h.database.exec("DROP TABLE icici_uat_handoffs");
    const missing = await h.module.iciciLocalTestingAvailability(h.sourceRequest());
    assert.equal(missing.mock, true);
    assert.equal(missing.transition, false);
    await h.database.exec("CREATE TABLE icici_uat_handoffs(id uuid PRIMARY KEY)");
    const partial = await h.module.iciciLocalTestingAvailability(h.sourceRequest());
    assert.equal(partial.mock, true);
    assert.equal(partial.transition, false);
    assert.equal(JSON.stringify(partial).includes(envDefaults.ICICI_SECRET_KEY), false);
    await h.database.exec("DROP TABLE icici_uat_handoffs");
    await h.database.exec(schemaSql);
    assert.equal(
      (await h.module.iciciLocalTestingAvailability(h.sourceRequest())).transition,
      true,
    );
    assert.equal(h.preparations.length, 0);
  } finally {
    await h.close();
  }
});
