const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
test("campaign view, write, export and kit downloads enforce independent existing permissions before touching data", async () => {
  let permissions = [],
    user = true,
    state,
    reads = 0,
    writes = 0,
    downloads = 0;
  class AccessError extends Error {}
  const inquiry = {
    id: "00000000-0000-4000-8000-000000000001",
    created_at: "2026-11-05",
    status: "New",
    notes: "internal",
    data: {
      company: "=FORMULA()",
      contact_name: "Contact",
      email: "private@example.test",
      phone: "+919876543210",
      platforms: ["Instagram"],
      promotions: ["Product Reviews"],
      budget: "Not Decided",
      category: "Technology",
    },
  };
  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    range: async () => ({ data: [inquiry], error: null }),
    single: async () => ({ data: { id: inquiry.id }, error: null }),
    update: () => {
      writes++;
      return query;
    },
  };
  const mocks = {
    "@/lib/backend/request-context.server": {
      runWithRequestContext: async (_, fn) => {
        state = { status: 200 };
        return fn(state);
      },
    },
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => {
        if (!user) {
          state.status = 401;
          throw new Error("Unauthenticated");
        }
        return { userId: "verified-user" };
      },
    },
    "@/lib/rbac.server": {
      AccessError,
      authorize: async (_, permission) => {
        if (!permissions.includes(permission)) throw new AccessError("Forbidden");
      },
    },
    "@/lib/marketing-intake.server": {
      marketingAdmin: {
        from: () => {
          reads++;
          return query;
        },
      },
      kitBucket: "influencer-media-kits",
    },
    "@/lib/website-requests.server": {
      validWebsiteOrigin: (r) => r.headers.get("origin") === "https://example.test",
    },
    "@/lib/influencer-database.server": {
      influencerAdmin: {
        from: () => {
          reads++;
          return query;
        },
      },
    },
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        storage: {
          from: () => {
            downloads++;
            return {};
          },
        },
      },
    },
  };
  const route = load("src/app/api/marketing/admin/route.ts", mocks, { File, FormData });
  const request = (suffix = "") => new Request("https://example.test/api/marketing/admin" + suffix);
  user = false;
  assert.equal((await route.GET(request())).status, 401);
  user = true;
  assert.equal((await route.GET(request())).status, 403);
  assert.equal(reads, 0);
  permissions = ["leads.view"];
  assert.equal((await route.GET(request())).status, 200);
  const previous = reads;
  assert.equal((await route.GET(request("?export=csv"))).status, 403);
  assert.equal(reads, previous);
  const update = (origin = "https://example.test", status = "Contacted") => {
    const body = new FormData();
    body.set("data", JSON.stringify({ id: inquiry.id, status, notes: "Follow up" }));
    return route.POST(
      new Request("https://example.test/api/marketing/admin", {
        method: "POST",
        headers: { origin, "x-aa-rpc": "1" },
        body,
      }),
    );
  };
  assert.equal((await update()).status, 403);
  assert.equal(writes, 0);
  permissions.push("leads.edit");
  assert.equal((await update("https://evil.test")).status, 403);
  assert.equal(writes, 0);
  assert.equal((await update("https://example.test", "Invalid status")).status, 400);
  assert.equal(writes, 0);
  assert.equal((await update()).status, 200);
  assert.equal(writes, 1);
  permissions.push("leads.export");
  const csv = await route.GET(request("?export=csv"));
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /'=FORMULA\(\)/);
  const kit = load("src/app/api/marketing/media-kit/[id]/route.ts", mocks, { File, FormData });
  const before = reads;
  assert.equal(
    (await kit.GET(request(), { params: Promise.resolve({ id: inquiry.id }) })).status,
    403,
  );
  assert.equal(reads, before);
  assert.equal(downloads, 0);
});
