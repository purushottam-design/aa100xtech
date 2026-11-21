const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");

// Uses the real login, shared RBAC and operator-role resolver together.
// Provider identities and schema responses are fixtures; no live writes.
function harness({
  roles = [],
  email = "person@example.test",
  roleError = null,
  status = "active",
  profileError = null,
  env = {},
  appMetadata = {},
  userMetadata = {},
  providerError = null,
  networkError = false,
  confirmed = true,
  banned = false,
} = {}) {
  const calls = { passwords: 0, revoked: 0, roleReads: 0 };
  const user = {
    id: "verified-user",
    email,
    email_confirmed_at: confirmed ? "2026-01-01" : null,
    banned_until: banned ? "2099-01-01" : null,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  };
  const service = {
    auth: {
      admin: {
        async getUserById(id) {
          assert.equal(id, user.id);
          return { data: { user }, error: null };
        },
      },
    },
    from(table) {
      calls.roleReads++;
      const result = {
        data: {
          user_roles: roles.map((role) => ({ role })),
          admin_roles: [],
          admin_permissions: [],
          profiles: { status, is_active: status !== "inactive" },
        }[table],
        error: table === "user_roles" ? roleError : table === "profiles" ? profileError : null,
      };
      const q = {
        select() {
          return q;
        },
        eq(_field, id) {
          assert.equal(id, user.id);
          return q;
        },
        maybeSingle() {
          return Promise.resolve(result);
        },
        then(a, b) {
          return Promise.resolve(result).then(a, b);
        },
      };
      return q;
    },
  };
  const provider = {
    auth: {
      async signInWithPassword(input) {
        calls.passwords++;
        if (networkError) throw new Error("private upstream detail");
        const error =
          providerError ??
          (input.email !== email || input.password !== "stored-password-fixture"
            ? { status: 400 }
            : null);
        return {
          data: error
            ? { session: null, user: null }
            : {
                user,
                session: { access_token: "access-fixture", refresh_token: "refresh-fixture" },
              },
          error,
        };
      },
      async signOut(options) {
        assert.equal(options.scope, "local");
        calls.revoked++;
        return { error: null };
      },
    },
  };
  const globals = {
    process: {
      env: {
        SUPABASE_URL: "https://project.example.test",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fixture",
        ...env,
      },
    },
    console: { warn() {} },
  };
  const mocks = {
    "@supabase/supabase-js": { createClient: () => provider },
    "@/integrations/supabase/client.server": { supabaseAdmin: service },
  };
  const api = load("src/lib/backend/handlers/dashboard-auth.ts", mocks, globals);
  const rbac = load("src/lib/rbac.server.ts", mocks, globals);
  return {
    calls,
    rbac,
    login: (data = {}) =>
      api.dashboardLogin({
        data: { email, password: "stored-password-fixture", dashboard: "super", ...data },
      }),
  };
}

