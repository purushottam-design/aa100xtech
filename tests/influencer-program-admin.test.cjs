const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const context = load("src/lib/backend/request-context.server.ts");
const profileId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000099";

function harness({ signedIn = true, permitted = true, duplicate = false } = {}) {
  const reads = [],
    writes = [];
  class AccessError extends Error {}
  const api = load("src/app/api/influencers/program/route.ts", {
    "@/lib/backend/request-context.server": context,
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => {
        if (!signedIn) {
          context.setResponseStatus(401);
          throw new Error("Unauthorized");
        }
        return { userId };
      },
    },
    "@/lib/rbac.server": {
      AccessError,
      authorize: async (_id, permission) => {
        assert.ok(["partners.review", "partners.view"].includes(permission));
        if (!permitted) throw new AccessError("Denied");
      },
    },
    "@/lib/influencer-database.server": {
      influencerAdmin: {
        from(table) {
          reads.push(table);
          const query = {
            select() {
              return query;
            },
            eq() {
              return query;
            },
            order() {
              return query;
            },
            limit() {
              return query;
            },
            maybeSingle: async () => ({
              data:
                table === "influencer_profiles"
                  ? { id: profileId, application_id: profileId }
                  : null,
              error: null,
            }),
            single: async () => ({
              data: { email: "private@example.test", phone: "+910000000000" },
              error: null,
            }),
            upsert: async (payload) => {
              writes.push({ table, payload });
              return {
                error: duplicate ? { code: "23505", details: "private-client-reference" } : null,
              };
            },
            then(resolve, reject) {
              return Promise.resolve({ data: [], error: null }).then(resolve, reject);
            },
          };
          return query;
        },
      },
    },
  });
  const request = (input) =>
    new Request(`https://uat.example.test/api/influencers/program?profileId=${profileId}`, {
      method: "POST",
      headers: {
        origin: "https://uat.example.test",
        "x-aa-rpc": "1",
        "content-type": "application/json",
      },
      body: JSON.stringify(input),
    });
  return { api, reads, writes, post: (input) => api.POST(request(input)) };
}
const referral = (patch) => ({
  action: "referral",
  profileId,
  clientReference: "CRM-CLIENT-001",
  evidenceReference: "verified-order-001",
  status: "converted",
  confirmationReviewed: true,
  ...patch,
});

test("program administration denies anonymous and non-reviewer callers before database access", async () => {
  for (const [options, status] of [
    [{ signedIn: false }, 401],
    [{ permitted: false }, 403],
  ]) {
    const h = harness(options);
    assert.equal((await h.post(referral())).status, status);
    assert.equal(h.reads.length, 0);
    assert.equal(h.writes.length, 0);
  }
  const h = harness();
  const forbidden = await h.api.POST(
    new Request("https://uat.example.test/api/influencers/program", { method: "POST", body: "{}" }),
  );
  assert.equal(forbidden.status, 403);
  assert.equal(h.reads.length, 0);
});

test("converted clients require explicit evidence review and server-owned reviewer identity", async () => {
  for (const patch of [{ confirmationReviewed: false }, { evidenceReference: "" }]) {
    const h = harness();
    assert.equal((await h.post(referral(patch))).status, 400);
    assert.equal(h.writes.length, 0);
  }
  const h = harness();
  assert.equal(
    (await h.post(referral({ confirmed_by: "forged", convertedClients: 9000 }))).status,
    200,
  );
  const row = h.writes[0].payload;
  assert.equal(row.confirmed_by, userId);
  assert.equal(row.updated_by, userId);
  assert.equal(row.client_reference, "crm-client-001");
  assert.ok(Number.isFinite(Date.parse(row.confirmed_at)));
  assert.equal("convertedClients" in row, false);
  const duplicate = harness({ duplicate: true });
  const response = await duplicate.post(referral());
  assert.equal(response.status, 409);
  assert.equal(JSON.stringify(await response.json()).includes("private-client-reference"), false);
});

test("stories require explicit publication consent and cannot leak private contact details", async () => {
  const story = {
    action: "testimonial",
    profileId,
    quote: "An exact partner-approved quotation for this test.",
    publicationStatus: "published",
    consentConfirmed: true,
  };
  for (const patch of [
    { consentConfirmed: false },
    { quote: "Please call me at +910000000000 about this collaboration." },
    { quote: "Please email private@example.test for more information." },
  ]) {
    const h = harness();
    assert.equal((await h.post({ ...story, ...patch })).status, 400);
    assert.equal(h.writes.length, 0);
  }
  const h = harness();
  assert.equal((await h.post(story)).status, 200);
  assert.equal(h.writes[0].payload.approved_by, userId);
  assert.equal(h.writes[0].payload.consent_confirmed, true);
});
