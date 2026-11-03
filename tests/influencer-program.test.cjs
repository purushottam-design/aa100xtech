const assert = require("node:assert/strict");
const { test } = require("node:test");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const load = require("./helpers/load-server.cjs");
const program = load("src/lib/influencer-program.ts");
const base = load("src/lib/influencers.ts");
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const profile = (n, patch = {}) => ({
  id: id(n),
  application_id: id(n + 100),
  updated_at: "2026-10-30T00:00:00Z",
  ...base.profileSchema.parse({
    slug: `test-partner-${n}`,
    display_name: `Synthetic Partner ${n}`,
    city: "Test City",
    state: "Test State",
    category: "Technology",
    biography: "Synthetic biography used only inside automated tests.",
    socials: { instagram: `https://instagram.com/test${n}`, instagram_followers: 10 },
    publication_status: "published",
    consent_confirmed: true,
    featured: false,
    ...patch,
  }),
});
const stats = (n, converted, leads = converted, date = "2026-10-01T00:00:00Z") => ({
  profile_id: id(n),
  converted_clients: converted,
  total_leads: leads,
  created_at: date,
});

test("rank, featured partner and level use converted clients only, with stable ties", () => {
  const profiles = [profile(4, { featured: true }), profile(2), profile(1), profile(3)];
  const ranked = program.rankInfluencers(profiles, [
    stats(4, 0, 9999),
    stats(3, 8, 500),
    stats(2, 8, 8),
    stats(1, 12, 12),
  ]);
  assert.deepEqual(
    Array.from(ranked, (p) => p.id),
    [id(1), id(2), id(3), id(4)],
  );
  assert.deepEqual(
    Array.from(ranked, (p) => p.rank),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    Array.from(ranked, (p) => p.featured),
    [true, false, false, false],
  );
  assert.equal(ranked[0].partnerLevel, "Elite Partner");
  const earlier = program.rankInfluencers(profiles, [
    stats(2, 8),
    stats(3, 8, 8, "2026-09-01T00:00:00Z"),
  ]);
  assert.equal(earlier[0].id, id(3));
  for (const [count, expected] of [
    [0, "Starter Partner"],
    [2, "Starter Partner"],
    [3, "Growth Partner"],
    [5, "Growth Partner"],
    [6, "Pro Partner"],
    [10, "Pro Partner"],
    [11, "Elite Partner"],
  ])
    assert.equal(program.partnerLevel(count), expected);
});

test("missing, invalid and partial statistics never become invented zero-score rankings", () => {
  assert.equal(program.rankInfluencers([profile(1)], []).length, 0);
  for (const patch of [
    { converted_clients: -1 },
    { converted_clients: 2, total_leads: 1 },
    { converted_clients: "12" },
    { created_at: "invalid" },
  ])
    assert.equal(program.rankInfluencers([profile(1)], [{ ...stats(1, 0), ...patch }]).length, 0);
});

function readHarness({ statistics, stories = [], failStats = false, unavailable = false } = {}) {
  const profiles = [profile(1), profile(2)];
  const reads = [];
  const client = {
    rpc(name) {
      assert.equal(name, "get_influencer_partner_stats");
      reads.push("aggregates");
      const query = {
        order() {
          return query;
        },
        range() {
          return query;
        },
        abortSignal: async () => ({
          data: statistics ?? [stats(1, 12), stats(2, 8)],
          error: failStats ? { message: "private database details" } : null,
        }),
      };
      return query;
    },
    from(table) {
      assert.equal(
        table,
        "influencer_testimonials",
        "Public reads must never query private referrals",
      );
      const query = {
        select(columns) {
          assert.equal(columns, "id,profile_id,quote,created_at");
          return query;
        },
        eq(key, value) {
          reads.push([key, value]);
          return query;
        },
        order() {
          return query;
        },
        limit() {
          return query;
        },
        abortSignal: async () => ({ data: stories, error: null }),
      };
      return query;
    },
  };
  const api = load(
    "src/lib/influencer-program.server.ts",
    {
      "@/lib/influencers.server": {
        listPublishedInfluencers: async () => ({
          profiles: unavailable ? [] : profiles,
          unavailable,
        }),
        publicInfluencerClient: () => client,
      },
    },
    { console: { warn() {} } },
  );
  return { api, reads };
}

