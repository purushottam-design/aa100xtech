const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

// Exercise the real shared RBAC helper, rather than replacing authorizeSuper.
// Auth identities and database rows are fixtures; no accounts or roles change.
function harness({ roles = [], customRoles = [], validToken = true, envAdmin = false } = {}) {
  const env = {
    ICICI_RETURN_URL: "https://uat.example.test/api/payments/icici/callback",
    ICICI_UAT_TEST_MODE: "true",
    ICICI_UAT_TESTS_PASSED: "false",
    ...(envAdmin ? { ADMIN_EMAIL: "configured-admin@example.test" } : {}),
  };
  const client = {
    auth: {
      async getUser(token) {
        assert.equal(token, "fixture-session");
        return {
          data: {
            user: validToken
              ? { id: "verified-user", user_metadata: { role: "supreme_admin" } }
              : null,
          },
          error: validToken ? null : { message: "private auth failure" },
        };
      },
      admin: {
        async getUserById(id) {
          assert.equal(id, "verified-user");
          return { data: { user: { email: "configured-admin@example.test" } }, error: null };
        },
      },
    },
    from(table) {
      const data = {
        user_roles: roles.map((role) => ({ role })),
        admin_roles: customRoles.map((key) => ({ role_id: key, roles: { key } })),
        admin_permissions: [],
        profiles: { status: "active", is_active: true },
        role_permissions: [],
      }[table];
      assert.notEqual(data, undefined);
      const query = {
        select() {
          return query;
        },
        eq(_column, id) {
          assert.equal(id, "verified-user");
          return query;
        },
        in() {
          return query;
        },
        maybeSingle() {
          return Promise.resolve({ data, error: null });
        },
        then(resolve, reject) {
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const { assertIciciCheckoutAccess } = load(
    "src/lib/icici-uat-access.server.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: client },
    },
    { process: { env } },
  );
  return {
    check: () =>
      assertIciciCheckoutAccess(
        new Request("https://uat.example.test/api/payments/icici/availability", {
          headers: { authorization: "Bearer fixture-session" },
        }),
        { origin: "https://uat.example.test" },
      ),
    env,
  };
}

test("ICICI tester authorization accepts a verified database Super Administrator", async () => {
  for (const options of [{ roles: ["supreme_admin"] }, { customRoles: ["supreme_admin"] }]) {
    const h = harness(options);
    await h.check();
    assert.equal(h.env.ICICI_UAT_TESTS_PASSED, "false");
  }
});

test("customer, employee and other admin roles cannot use forged Super Admin metadata", async () => {
  for (const role of [undefined, "customer", "employee", "company_admin", "manager"]) {
    await assert.rejects(harness({ roles: role ? [role] : [] }).check(), {
      code: "ICICI_UAT_TEST_ACCESS_REQUIRED",
      status: 403,
    });
  }
});

test("the existing configured-admin compatibility path still requires a server-validated session", async () => {
  await harness({ envAdmin: true }).check();
  await assert.rejects(harness({ envAdmin: true, validToken: false }).check(), {
    code: "ICICI_UAT_TEST_ACCESS_REQUIRED",
    status: 403,
  });
});
