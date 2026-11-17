const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");
const navigation = load("src/lib/auth-navigation.ts");

test("login preserves the requested booking, query and section", () => {
  const target = "/consultation?book=quick&service=Web+Design#pricing";
  const href = navigation.loginHref(target);
  assert.equal(navigation.authReturnPath(new URL(href, "https://example.test").search), target);
  for (const unsafe of [
    "https://other.test",
    "//other.test",
    "/\\other.test",
    "/auth",
    "/auth?next=/auth",
    "/request-access",
    "/\n/other.test",
  ])
    assert.equal(navigation.authReturnPath("?" + new URLSearchParams({ next: unsafe })), null);
});

test("website functions require login while account creation and policies stay accessible", () => {
  for (const path of [
    "/consultation",
    "/contact",
    "/careers/apply",
    "/partners/apply",
    "/services",
    "/dashboard",
    "/settings",
  ])
    assert.equal(navigation.isPublicPage(path), false, path);
  for (const path of ["/", "/auth", "/request-access", "/privacy-policy", "/terms-and-conditions"])
    assert.equal(navigation.isPublicPage(path), true, path);
});

test("customer submissions verify the live session and reject expired or revoked tokens", async () => {
  let revoked = false,
    unavailable = false,
    verifications = 0;
  const { websiteSessionError } = load(
    "src/lib/website-session.server.ts",
    {
      "@supabase/supabase-js": {
        createClient: () => ({
          auth: {
            getClaims: async () => ({ data: { claims: { sub: "customer-id" } }, error: null }),
            getUser: async () => {
              verifications++;
              return {
                data: { user: revoked || unavailable ? null : { id: "customer-id" } },
                error: unavailable ? { status: 503 } : revoked ? { status: 401 } : null,
              };
            },
          },
        }),
      },
    },
    {
      process: {
        env: { SUPABASE_URL: "https://example.test", SUPABASE_PUBLISHABLE_KEY: "fixture-key" },
      },
    },
  );
  const request = (token) =>
    new Request("https://example.test/api/website/requests", {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  assert.equal((await websiteSessionError(request())).status, 401);
  assert.equal((await websiteSessionError(request("malformed"))).status, 401);
  assert.equal(verifications, 0);
  assert.equal(await websiteSessionError(request("test.valid.token")), null);
  revoked = true;
  const rejected = await websiteSessionError(request("test.revoked.token"));
  assert.equal(rejected.status, 401);
  assert.match((await rejected.json()).error, /log in/);
  revoked = false;
  unavailable = true;
  assert.equal((await websiteSessionError(request("test.valid.token"))).status, 503);
});

test("booking and payment handlers reject guests before validation or database/gateway work", async () => {
  let authChecks = 0,
    writes = 0;
  const api = load("src/lib/backend/handlers/consultations.ts", {
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => {
        authChecks++;
        throw new Error("Login required");
      },
    },
    "@/lib/payment-database.server": {},
    "@/lib/consultations.server": {},
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        from() {
          writes++;
          throw new Error("Must not touch database");
        },
      },
    },
  });
  for (const name of [
    "createConsultationBooking",
    "verifyConsultationPayment",
    "markConsultationPaymentFailed",
  ])
    await assert.rejects(api[name]({ data: {} }), /Login required/);
  assert.equal(authChecks, 3);
  assert.equal(writes, 0);
});

test("creator and brand submission routes reject guests before processing their form", async () => {
  let submissions = 0;
  const context = load("src/lib/backend/request-context.server.ts");
  const { websiteSessionError } = load("src/lib/website-session.server.ts", {
    "@/lib/backend/request-context.server": context,
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => {
        context.setResponseStatus(401);
        throw new Error("Expired");
      },
    },
  });
  const route = load("src/app/api/marketing/[kind]/route.ts", {
    "@/lib/website-session.server": { websiteSessionError },
    "@/lib/marketing-intake.server": {
      submitMarketingIntake() {
        submissions++;
      },
    },
  });
  for (const kind of ["creator", "brand"]) {
    const response = await route.POST(
      new Request("https://example.test/api/marketing/" + kind, { method: "POST" }),
      { params: Promise.resolve({ kind }) },
    );
    assert.equal(response.status, 401);
  }
  assert.equal(submissions, 0);
});

test("customer form transports attach the existing account token", async () => {
  let requestHeaders;
  const { submitMarketingForm } = load(
    "src/lib/marketing-submission.ts",
    {
      "@/integrations/supabase/auth-attacher": {
        attachSupabaseAuth: async () =>
          new Headers({ authorization: "Bearer existing-account-token" }),
      },
    },
    {
      fetch: async (_url, init) => {
        requestHeaders = init.headers;
        return Response.json({ ok: true, reference: "saved-reference" });
      },
    },
  );
  await submitMarketingForm("creator", new FormData());
  assert.equal(requestHeaders.get("authorization"), "Bearer existing-account-token");
  assert.equal(requestHeaders.get("x-aa-rpc"), "1");
});

test("migration blocks anonymous direct partner inserts while retaining accounts and applications", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
      CREATE TABLE partner_applications (name text);
      INSERT INTO partner_applications VALUES ('Existing application');
      GRANT INSERT ON partner_applications TO anon, authenticated, PUBLIC;`);
    const migration = fs.readFileSync(
      "supabase/migrations/20261117120000_require_customer_login.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    await db.exec("SET ROLE anon");
    await assert.rejects(
      db.exec("INSERT INTO partner_applications VALUES ('Guest')"),
      /permission denied/,
    );
    await db.exec(
      "RESET ROLE; SET ROLE authenticated; INSERT INTO partner_applications VALUES ('Returning customer'); RESET ROLE;",
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS count FROM partner_applications")).rows[0].count,
      2,
    );
  } finally {
    await db.close();
  }
});
