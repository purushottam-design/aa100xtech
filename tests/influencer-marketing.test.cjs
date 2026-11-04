const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { filterCreators, creatorListing } = load("src/lib/creator-discovery.ts");
const base = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "fixture-creator",
  display_name: "Fixture Creator",
  city: "Delhi",
  state: "Delhi",
  category: "Fashion",
  specialization: "Sustainable lifestyle",
  biography: "Fashion and lifestyle stories from Delhi, India.",
  featured: true,
  profile_image: null,
  socials: {
    instagram: "https://instagram.com/fixture",
    instagram_followers: 50_000,
    youtube: "",
    youtube_followers: null,
    facebook: "",
    facebook_followers: null,
    other: [],
  },
};

test("creator filters combine public niche, name, location, platform and audience without fake matches", () => {
  assert.equal(
    filterCreators([base], {
      search: "lifestyle",
      category: "fashion",
      location: "India",
      platform: "instagram",
      followers: "50k-100k",
    }).length,
    1,
  );
  assert.equal(filterCreators([base], { search: "Mumbai" }).length, 0);
  assert.equal(filterCreators([base], { platform: "youtube" }).length, 0);
  assert.equal(filterCreators([base], { category: "technology" }).length, 0);
  assert.equal(
    filterCreators(
      [{ ...base, category: "Other", specialization: "Property and real estate tours" }],
      { category: "real-estate" },
    ).length,
    1,
  );
  assert.equal(
    filterCreators([{ ...base, category: "Other", specialization: "Food and cooking" }], {
      category: "food",
    }).length,
    1,
  );
  const snap = {
    ...base,
    socials: { ...base.socials, other: ["https://www.snapchat.com/add/fixture"] },
  };
  assert.equal(filterCreators([snap], { platform: "snapchat" }).length, 1);
  assert.equal(
    filterCreators([snap], { platform: "snapchat", followers: "under-10k" }).length,
    0,
    "Unknown Snapchat counts never become zero",
  );
});

test("audience filters have non-overlapping boundaries and preserve unknown counts", () => {
  for (const [count, range] of [
    [0, "under-10k"],
    [9999, "under-10k"],
    [10000, "10k-50k"],
    [49999, "10k-50k"],
    [50000, "50k-100k"],
    [100000, "100k-500k"],
    [500000, "500k-1m"],
    [1000000, "1m-plus"],
  ]) {
    const profile = { ...base, socials: { ...base.socials, instagram_followers: count } };
    assert.equal(filterCreators([profile], { followers: range }).length, 1);
  }
  assert.equal(
    filterCreators([{ ...base, socials: { ...base.socials, instagram_followers: null } }], {
      followers: "under-10k",
    }).length,
    0,
  );
  assert.equal(
    filterCreators(
      [
        {
          ...base,
          socials: {
            ...base.socials,
            youtube: "https://youtube.com/@fixture",
            youtube_followers: 5000,
          },
        },
      ],
      { platform: "youtube", followers: "under-10k" },
    ).length,
    1,
  );
});

test("marketing listings use an explicit public whitelist without application IDs or private contact details", () => {
  const listing = creatorListing({
    ...base,
    application_id: "private-application",
    email: "private@example.test",
    phone: "+910000000000",
    review_note: "private",
  });
  for (const key of ["application_id", "email", "phone", "review_note"])
    assert.equal(key in listing, false);
  assert.equal(listing.slug, base.slug);
  assert.equal(JSON.stringify(listing).includes("private"), false);
});

test("campaign details validate fields and cannot attach to another request kind", () => {
  const { websiteRequestSchema } = load("src/lib/website-requests.ts");
  const campaign = {
    type: "Influencer Marketing",
    category: "Fashion & Lifestyle",
    platform: "Instagram",
    location: "Delhi",
    budget: "Discuss budget",
    timeline: "Next month",
    package: "Growth Campaign",
  };
  const input = {
    id: base.id,
    kind: "influencer",
    name: "Test Brand",
    email: "brand@example.test",
    phone: "+910000000000",
    company: "Test Company",
    requirements: "A scoped product launch campaign",
    selectedPlan: "influencer-marketing",
    startedAt: Date.now() - 5000,
    campaign,
  };
  assert.ok(websiteRequestSchema.safeParse(input).success);
  for (const update of [
    { platform: "Bad platform" },
    { budget: "" },
    { timeline: "" },
    { type: "Unapproved service" },
    { category: "Unknown" },
    { package: "Free guaranteed reach" },
  ])
    assert.equal(
      websiteRequestSchema.safeParse({ ...input, campaign: { ...campaign, ...update } }).success,
      false,
    );
  assert.equal(websiteRequestSchema.safeParse({ ...input, company: "" }).success, false);
  assert.equal(websiteRequestSchema.safeParse({ ...input, kind: "contact" }).success, false);
});

