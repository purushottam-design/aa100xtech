const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

function guard(result) {
  const states = [];
  let cursor = 0,
    effect,
    eventHandler,
    pathname = "/admin";
  const GuestPagePreview = () => null;
  const { ProtectedRoute } = load("src/components/protected-route.tsx", {
    react: {
      useState(initial) {
        const slot = cursor++;
        if (!(slot in states)) states[slot] = initial;
        return [
          states[slot],
          (value) => {
            states[slot] = typeof value === "function" ? value(states[slot]) : value;
          },
        ];
      },
      useEffect(callback) {
        effect = callback;
      },
    },
    "next/navigation": { usePathname: () => pathname },
    "@/components/guest-page-preview": { GuestPagePreview },
    "@/integrations/supabase/client": {
      supabase: {
        auth: {
          getUser: async () => result,
          onAuthStateChange(callback) {
            eventHandler = callback;
            return { data: { subscription: { unsubscribe() {} } } };
          },
        },
      },
    },
  });
  return {
    GuestPagePreview,
    render() {
      cursor = 0;
      return ProtectedRoute({ children: "PRIVATE CONTENT" });
    },
    start() {
      return effect();
    },
    event(name, session) {
      eventHandler(name, session);
    },
    navigate(path) {
      pathname = path;
    },
    states,
  };
}

test("guest sees only preview, and sign-in events require fresh verification", async () => {
  const view = guard({ data: { user: null }, error: null });
  assert.equal(view.render().props.role, "status");
  const cleanup = view.start();
  await new Promise(setImmediate);
  assert.equal(view.render().type, view.GuestPagePreview);
  const before = view.states[1];
  view.event("INITIAL_SESSION", { user: { id: "member" } });
  assert.equal(view.states[1], before);
  view.event("SIGNED_IN", { user: { id: "member" } });
  assert.equal(view.render().props.role, "status");
  cleanup();
});

test("verified session renders children; navigation and logout hide them immediately", async () => {
  const view = guard({ data: { user: { id: "member" } }, error: null });
  view.render();
  const cleanup = view.start();
  await new Promise(setImmediate);
  assert.equal(view.render().props.children, "PRIVATE CONTENT");
  view.navigate("/dashboard");
  assert.equal(view.render().props.role, "status");
  cleanup();
  const cleanupNextPage = view.start();
  view.event("SIGNED_OUT", null);
  assert.equal(view.render().type, view.GuestPagePreview);
  cleanupNextPage();
});

test("backend failure shows retry instead of rendering protected children", async () => {
  const view = guard({ data: { user: null }, error: { status: 503 } });
  view.render();
  const cleanup = view.start();
  await new Promise(setImmediate);
  assert.equal(view.render().props.role, "alert");
  cleanup();
});

test("a pending session response cannot restore access after logout", async () => {
  const view = guard({ data: { user: { id: "previous-user" } }, error: null });
  view.render();
  const cleanup = view.start();
  view.event("SIGNED_OUT", null);
  await new Promise(setImmediate);
  assert.equal(view.render().type, view.GuestPagePreview);
  cleanup();
});
