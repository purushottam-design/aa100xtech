const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(relativePath, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name === "server-only") return {};
      return name in mocks ? mocks[name] : require(name);
    },
    Request,
    Response,
    Headers,
    URL,
    Error,
    SyntaxError,
    Object,
    JSON,
    process,
    ...globals,
  });
  return exports;
}

const context = load("src/lib/backend/request-context.server.ts");
const { createServerFn } = load("src/lib/backend/server.ts");
const { handleRpc } = load("src/lib/backend/transport.server.ts", {
  "./request-context.server": context,
});

function request(method = "POST", data, headers = {}) {
  return new Request("https://preview.example.com/api/rpc/test/run", {
    method,
    headers: { "x-aa-rpc": "1", "content-type": "application/json", ...headers },
    ...(method === "POST" ? { body: JSON.stringify({ data }) } : {}),
  });
}

test("RPC allowlist, HTTP methods and cross-site request protection", async () => {
  let calls = 0;
  const handler = createServerFn({ method: "POST" }).handler(async () => ++calls);
  const registry = { "test/run": handler };
  assert.equal((await handleRpc(request(), "__proto__", registry)).status, 404);
  assert.equal((await handleRpc(request("GET"), "test/run", registry)).status, 405);
  assert.equal(
    (
      await handleRpc(
        request("POST", {}, { origin: "https://attacker.example" }),
        "test/run",
        registry,
      )
    ).status,
    403,
  );
  assert.equal(
    (await handleRpc(request("POST", {}, { "sec-fetch-site": "cross-site" }), "test/run", registry))
      .status,
    403,
  );
  assert.equal(
    (await handleRpc(request("POST", {}, { "x-aa-rpc": "" }), "test/run", registry)).status,
    403,
  );
  assert.equal(calls, 0);
  const result = await handleRpc(
    request("POST", {}, { origin: "https://preview.example.com" }),
    "test/run",
    registry,
  );
  assert.equal(result.status, 200);
  assert.equal((await result.json()).data, 1);
});

test("Zod validation and malformed JSON reject before the handler", async () => {
  let calls = 0;
  const { z } = require("zod");
  const handler = createServerFn({ method: "POST" })
    .inputValidator((input) => z.object({ amount: z.number().positive() }).parse(input))
    .handler(async ({ data }) => {
      calls++;
      return data.amount;
    });
  const registry = { "test/run": handler };
  const invalid = await handleRpc(request("POST", { amount: -1 }), "test/run", registry);
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.name, "ZodError");
  const malformed = new Request("https://preview.example.com/api/rpc/test/run", {
    method: "POST",
    headers: { "x-aa-rpc": "1", "content-type": "application/json" },
    body: "{",
  });
  assert.equal((await handleRpc(malformed, "test/run", registry)).status, 400);
  assert.equal(calls, 0);
  const valid = await handleRpc(request("POST", { amount: 42 }), "test/run", registry);
  assert.equal((await valid.json()).data, 42);
});

test("request context isolates concurrent users and forwards status/cookies", async () => {
  const handler = createServerFn({ method: "GET" }).handler(async () => {
    const actor = context.getRequestHeader("authorization");
    await Promise.resolve();
    context.setResponseHeader(
      "set-cookie",
      `aa_2fa=${actor}; Path=/; HttpOnly; SameSite=Lax; Secure`,
    );
    context.setResponseStatus(201);
    return actor;
  });
  const responses = await Promise.all(
    ["one", "two"].map((actor) =>
      handleRpc(request("GET", undefined, { authorization: actor }), "test/run", {
        "test/run": handler,
      }),
    ),
  );
  for (const [index, actor] of ["one", "two"].entries()) {
    assert.equal(responses[index].status, 201);
    assert.match(responses[index].headers.get("set-cookie"), new RegExp(`aa_2fa=${actor};`));
    assert.equal((await responses[index].json()).data, actor);
  }
});

test("protected handlers validate bearer claims before business logic", async () => {
  let sdkCalls = 0;
  let handlerCalls = 0;
  const auth = load(
    "src/integrations/supabase/auth-middleware.ts",
    {
      "@/lib/backend/request-context.server": context,
      "@supabase/supabase-js": {
        createClient: () => ({
          auth: {
            getClaims: async (token) => {
              sdkCalls++;
              return token === "valid.signed.jwt"
                ? { data: { claims: { sub: "real-user" } }, error: null }
                : { data: null, error: new Error("bad signature") };
            },
          },
        }),
      },
    },
    {
      process: {
        env: {
          SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        },
      },
    },
  );
  const handler = createServerFn({ method: "POST" })
    .middleware([auth.requireSupabaseAuth])
    .handler(async ({ context: user }) => {
      handlerCalls++;
      return user.userId;
    });
  const registry = { "test/run": handler };
  for (const authorization of ["", "Basic value", "Bearer invalid", "Bearer forged.signed.jwt"]) {
    const response = await handleRpc(request("POST", {}, { authorization }), "test/run", registry);
    assert.equal(response.status, 401);
    assert.match((await response.json()).error.message, /^Unauthorized:/);
  }
  assert.equal(handlerCalls, 0);
  assert.equal(sdkCalls, 1);
  const response = await handleRpc(
    request("POST", {}, { authorization: "Bearer valid.signed.jwt" }),
    "test/run",
    registry,
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data, "real-user");
  assert.equal(handlerCalls, 1);
});

test("all 106 typed entrypoints are explicitly registered", () => {
  const registrySource = fs.readFileSync(
    path.join(__dirname, "../src/lib/backend/registry.server.ts"),
    "utf8",
  );
  const registered = [...registrySource.matchAll(/^  "([^"]+)":/gm)].map((match) => match[1]);
  const stubs = fs
    .readdirSync(path.join(__dirname, "../src/lib"))
    .filter((file) => file.endsWith(".functions.ts"))
    .flatMap((file) =>
      [
        ...fs
          .readFileSync(path.join(__dirname, "../src/lib", file), "utf8")
          .matchAll(/>\(\s*"([^"]+)",\s*"(?:GET|POST)"\s*,?\s*\)/g),
      ].map((match) => match[1]),
    );
  assert.equal(registered.length, 106);
  assert.deepEqual(registered.sort(), stubs.sort());
});

test("public API preflight uses an empty 204 response body", () => {
  const { jsonResponse } = load("src/lib/affiliate.server.ts");
  const response = jsonResponse(null, 204);
  assert.equal(response.status, 204);
  assert.equal(response.body, null);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});
