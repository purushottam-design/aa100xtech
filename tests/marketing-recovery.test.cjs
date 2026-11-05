const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { diagnoseMarketing } = require("../scripts/diagnose-marketing-intake.cjs");

test("marketing failures identify the correct repair without exposing internal details to form visitors", async () => {
  for (const environment of ["development", "production"]) {
    const logs = [];
    const { marketingRequestError } = load(
      "src/lib/marketing-errors.server.ts",
      {
        "@/integrations/supabase/client.server": { supabaseAdmin: {} },
      },
      {
        process: { env: { NODE_ENV: environment } },
        console: { error: (message) => logs.push(message) },
      },
    );
    for (const code of ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"]) {
      const response = marketingRequestError({
        code,
        message: "sensitive-database-url",
        details: "private applicant",
      });
      assert.equal(response.status, 503);
      assert.equal(response.headers.get("cache-control"), "no-store");
      const body = await response.json();
      assert.equal(body.code, "MARKETING_SCHEMA_MISSING");
      assert.match(body.error, /couldn’t save your submission/);
      assert.doesNotMatch(
        JSON.stringify(body),
        /supabase|\.sql|sensitive|private applicant|influencer/i,
      );
      assert.match(logs.at(-1), /20261105143000_marketing_intake_recovery\.sql/);
      assert.doesNotMatch(
        logs.at(-1),
        /restore_influencer_applications|sensitive|private applicant/,
      );
    }
    assert.equal(
      (await marketingRequestError({ code: "42501" }).json()).code,
      "MARKETING_DATABASE_PERMISSION",
    );
  }
});

test("read-only marketing diagnostics detect a missing migration even with a working influencer backend", async () => {
  const calls = [];
  const results = await diagnoseMarketing({
    env: {
      SUPABASE_URL: "https://example.test",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-server-key",
    },
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      const path = new URL(url).pathname;
      if (path === "/rest/v1/")
        return Response.json({
          paths: { "/partner_applications": {}, "/rpc/take_influencer_submission_slot": {} },
        });
      return Response.json({ code: "PGRST205" }, { status: 404 });
    },
  });
  assert.equal(results.find((r) => r.check === "Influencer applications").ready, true);
  for (const check of [
    "Campaign inquiries",
    "Submission receipts",
    "Marketing submission function",
    "Campaign columns and server grants",
    "Private media-kit storage",
  ])
    assert.equal(results.find((r) => r.check === check).ready, false);
  assert.ok(calls.every((c) => !c.init.method && !c.init.body));
  assert.ok(calls.some((c) => c.url.includes("limit=0")));
  assert.ok(calls.every((c) => !c.url.includes("/rpc/") && !c.url.includes("/object/")));
  assert.doesNotMatch(JSON.stringify(results), /synthetic-server-key|example\.test/);
});

test("marketing readiness needs actual campaign columns and a private size-limited media-kit bucket", async () => {
  let columnsReady = true,
    privateBucket = true;
  const options = {
    env: {
      SUPABASE_URL: "https://example.test",
      SUPABASE_SERVICE_ROLE_KEY: "synthetic-server-key",
    },
    fetchImpl: async (url) => {
      const path = new URL(url).pathname;
      if (path === "/rest/v1/")
        return Response.json({
          paths: Object.fromEntries(
            [
              "/partner_applications",
              "/brand_campaign_inquiries",
              "/marketing_intake_receipts",
              "/rpc/take_influencer_submission_slot",
              "/rpc/save_marketing_intake",
            ].map((p) => [p, {}]),
          ),
        });
      if (path.startsWith("/storage/"))
        return Response.json({ public: !privateBucket, file_size_limit: 5242880 });
      return columnsReady ? Response.json([]) : Response.json({ code: "42703" }, { status: 400 });
    },
  };
  assert.ok((await diagnoseMarketing(options)).every((r) => r.ready));
  columnsReady = false;
  assert.equal(
    (await diagnoseMarketing(options)).find((r) => r.check === "Campaign columns and server grants")
      .ready,
    false,
  );
  privateBucket = false;
  assert.equal(
    (await diagnoseMarketing(options)).find((r) => r.check === "Private media-kit storage").ready,
    false,
  );
  assert.equal((await diagnoseMarketing({ env: {} }))[0].ready, false);
});