test("stored password + database Super Admin role creates the normal provider session", async () => {
  const h = harness({ roles: ["supreme_admin"] });
  const r = await h.login({ email: " PERSON@EXAMPLE.TEST " });
  assert.equal(r.ok, true);
  assert.equal(r.session.access_token, "access-fixture");
  assert.equal(h.calls.passwords, 1);
  assert.equal(h.calls.revoked, 0);
});
test("wrong password and nonexistent identity return the same generic error before role lookup", async () => {
  for (const input of [{ password: "wrong" }, { email: "missing@example.test" }]) {
    const h = harness({ roles: ["supreme_admin"] });
    const r = await h.login(input);
    assert.equal(r.code, "INVALID_CREDENTIALS");
    assert.equal(r.session, undefined);
    assert.equal(h.calls.roleReads, 0);
  }
});
test("a valid ordinary user, company admin, or forged user_metadata cannot open Super Admin", async () => {
  for (const roles of [[], ["customer"], ["company_admin"]]) {
    const h = harness({
      roles,
      userMetadata: { role: "supreme_admin", aa_dashboard_roles: ["supreme_admin"] },
    });
    const r = await h.login();
    assert.equal(r.code, "DASHBOARD_FORBIDDEN");
    assert.equal(h.calls.revoked, 1);
    assert.equal(r.session, undefined);
    await assert.rejects(h.rbac.authorizeSuper("verified-user"), /Super admin access only/);
  }
});
test("the existing verified ADMIN_EMAIL account uses the same fallback as protected APIs", async () => {
  const h = harness({
    env: { ADMIN_EMAIL: "person@example.test" },
    roleError: { code: "PGRST205" },
  });
  assert.equal((await h.login()).ok, true);
  assert.equal((await h.rbac.authorizeSuper("verified-user")).isSuper, true);
});
test("a configured dedicated email alone cannot assign itself an administrator role", async () => {
  const h = harness({
    env: {
      SUPER_ADMIN_EMAIL: "person@example.test",
      SUPER_ADMIN_PASSWORD: "stored-password-fixture",
    },
    roleError: { code: "PGRST205" },
    userMetadata: { aa_dashboard_roles: ["supreme_admin"] },
  });
  assert.equal((await h.login()).code, "ADMIN_SETUP_REQUIRED");
  assert.equal(h.calls.revoked, 1);
});
test("an operator-provisioned dedicated account works without the missing legacy role table", async () => {
  const h = harness({
    env: { SUPER_ADMIN_EMAIL: "person@example.test" },
    roleError: { code: "PGRST205" },
    appMetadata: { aa_dashboard_roles: ["supreme_admin"] },
  });
  assert.equal((await h.login()).ok, true);
  assert.equal((await h.rbac.authorizeSuper("verified-user")).isSuper, true);
});
test("an Auth role marker only applies to its server-configured email", async () => {
  const h = harness({
    env: { SUPER_ADMIN_EMAIL: "different@example.test" },
    appMetadata: { aa_dashboard_roles: ["supreme_admin"] },
  });
  assert.equal((await h.login()).code, "DASHBOARD_FORBIDDEN");
});
test("unconfirmed and banned identities do not receive configured administrator access", async () => {
  for (const flags of [{ confirmed: false }, { banned: true }]) {
    const h = harness({ ...flags, env: { ADMIN_EMAIL: "person@example.test" } });
    assert.equal((await h.login()).ok, false);
  }
});
test("inactive and suspended Super Admins are denied both login and privileged APIs", async () => {
  for (const status of ["inactive", "suspended"]) {
    const h = harness({ status, roles: ["supreme_admin"] });
    assert.equal((await h.login()).code, "ACCOUNT_INACTIVE");
    await assert.rejects(h.rbac.authorizeSuper("verified-user"));
    await assert.rejects(h.rbac.authorize("verified-user"));
  }
});
test("unavailable roles or account status fail closed with an actionable service error", async () => {
  const h = harness({ roleError: { code: "PGRST205" } });
  assert.equal((await h.login()).code, "AUTHORIZATION_UNAVAILABLE");
  const broken = harness({ roles: ["supreme_admin"], profileError: { code: "NETWORK" } });
  assert.equal((await broken.login()).code, "AUTH_SERVICE_UNAVAILABLE");
  assert.equal(broken.calls.revoked, 1);
});
test("network, provider outage and rate limiting never return a privileged session or private error", async () => {
  for (const flags of [
    { networkError: true },
    { providerError: { status: 503 } },
    { providerError: { status: 429 } },
  ]) {
    const h = harness(flags);
    const r = await h.login();
    assert.equal(r.ok, false);
    assert.equal(r.session, undefined);
    assert.doesNotMatch(JSON.stringify(r), /private upstream/);
    assert.equal(
      r.code,
      flags.providerError?.status === 429 ? "AUTH_RATE_LIMITED" : "AUTH_SERVICE_UNAVAILABLE",
    );
  }
});
test("login validates the requested dashboard before authentication", async () => {
  const h = harness({ roles: ["supreme_admin"] });
  await assert.rejects(h.login({ dashboard: "invented" }));
  assert.equal(h.calls.passwords, 0);
});

test("missing, malformed or mismatched Supabase configuration fails before password verification", async () => {
  for (const env of [
    { SUPABASE_URL: "" },
    { SUPABASE_PUBLISHABLE_KEY: "" },
    { SUPABASE_URL: "not-a-url" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://different.example.test" },
  ]) {
    const h = harness({ env });
    const result = await h.login();
    assert.equal(result.ok, false);
    assert.equal(result.code, "AUTH_CONFIGURATION_REQUIRED");
    assert.equal(h.calls.passwords, 0);
    assert.equal(result.session, undefined);
    assert.doesNotMatch(JSON.stringify(result), /different\.example|stored-password/);
  }
});

test("public bootstrap and password-sync calls cannot provision an admin or claim a reserved email", async () => {
  let status;
  const api = load(
    "src/lib/backend/handlers/accounts.ts",
    {
      "@/lib/backend/request-context.server": {
        setResponseStatus(value) {
          status = value;
        },
      },
      "@/integrations/supabase/auth-middleware": { requireSupabaseAuth: async () => ({}) },
      "@/integrations/supabase/client.server": {
        supabaseAdmin: new Proxy(
          {},
          {
            get() {
              throw new Error("Public provisioning must never reach privileged Auth");
            },
          },
        ),
      },
    },
    { process: { env: { SUPER_ADMIN_EMAIL: "reserved@example.test" } } },
  );
  const statusResult = await api.getBootstrapStatus();
  assert.equal(statusResult.needsBootstrap, false);
  await assert.rejects(
    api.bootstrapSupremeAdmin({
      data: {
        fullName: "Fixture Admin",
        username: "fixture-admin",
        email: "fixture@example.test",
        phone: "+919876543210",
        password: "fixture-password-never-used",
      },
    }),
    /operator/,
  );
  assert.equal(status, 403);
  assert.equal((await api.verifyEnvAdminLogin({ data: {} })).isAdmin, false);
  await assert.rejects(
    api.signUpAccount({
      data: {
        fullName: "Fixture User",
        email: "reserved@example.test",
        phone: "+919876543210",
        password: "fixture-password-never-used",
        role: "employee",
      },
    }),
    /cannot be registered here/,
  );
});
