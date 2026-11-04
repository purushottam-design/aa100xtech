const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");

test("consultation hours account for selected timezone, duration, invalid dates and past times", () => {
  const { consultationScheduleError: check } = load("src/lib/consultation-schedule.ts");
  const base = {
    preferredDate: "2027-01-01",
    preferredTime: "11:00",
    timezone: "Asia/Calcutta",
    planId: "standard",
  };
  const now = Date.parse("2026-11-03T00:00:00Z");
  assert.equal(check(base, now), null);
  assert.equal(check({ ...base, preferredTime: "16:30" }, now), null);
  for (const patch of [
    { preferredTime: "10:59" },
    { preferredTime: "16:45" },
    { preferredTime: "17:00" },
    { preferredDate: "2026-01-01" },
    { preferredDate: "2027-02-30" },
    { timezone: "invalid" },
  ])
    assert.ok(check({ ...base, ...patch }, now));
  assert.equal(check({ ...base, preferredTime: "05:30", timezone: "UTC" }, now), null);
  assert.ok(check({ ...base, preferredTime: "11:01", timezone: "UTC" }, now));
  assert.equal(check({ ...base, preferredTime: "14:00", planId: "executive" }, now), null);
  assert.ok(check({ ...base, preferredTime: "14:01", planId: "executive" }, now));
});

test("request schema validates package selection, contact data, spam trap and unsafe links", () => {
  const { websiteRequestSchema: schema } = load("src/lib/website-requests.ts");
  const base = {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "proposal",
    name: "Test Customer",
    email: "test@example.test",
    phone: "+910000000000",
    selectedPlan: "business",
    requirements: "A business website with manageable content",
    startedAt: Date.now() - 5000,
  };
  assert.ok(schema.safeParse(base).success);
  for (const patch of [
    { selectedPlan: "unapproved" },
    { email: "invalid" },
    { phone: "" },
    { website: "filled" },
    { portfolio: "javascript:alert(1)" },
    { requirements: "short" },
  ])
    assert.equal(schema.safeParse({ ...base, ...patch }).success, false);
});

test("website requests atomically reuse existing records, throttle spam and reject private-table access", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    for (const migration of [
      "20261103110000_website_content_prerequisites.sql",
      "20261103120000_website_requests.sql",
      "20261103121000_website_resume_storage.sql",
    ])
      await db.exec(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"));
    assert.equal(
      (await db.query("SELECT public FROM storage.buckets WHERE id='website-resumes'")).rows[0]
        .public,
      false,
    );
    // Applying the additive prerequisite again keeps existing records intact.
    await db.exec(
      "INSERT INTO contact_messages(name,email,message) VALUES('Existing','existing@example.test','Preserve this existing record')",
    );
    await db.exec(
      fs.readFileSync(
        "supabase/migrations/20261103110000_website_content_prerequisites.sql",
        "utf8",
      ),
    );
    await db.exec(
      fs.readFileSync("supabase/migrations/20261103120000_website_requests.sql", "utf8"),
    );
    const submit = (id, kind = "proposal", hash = "fixture", emailHash = "same-email") =>
      db.query("SELECT submit_website_request($1,$2,$3,$4,$5,$6) AS created", [
        id,
        kind,
        JSON.stringify({
          name: "Test",
          email: "test@example.test",
          requirements: "A test website",
          selectedPlan: "business",
          role: "Developer",
          experience: "Existing experience",
        }),
        hash,
        emailHash,
        kind === "career" ? "hr@aa100xtech.com" : "customer.care@aa100xtech.com",
      ]);
    const id = "00000000-0000-4000-8000-000000000001";
    assert.equal((await submit(id)).rows[0].created, true);
    assert.equal((await submit(id)).rows[0].created, false);
    await assert.rejects(submit(id, "proposal", "changed"), /Request conflict/);
    assert.equal((await db.query("SELECT count(*) AS n FROM contact_messages")).rows[0].n, 2);
    await submit("00000000-0000-4000-8000-000000000002", "career");
    const candidate = (
      await db.query("SELECT role_applied,deliverables FROM candidate_submissions")
    ).rows[0];
    assert.equal(candidate.role_applied, "Developer");
    assert.ok(candidate.deliverables.includes("Existing experience"));
    assert.equal(
      (await db.query("SELECT recipient FROM website_requests WHERE kind='career'")).rows[0]
        .recipient,
      "hr@aa100xtech.com",
    );
    await submit("00000000-0000-4000-8000-000000000003");
    await assert.rejects(submit("00000000-0000-4000-8000-000000000004"), /Request limit/);
    assert.equal((await db.query("SELECT count(*) AS n FROM website_requests")).rows[0].n, 3);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query("SELECT * FROM website_requests"), /permission denied/);
      await assert.rejects(submit("00000000-0000-4000-8000-000000000005"), /permission denied/);
      await db.exec("RESET ROLE");
    }
  } finally {
    await db.close();
  }
});

test("request handler rejects CSRF and reports save failure without claiming email delivery", async () => {
  let writes = 0;
  let fail = false;
  let ambiguous = false;
  const db = {
    rpc: async () => {
      writes++;
      return { data: ambiguous ? null : true, error: fail ? { code: "PGRST205" } : null };
    },
    from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
  };
  const { saveWebsiteRequest } = load(
    "src/lib/website-requests.server.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: db },
      "@/lib/public-site.server": {
        publicSiteSettings: async () => ({
          email: "customer.care@aa100xtech.com",
        }),
      },
    },
    {
      File,
      FormData,
      process: {
        env: {
          NODE_ENV: "development",
          DEV_TUNNEL_ORIGIN: "https://tunnel.example.test",
        },
      },
      fetch: () => assert.fail("Missing provider configuration must not send email"),
    },
  );
  const data = {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "career",
    name: "Test Customer",
    email: "test@example.test",
    phone: "+910000000000",
    role: "Developer",
    requirements: "A synthetic test application",
    startedAt: Date.now() - 5000,
  };
  const req = (patch = {}) => {
    const form = new FormData();
    form.set("data", JSON.stringify(data));
    return new Request("http://localhost:3000/api/website/requests", {
      method: "POST",
      headers: {
        origin: "https://tunnel.example.test",
        "x-forwarded-host": "tunnel.example.test",
        "x-forwarded-proto": "https",
        "x-aa-rpc": "1",
        ...patch,
      },
      body: form,
    });
  };
  assert.equal(
    (await saveWebsiteRequest(req({ origin: "https://attacker.example.test" }))).status,
    403,
  );
  assert.equal(writes, 0);
  assert.deepEqual(await (await saveWebsiteRequest(req())).json(), {
    saved: true,
    notification: "not_configured",
  });
  fail = true;
  const failure = await saveWebsiteRequest(req());
  assert.equal(failure.status, 503);
  assert.equal((await failure.json()).saved, false);
  fail = false;
  ambiguous = true;
  const unconfirmed = await saveWebsiteRequest(req());
  assert.equal(unconfirmed.status, 503);
  assert.equal((await unconfirmed.json()).saved, false);
});
