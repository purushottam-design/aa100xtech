const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

test("HR notification uses the approved destination and idempotency key without changing saved status", async () => {
  let created = true,
    providerOk = true;
  const sent = [],
    states = [];
  const db = {
    rpc: async () => ({ data: created, error: null }),
    from: () => ({
      update: (value) => ({
        eq: async () => {
          states.push(value.notification_status);
          return { error: null };
        },
      }),
    }),
  };
  const { saveWebsiteRequest } = load(
    "src/lib/website-requests.server.ts",
    { "@/integrations/supabase/client.server": { supabaseAdmin: db } },
    {
      File,
      FormData,
      process: {
        env: {
          NODE_ENV: "production",
          RESEND_API_KEY: "fixture-private-provider-key",
          NOTIFICATION_FROM_EMAIL: "verified@example.test",
        },
      },
      fetch: async (url, options) => {
        sent.push({ url, headers: options.headers, body: JSON.parse(options.body) });
        return new Response("{}", { status: providerOk ? 200 : 503 });
      },
    },
  );
  const input = {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "career",
    name: "Test Applicant",
    email: "applicant@example.test",
    phone: "+910000000000",
    role: "Developer",
    requirements: "A synthetic job application",
    startedAt: Date.now() - 5000,
  };
  const request = () => {
    const form = new FormData();
    form.set("data", JSON.stringify(input));
    return new Request("https://aa100xtech.com/api/website/requests", {
      method: "POST",
      headers: { origin: "https://aa100xtech.com", "x-aa-rpc": "1" },
      body: form,
    });
  };
  assert.deepEqual(await (await saveWebsiteRequest(request())).json(), {
    saved: true,
    notification: "sent",
  });
  assert.deepEqual(sent[0].body.to, ["hr@aa100xtech.com"]);
  assert.equal(sent[0].headers["Idempotency-Key"], input.id);
  assert.equal(sent[0].url, "https://api.resend.com/emails");
  created = false;
  await saveWebsiteRequest(request());
  assert.equal(sent.length, 1, "A duplicate never sends a second notification");
  created = true;
  providerOk = false;
  assert.deepEqual(await (await saveWebsiteRequest(request())).json(), {
    saved: true,
    notification: "failed",
  });
  assert.equal(states.at(-1), "failed");
});

test("public settings expose only approved fields and cannot override official hours or inject links", async () => {
  const values = {
    siteName: "Approved Company",
    supportEmail: "public@example.test",
    phone: "javascript:alert(1)",
    hours: "All night",
    smtpPassword: "fixture-never-public",
    serviceRoleKey: "fixture-private-key",
  };
  const query = {
    select() {
      return query;
    },
    eq() {
      return query;
    },
    abortSignal() {
      return query;
    },
    maybeSingle: async () => ({ data: { value: values }, error: null }),
  };
  const { publicSiteSettings } = load("src/lib/public-site.server.ts", {
    "@/integrations/supabase/client.server": { supabaseAdmin: { from: () => query } },
  });
  const result = await publicSiteSettings();
  assert.equal(result.name, "Approved Company");
  assert.equal(result.email, "public@example.test");
  assert.equal(result.hours, "11:00 AM – 5:00 PM");
  assert.ok(result.phoneHref.startsWith("tel:"));
  assert.equal(JSON.stringify(result).includes("fixture-"), false);
});