test("public program reads only aggregates and consented stories belonging to public profiles", async () => {
  const h = readHarness({
    stories: [
      {
        id: id(201),
        profile_id: id(1),
        quote: "Approved synthetic quote used only for tests.",
        created_at: "2026-10-30",
      },
      {
        id: id(202),
        profile_id: id(99),
        quote: "A hidden creator must not appear.",
        created_at: "2026-10-30",
      },
    ],
  });
  const result = await h.api.getInfluencerProgram();
  assert.equal(result.partners[0].id, id(1));
  assert.equal(result.testimonials.length, 1);
  assert.ok(
    h.reads.some(
      (row) => Array.isArray(row) && row[0] === "publication_status" && row[1] === "published",
    ),
  );
  assert.ok(
    h.reads.some((row) => Array.isArray(row) && row[0] === "consent_confirmed" && row[1] === true),
  );
  for (const options of [{ failStats: true }, { statistics: [stats(1, 12)] }]) {
    const failed = await readHarness(options).api.getInfluencerProgram();
    assert.equal(failed.rankingsUnavailable, true);
    assert.equal(failed.partners.length, 0);
    assert.equal(
      failed.profiles.length,
      2,
      "A ranking outage must not erase the existing directory",
    );
  }
  const failed = readHarness({ unavailable: true });
  assert.equal((await failed.api.getInfluencerProgram()).partners.length, 0);
  assert.equal(failed.reads.length, 0);
});

test("removed public spotlight and leaderboard stay absent without fake stories or private data", async () => {
  const profiles = [profile(2, { featured: true }), profile(1)];
  const partners = program.rankInfluencers(profiles, [stats(2, 3, 900), stats(1, 12)]);
  const page = load("src/app/influencers/page.tsx", {
    "next/link": ({ href, children, ...props }) =>
      React.createElement("a", { href, ...props }, children),
    "./influencers.css": {},
    "@/lib/influencer-program.server": {
      getInfluencerProgram: async () => ({
        profiles,
        partners,
        testimonials: [],
        unavailable: false,
        rankingsUnavailable: false,
        testimonialsUnavailable: false,
      }),
    },
  });
  const markup = renderToStaticMarkup(await page.default());
  assert.equal(markup.includes("data-featured-partner="), false);
  assert.equal(markup.includes("data-rank="), false);
  assert.equal(markup.includes("Top Influencer Partners"), false);
  assert.ok(markup.includes("Approved partner stories will appear here"));
  assert.equal(markup.includes("client_reference"), false);
  assert.equal(markup.includes("evidence_reference"), false);
  assert.equal(markup.includes('class="ip-spotlight-section'), false);
});

test("client records require explicit verified conversion evidence; public counters cannot be submitted", () => {
  const parsed = program.programUpdateSchema.parse({
    action: "referral",
    profileId: id(1),
    clientReference: "CLIENT-001",
    evidenceReference: "verified-invoice-001",
    status: "converted",
    confirmationReviewed: true,
    convertedClients: 9999,
    totalLeads: 9999,
  });
  assert.equal(parsed.clientReference, "client-001");
  assert.equal("convertedClients" in parsed, false);
  assert.equal("totalLeads" in parsed, false);
  assert.equal(
    program.programUpdateSchema.safeParse({ ...parsed, clientReference: "private@example.test" })
      .success,
    false,
  );
});

test("the existing application contract stays valid and primary social platform must have a genuine URL", () => {
  const input = {
    full_name: "Test Applicant",
    display_name: "Test Applicant",
    email: "test@example.test",
    phone: "+910000000000",
    city: "Test City",
    state: "Test State",
    country: "India",
    category: "Technology",
    biography: "A genuine applicant supplied introduction.",
    audience_location: "India",
    interest: "both",
    deliverables: "A genuine applicant supplied introduction.",
    expected_terms: "Terms to be agreed in writing.",
    processing_consent: true,
    publication_consent: true,
    socials: { instagram: "https://instagram.com/test" },
  };
  assert.equal(base.influencerApplicationSchema.safeParse(input).success, true);
  assert.equal(
    base.influencerApplicationSchema.safeParse({
      ...input,
      socials: { ...input.socials, primary: "youtube" },
    }).success,
    false,
  );
  assert.equal(
    base.influencerApplicationSchema.safeParse({ ...input, program_terms_consent: false }).success,
    false,
  );
});
