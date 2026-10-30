const assert = require("node:assert/strict");
const { test } = require("node:test");
const { diagnoseInfluencers } = require("../scripts/diagnose-influencers.cjs");

const env = {
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
  SUPABASE_SERVICE_ROLE_KEY: "synthetic-server-key",
};

test("restricted public REST metadata cannot misclassify a valid publishable key", async () => {
  const results = await diagnoseInfluencers({
    env,
    fetchImpl: async (input, init) => {
      const url = new URL(input);
      if (init.headers.apikey === env.SUPABASE_PUBLISHABLE_KEY) {
        assert.equal(init.headers.Authorization, undefined);
        if (url.pathname === "/auth/v1/settings") return Response.json({});
        if (url.pathname === "/rest/v1/") return Response.json({}, { status: 401 });
        assert.equal(url.searchParams.get("limit"), "0");
        return Response.json({ code: "PGRST205" }, { status: 404 });
      }
      assert.equal(init.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
      if (url.pathname === "/rest/v1/")
        return Response.json({
          paths: { "/partner_applications": {}, "/rpc/take_influencer_submission_slot": {} },
        });
      assert.equal(url.searchParams.get("limit"), "0");
      return Response.json([]);
    },
  });
  assert.equal(results.find((result) => result.check === "Public database credential").ready, true);
  const schema = results.find((result) => result.check === "Public influencer profiles");
  assert.equal(schema.ready, false);
  assert.equal(schema.databaseCode, "PGRST205");
});

test("a rejected public key is still reported as unavailable without returning API details", async () => {
  const results = await diagnoseInfluencers({
    env,
    fetchImpl: async () =>
      Response.json({ message: "Invalid API key private-response-value" }, { status: 401 }),
  });
  const credential = results.find((result) => result.check === "Public database credential");
  assert.equal(credential.ready, false);
  assert.equal(credential.status, 401);
  assert.doesNotMatch(JSON.stringify(results), /private-response-value|synthetic-server-key/);
});
