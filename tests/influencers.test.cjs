const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const sharp = require("sharp");

function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const source = fs.readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  });
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => (name === "server-only" ? {} : name in mocks ? mocks[name] : require(name)),
    Request,
    Response,
    Headers,
    AbortSignal,
    URL,
    Buffer,
    File,
    FormData,
    console,
    process: { env: { SUPABASE_SERVICE_ROLE_KEY: "test-only-secret" } },
    ...globals,
  });
  return exports;
}
const schema = load("src/lib/influencers.ts");
const { createServerFn } = load("src/lib/backend/server.ts");
const id = "00000000-0000-4000-8000-000000000001";
const validApplication = () => ({
  full_name: "Test Applicant",
  display_name: "Test Creator",
  email: "test@example.com",
  phone: "+910000000000",
  city: "Test City",
  state: "Test State",
  country: "India",
  biography: "Synthetic creator biography used only in automated tests.",
  category: "Technology",
  specialization: "Testing",
  audience_location: "India",
  socials: {
    instagram: "https://instagram.com/test",
    instagram_followers: 123,
    youtube: "",
    facebook: "",
    other: [],
  },
  interest: "both",
  deliverables: "A series of approved educational videos",
  expected_terms: "Scope and fees to be agreed in writing",
  processing_consent: true,
  publication_consent: true,
});
const appData = () => schema.influencerApplicationSchema.parse(validApplication());

function publicReadHarness({ env, pages = [], lookup, fetchImpl = fetch } = {}) {
  const warnings = [];
  const queries = [];
  let options;
  let pageIndex = 0;
  const query = {
    abortSignal(signal) {
      assert.ok(signal instanceof AbortSignal);
      return query;
    },
    select(columns) {
      queries.push(["select", columns]);
      return query;
    },
    eq(...args) {
      queries.push(["eq", ...args]);
      return query;
    },
    order(...args) {
      queries.push(["order", ...args]);
      return query;
    },
    range(start, end) {
      queries.push(["range", start, end]);
      const result = pages[pageIndex++] ?? { data: [], error: null };
      return result instanceof Error ? Promise.reject(result) : Promise.resolve(result);
    },
    maybeSingle: async () => lookup ?? { data: null, error: null },
  };
  const api = load(
    "src/lib/influencers.server.ts",
    {
      "next/cache": { unstable_noStore() {} },
      "@supabase/supabase-js": {
        createClient: (_url, _key, config) => {
          options = config;
          return {
            from(table) {
              assert.equal(table, "influencer_profiles");
              return query;
            },
          };
        },
      },
    },
    {
      process: {
        env: env ?? {
          SUPABASE_URL: "https://example.supabase.co",
          SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        },
      },
      console: {
        warn: (...args) => warnings.push(args.join(" ")),
        error() {
          assert.fail("Expected database failures must not emit console.error");
        },
      },
      fetch: fetchImpl,
    },
  );
  return {
    api,
    warnings,
    queries,
    get options() {
      return options;
    },
  };
}

test("public reads preserve publication filters, stable pagination, and genuine empty results", async () => {
  const firstPage = Array.from({ length: 200 }, (_, i) => ({ id: String(i) }));
  const h = publicReadHarness({
    pages: [
      { data: firstPage, error: null },
      { data: [{ id: "last" }], error: null },
    ],
  });
  const result = await h.api.listPublishedInfluencers();
  assert.equal(result.unavailable, false);
  assert.equal(result.profiles.length, 201);
  assert.equal(result.profiles[200].id, "last");
  assert.deepEqual(
    h.queries.filter(([kind]) => kind === "range"),
    [
      ["range", 0, 199],
      ["range", 200, 399],
    ],
  );
  assert.deepEqual(
    h.queries.filter(([kind]) => kind === "eq"),
    Array(2).fill(["eq", "publication_status", "published"]),
  );
  assert.deepEqual(
    h.queries.filter(([kind]) => kind === "order"),
    [
      ["order", "display_name"],
      ["order", "id"],
      ["order", "display_name"],
      ["order", "id"],
    ],
  );
  const empty = await h.api.listPublishedInfluencers();
  assert.equal(empty.unavailable, false);
  assert.equal(empty.profiles.length, 0);
  assert.equal(h.warnings.length, 0);
});

