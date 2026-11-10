const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

function metadataFixture() {
  const entries = new Map();
  const reads = [];
  const invalidations = [];
  const limits = [];
  let result = {
    data: { title: "Published title", subtitle: "Published description", image_url: "/logo.png" },
    error: null,
  };
  const query = {
    select(value) {
      reads.push(["select", value]);
      return query;
    },
    eq(key, value) {
      reads.push([key, value]);
      return query;
    },
    not(...args) {
      reads.push(args);
      return query;
    },
    order() {
      return query;
    },
    limit() {
      return query;
    },
    abortSignal(signal) {
      limits.push(signal.timeout);
      return query;
    },
    async maybeSingle() {
      return result;
    },
  };
  let policy;
  const api = load(
    "src/lib/cms-metadata.server.ts",
    {
      "next/cache": {
        unstable_cache(fn, _key, options) {
          policy = options;
          return (...args) => {
            const key = JSON.stringify(args);
            if (!entries.has(key)) entries.set(key, fn(...args));
            return entries.get(key);
          };
        },
        revalidateTag(tag, options) {
          invalidations.push([tag, options]);
          entries.clear();
        },
      },
      "@/integrations/supabase/client.server": { supabaseAdmin: { from: () => query } },
    },
    { AbortSignal: { timeout: (timeout) => ({ timeout }) } },
  );
  return {
    api,
    reads,
    limits,
    invalidations,
    policy,
    setResult: (next) => {
      result = next;
    },
  };
}

test("public SEO reads are reused between navigations, isolated by page and invalidated after publication", async () => {
  const state = metadataFixture();
  const fallback = {
    title: "Fallback",
    description: "Default description",
    alternates: { canonical: "https://aa100xtech.com/contact" },
  };
  const first = await state.api.cmsPageMetadata("contact", fallback);
  assert.equal(first.title, "Published title");
  assert.equal(first.alternates.canonical, fallback.alternates.canonical);
  assert.equal(first.openGraph.images[0], "/logo.png");
  await state.api.cmsPageMetadata("contact", fallback);
  assert.equal(
    state.limits.length,
    1,
    "A repeat navigation must not wait for a second database read",
  );
  await state.api.cmsPageMetadata("home", fallback);
  assert.equal(state.limits.length, 2);
  assert.deepEqual(state.limits, [1500, 1500]);
  assert.ok(state.reads.some(([key, value]) => key === "active" && value === true));
  assert.ok(
    state.reads.some((row) => row[0] === "published_at" && row[1] === "is" && row[2] === null),
  );
  assert.equal(state.policy.revalidate, 60);
  state.api.invalidateCmsPageMetadata();
  assert.equal(state.invalidations[0][0], state.policy.tags[0]);
  assert.equal(state.invalidations[0][1].expire, 0);
  state.setResult({
    data: { title: "Updated title", subtitle: null, image_url: null },
    error: null,
  });
  assert.equal((await state.api.cmsPageMetadata("contact", fallback)).title, "Updated title");
  assert.equal(state.limits.length, 3);
});

test("an unavailable optional CMS keeps each page's own metadata and does not repeat its slow lookup", async () => {
  const state = metadataFixture();
  state.setResult({ data: null, error: { message: "Unavailable" } });
  const first = { title: "Contact", description: "Contact description" };
  const second = { title: "Contact alternative", description: "Alternative description" };
  assert.equal(await state.api.cmsPageMetadata("contact", first), first);
  assert.equal(await state.api.cmsPageMetadata("contact", second), second);
  assert.equal(state.limits.length, 1);
});

test("CMS writes invalidate public metadata only after a successful authorized database change", async () => {
  const invalidations = [];
  let allowed = true;
  let failure = false;
  const query = {
    select() {
      return query;
    },
    eq() {
      return query;
    },
    update() {
      return query;
    },
    insert() {
      return query;
    },
    delete() {
      return query;
    },
    async single() {
      return {
        data: failure ? null : { id: "saved" },
        error: failure ? { message: "Failed" } : null,
      };
    },
    async maybeSingle() {
      return { data: { active: true, email: "admin@example.invalid" }, error: null };
    },
    then(resolve) {
      return Promise.resolve({ error: failure ? { message: "Failed" } : null }).then(resolve);
    },
  };
  const api = load("src/lib/backend/handlers/super-admin-plus.ts", {
    "@/lib/backend/server": {
      createServerFn() {
        const builder = {
          middleware: () => builder,
          inputValidator: () => builder,
          handler: (fn) => fn,
        };
        return builder;
      },
    },
    "@/integrations/supabase/auth-middleware": { requireSupabaseAuth: () => undefined },
    "@/lib/rbac.server": {
      resolveAccess: async () => ({
        status: allowed ? "active" : "suspended",
        isSuper: true,
        roles: [],
        permissions: [],
      }),
    },
    "@/integrations/supabase/client.server": { supabaseAdmin: { from: () => query } },
    "@/lib/backend/request-context.server": {
      setResponseStatus() {},
      getRequestHeader: () => null,
    },
    "@/lib/cms-metadata.server": { invalidateCmsPageMetadata: () => invalidations.push(true) },
  });
  const context = { userId: "verified-admin" };
  const data = {
    title: "Updated SEO",
    slug: "contact",
    blockType: "section",
    placement: "seo-contact",
    active: true,
  };
  await api.saveContentBlock({ data, context });
  await api.deleteContentBlock({ data: { id: "saved" }, context });
  assert.equal(invalidations.length, 2);
  failure = true;
  await assert.rejects(api.saveContentBlock({ data, context }));
  await assert.rejects(api.deleteContentBlock({ data: { id: "saved" }, context }));
  allowed = false;
  await assert.rejects(api.saveContentBlock({ data, context }));
  assert.equal(invalidations.length, 2);
});
