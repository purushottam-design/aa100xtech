const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { creatorIntakeSchema, brandIntakeSchema, budgets, creatorPartnershipInterests } = load(
  "src/lib/marketing-intake.ts",
);
const token = "00000000-0000-4000-8000-000000000001";
const common = {
  email: "fixture@example.test",
  phone: "+919876543210",
  privacy: true,
  token,
  startedAt: Date.now() - 5000,
};
const creator = {
  ...common,
  full_name: "Test Creator",
  city: "Patna",
  state: "Bihar",
  country: "India",
  profiles: [{ platform: "Instagram", url: "https://instagram.com/fixture", followers: 100 }],
  category: "Technology",
  average_views: null,
  engagement: null,
  collaboration: "Paid",
  biography: "Test biography for a synthetic creator fixture.",
};
const brand = {
  ...common,
  company: "Test Brand",
  contact_name: "Test Contact",
  industry: "Technology",
  location: "Patna, India",
  objective: "Brand Awareness",
  platforms: ["Instagram"],
  category: "Technology",
  influencer_count: null,
  budget: budgets[0],
  promotions: ["Instagram Reels"],
};

test("creator consent is optional for publication and required for processing; platform URLs, phones and counts validate", () => {
  const parsed = creatorIntakeSchema.parse(creator);
  assert.equal(parsed.publication_consent, false);
  assert.equal(creatorIntakeSchema.safeParse({ ...creator, privacy: false }).success, false);
  for (const patch of [
    { phone: "123" },
    { email: "invalid" },
    { profiles: [] },
    { profiles: [{ platform: "Instagram", url: "https://evil.test/profile", followers: 0 }] },
    { profiles: [{ platform: "Other", url: "javascript:alert(1)", followers: 0 }] },
    { engagement: 101 },
    { average_views: -1 },
  ])
    assert.equal(creatorIntakeSchema.safeParse({ ...creator, ...patch }).success, false);
  const many = ["Snapchat", "ShareChat", "Moj", "Josh", "X (Twitter)", "Pinterest", "Other"].map(
    (platform) => ({
      platform,
      url: {
        Snapchat: "https://snapchat.com/add/test",
        ShareChat: "https://sharechat.com/profile/test",
        Moj: "https://mojapp.in/@test",
        Josh: "https://myjosh.in/@test",
        "X (Twitter)": "https://x.com/test",
        Pinterest: "https://pinterest.com/test",
        Other: "https://example.test/creator",
      }[platform],
      followers: null,
    }),
  );
  assert.equal(creatorIntakeSchema.safeParse({ ...creator, profiles: many }).success, true);
  assert.equal(
    creatorIntakeSchema.safeParse({
      ...creator,
      profiles: [...creator.profiles, ...creator.profiles],
    }).success,
    false,
  );
});
test("brand choices, numeric limits, dates and privacy validate server-side", () => {
  assert.equal(brandIntakeSchema.safeParse(brand).success, true);
  for (const patch of [
    { privacy: false },
    { company: "" },
    { budget: "free" },
    { platforms: [] },
    { promotions: [] },
    { influencer_count: 0 },
    { start_date: "2026-02-30" },
    { company_website: "http://example.test" },
  ])
    assert.equal(brandIntakeSchema.safeParse({ ...brand, ...patch }).success, false);
});
test("creator partnership interests and goals validate without changing existing applications", async () => {
  const application = {
    ...creator,
    creator_name: "Test Creator Studio",
    primary_platform: "Instagram",
    portfolio_url: "https://example.test/portfolio",
    joining_reason: "I want support building a professional creator presence.",
    partnership_interests: ["Portfolio Website", "Domain Support", "AI Prompt Resources"],
  };
  const s = server();
  assert.equal((await s.submit(application)).status, 201);
  const payload = s.writes[0].args.p_payload;
  assert.equal(payload.display_name, application.creator_name);
  assert.equal(payload.portfolio_url, application.portfolio_url);
  assert.equal(payload.joining_reason, application.joining_reason);
  assert.deepEqual(Array.from(payload.partnership_interests), application.partnership_interests);
  for (const patch of [
    { partnership_interests: ["Guaranteed free services"] },
    { primary_platform: "Invalid platform" },
    { portfolio_url: "javascript:alert(1)" },
    { joining_reason: "x".repeat(1501) },
  ]) {
    assert.equal(creatorIntakeSchema.safeParse({ ...application, ...patch }).success, false);
  }
  assert.deepEqual(Array.from(creatorIntakeSchema.parse(creator).partnership_interests), []);
});
test("expanded program interests preserve legacy choices and save multi-package selections", async () => {
  const requested = [
    "Creator Website",
    "Image Production",
    "Video Production",
    "AI Image Prompts",
    "AI Video Prompts",
    "Songs / Music",
    "Music Albums",
    "Music Videos",
    "Digital Distribution",
    "Original IP Development",
    "Audience Growth Support",
  ];
  for (const interest of requested)
    assert.ok(creatorPartnershipInterests.includes(interest), interest);
  const allInterests = Array.from(creatorPartnershipInterests);
  assert.equal(new Set(allInterests).size, allInterests.length);
  const s = server();
  assert.equal((await s.submit({ ...creator, partnership_interests: allInterests })).status, 201);
  assert.deepEqual(Array.from(s.writes[0].args.p_payload.partnership_interests), allInterests);
  for (const legacy of [
    "Microdrama",
    "Creator Application",
    "Domain Support",
    "AI Prompt Resources",
    "Application Hosting",
  ])
    assert.equal(
      creatorIntakeSchema.safeParse({ ...creator, partnership_interests: [legacy] }).success,
      true,
    );
});
function server({
  allowed = true,
  failure = null,
  created = true,
  notifications = false,
  mailFailure = false,
} = {}) {
  const writes = [],
    uploads = [],
    removed = [],
    mail = [];
  const db = {
    rpc: async (name, args) => {
      writes.push({ name, args });
      return failure ? { error: failure } : { data: { reference: token, created }, error: null };
    },
    from: () => ({
      select: () => ({ limit: async () => ({ error: null }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  };
  const { submitMarketingIntake } = load(
    "src/lib/marketing-intake.server.ts",
    {
      "@/integrations/supabase/client.server": {
        supabaseAdmin: {
          ...db,
          storage: {
            from: () => ({
              upload: async (path) => {
                uploads.push(path);
                return { error: null };
              },
              remove: async (paths) => {
                removed.push(...paths);
                return { error: null };
              },
            }),
          },
        },
      },
      "@/lib/influencer-database.server": {
        influencerAdmin: { rpc: async () => ({ data: allowed, error: null }) },
      },
      "@/lib/website-requests.server": {
        validWebsiteOrigin: (r) => r.headers.get("origin") === "https://example.test",
      },
      "@/lib/public-site.server": {
        publicSiteSettings: async () => ({ email: "admin@example.test" }),
      },
    },
    {
      File,
      FormData,
      process: {
        env: {
          SUPABASE_SERVICE_ROLE_KEY: "synthetic-test-secret",
          NODE_ENV: "production",
          ...(notifications
            ? {
                RESEND_API_KEY: "synthetic-test-key",
                NOTIFICATION_FROM_EMAIL: "website@example.test",
              }
            : {}),
        },
      },
      fetch: async (url, options) => {
        mail.push({ url, body: JSON.parse(options.body), headers: options.headers });
        if (mailFailure) throw new Error("Mail unavailable");
        return new Response("{}", { status: 200 });
      },
    },
  );
  const submit = (data, kind = "creator", file = null, origin = "https://example.test") => {
    const form = new FormData();
    form.set("data", JSON.stringify({ ...data, startedAt: Date.now() - 5000 }));
    if (file) form.set("media_kit", file);
    return submitMarketingIntake(
      new Request("https://example.test/api/marketing/" + kind, {
        method: "POST",
        headers: { origin, "x-aa-rpc": "1" },
        body: form,
      }),
      kind,
    );
  };
  return { submit, writes, uploads, removed, mail };
}
test("creator admin notifications follow confirmed new saves and cannot undo a saved application", async () => {
  const s = server({ notifications: true });
  assert.equal((await s.submit(creator)).status, 201);
  assert.equal(s.writes.length, 1);
  assert.equal(s.mail.length, 1);
  assert.equal(s.mail[0].body.subject, `AA100XTECH influencer application ${token}`);
  assert.deepEqual(Array.from(s.mail[0].body.to), ["admin@example.test"]);
  assert.equal(s.mail[0].headers["Idempotency-Key"], token);
  const duplicate = server({ notifications: true, created: false });
  assert.equal((await duplicate.submit(creator)).status, 200);
  assert.equal(duplicate.mail.length, 0);
  const failedSave = server({ notifications: true, failure: { code: "42P01" } });
  assert.equal((await failedSave.submit(creator)).status, 503);
  assert.equal(failedSave.mail.length, 0);
  assert.equal(
    (await server({ notifications: true, mailFailure: true }).submit(creator)).status,
    201,
  );
});
test("real handler saves only validated private data, returns DB receipt, and does not publish profiles", async () => {
  const s = server();
  const res = await s.submit(creator);
  assert.equal(res.status, 201);
  assert.equal((await res.json()).reference, token);
  const payload = s.writes[0].args.p_payload;
  assert.equal(payload.publication_consent, false);
  assert.equal(payload.processing_consent, true);
  assert.equal(payload.token, undefined);
  assert.equal(payload.website_trap, undefined);
  assert.equal(payload.socials.instagram, creator.profiles[0].url);
  assert.equal(payload.profiles[0].followers, 100);
  assert.equal((await s.submit({ ...creator, privacy: false })).status, 400);
  assert.equal(s.writes.length, 1);
  assert.equal((await s.submit(creator, "creator", null, "https://evil.test")).status, 403);
  assert.equal(s.writes.length, 1);
  assert.equal((await server({ allowed: false }).submit(brand, "brand")).status, 429);
  assert.equal((await server({ failure: { code: "42P01" } }).submit(brand, "brand")).status, 503);
  assert.equal((await server({ failure: { code: "23505" } }).submit(brand, "brand")).status, 409);
  assert.equal((await server({ created: false }).submit(creator)).status, 200);
});
test("both intake handlers accept skipped optional details while keeping essential fields required", async () => {
  const minimalCreator = { ...creator, city: "", state: "", country: "", biography: "" };
  const minimalBrand = { ...brand, industry: "", location: "" };
  const creatorServer = server();
  assert.equal((await creatorServer.submit(minimalCreator)).status, 201);
  assert.equal(creatorServer.writes[0].args.p_payload.biography, "");
  assert.equal((await server().submit(minimalBrand, "brand")).status, 201);
  assert.equal(creatorIntakeSchema.safeParse({ ...minimalCreator, full_name: "" }).success, false);
  assert.equal(brandIntakeSchema.safeParse({ ...minimalBrand, contact_name: "" }).success, false);
  assert.equal(
    creatorIntakeSchema.safeParse({ ...minimalCreator, biography: "a".repeat(1201) }).success,
    false,
  );
});

test("private kits validate contents and size, and cleanup follows failed or duplicate persistence", async () => {
  const kit = new File(["%PDF-1.7\n synthetic test content\n%%EOF"], "test.pdf", {
    type: "application/pdf",
  });
  const s = server();
  assert.equal((await s.submit(creator, "creator", kit)).status, 201);
  assert.equal(s.uploads.length, 1);
  assert.equal(s.removed.length, 0);
  assert.equal(
    (await s.submit(creator, "creator", new File(["bad"], "bad.pdf", { type: "application/pdf" })))
      .status,
    400,
  );
  assert.equal(
    (
      await s.submit(
        creator,
        "creator",
        new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "big.pdf", { type: "application/pdf" }),
      )
    ).status,
    400,
  );
  assert.equal((await s.submit(brand, "brand", kit)).status, 400);
  const duplicate = server({ created: false });
  assert.equal((await duplicate.submit(creator, "creator", kit)).status, 200);
  assert.equal(duplicate.removed.length, 1);
  const failed = server({ failure: { code: "42P01" } });
  assert.equal((await failed.submit(creator, "creator", kit)).status, 503);
  assert.equal(failed.removed.length, 1);
  const ambiguous = server({ failure: { code: "", message: "Transport timeout" } });
  assert.equal((await ambiguous.submit(creator, "creator", kit)).status, 503);
  assert.equal(ambiguous.removed.length, 0, "An attachment survives an uncertain commit");
});