test("plain Supabase errors give safe actionable warnings, discard partial data, and recover", async () => {
  const error = { code: "PGRST205", message: "sensitive-value", details: "sensitive-value" };
  const h = publicReadHarness({
    pages: [
      { data: Array(200).fill({ id: "partial" }), error: null },
      { data: null, error },
      { data: null, error },
      { data: [{ id: "recovered" }], error: null },
    ],
  });
  const failed = await h.api.listPublishedInfluencers();
  assert.equal(failed.unavailable, true);
  assert.equal(failed.profiles.length, 0);
  assert.equal((await h.api.listPublishedInfluencers()).unavailable, true);
  assert.equal(h.warnings.length, 1, "Repeated outages do not spam the development console");
  assert.match(h.warnings[0], /schema.*20261026090000_influencer_partnership.sql/);
  assert.doesNotMatch(h.warnings[0], /sensitive-value/);
  assert.equal((await h.api.listPublishedInfluencers()).profiles[0].id, "recovered");
});

test("configuration, permission, credential, TLS and timeout failures remain recoverable", async () => {
  const cases = [
    [{ code: "42703" }, /schema/],
    [{ code: "42501" }, /permissions/],
    [{ message: "Invalid API key sensitive-value" }, /credentials/],
    [
      {
        message: "TypeError: fetch failed",
        details: "UNABLE_TO_VERIFY_LEAF_SIGNATURE sensitive-value",
      },
      /tls/,
    ],
    [{ message: "TimeoutError: timed out" }, /timeout/],
    [new Error("sensitive-value"), /connection/],
  ];
  for (const [error, expected] of cases) {
    const h = publicReadHarness({
      pages: [error instanceof Error ? error : { data: null, error }],
    });
    assert.equal((await h.api.listPublishedInfluencers()).unavailable, true);
    assert.match(h.warnings[0], expected);
    assert.doesNotMatch(h.warnings[0], /sensitive-value/);
  }
  const missing = publicReadHarness({ env: {} });
  assert.equal((await missing.api.listPublishedInfluencers()).unavailable, true);
  assert.match(missing.warnings[0], /configuration.*SUPABASE_URL/);
});

test("public requests retain apikey and user JWT headers, avoid caching and enforce a deadline", async () => {
  let received;
  const h = publicReadHarness({
    fetchImpl: async (input, init) => {
      received = { input, init };
      return new Response("[]");
    },
  });
  h.api.publicInfluencerClient();
  const outgoing = h.options.global.fetch;
  const cancellation = new AbortController();
  const request = new Request("https://example.supabase.co/rest/v1/influencer_profiles", {
    headers: { "x-test": "preserved" },
  });
  await outgoing(request, {
    headers: { Authorization: "Bearer sb_publishable_test" },
    signal: cancellation.signal,
  });
  assert.equal(received.init.headers.get("apikey"), "sb_publishable_test");
  assert.equal(received.init.headers.has("Authorization"), false);
  assert.equal(received.init.headers.get("x-test"), "preserved");
  assert.equal(received.init.cache, "no-store");
  cancellation.abort();
  assert.equal(received.init.signal.aborted, true);
  await outgoing(request, { headers: { Authorization: "Bearer signed-user-jwt" } });
  assert.equal(received.init.headers.get("Authorization"), "Bearer signed-user-jwt");
  assert.ok(received.init.signal instanceof AbortSignal);
  const legacy = publicReadHarness({
    env: {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "legacy-anon-jwt",
    },
    fetchImpl: async (_input, init) => {
      received = { init };
      return new Response("[]");
    },
  });
  legacy.api.publicInfluencerClient();
  await legacy.options.global.fetch(request, {
    headers: { Authorization: "Bearer legacy-anon-jwt" },
  });
  assert.equal(received.init.headers.get("Authorization"), "Bearer legacy-anon-jwt");
});

