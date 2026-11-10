const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

function harness(result, throws = false) {
  let writes = 0;
  const context = load("src/lib/backend/request-context.server.ts");
  const api = load("src/lib/backend/handlers/accounts.ts", {
    "@/lib/backend/request-context.server": context,
    "@/lib/admin-env.server": { isReservedAdminEmail: () => false },
    "@/integrations/supabase/auth-middleware": { requireSupabaseAuth: async () => ({}) },
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        auth: {
          admin: {
            async createUser() {
              if (throws) throw result;
              return { data: null, error: result };
            },
          },
        },
        from() {
          writes++;
          throw new Error("Must not write after failed authentication");
        },
      },
    },
  });
  const { handleRpc } = load("src/lib/backend/transport.server.ts", {
    "@/lib/backend/request-context.server": context,
  });
  return {
    writes: () => writes,
    request: () =>
      handleRpc(
        new Request("http://localhost/api/rpc/accounts/signUpAccount", {
          method: "POST",
          headers: { "content-type": "application/json", "x-aa-rpc": "1" },
          body: JSON.stringify({
            data: {
              fullName: "Signup Fixture",
              email: "fixture@example.test",
              phone: "1234567890",
              password: "fixture-password",
              role: "customer",
            },
          }),
        }),
        "accounts/signUpAccount",
        { "accounts/signUpAccount": api.signUpAccount },
      ),
  };
}

test("signup network outages return actionable 503 errors without upstream details or profile writes", async () => {
  for (const [error, throws] of [
    [{ message: "fetch failed private-host", status: 0 }, false],
    [new TypeError("fetch failed private-host"), true],
    [{ message: "private provider error", status: 503 }, false],
  ]) {
    const h = harness(error, throws);
    const response = await h.request();
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.error.message, /temporarily unavailable/);
    assert.doesNotMatch(JSON.stringify(body), /private|fetch failed/);
    assert.equal(h.writes(), 0);
  }
});

test("signup preserves duplicate-email recovery and distinguishes throttling from invalid details", async () => {
  const duplicate = await harness({
    message: "User already been registered",
    status: 422,
  }).request();
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).data.code, "email_exists");
  const limited = await harness({ message: "private provider error", status: 429 }).request();
  assert.equal(limited.status, 429);
  assert.match((await limited.json()).error.message, /wait/);
  const invalid = await harness({ message: "private provider error", status: 422 }).request();
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error.message, /check your details/);
});