test("selected campaign creators must still be published and consented before persistence", async () => {
  const writes = [];
  let current = null;
  const { saveWebsiteRequest } = load(
    "src/lib/website-requests.server.ts",
    {
      "@/integrations/supabase/client.server": {
        supabaseAdmin: {
          rpc: async (_, args) => {
            writes.push(args);
            return { data: true, error: null };
          },
          from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
        },
      },
      "@/lib/public-site.server": {
        publicSiteSettings: async () => ({ email: "customer.care@aa100xtech.com" }),
      },
      "@/lib/influencers.server": {
        getPublishedInfluencer: async () => {
          if (current instanceof Error) throw current;
          return current;
        },
      },
    },
    { File, FormData, process: { env: { NODE_ENV: "production" } } },
  );
  const input = {
    id: base.id,
    kind: "influencer",
    name: "Test Brand",
    email: "brand@example.test",
    phone: "+910000000000",
    company: "Test Company",
    requirements: "A scoped product launch campaign",
    selectedPlan: "influencer-marketing",
    startedAt: Date.now() - 5000,
    campaign: {
      type: "Influencer Marketing",
      category: "Fashion & Lifestyle",
      platform: "Instagram",
      location: "Delhi",
      budget: "Discuss budget",
      timeline: "Next month",
      package: "Growth Campaign",
      creator: { id: base.id, slug: base.slug, name: "Untrusted label" },
    },
  };
  const submit = () => {
    const form = new FormData();
    form.set("data", JSON.stringify(input));
    return saveWebsiteRequest(
      new Request("https://aa100xtech.com/api/website/requests", {
        method: "POST",
        headers: { origin: "https://aa100xtech.com", "x-aa-rpc": "1" },
        body: form,
      }),
    );
  };
  assert.equal((await submit()).status, 400);
  assert.equal(writes.length, 0);
  current = { ...base, publication_status: "published", consent_confirmed: false };
  assert.equal((await submit()).status, 400);
  current = new Error("Read unavailable");
  assert.equal((await submit()).status, 503);
  assert.equal(writes.length, 0);
  current = { ...base, publication_status: "published", consent_confirmed: true };
  assert.equal((await submit()).status, 200);
  const stored = JSON.parse(writes[0].request_payload.campaign);
  assert.equal(stored.creator.name, base.display_name);
  assert.equal(stored.budget, "Discuss budget");
  assert.equal(writes[0].destination, "customer.care@aa100xtech.com");
  const previousHash = writes[0].request_hash;
  input.campaign.budget = "A revised budget";
  await submit();
  assert.notEqual(
    writes[1].request_hash,
    previousHash,
    "Campaign fields participate in existing idempotency protection",
  );
});

test("development loopback aliases preserve same-origin checks without trusting arbitrary hosts or ports", () => {
  const mocks = {
    "@/integrations/supabase/client.server": { supabaseAdmin: {} },
    "@/lib/public-site.server": {},
    "@/lib/influencers.server": {},
  };
  const { validWebsiteOrigin } = load("src/lib/website-requests.server.ts", mocks, {
    process: { env: { NODE_ENV: "development" } },
  });
  const request = (origin, host = "127.0.0.1:3000") =>
    new Request("http://localhost:3000/api/website/requests", {
      headers: { origin, host, "x-aa-rpc": "1" },
    });
  assert.equal(validWebsiteOrigin(request("http://127.0.0.1:3000")), true);
  assert.equal(validWebsiteOrigin(request("http://evil.example", "evil.example")), false);
  assert.equal(validWebsiteOrigin(request("http://127.0.0.1:4000", "127.0.0.1:4000")), false);
  const production = load("src/lib/website-requests.server.ts", mocks, {
    process: { env: { NODE_ENV: "production" } },
  });
  assert.equal(production.validWebsiteOrigin(request("http://127.0.0.1:3000")), false);
});
