const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { websiteRequestSchema } = load("src/lib/website-requests.ts");
const { adServices, adPlatforms, adBudgets } = load("src/lib/social-ad-proposal.ts");

const input = () => ({
  id: "00000000-0000-4000-8000-000000000001",
  kind: "proposal",
  name: "Test Business Owner",
  company: "Example Business",
  email: "owner@example.test",
  phone: "+91 9876543210",
  selectedPlan: "social-media-ads",
  requirements: "Plan a paid social campaign for our local business.",
  startedAt: Date.now() - 5000,
  socialAds: {
    companyWebsite: "https://example.test",
    services: [adServices[0]],
    platforms: [adPlatforms[0]],
    budget: adBudgets[0],
    location: "Patna, India",
    objective: "Lead Generation",
    startDate: "2026-12-01",
    privacy: true,
  },
});

test("advertising proposals enforce required fields, platform choices, website protocol and privacy on the server schema", () => {
  assert.equal(websiteRequestSchema.safeParse(input()).success, true);
  for (const change of [
    { privacy: false },
    { platforms: [] },
    { services: [] },
    { budget: "anything" },
    { startDate: "tomorrow" },
    { location: "" },
    { companyWebsite: "javascript:alert(1)" },
  ]) {
    const value = input();
    value.socialAds = { ...value.socialAds, ...change };
    assert.equal(websiteRequestSchema.safeParse(value).success, false, JSON.stringify(change));
  }
  assert.equal(websiteRequestSchema.safeParse({ ...input(), company: "" }).success, false);
  assert.equal(websiteRequestSchema.safeParse({ ...input(), kind: "contact" }).success, false);
  assert.equal(websiteRequestSchema.safeParse({ ...input(), website: "spam" }).success, false);
  const generic = input();
  delete generic.socialAds;
  assert.equal(
    websiteRequestSchema.safeParse(generic).success,
    true,
    "Existing general proposal selections still work",
  );
});

function submissionFixture({ failure = false } = {}) {
  const records = new Map(),
    mail = [];
  let calls = 0;
  const server = load(
    "src/lib/website-requests.server.ts",
    {
      "@/lib/website-database.server": {
        websiteAdmin: {
          async rpc(name, args) {
            assert.equal(name, "submit_website_request");
            calls++;
            if (failure) return { data: null, error: { code: "unavailable" } };
            const existing = records.get(args.request_id);
            if (existing)
              return {
                data: false,
                error: existing.request_hash === args.request_hash ? null : { code: "23505" },
              };
            records.set(args.request_id, args);
            return { data: true, error: null };
          },
          from() {
            return {
              update() {
                return { eq: async () => ({ error: null }) };
              },
            };
          },
        },
      },
      "@/lib/public-site.server": {
        publicSiteSettings: async () => ({ email: "admin@example.test" }),
      },
      "@/lib/influencers.server": {},
    },
    {
      FormData,
      File,
      process: {
        env: {
          NODE_ENV: "production",
          RESEND_API_KEY: "fixture",
          NOTIFICATION_FROM_EMAIL: "verified@example.test",
        },
      },
      fetch: async (url, options) => {
        mail.push(JSON.parse(options.body));
        return Response.json({});
      },
    },
  );
  const request = (value) => {
    const body = new FormData();
    body.set("data", JSON.stringify(value));
    return new Request("https://aa100xtech.com/api/website/social-ads", {
      method: "POST",
      headers: { origin: "https://aa100xtech.com", "x-aa-rpc": "1" },
      body,
    });
  };
  return { ...server, records, mail, request, calls: () => calls };
}

test("dedicated endpoint requires the full brief; saved data retains all preferences and retries do not duplicate notifications", async () => {
  const fixture = submissionFixture();
  const missing = input();
  delete missing.socialAds;
  assert.equal((await fixture.saveWebsiteRequest(fixture.request(missing), true)).status, 400);
  const noConsent = input();
  noConsent.socialAds.privacy = false;
  assert.equal((await fixture.saveWebsiteRequest(fixture.request(noConsent), true)).status, 400);
  assert.equal(fixture.calls(), 0);
  const value = input();
  const response = await fixture.saveWebsiteRequest(fixture.request(value), true);
  assert.deepEqual(await response.json(), { saved: true, notification: "sent" });
  const stored = fixture.records.get(value.id).request_payload;
  assert.deepEqual(JSON.parse(stored.socialAds), value.socialAds);
  assert.equal(stored.status, "New");
  assert.equal(fixture.mail.length, 2);
  assert.deepEqual(fixture.mail[0].to, ["admin@example.test"]);
  assert.deepEqual(fixture.mail[1].to, [value.email]);
  assert.equal((await fixture.saveWebsiteRequest(fixture.request(value), true)).status, 200);
  assert.equal(fixture.mail.length, 2);
  const spam = input();
  spam.startedAt = Date.now();
  assert.equal((await fixture.saveWebsiteRequest(fixture.request(spam), true)).status, 429);
});

test("storage failures never return success or send confirmation emails", async () => {
  const f = submissionFixture({ failure: true });
  const response = await f.saveWebsiteRequest(f.request(input()), true);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).saved, false);
  assert.equal(f.mail.length, 0);
});

test("admin status updates enforce lead permissions, reject cross-site requests and protect concurrent changes", async () => {
  let permissions = ["leads.view"],
    writes = 0,
    race = false,
    nextPayload;
  const original = {
    name: "Private name",
    socialAds: JSON.stringify(input().socialAds),
    status: "New",
  };
  const route = load("src/app/api/website/requests/route.ts", {
    "@/lib/website-requests.server": {
      validWebsiteOrigin: (request) => request.headers.get("origin") === "https://aa100xtech.com",
    },
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        auth: { getUser: async () => ({ data: { user: { id: "verified" } }, error: null }) },
      },
    },
    "@/lib/rbac.server": { authorize: async () => ({ isSuper: false, permissions }) },
    "@/lib/website-database.server": {
      websiteAdmin: {
        from() {
          let updating = false;
          const q = {
            select() {
              return q;
            },
            eq(key, value) {
              return q;
            },
            filter(key, operator, value) {
              assert.equal(key, "payload");
              assert.equal(operator, "eq");
              assert.deepEqual(JSON.parse(value), original);
              return q;
            },
            update(value) {
              updating = true;
              writes++;
              nextPayload = value.payload;
              return q;
            },
            maybeSingle: async () => ({
              data: updating ? (race ? null : { id: input().id }) : { payload: original },
              error: null,
            }),
          };
          return q;
        },
      },
    },
  });
  const request = (status = "Contacted", origin = "https://aa100xtech.com") =>
    new Request("https://aa100xtech.com/api/website/requests", {
      method: "PATCH",
      headers: { authorization: "Bearer verified", origin, "content-type": "application/json" },
      body: JSON.stringify({ id: input().id, status }),
    });
  assert.equal((await route.PATCH(request())).status, 403);
  assert.equal(writes, 0);
  permissions = ["leads.view", "leads.edit"];
  assert.equal((await route.PATCH(request("Contacted", "https://foreign.test"))).status, 403);
  assert.equal((await route.PATCH(request("Invalid"))).status, 400);
  assert.equal((await route.PATCH(request())).status, 200);
  assert.equal(nextPayload.name, original.name);
  assert.equal(nextPayload.socialAds, original.socialAds);
  assert.equal(nextPayload.status, "Contacted");
  race = true;
  assert.equal((await route.PATCH(request())).status, 409);
});
