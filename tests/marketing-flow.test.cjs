const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");
const legacyCreator = {
  submission_id: "00000000-0000-4000-8000-000000000004",
  full_name: "Synthetic Partner",
  display_name: "Synthetic Partner",
  email: "partner@example.invalid",
  phone: "+910000000000",
  city: "Patna",
  state: "Bihar",
  country: "India",
  category: "Business",
  biography: "A synthetic creator used for local database verification.",
  audience_location: "India",
  socials: { instagram: "https://instagram.com/synthetic-test", instagram_followers: 123 },
  interest: "both",
  deliverables: "Educational content and brand collaborations.",
  expected_terms: "Scope will be agreed in writing.",
  processing_consent: true,
  publication_consent: true,
  program_terms_consent: true,
  portfolio_url: "https://example.invalid/portfolio",
};
const legacyBrand = {
  id: "00000000-0000-4000-8000-000000000003",
  kind: "influencer",
  name: "Synthetic Contact",
  company: "Synthetic Brand",
  email: "brand@example.invalid",
  phone: "+910000000000",
  requirements: "A synthetic campaign brief for local tests.",
  selectedPlan: "influencer-marketing",
  startedAt: Date.now() - 5000,
  campaign: {
    type: "Influencer Marketing",
    category: "Any category",
    platform: "Instagram",
    location: "India",
    budget: "Discuss scope",
    timeline: "Next month",
    targetAudience: "Technology enthusiasts",
  },
};

test("shared brand forms retain directory selections only while the selected creator remains published and consented", async () => {
  let published = null;
  const { prepareMarketingForm } = load(
    "src/lib/marketing-form.server.ts",
    { "@/lib/influencers.server": { getPublishedInfluencer: async () => published } },
    { File, FormData },
  );
  const creator = {
    id: "00000000-0000-4000-8000-000000000010",
    slug: "selected-creator",
    name: "Untrusted submitted name",
  };
  const input = {
    token: legacyBrand.id,
    startedAt: Date.now() - 5000,
    email: legacyBrand.email,
    phone: legacyBrand.phone,
    privacy: true,
    company: "Synthetic brand",
    contact_name: "Synthetic contact",
    industry: "Technology",
    location: "India",
    objective: "Brand Awareness",
    platforms: ["Instagram"],
    category: "Technology",
    influencer_count: null,
    budget: "Not Decided",
    promotions: ["Instagram Reels"],
    creator,
  };
  await assert.rejects(prepareMarketingForm(form(input), "brand"), /no longer available/);
  published = {
    ...creator,
    display_name: "Approved creator name",
    publication_status: "published",
    consent_confirmed: false,
  };
  await assert.rejects(prepareMarketingForm(form(input), "brand"), /no longer available/);
  published.consent_confirmed = true;
  const prepared = await prepareMarketingForm(form(input), "brand");
  assert.equal(prepared.details.creator.name, "Approved creator name");
});
function form(data, format = "") {
  const fd = new FormData();
  fd.set(format === "partner-application" ? "application" : "data", JSON.stringify(data));
  if (format) fd.set("format", format);
  if (format === "partner-application") fd.set("startedAt", String(Date.now() - 5000));
  if (format === "campaign-enquiry") fd.set("privacy", "true");
  return fd;
}
test("embedded forms validate their original fields and explicit consent without inventing missing campaign preferences", async () => {
  const { prepareMarketingForm } = load(
    "src/lib/marketing-form.server.ts",
    { "@/lib/influencers.server": { getPublishedInfluencer: async () => null } },
    { File, FormData },
  );
  const creator = await prepareMarketingForm(form(legacyCreator, "partner-application"), "creator");
  assert.equal(creator.token, legacyCreator.submission_id);
  assert.equal(creator.details.category, "Business");
  assert.equal(creator.details.portfolio_url, legacyCreator.portfolio_url);
  assert.equal(creator.details.socials.instagram_followers, 123);
  assert.equal(creator.details.submission_id, undefined);
  const brand = await prepareMarketingForm(form(legacyBrand, "campaign-enquiry"), "brand");
  assert.equal(brand.details.budget, "Discuss scope");
  assert.equal(brand.details.legacy_campaign.targetAudience, "Technology enthusiasts");
  assert.equal(brand.details.industry, "");
  assert.equal(brand.details.objective, "");
  assert.deepEqual(Array.from(brand.details.promotions), []);
  const noConsent = form(legacyBrand, "campaign-enquiry");
  noConsent.delete("privacy");
  await assert.rejects(prepareMarketingForm(noConsent, "brand"), /Privacy Policy/);
  await assert.rejects(
    prepareMarketingForm(
      form({ ...legacyCreator, processing_consent: false }, "partner-application"),
      "creator",
    ),
  );
  await assert.rejects(
    prepareMarketingForm(
      form(
        {
          ...legacyBrand,
          campaign: {
            ...legacyBrand.campaign,
            creator: { id: legacyBrand.id, slug: "no-longer-public", name: "Untrusted name" },
          },
        },
        "campaign-enquiry",
      ),
      "brand",
    ),
    /no longer available/,
  );
});

