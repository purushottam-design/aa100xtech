const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function navigation(pathname = "/") {
  const calls = [];
  const exports = {};
  const source = fs.readFileSync("src/lib/navigation.tsx", "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    exports,
    URLSearchParams,
    require: (name) => {
      if (name === "react/jsx-runtime") return require(name);
      if (name === "react") return { forwardRef: (render) => render, useCallback: (fn) => fn };
      if (name === "next/link") return { default: "NextLink" };
      if (name === "next/navigation") {
        return {
          usePathname: () => pathname,
          useRouter: () => ({
            push: (href) => calls.push(["push", href]),
            replace: (href) => calls.push(["replace", href]),
          }),
        };
      }
      throw new Error("Unexpected import: " + name);
    },
  });
  return { ...exports, calls };
}

test("existing dynamic service and query destinations retain URL encoding", () => {
  const { navigationHref } = navigation();
  assert.equal(
    navigationHref({
      to: "/services/$slug",
      params: { slug: "mobile apps" },
      search: { opportunity: "paid-promotion", plan: "Growth & Pro", omitted: undefined },
      hash: "pricing",
    }),
    "/services/mobile%20apps?opportunity=paid-promotion&plan=Growth+%26+Pro#pricing",
  );
  assert.equal(
    navigationHref({ to: "/admin/super", search: { section: "overview" } }),
    "/admin/super?section=overview",
  );
});

test("Next navigation preserves replace and push behavior", () => {
  const api = navigation();
  const navigate = api.useNavigate();
  navigate({ to: "/dashboard", replace: true });
  navigate({ to: "/partners/apply", search: { plan: "growth" } });
  assert.deepEqual(api.calls, [
    ["replace", "/dashboard"],
    ["push", "/partners/apply?plan=growth"],
  ]);
});

test("active links preserve classes, anchor props, and Radix forwarded ref", () => {
  const api = navigation("/services/website-development");
  const ref = {};
  const link = api.Link(
    {
      to: "/services",
      className: "navigation-link",
      activeProps: { className: "text-foreground bg-secondary" },
      "aria-label": "Services",
      children: "Services",
    },
    ref,
  );
  assert.equal(link.props.href, "/services");
  assert.equal(link.props.className, "navigation-link text-foreground bg-secondary");
  assert.equal(link.props["aria-current"], "page");
  assert.equal(link.props["aria-label"], "Services");
  assert.equal(link.props.ref, ref);
  const exact = api.Link({
    to: "/",
    activeOptions: { exact: true },
    activeProps: { className: "active" },
  });
  assert.equal(exact.props["data-status"], "inactive");
});

test("active link matching observes path segment boundaries", () => {
  const api = navigation("/services-other");
  const link = api.Link({ to: "/services", activeProps: { className: "active" } });
  assert.equal(link.props["data-status"], "inactive");
  assert.equal(
    api.useRouterState({ select: (state) => state.location.pathname }),
    "/services-other",
  );
});

function worker() {
  const handlers = {};
  const cacheWrites = [];
  const entries = new Map();
  let offline = false;
  vm.runInNewContext(fs.readFileSync("public/sw.js", "utf8"), {
    self: {
      location: { origin: "https://aa100xtech.com" },
      addEventListener: (event, fn) => {
        handlers[event] = fn;
      },
    },
    URL,
    Response,
    fetch: async (request) => {
      if (offline) throw new TypeError("Network unavailable");
      const stylesheet = new URL(request.url).pathname.endsWith(".css");
      const script = new URL(request.url).pathname.endsWith(".js");
      return new Response(
        stylesheet ? "body{color:white}" : script ? "console.log('app');" : "<html></html>",
        {
          headers: {
            "content-type": stylesheet
              ? "text/css"
              : script
                ? "application/javascript"
                : "text/html",
          },
        },
      );
    },
    caches: {
      open: async () => ({
        put: (request, response) => {
          cacheWrites.push(request.url);
          entries.set(request.url, response);
        },
      }),
      match: async (request) =>
        entries
          .get(typeof request === "string" ? "https://aa100xtech.com" + request : request.url)
          ?.clone(),
    },
  });
  return {
    handlers,
    cacheWrites,
    setOffline: () => {
      offline = true;
    },
  };
}

test("service worker bypasses Next RSC, nonstatic framework, and API traffic", () => {
  const { handlers } = worker();
  for (const [path, headers] of [
    ["/_next/image?url=%2Flogo.png&w=256&q=75", {}],
    ["/_next/webpack-hmr", {}],
    ["/api/rpc/getMyAccount", {}],
    ["/app/home?_rsc=token", {}],
    ["/app/home", { RSC: "1" }],
    ["/app/home", { "Next-Router-Prefetch": "1" }],
    ["/_next/static/chunk.js", { RSC: "1" }],
  ]) {
    let intercepted = false;
    handlers.fetch({
      request: new Request("https://aa100xtech.com" + path, { headers }),
      respondWith: () => {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false, path);
  }
});

test("service worker retains Next static JS and CSS for offline reloads", async () => {
  const { handlers, cacheWrites, setOffline } = worker();
  const paths = ["/_next/static/chunks/app-a1b2.js", "/_next/static/css/styles-a1b2.css"];
  async function request(path) {
    let response;
    handlers.fetch({
      request: new Request("https://aa100xtech.com" + path),
      respondWith: (pending) => {
        response = pending;
      },
    });
    assert.ok(response, "Static framework assets must be intercepted for offline caching");
    return response;
  }
  for (const path of paths) assert.equal((await request(path)).status, 200);
  await Promise.resolve();
  assert.equal(cacheWrites.length, 2);
  setOffline();
  for (const path of paths) {
    const response = await request(path);
    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type"),
      path.endsWith(".css") ? "text/css" : "application/javascript",
    );
    assert.equal(
      await response.text(),
      path.endsWith(".css") ? "body{color:white}" : "console.log('app');",
    );
  }
  assert.equal(cacheWrites.length, 2, "Offline responses are served from the original asset cache");
});

test("service worker serves website HTML", async () => {
  const { handlers, cacheWrites } = worker();
  let response;
  handlers.fetch({
    request: new Request("https://aa100xtech.com/"),
    respondWith: (pending) => {
      response = pending;
    },
  });
  assert.equal((await response).status, 200);
  await Promise.resolve();
  assert.deepEqual(cacheWrites, ["https://aa100xtech.com/"]);
});
