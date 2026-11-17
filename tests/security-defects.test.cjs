const assert = require("node:assert/strict");
const { test } = require("node:test");
const sharp = require("sharp");
const load = require("./helpers/load-server.cjs");
const id = "00000000-0000-4000-8000-000000000010";
const owner = "00000000-0000-4000-8000-000000000001";
const input = {
  id,
  fullName: "Test Customer",
  email: "test@example.test",
  phone: "+910000000000",
  company: "",
  category: "Authentication",
  title: "A test login issue",
  description: "A synthetic report with reproduction steps for testing.",
  priority: "High",
};
class AccessError extends Error {
  constructor(message, status = 403) {
    super(message);
    this.status = status;
  }
}
function fixture() {
  const state = {
    uploads: [],
    removed: [],
    rpc: [],
    queries: [],
    previous: null,
    lookup: null,
    rows: [],
    canReview: false,
    canManage: false,
    fail: null,
    unauthenticated: false,
  };
  const query = (client) => {
    const log = { client, filters: [] };
    state.queries.push(log);
    const chain = {
      select() {
        return chain;
      },
      update(data) {
        log.update = data;
        return chain;
      },
      eq(key, value) {
        log.filters.push([key, value]);
        return chain;
      },
      ilike(key, value) {
        log.filters.push([key, value]);
        return chain;
      },
      order() {
        return chain;
      },
      range() {
        return chain;
      },
      maybeSingle: async () => ({
        data: client === "admin" ? state.previous : state.lookup,
        error: null,
      }),
      then(resolve, reject) {
        return Promise.resolve({ data: state.rows, count: state.rows.length, error: null }).then(
          resolve,
          reject,
        );
      },
    };
    return chain;
  };
  const admin = {
    from: () => query("admin"),
    rpc: async (name, args) => {
      state.rpc.push({ name, args });
      return {
        data: state.fail ? null : { id, ticket_number: 1, status: "Open", created: true },
        error: state.fail,
      };
    },
    storage: {
      from: (bucket) => ({
        upload: async (path, bytes, options) => {
          state.uploads.push({ bucket, path, bytes, options });
          return { error: null };
        },
        remove: async (paths) => {
          state.removed.push(...paths);
          return { error: null };
        },
        download: async () => ({ data: new Blob(["synthetic attachment"]), error: null }),
      }),
    },
  };
  const session = { userId: owner, supabase: { from: () => query("customer") } };
  let context;
  const api = load(
    "src/lib/security-defects.server.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: admin },
      "@/integrations/supabase/auth-middleware": {
        requireSupabaseAuth: async () => {
          if (state.unauthenticated) {
            context.status = 401;
            throw new Error("Expired session");
          }
          return session;
        },
      },
      "@/lib/backend/request-context.server": {
        runWithRequestContext: (request, callback) => {
          context = { status: 200 };
          return callback(context);
        },
      },
      "@/lib/rbac.server": {
        AccessError,
        authorize: async (_user, permission) => {
          if (!state.canReview || (permission === "support.reply" && !state.canManage))
            throw new AccessError("Access denied.");
          return {
            isSuper: false,
            permissions: state.canManage ? ["support.view", "support.reply"] : ["support.view"],
          };
        },
      },
      "@/lib/website-requests.server": {
        validWebsiteOrigin: (request) =>
          request.headers.get("origin") === "https://aa100xtech.com" &&
          request.headers.get("x-aa-rpc") === "1",
      },
    },
    { File, FormData, Blob },
  );
  return { api, state, session };
}
function formRequest(data = input, file) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  if (file) form.set("attachment", file);
  return new Request("https://aa100xtech.com/api/security-defects", {
    method: "POST",
    headers: {
      origin: "https://aa100xtech.com",
      "x-aa-rpc": "1",
      authorization: "Bearer synthetic.token.value",
    },
    body: form,
  });
}