test("profile reads distinguish missing profiles from database failures without exposing SDK details", async () => {
  const missing = publicReadHarness();
  assert.equal(await missing.api.getPublishedInfluencer("missing"), null);
  assert.ok(
    missing.queries.some(
      (entry) => entry[0] === "eq" && entry[1] === "slug" && entry[2] === "missing",
    ),
  );
  const failed = publicReadHarness({
    lookup: { data: null, error: { code: "42501", message: "sensitive-value" } },
  });
  await assert.rejects(failed.api.getPublishedInfluencer("existing"), (error) => {
    assert.ok(error instanceof failed.api.InfluencerDirectoryUnavailableError);
    assert.doesNotMatch(error.message, /sensitive-value/);
    return true;
  });
  const published = publicReadHarness({ lookup: { data: { slug: "published" }, error: null } });
  assert.equal((await published.api.getPublishedInfluencer("published")).slug, "published");
});

test("homepage and profile render an availability state without throwing or replacing missing profiles", async () => {
  const failed = publicReadHarness({ env: {} });
  const featured = load("src/components/featured-influencers.tsx", {
    "next/link": "Link",
    "@/lib/influencers.server": failed.api,
    "@/components/influencer-directory": { InfluencerCard: "InfluencerCard" },
  });
  assert.match(JSON.stringify(await featured.FeaturedInfluencers()), /temporarily unavailable/);
  const empty = load("src/components/featured-influencers.tsx", {
    "next/link": "Link",
    "@/lib/influencers.server": publicReadHarness().api,
    "@/components/influencer-directory": { InfluencerCard: "InfluencerCard" },
  });
  assert.equal(await empty.FeaturedInfluencers(), null);
  const profilePage = (api) =>
    load("src/app/influencers/[slug]/page.tsx", {
      "next/link": "Link",
      "@/lib/influencers.server": api,
      "@/lib/influencers": schema,
      "@/components/influencer-share": { InfluencerShare: "InfluencerShare" },
      "@/components/ui/button": { Button: "Button" },
      "next/navigation": {
        notFound() {
          throw new Error("test-not-found");
        },
      },
    });
  const params = Promise.resolve({ slug: "existing" });
  assert.match(
    JSON.stringify(await profilePage(failed.api).default({ params })),
    /temporarily unavailable/,
  );
  await assert.rejects(profilePage(publicReadHarness().api).default({ params }), /test-not-found/);
});

test("application validation requires separate consent, social profiles and safe URLs", () => {
  assert.equal(schema.influencerApplicationSchema.safeParse(validApplication()).success, true);
  for (const patch of [
    { processing_consent: false },
    { publication_consent: false },
    { website: "spam" },
    { category: "Invalid" },
    { socials: { instagram: "https://instagram.com.attacker.example/profile" } },
    { socials: {} },
    { portfolio_url: "javascript:alert(1)" },
    { socials: { instagram: "https://instagram.com/test", instagram_followers: -1 } },
  ])
    assert.equal(
      schema.influencerApplicationSchema.safeParse({ ...validApplication(), ...patch }).success,
      false,
      JSON.stringify(patch),
    );
  assert.equal(schema.youtubeEmbed("https://evil.example/watch?v=abcdefghijk"), null);
  assert.equal(
    schema.youtubeEmbed("https://youtube.com/watch?v=abcdefghijk"),
    "https://www.youtube-nocookie.com/embed/abcdefghijk",
  );
});

