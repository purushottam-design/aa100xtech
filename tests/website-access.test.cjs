const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
test("private inquiry records and resume downloads follow lead and candidate permissions", async () => {
  let permissions = [],
    reads = 0;
  const filters = [];
  const query = {
    select() {
      return query;
    },
    in(column, values) {
      filters.push([column, Array.from(values)]);
      return query;
    },
    order() {
      return query;
    },
    limit: async () => ({ data: [], error: null }),
  };
  const route = load("src/app/api/website/requests/route.ts", {
    "@/lib/website-requests.server": {},
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        auth: { getUser: async () => ({ data: { user: { id: "verified" } }, error: null }) },
      },
    },
    "@/lib/website-database.server": {
      websiteAdmin: {
        from() {
          reads++;
          return query;
        },
      },
    },
    "@/lib/rbac.server": { authorize: async () => ({ isSuper: false, permissions }) },
  });
  const request = (path = "", auth = true) =>
    new Request("https://aa100xtech.com/api/website/requests" + path, {
      headers: auth ? { authorization: "Bearer fixture-user-token" } : {},
    });
  assert.equal((await route.GET(request("", false))).status, 401);
  permissions = ["content.view"];
  assert.equal((await route.GET(request())).status, 403);
  assert.equal(reads, 0);
  permissions = ["candidates.view"];
  assert.equal((await route.GET(request())).status, 200);
  assert.deepEqual(filters.at(-1), ["kind", ["career"]]);
  permissions = ["leads.view"];
  assert.equal((await route.GET(request())).status, 200);
  assert.deepEqual(filters.at(-1), ["kind", ["proposal", "influencer", "contact"]]);
  const before = reads;
  assert.equal(
    (await route.GET(request("?attachment=00000000-0000-4000-8000-000000000001"))).status,
    403,
  );
  assert.equal(reads, before);
});
