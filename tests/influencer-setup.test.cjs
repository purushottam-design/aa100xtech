const assert = require("node:assert/strict");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { repairInfluencers, repairQuery } = require("../scripts/repair-influencers.cjs");

const ref = "abcdefghijklmnopqrst";
const env = {
  SUPABASE_URL: `https://${ref}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
};

test("repair preview and missing credentials cannot issue network requests", async () => {
  let requests = 0;
  const options = {
    env,
    log() {},
    fetchImpl: async () => {
      requests++;
      throw new Error("Unexpected network request");
    },
  };
  assert.equal((await repairInfluencers(options)).applied, false);
  await assert.rejects(repairInfluencers({ ...options, apply: true }), /SUPABASE_ACCESS_TOKEN/);
  assert.equal(requests, 0);
});

test("repair refuses conflicting project configuration before sending a token", async () => {
  for (const overrides of [
    { SUPABASE_PROJECT_ID: "different-project" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://different.supabase.co" },
    { SUPABASE_URL: "https://untrusted.example" },
    { SUPABASE_URL: `http://${ref}.supabase.co` },
  ]) {
    await assert.rejects(
      repairInfluencers({
        env: { ...env, SUPABASE_ACCESS_TOKEN: "synthetic-token", ...overrides },
        apply: true,
        log() {},
        fetchImpl() {
          assert.fail("Must reject conflicting projects without sending credentials");
        },
      }),
      /differ|hosted/,
    );
  }
});

test("repair checks database access, sends atomic SQL only to Supabase, and keeps secrets out of logs", async () => {
  const requests = [];
  const logs = [];
  const result = await repairInfluencers({
    env: { ...env, SUPABASE_ACCESS_TOKEN: "synthetic-private-token" },
    apply: true,
    log: (message) => logs.push(message),
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      return Response.json(requests.length === 1 ? [{ influencer_repair_access: true }] : []);
    },
  });
  assert.equal(result.applied, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, `https://api.supabase.com/v1/projects/${ref}/database/query`);
  assert.equal(JSON.parse(requests[0].init.body).read_only, true);
  assert.equal(requests[1].url, `https://api.supabase.com/v1/projects/${ref}/database/query`);
  assert.equal(requests[1].init.redirect, "error");
  assert.equal(requests[1].init.headers.Authorization, "Bearer synthetic-private-token");
  const payload = JSON.parse(requests[1].init.body);
  assert.equal(payload.read_only, false);
  assert.match(payload.query, /CREATE TABLE IF NOT EXISTS public.partner_applications/);
  assert.match(payload.query, /CREATE TABLE IF NOT EXISTS public.influencer_client_referrals/);
  assert.doesNotMatch(logs.join("\n"), /synthetic-private-token/);
});

test("repair does not send schema changes after an invalid access response or authorization failure", async () => {
  for (const response of [
    Response.json([{ influencer_repair_access: false }]),
    Response.json({ message: "sensitive-server-details" }, { status: 403 }),
  ]) {
    let requests = 0;
    await assert.rejects(
      repairInfluencers({
        env: { ...env, SUPABASE_ACCESS_TOKEN: "synthetic-token" },
        apply: true,
        log() {},
        fetchImpl: async () => {
          requests++;
          return response;
        },
      }),
      /no schema changes were sent|HTTP 403/,
    );
    assert.equal(requests, 1);
  }
});

test("an unconfirmed SQL request is not retried and cannot leak the transport error", async () => {
  let requests = 0;
  await assert.rejects(
    repairInfluencers({
      env: { ...env, SUPABASE_ACCESS_TOKEN: "synthetic-token" },
      apply: true,
      log() {},
      fetchImpl: async () => {
        requests++;
        if (requests === 1) return Response.json([{ influencer_repair_access: true }]);
        throw new Error("sensitive-transport-details");
      },
    }),
    (error) => {
      assert.match(error.message, /could not be confirmed/);
      assert.doesNotMatch(error.message, /sensitive-transport-details/);
      return true;
    },
  );
  assert.equal(requests, 2);
});

test("permission failures identify missing database scopes without returning API details", async () => {
  for (const permission of ["database_read", "database_write"]) {
    let requests = 0;
    await assert.rejects(
      repairInfluencers({
        env: { ...env, SUPABASE_ACCESS_TOKEN: "synthetic-token" },
        apply: true,
        log() {},
        fetchImpl: async () => {
          requests++;
          return Response.json(
            { message: `Missing required permission(s): ${permission} private-response-value` },
            { status: 403 },
          );
        },
      }),
      (error) => {
        assert.match(error.message, new RegExp(permission));
        assert.doesNotMatch(error.message, /private-response-value|synthetic-token/);
        return true;
      },
    );
    assert.equal(requests, 1, "Permission failure must stop before schema changes");
  }
});

test("the combined repair rolls back all schema changes when the second migration fails", async () => {
  const db = await PGlite.create();
  try {
    // Missing auth.users deliberately makes the second migration fail.
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE SCHEMA auth;
      CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,
      public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    await assert.rejects(db.exec(repairQuery(process.cwd())), /auth.users/);
    await db.exec("ROLLBACK");
    assert.equal(
      (await db.query("SELECT to_regclass('public.partner_applications') AS name")).rows[0].name,
      null,
    );
    await db.exec("CREATE TABLE auth.users(id uuid PRIMARY KEY)");
    await db.exec(repairQuery(process.cwd()));
    await db.exec(repairQuery(process.cwd()));
    assert.equal(
      (await db.query("SELECT count(*) AS count FROM public.partner_applications")).rows[0].count,
      0,
    );
    assert.deepEqual(
      (await db.query("SELECT * FROM public.get_influencer_partner_stats()")).rows,
      [],
    );
  } finally {
    await db.close();
  }
});
