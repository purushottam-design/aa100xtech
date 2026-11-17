const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-server.cjs");
const schema = load("src/lib/influencers.ts");
const campaign = load("src/lib/campaign-enquiry.ts");
const submissionId = "00000000-0000-4000-8000-000000000001";
const input = {
  submission_id: submissionId,
  full_name: "Synthetic Creator",
  display_name: "Synthetic Creator",
  email: "creator@example.test",
  phone: "+91 00000 00000",
  city: "Test City",
  state: "Test State",
  country: "India",
  category: "Technology",
  biography: "Synthetic introduction used only by automated tests.",
  audience_location: "India",
  socials: { instagram: "https://instagram.com/synthetic-test" },
  interest: "both",
  deliverables: "Agreed creator content and brand collaborations.",
  expected_terms: "Terms will be agreed in writing.",
  portfolio_url: "https://example.test/portfolio",
  processing_consent: true,
  publication_consent: true,
  program_terms_consent: true,
};

test("partner application keeps existing fields and rejects invalid phone, URLs and retry identifiers", () => {
  const parsed = schema.influencerApplicationSchema.parse(input);
  assert.equal(parsed.submission_id, submissionId);
  assert.equal(parsed.portfolio_url, input.portfolio_url);
  assert.equal(parsed.deliverables, input.deliverables);
  assert.equal(
    schema.influencerApplicationSchema.safeParse({ ...input, submission_id: undefined }).success,
    true,
  );
  for (const patch of [
    { phone: "not-a-number" },
    { phone: "+ ( ) --" },
    { submission_id: "not-a-uuid" },
    { portfolio_url: "javascript:alert(1)" },
    { processing_consent: false },
    { publication_consent: false },
  ])
    assert.equal(
      schema.influencerApplicationSchema.safeParse({ ...input, ...patch }).success,
      false,
    );
});

test("same partner request ID uses the existing primary key and cannot create a second record", async () => {
  const rows = new Map();
  class PublicError extends Error {
    constructor(message, status = 400) {
      super(message);
      this.status = status;
    }
  }
  const route = load(
    "src/app/api/influencers/apply/route.ts",
    {
      "@/lib/website-session.server": { websiteSessionError: async () => null },
      "@/lib/influencers": schema,
      "@/integrations/supabase/client.server": { supabaseAdmin: {} },
      "@/lib/influencer-database.server": {
        influencerAdmin: {
          rpc: async () => ({ data: true, error: null }),
          from(table) {
            assert.equal(table, "partner_applications");
            return {
              insert: async (row) => {
                if (rows.has(row.id)) return { error: { code: "23505" } };
                rows.set(row.id, row);
                return { error: null };
              },
            };
          },
        },
      },
      "@/lib/influencer-upload.server": {
        assertInfluencerOrigin() {},
        boundedFormData: (request) => request.formData(),
        storeInfluencerImage() {
          throw new Error("Unexpected upload");
        },
        InfluencerRequestError: PublicError,
        requestError: (error) =>
          Response.json({ error: error.message }, { status: error.status ?? 503 }),
      },
    },
    { process: { env: { SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-secret" } } },
  );
  function request(payload) {
    const body = new FormData();
    body.set("application", JSON.stringify(payload));
    return new Request("https://example.test/api/influencers/apply", { method: "POST", body });
  }
  assert.equal((await route.POST(request(input))).status, 201);
  const retry = await route.POST(
    request({ ...input, full_name: "Changed retry must not overwrite" }),
  );
  assert.equal(retry.status, 409);
  assert.match((await retry.json()).error, /already been received/);
  assert.equal(rows.size, 1);
  const saved = rows.get(submissionId);
  assert.equal(saved.full_name, input.full_name);
  assert.equal(saved.status, "pending");
  assert.equal(saved.influencer_review_status, "pending");
  assert.equal(saved.influencer_data.portfolio_url, input.portfolio_url);
  assert.equal(saved.influencer_data.deliverables, input.deliverables);
});

test("brand partner audience details use the shared campaign contract and are bounded", () => {
  const brief = {
    type: "Influencer Marketing",
    category: "Any category",
    platform: "Instagram",
    location: "India",
    budget: "Discuss scope",
    timeline: "Next month",
    targetAudience: "Regional fashion audiences",
  };
  assert.equal(campaign.campaignDetailsSchema.parse(brief).targetAudience, brief.targetAudience);
  for (const targetAudience of ["", "x".repeat(501)])
    assert.equal(
      campaign.campaignDetailsSchema.safeParse({ ...brief, targetAudience }).success,
      false,
    );
  assert.equal(
    campaign.campaignDetailsSchema.safeParse({ ...brief, targetAudience: undefined }).success,
    true,
  );
});