function adminHarness({ permitted = true, signedIn = true, consent = true } = {}) {
  let row = {
    id,
    full_name: "Test Applicant",
    email: "test@example.com",
    is_influencer: true,
    status: "pending",
    influencer_review_status: "pending",
    publication_consent: consent,
    processing_consent: true,
    influencer_data: { ...appData(), profile_image: null, cover_image: null, gallery: [] },
  };
  let profile = null;
  const writes = [];
  let responseStatus = 200;
  const db = {
    from(table) {
      let action = "select",
        payload,
        columns = "";
      const q = {
        select(value) {
          columns = value;
          return q;
        },
        eq() {
          return q;
        },
        or() {
          return q;
        },
        order() {
          return q;
        },
        limit() {
          return q;
        },
        range() {
          return q;
        },
        update(value) {
          action = "update";
          payload = value;
          return q;
        },
        upsert(value) {
          action = "upsert";
          payload = value;
          return q;
        },
        single: async () => ({ data: row, error: null }),
        maybeSingle: async () => ({
          data: table === "influencer_profiles" ? profile : row,
          error: null,
        }),
        then(resolve) {
          if (action !== "select") {
            writes.push({ table, action, payload });
            if (table === "partner_applications") row = { ...row, ...payload };
            else profile = { id: "profile", ...profile, ...payload };
          }
          return Promise.resolve({
            data:
              action === "select"
                ? [
                    {
                      ...row,
                      ...(columns.includes("influencer_profiles")
                        ? { influencer_profiles: profile }
                        : {}),
                    },
                  ]
                : null,
            error: null,
          }).then(resolve);
        },
      };
      return q;
    },
  };
  class AccessError extends Error {
    status = 403;
  }
  const api = load("src/lib/backend/handlers/influencers.ts", {
    "@/lib/backend/server": { createServerFn },
    "@/lib/backend/request-context.server": {
      setResponseStatus: (status) => {
        responseStatus = status;
      },
    },
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => {
        if (!signedIn) throw new Error("Unauthorized");
        return { userId: "admin" };
      },
    },
    "@/lib/influencer-database.server": { influencerAdmin: db },
    "@/lib/rbac.server": {
      AccessError,
      authorize: async () => {
        if (!permitted) throw new AccessError("Forbidden");
      },
    },
    "@/lib/influencers": schema,
  });
  const save = (patch = {}) =>
    api.saveInfluencer({
      data: {
        applicationId: id,
        status: "approved",
        profile: null,
        review_note: "",
        information_request: "",
        partnership_type: "website",
        collaboration_progress: "",
        revokeConsent: false,
        ...patch,
      },
    });
  return {
    api,
    save,
    get row() {
      return row;
    },
    get profile() {
      return profile;
    },
    writes,
    get responseStatus() {
      return responseStatus;
    },
  };
}
test("admin authorization denies anonymous and unprivileged callers before reads or writes", async () => {
  for (const config of [{ signedIn: false }, { permitted: false }]) {
    const h = adminHarness(config);
    await assert.rejects(h.save(), /Unauthorized|Forbidden/);
    await assert.rejects(h.api.listInfluencerApplications(), /Unauthorized|Forbidden/);
    assert.equal(h.writes.length, 0);
  }
});
test("approval creates a draft; explicit approval and consent confirmation are required to publish", async () => {
  const h = adminHarness();
  await h.save();
  assert.equal(h.row.status, "approved");
  assert.equal(h.profile.publication_status, "draft");
  assert.equal(h.profile.consent_confirmed, false);
  assert.equal("email" in h.profile, false);
  assert.equal("expected_terms" in h.profile, false);
  assert.equal("phone" in h.profile, false);
  await assert.rejects(
    h.save({ profile: { ...h.profile, publication_status: "published" } }),
    /Publication requires/,
  );
  await h.save({
    profile: { ...h.profile, publication_status: "published", consent_confirmed: true },
  });
  assert.equal(h.profile.publication_status, "published");
  const list = await h.api.listInfluencerApplications();
  assert.equal(
    list[0].profile.slug,
    h.profile.slug,
    "One-to-one Supabase joins return a profile object",
  );
  await h.save({ profile: h.profile, revokeConsent: true });
  assert.equal(h.row.publication_consent, false);
  assert.equal(h.profile.publication_status, "unpublished");
  assert.equal(h.profile.consent_confirmed, false);
});
test("missing consent blocks publication; rejection unpublishes; media cannot cross applications", async () => {
  const h = adminHarness({ consent: false });
  await h.save();
  await assert.rejects(
    h.save({ profile: { ...h.profile, publication_status: "published", consent_confirmed: true } }),
    /Publication requires/,
  );
  const h2 = adminHarness();
  await h2.save();
  await h2.save({
    profile: { ...h2.profile, publication_status: "published", consent_confirmed: true },
  });
  await h2.save({ status: "rejected", profile: h2.profile });
  assert.equal(h2.profile.publication_status, "unpublished");
  await assert.rejects(
    h2.save({
      profile: {
        ...h2.profile,
        profile_image:
          "00000000-0000-4000-8000-000000000002/00000000-0000-4000-8000-000000000003.webp",
      },
    }),
    /Images must belong/,
  );
});

