const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

test("HR notification uses the approved destination and idempotency key without changing saved status", async () => {
  let created = true,
    providerOk = true,
    databaseError = null;
  const sent = [],
    states = [];
  const db = {
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        remove: async () => ({ error: null }),
      }),
    },
    rpc: async () => ({ data: databaseError ? null : created, error: databaseError }),
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
    form.set(
      "attachment",
      new File(["%PDF-1.4\nTest resume\n%%EOF"], "applicant-resume.pdf", {
        type: "application/pdf",
      }),
    );
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
  assert.equal(sent[0].body.reply_to, input.email);
  assert.deepEqual(sent[0].body.attachments, [
    {
      filename: "resume.pdf",
      content: Buffer.from("%PDF-1.4\nTest resume\n%%EOF").toString("base64"),
    },
  ]);
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
  const sentBeforeFailure = sent.length;
  databaseError = { code: "PGRST205" };
  assert.equal((await saveWebsiteRequest(request())).status, 503);
  assert.equal(
    sent.length,
    sentBeforeFailure,
    "No email is sent when saving the application fails",
  );
  databaseError = null;
  const { saveWebsiteRequest: withoutEmailConfiguration } = load(
    "src/lib/website-requests.server.ts",
    { "@/integrations/supabase/client.server": { supabaseAdmin: db } },
    {
      File,
      FormData,
      process: { env: { NODE_ENV: "production" } },
      fetch: async () => {
        throw new Error("Must not call email provider without configuration");
      },
    },
  );
  assert.deepEqual(await (await withoutEmailConfiguration(request())).json(), {
    saved: true,
    notification: "not_configured",
  });
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
  assert.equal(result.phone, "");
  assert.equal(result.phoneHref, "");
  assert.equal(JSON.stringify(result).includes("fixture-"), false);
});