test("security endpoints deny expired sessions and cross-site writes before data access", async () => {
  const { api, state } = fixture();
  state.unauthenticated = true;
  const request = new Request("https://aa100xtech.com/api/security-defects");
  assert.equal(
    (await api.securityDefectRequest(request, () => api.listSecurityDefects(request, {}))).status,
    401,
  );
  assert.equal(
    (
      await api.securityDefectRequest(new Request(request.url, { method: "POST" }), () => {
        throw new Error("Should not run");
      })
    ).status,
    403,
  );
  assert.equal(state.queries.length, 0);
});
test("customers query only their own tickets and cannot use the team queue or status updates", async () => {
  const { api, state, session } = fixture();
  const request = new Request(
    "https://aa100xtech.com/api/security-defects?q=SID-000001&status=Open",
  );
  assert.equal((await api.listSecurityDefects(request, session)).status, 200);
  assert.equal(state.queries[0].client, "customer");
  assert.ok(state.queries[0].filters.some(([key, value]) => key === "user_id" && value === owner));
  assert.ok(
    state.queries[0].filters.some(([key, value]) => key === "ticket_number" && value === 1),
  );
  await assert.rejects(
    api.listSecurityDefects(new Request(request.url + "&scope=team"), session),
    (error) => error.status === 403,
  );
  await assert.rejects(
    api.updateSecurityDefect(
      new Request(request.url, {
        method: "PATCH",
        body: JSON.stringify({ id, status: "Resolved", previousStatus: "Open" }),
      }),
      session,
    ),
    (error) => error.status === 403,
  );
  await assert.rejects(
    api.downloadSecurityAttachment(id, session),
    (error) => error.status === 404,
  );
  assert.equal(state.uploads.length, 0);
});
test("reviewers need both support permissions to update and stale updates cannot overwrite status", async () => {
  const { api, state, session } = fixture();
  state.canReview = true;
  const request = () =>
    new Request("https://aa100xtech.com/api/security-defects", {
      method: "PATCH",
      body: JSON.stringify({ id, status: "Resolved", previousStatus: "Open" }),
    });
  await assert.rejects(
    api.updateSecurityDefect(request(), session),
    (error) => error.status === 403,
  );
  state.canManage = true;
  await assert.rejects(
    api.updateSecurityDefect(request(), session),
    (error) => error.status === 409,
  );
  const update = state.queries.find((query) => query.update);
  assert.ok(update.filters.some(([key, value]) => key === "status" && value === "Open"));
  assert.equal(update.update.updated_by, owner);
});
test("report validation rejects malformed fields, unsupported and disguised attachments without writes", async () => {
  const { api, state, session } = fixture();
  for (const invalid of [
    { ...input, email: "invalid" },
    { ...input, title: "x" },
    { ...input, phone: "letters" },
    { ...input, priority: "Urgent" },
    { ...input, status: "Resolved" },
  ])
    await assert.rejects(api.createSecurityDefect(formRequest(invalid), session));
  for (const file of [
    new File(["<script>bad</script>"], "fake.png", { type: "image/png" }),
    new File(["not a PDF"], "fake.pdf", { type: "application/pdf" }),
    new File(["<svg/>"], "file.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" }),
  ])
    await assert.rejects(api.createSecurityDefect(formRequest(input, file), session));
  assert.equal(state.rpc.length, 0);
  assert.equal(state.uploads.length, 0);
});
test("valid attachments are re-encoded into private storage and retries return the original ticket", async () => {
  const { api, state, session } = fixture();
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } })
    .png()
    .toBuffer();
  const file = new File([png], "private-screenshot.png", { type: "image/png" });
  const response = await api.createSecurityDefect(formRequest(input, file), session);
  assert.equal(response.status, 201);
  assert.equal(state.uploads[0].bucket, "security-defect-attachments");
  assert.ok(state.uploads[0].path.startsWith(`security/${owner}/${id}/`));
  assert.equal((await sharp(state.uploads[0].bytes).metadata()).format, "webp");
  assert.equal(state.uploads[0].path.includes("private-screenshot"), false);
  const args = state.rpc[0].args;
  assert.equal(args.p_user_id, owner);
  state.previous = {
    id,
    user_id: owner,
    payload_hash: args.p_hash,
    ticket_number: 1,
    status: "Open",
    created_at: new Date().toISOString(),
  };
  assert.equal((await api.createSecurityDefect(formRequest(input, file), session)).status, 200);
  assert.equal(state.uploads.length, 1);
  assert.equal(state.rpc.length, 1);
  await assert.rejects(
    api.createSecurityDefect(formRequest({ ...input, title: "Changed title" }, file), session),
    (error) => error.status === 409,
  );
});
test("attachment downloads require a permitted row and enforce the ticket's storage prefix", async () => {
  const { api, state, session } = fixture();
  state.lookup = {
    id,
    user_id: owner,
    ticket_number: 1,
    attachment_path: `security/${owner}/${id}/${"a".repeat(64)}.pdf`,
  };
  const response = await api.downloadSecurityAttachment(id, session);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("content-disposition"), /^attachment;/);
  state.lookup.attachment_path = "other-user/private.pdf";
  await assert.rejects(
    api.downloadSecurityAttachment(id, session),
    (error) => error.status === 404,
  );
});

test("streamed bodies are bounded even when Content-Length is missing", async () => {
  const { api, state, session } = fixture();
  const oversized = new Request("https://aa100xtech.com/api/security-defects", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=test" },
    body: new Uint8Array(5 * 1024 * 1024 + 65537),
  });
  await assert.rejects(
    api.createSecurityDefect(oversized, session),
    (error) => error.status === 413,
  );
  assert.equal(state.queries.length, 0);
  state.canReview = true;
  state.canManage = true;
  await assert.rejects(
    api.updateSecurityDefect(
      new Request(oversized.url, { method: "PATCH", body: "x".repeat(1025) }),
      session,
    ),
    (error) => error.status === 413,
  );
});

test("authorized reviewers use the support queue, while unconfirmed saves never delete evidence", async () => {
  const { api, state, session } = fixture();
  state.canReview = true;
  await api.listSecurityDefects(
    new Request("https://aa100xtech.com/api/security-defects?scope=team"),
    session,
  );
  assert.equal(state.queries[0].client, "admin");
  assert.equal(
    state.queries[0].filters.some(([key]) => key === "user_id"),
    false,
  );
  const file = new File(["%PDF-1.7\nSynthetic test attachment\n%%EOF"], "report.pdf", {
    type: "application/pdf",
  });
  state.fail = { code: "FETCH_ERROR" };
  await assert.rejects(api.createSecurityDefect(formRequest(input, file), session));
  assert.equal(state.uploads.length, 1);
  assert.equal(state.removed.length, 0);
  state.fail = { code: "P0001" };
  await assert.rejects(
    api.createSecurityDefect(formRequest(input, file), session),
    (error) => error.status === 429,
  );
  assert.equal(state.removed.length, 1);
});