test("all four form variants persist through the real save function as service_role, and retries never duplicate rows", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(
      `CREATE ROLE anon NOLOGIN;CREATE ROLE authenticated NOLOGIN;CREATE ROLE service_role NOLOGIN BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    await db.exec(fs.readFileSync("supabase/repairs/restore_influencer_applications.sql", "utf8"));
    await db.exec(
      fs.readFileSync("supabase/migrations/20261105143000_marketing_intake_recovery.sql", "utf8"),
    );
    const query = async (sql, args = []) => {
      await db.exec("SET ROLE service_role");
      try {
        return await db.query(sql, args);
      } finally {
        await db.exec("RESET ROLE");
      }
    };
    const client = {
      from: (table) => ({
        select: () => ({
          limit: async () => {
            try {
              await query(`SELECT token FROM public.marketing_intake_receipts LIMIT 0`);
              return { error: null };
            } catch (e) {
              return { error: { code: e.code } };
            }
          },
        }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
      rpc: async (name, args) => {
        try {
          const result = await query(
            "SELECT public.save_marketing_intake($1,$2,$3,$4) AS receipt",
            [args.p_kind, args.p_token, args.p_hash, JSON.stringify(args.p_payload)],
          );
          return { data: result.rows[0].receipt, error: null };
        } catch (e) {
          return { data: null, error: { code: e.code } };
        }
      },
    };
    const { submitMarketingIntake } = load(
      "src/lib/marketing-intake.server.ts",
      {
        "@/integrations/supabase/client.server": { supabaseAdmin: client },
        "@/lib/influencer-database.server": {
          influencerAdmin: {
            rpc: async (_, args) => ({
              data: (
                await query("SELECT public.take_influencer_submission_slot($1) AS allowed", [
                  args.rate_key,
                ])
              ).rows[0].allowed,
              error: null,
            }),
          },
        },
        "@/lib/website-requests.server": { validWebsiteOrigin: () => true },
        "@/lib/public-site.server": {
          publicSiteSettings: async () => ({ email: "admin@example.invalid" }),
        },
        "@/lib/influencers.server": { getPublishedInfluencer: async () => null },
      },
      {
        File,
        FormData,
        process: {
          env: { SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-secret", NODE_ENV: "production" },
        },
      },
    );
    const submit = (kind, data, format = "") =>
      submitMarketingIntake(
        new Request("https://example.invalid/api/marketing/" + kind, {
          method: "POST",
          body: form(data, format),
        }),
        kind,
      );
    const common = {
      privacy: true,
      phone: "+910000000000",
      email: "test@example.invalid",
      startedAt: Date.now() - 5000,
    };
    const creator = {
      ...common,
      token: "00000000-0000-4000-8000-000000000002",
      full_name: "Synthetic Creator",
      city: "Patna",
      state: "Bihar",
      country: "India",
      profiles: [
        { platform: "Instagram", url: "https://instagram.com/synthetic-test", followers: 123 },
      ],
      category: "Technology",
      average_views: null,
      engagement: null,
      collaboration: "Paid",
      biography: "Synthetic creator for local persistence verification.",
      publication_consent: false,
      partnership_application: true,
      creator_name: "Synthetic Creator Studio",
      primary_platform: "Instagram",
      partnership_interests: ["Portfolio Website", "Songs / Music", "Microdrama"],
      creator_goals: "Build a professional portfolio and original content.",
      joining_reason: "Explore creative and technical support.",
      project_requirements: "A portfolio website and music video.",
      whatsapp: "+910000000001",
      additional_message: "Discuss scope before starting.",
    };
    const brand = {
      ...common,
      token: "00000000-0000-4000-8000-000000000001",
      company: "Synthetic Brand",
      contact_name: "Synthetic Contact",
      industry: "Technology",
      location: "India",
      objective: "Brand Awareness",
      platforms: ["Instagram"],
      category: "Technology",
      influencer_count: null,
      budget: "Not Decided",
      promotions: ["Instagram Reels"],
    };
    const first = await submit("brand", brand);
    assert.equal(first.status, 201);
    const receipt = await first.json();
    assert.equal(receipt.ok, true);
    assert.notEqual(receipt.reference, brand.token);
    assert.equal((await submit("creator", creator)).status, 201);
    assert.equal((await submit("brand", legacyBrand, "campaign-enquiry")).status, 201);
    assert.equal((await submit("creator", legacyCreator, "partner-application")).status, 201);
    const partnershipData = (
      await query(
        "SELECT influencer_data FROM partner_applications WHERE influencer_data->>'partnership_application'='true'",
      )
    ).rows[0].influencer_data;
    for (const field of [
      "creator_name",
      "creator_goals",
      "joining_reason",
      "project_requirements",
      "whatsapp",
      "additional_message",
    ])
      assert.equal(partnershipData[field], creator[field]);
    assert.deepEqual(partnershipData.partnership_interests, creator.partnership_interests);
    const repeated = await submit("brand", brand);
    assert.equal(repeated.status, 200);
    assert.equal((await repeated.json()).reference, receipt.reference);
    // Rate limiting applies to new attempts; check the conflicting retry directly in SQL.
    await assert.rejects(
      query("SELECT public.save_marketing_intake($1,$2,$3,$4)", [
        "brand",
        brand.token,
        "changed",
        JSON.stringify(brand),
      ]),
      /Submission conflict/,
    );
    assert.equal(
      (await query("SELECT count(*)::int AS count FROM brand_campaign_inquiries")).rows[0].count,
      2,
    );
    assert.equal(
      (await query("SELECT count(*)::int AS count FROM partner_applications WHERE is_influencer"))
        .rows[0].count,
      2,
    );
    assert.equal(
      (await query("SELECT count(*)::int AS count FROM marketing_intake_receipts")).rows[0].count,
      4,
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS count FROM influencer_profiles")).rows[0].count,
      0,
    );
  } finally {
    await db.close();
  }
});

test("schema, credentials and permission failures stay distinct and unavailable schemas do not consume the rate limiter", async () => {
  for (const [failure, expected] of [
    [null, "MARKETING_DATABASE_CONFIGURATION"],
    [{ code: "PGRST205" }, "MARKETING_SCHEMA_MISSING"],
    [{ code: "PGRST301" }, "MARKETING_DATABASE_CREDENTIALS"],
    [{ code: "42501" }, "MARKETING_DATABASE_PERMISSION"],
  ]) {
    let slots = 0;
    const logs = [];
    const { submitMarketingIntake } = load(
      "src/lib/marketing-intake.server.ts",
      {
        "@/integrations/supabase/client.server": {
          supabaseAdmin: {
            from: () => ({ select: () => ({ limit: async () => ({ error: failure }) }) }),
          },
        },
        "@/lib/influencer-database.server": {
          influencerAdmin: {
            rpc: async () => {
              slots++;
              return { data: true, error: null };
            },
          },
        },
        "@/lib/website-requests.server": { validWebsiteOrigin: () => true },
      },
      {
        File,
        FormData,
        process: { env: failure ? { SUPABASE_SERVICE_ROLE_KEY: "synthetic-secret" } : {} },
        console: { error: (message) => logs.push(message) },
      },
    );
    const response = await submitMarketingIntake(
      new Request("https://example.invalid/api/marketing/brand", {
        method: "POST",
        body: form(legacyBrand, "campaign-enquiry"),
      }),
      "brand",
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, expected);
    assert.equal(slots, 0);
    assert.match(
      logs[0],
      failure ? /operation=check_marketing_schema/ : /operation=take_influencer_submission_slot/,
    );
    if (failure) assert.match(logs[0], new RegExp("database_code=" + failure.code));
  }
});

test("shared browser transport requires a database reference and rejects bad response bodies", async () => {
  for (const [response, error] of [
    [Response.json({ ok: true }), /not be confirmed/],
    [new Response("bad upstream response", { status: 503 }), /unexpected response/],
    [Response.json({ error: "Synthetic save failed" }, { status: 503 }), /Synthetic save failed/],
  ]) {
    const { submitMarketingForm } = load(
      "src/lib/marketing-submission.ts",
      {},
      { fetch: async () => response, FormData },
    );
    await assert.rejects(submitMarketingForm("brand", new FormData()), error);
  }
});
