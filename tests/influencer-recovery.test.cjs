const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");

for (const legacy of [false, true]) {
  test(`application repair restores ${legacy ? "legacy" : "missing"} schema without exposing applicants or losing records`, async () => {
    const db = await PGlite.create();
    try {
      await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
        CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
        CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
      if (legacy)
        await db.exec(`CREATE TABLE partner_applications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text NOT NULL,email text NOT NULL,phone text,country text,platforms text,handle text,followers text,niche text,target_level text,motivation text,referrer text,created_at timestamptz NOT NULL DEFAULT now());
        INSERT INTO partner_applications(full_name,email) VALUES ('Historical Applicant','historical@example.test');`);
      const repair = fs.readFileSync(
        "supabase/repairs/restore_influencer_applications.sql",
        "utf8",
      );
      await db.exec(repair);
      const asRole = async (role, sql, args = []) => {
        await db.exec(`SET ROLE ${role}`);
        try {
          return await db.query(sql, args);
        } finally {
          await db.exec("RESET ROLE");
        }
      };
      for (let n = 0; n < 6; n++)
        assert.equal(
          (
            await asRole(
              "service_role",
              `SELECT take_influencer_submission_slot('synthetic-ip-hmac') AS allowed`,
            )
          ).rows[0].allowed,
          n < 5,
        );
      const row = (
        await asRole(
          "service_role",
          `INSERT INTO partner_applications(full_name,email,is_influencer,influencer_data,processing_consent,publication_consent) VALUES ('Synthetic Applicant','synthetic@example.test',true,'{"program_terms_consent":true}',true,true) RETURNING id,status,influencer_review_status`,
        )
      ).rows[0];
      assert.equal(row.status, "pending");
      assert.equal(row.influencer_review_status, "pending");
      for (const role of ["anon", "authenticated"]) {
        await assert.rejects(
          asRole(role, "SELECT email FROM partner_applications"),
          /permission denied/,
        );
        await assert.rejects(
          asRole(role, `SELECT take_influencer_submission_slot('forged')`),
          /permission denied/,
        );
        await assert.rejects(
          asRole(
            role,
            `INSERT INTO partner_applications(full_name,email,is_influencer) VALUES ('Forged Applicant','forged@example.test',true)`,
          ),
          /row-level security/,
        );
      }
      await asRole(
        "anon",
        `INSERT INTO partner_applications(full_name,email) VALUES ('Legacy Affiliate Form','legacy@example.test')`,
      );
      await db.exec(repair);
      const preserved = (
        await asRole("service_role", "SELECT * FROM partner_applications WHERE id=$1", [row.id])
      ).rows[0];
      assert.equal(preserved.email, "synthetic@example.test");
      assert.equal(preserved.influencer_data.program_terms_consent, true);
      assert.equal(
        (await db.query("SELECT count(*) AS count FROM partner_applications")).rows[0].count,
        legacy ? 3 : 2,
      );
      assert.equal(
        (
          await asRole(
            "service_role",
            `SELECT take_influencer_submission_slot('synthetic-ip-hmac') AS allowed`,
          )
        ).rows[0].allowed,
        false,
        "Repair must not reset the active rate limit",
      );
      await db.exec(
        fs.readFileSync(
          "supabase/migrations/20261030190000_influencer_partner_program.sql",
          "utf8",
        ),
      );
      assert.equal(
        (await asRole("anon", "SELECT * FROM get_influencer_partner_stats()")).rows.length,
        0,
        "Pending applicants cannot become public partners",
      );
    } finally {
      await db.close();
    }
  });
}

test("request diagnostics classify plain Supabase and TLS failures without logging raw details", async () => {
  for (const environment of ["development", "production"]) {
    const messages = [];
    const api = load(
      "src/lib/influencer-upload.server.ts",
      { "@/integrations/supabase/client.server": { supabaseAdmin: {} } },
      {
        process: { env: { NODE_ENV: environment } },
        console: { error: (message) => messages.push(message) },
      },
    );
    for (const [failure, code] of [
      [
        { code: "PGRST202", details: "sensitive-value", message: "secret-db-address" },
        "INFLUENCER_SCHEMA_MISSING",
      ],
      [{ code: "PGRST205" }, "INFLUENCER_SCHEMA_MISSING"],
      [
        { message: "fetch failed", details: "UNABLE_TO_VERIFY_LEAF_SIGNATURE sensitive-value" },
        "INFLUENCER_TLS_ERROR",
      ],
      [
        new Error("fetch failed", { cause: { code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" } }),
        "INFLUENCER_TLS_ERROR",
      ],
      [{ code: "42501" }, "INFLUENCER_DATABASE_PERMISSION"],
      [{ message: "Invalid API key sensitive-value" }, "INFLUENCER_DATABASE_CREDENTIALS"],
      [
        new Error("Missing Supabase environment variable(s): private-value"),
        "INFLUENCER_DATABASE_CONFIGURATION",
      ],
      [new Error("sensitive-value"), "INFLUENCER_SAVE_UNAVAILABLE"],
    ]) {
      const response = api.requestError(failure);
      const body = await response.json();
      assert.equal(response.status, 503);
      assert.equal(body.code, code);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.doesNotMatch(JSON.stringify(body), /sensitive-value|secret-db-address|private-value/);
      if (environment === "production")
        assert.equal(
          body.error,
          "We could not save your changes. Please try again or contact our team.",
        );
    }
    assert.doesNotMatch(messages.join(" "), /sensitive-value|secret-db-address|private-value/);
    const invalid = api.requestError(
      new api.InfluencerRequestError("Cross-site request rejected", 403),
    );
    assert.equal(invalid.status, 403);
  }
});

test("a missing submission function fails before uploads or inserts and returns its safe schema code", async () => {
  const schema = load("src/lib/influencers.ts");
  let writes = 0;
  const input = {
    full_name: "Synthetic Applicant",
    display_name: "Synthetic Creator",
    email: "synthetic@example.test",
    phone: "+910000000000",
    city: "Test City",
    state: "Test State",
    country: "India",
    biography: "Synthetic introduction for automated tests.",
    category: "Technology",
    audience_location: "India",
    socials: { instagram: "https://instagram.com/synthetic" },
    interest: "both",
    deliverables: "Synthetic application motivation for testing.",
    expected_terms: "Terms to be agreed in writing.",
    processing_consent: true,
    publication_consent: true,
  };
  const api = load(
    "src/app/api/influencers/apply/route.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: {} },
      "@/lib/influencer-database.server": {
        influencerAdmin: {
          rpc: async () => ({ data: null, error: { code: "PGRST202", details: "private-value" } }),
          from() {
            writes++;
            throw new Error("Must not write before rate limit check");
          },
        },
      },
      "@/lib/influencers": schema,
    },
    {
      process: {
        env: { SUPABASE_SERVICE_ROLE_KEY: "synthetic-server-key", NODE_ENV: "development" },
      },
      console: { error() {} },
    },
  );
  const body = new FormData();
  body.set("application", JSON.stringify(input));
  const response = await api.POST(
    new Request("http://localhost:3000/api/influencers/apply", {
      method: "POST",
      headers: { "x-aa-rpc": "1" },
      body,
    }),
  );
  assert.equal(response.status, 503);
  assert.equal(writes, 0);
  assert.equal((await response.json()).code, "INFLUENCER_SCHEMA_MISSING");
});