test("publishing rejects private contact details accidentally copied into public text", async () => {
  const h = adminHarness();
  await h.save();
  await assert.rejects(
    h.save({
      profile: {
        ...h.profile,
        publication_status: "published",
        consent_confirmed: true,
        biography: "Please contact my private address test@example.com about this collaboration.",
      },
    }),
    /private email or phone/,
  );
});

test("directory search and category, platform and city/state filters combine without fabricated records", () => {
  const defaults = schema.profileSchema.parse({
    ...appData(),
    slug: "test-alpha",
    publication_status: "published",
    consent_confirmed: true,
    featured: false,
  });
  const profiles = [
    { ...defaults, id: "a", display_name: "Alpha Creator", city: "Delhi", state: "Delhi" },
    {
      ...defaults,
      id: "b",
      display_name: "Beta Creator",
      city: "Mumbai",
      state: "Maharashtra",
      category: "Lifestyle",
      socials: {
        ...defaults.socials,
        instagram: "",
        youtube: "https://youtube.com/@beta",
        other: ["https://example.test/beta"],
      },
    },
  ];
  function cards(values) {
    let index = 0;
    const ui = load("src/components/influencer-directory.tsx", {
      react: { useState: () => [values[index++] ?? "", () => {}] },
      "@/lib/influencers": schema,
      "@/components/ui/input": { Input: "Input" },
      "@/components/ui/button": { Button: "Button" },
    });
    const tree = ui.InfluencerDirectory({ profiles });
    const walk = (node) =>
      !node || typeof node !== "object"
        ? []
        : Array.isArray(node)
          ? node.flatMap(walk)
          : [
              ...(node.type === ui.InfluencerCard ? [node.props.profile.id] : []),
              ...walk(node.props?.children),
            ];
    return walk(tree);
  }
  assert.deepEqual(cards(["alpha", "instagram", "Delhi, Delhi", "Technology"]), ["a"]);
  assert.deepEqual(cards(["", "youtube", "Mumbai, Maharashtra", "Lifestyle"]), ["b"]);
  assert.deepEqual(cards(["", "other", "", ""]), ["b"]);
  assert.deepEqual(cards(["missing", "", "", ""]), []);
});

