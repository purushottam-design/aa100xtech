const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
test("career uploads reject disguised files, stay private and clean up confirmed save failures", async () => {
  const uploads = [],
    removed = [];
  let writes = 0,
    fail = false;
  const db = {
    storage: {
      from: (bucket) => ({
        upload: async (path) => {
          uploads.push({ bucket, path });
          return { error: null };
        },
        remove: async (paths) => {
          removed.push(...paths);
          return { error: null };
        },
      }),
    },
    rpc: async () => {
      writes++;
      return { data: true, error: fail ? { code: "PGRST205" } : null };
    },
    from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }),
  };
  const { saveWebsiteRequest } = load(
    "src/lib/website-requests.server.ts",
    { "@/integrations/supabase/client.server": { supabaseAdmin: db } },
    { File, FormData, process: { env: { NODE_ENV: "production" } } },
  );
  const input = {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "career",
    name: "Test Applicant",
    email: "test@example.test",
    phone: "+910000000000",
    role: "Developer",
    requirements: "A synthetic job application",
    startedAt: Date.now() - 5000,
  };
  const request = (file) => {
    const form = new FormData();
    form.set("data", JSON.stringify(input));
    form.set("attachment", file);
    return new Request("https://aa100xtech.com/api/website/requests", {
      method: "POST",
      headers: { origin: "https://aa100xtech.com", "x-aa-rpc": "1" },
      body: form,
    });
  };
  for (const file of [
    new File(["<html>malicious</html>"], "resume.pdf", { type: "application/pdf" }),
    new File(["%PDF-1.7\n%%EOF"], "resume.html", { type: "text/html" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" }),
  ])
    assert.equal((await saveWebsiteRequest(request(file))).status, 400);
  assert.equal(writes, 0);
  assert.equal(uploads.length, 0);
  const pdf = new File(["%PDF-1.7\nSynthetic test only\n%%EOF"], "resume.pdf", {
    type: "application/pdf",
  });
  assert.equal((await (await saveWebsiteRequest(request(pdf))).json()).saved, true);
  assert.equal(uploads[0].bucket, "website-resumes");
  assert.ok(uploads[0].path.startsWith(`website/${input.id}/`));
  assert.equal(uploads[0].path.includes("resume"), false);
  fail = true;
  assert.equal((await saveWebsiteRequest(request(pdf))).status, 503);
  assert.equal(removed.length, 1);
});