test("uploads decode and re-encode valid images, strip metadata and reject disguised files", async () => {
  const uploads = [];
  const upload = load("src/lib/influencer-upload.server.ts", {
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        storage: {
          from: () => ({
            upload: async (path, bytes, options) => {
              uploads.push({ path, bytes, options });
              return { error: null };
            },
          }),
        },
      },
    },
    "./influencers": schema,
  });
  const bytes = await sharp({
    create: { width: 80, height: 80, channels: 3, background: "orange" },
  })
    .jpeg()
    .withMetadata()
    .toBuffer();
  await upload.storeInfluencerImage(new File([bytes], "photo.jpg", { type: "image/jpeg" }), id);
  const output = await sharp(uploads[0].bytes).metadata();
  assert.equal(output.format, "webp");
  assert.equal(output.exif, undefined);
  assert.equal(uploads[0].options.upsert, false);
  await assert.rejects(
    upload.storeInfluencerImage(
      new File(["<svg onload='evil()'/>"], "fake.jpg", { type: "image/jpeg" }),
      id,
    ),
    /could not be decoded/,
  );
  await assert.rejects(
    upload.storeInfluencerImage(new File(["svg"], "x.svg", { type: "image/svg+xml" }), id),
    /Images must be/,
  );
  await assert.rejects(
    upload.boundedFormData(
      new Request("https://example.com", {
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=x",
          "content-length": String(schema.maxUploadBytes + 1),
        },
        body: "x",
      }),
    ),
    /18 MB/,
  );
  assert.throws(
    () =>
      upload.assertInfluencerOrigin(
        new Request("https://example.com", {
          headers: { "x-aa-rpc": "1", origin: "https://attacker.example" },
        }),
      ),
    /Cross-site/,
  );
});

test("application endpoint saves pending private submissions and reports database failures without success", async () => {
  let saved,
    fail = false;
  const route = load("src/app/api/influencers/apply/route.ts", {
    "@/integrations/supabase/client.server": { supabaseAdmin: {} },
    "@/lib/influencer-database.server": {
      influencerAdmin: {
        rpc: async () => ({ data: true, error: null }),
        from: () => ({
          insert: async (row) => {
            saved = row;
            return { error: fail ? new Error("DB unavailable") : null };
          },
        }),
      },
    },
    "@/lib/influencers": schema,
    "@/lib/influencer-upload.server": {
      assertInfluencerOrigin() {},
      boundedFormData: (request) => request.formData(),
      storeInfluencerImage() {
        throw new Error("Unexpected upload");
      },
      InfluencerRequestError: Error,
      requestError: () => Response.json({ error: "Could not save" }, { status: 503 }),
    },
  });
  const request = () => {
    const fd = new FormData();
    fd.set("application", JSON.stringify(validApplication()));
    return new Request("https://example.com/api/influencers/apply", { method: "POST", body: fd });
  };
  assert.equal((await route.POST(request())).status, 201);
  assert.equal(saved.status, "pending");
  assert.equal(saved.influencer_review_status, "pending");
  assert.equal(saved.publication_consent, true);
  assert.equal(saved.is_influencer, true);
  assert.equal(saved.influencer_data.expected_terms, validApplication().expected_terms);
  fail = true;
  assert.equal((await route.POST(request())).status, 503);
});

test("public media checks current RLS-visible profile and never serves unreferenced assets", async () => {
  let visible = false,
    downloads = 0;
  const path = `${id}/00000000-0000-4000-8000-000000000003.webp`;
  const q = {
    select() {
      return q;
    },
    eq() {
      return q;
    },
    maybeSingle: async () => ({
      data: visible ? { profile_image: path, cover_image: null, gallery: [] } : null,
      error: null,
    }),
  };
  const route = load(
    "src/app/api/influencers/media/[...path]/route.ts",
    {
      "@/lib/influencers": schema,
      "@/lib/influencers.server": { publicInfluencerClient: () => ({ from: () => q }) },
      "@/integrations/supabase/client.server": {
        supabaseAdmin: {
          storage: {
            from: () => ({
              download: async () => {
                downloads++;
                return { data: new Blob(["image"]), error: null };
              },
            }),
          },
        },
      },
      "@/integrations/supabase/auth-middleware": {},
      "@/lib/backend/request-context.server": {},
      "@/lib/rbac.server": {},
    },
    { Blob },
  );
  const get = () =>
    route.GET(new Request(`https://example.com/api/influencers/media/${path}`), {
      params: Promise.resolve({ path: path.split("/") }),
    });
  assert.equal((await get()).status, 404);
  assert.equal(downloads, 0);
  visible = true;
  const response = await get();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  visible = false;
  assert.equal((await get()).status, 404);
  assert.equal(downloads, 1);
});
