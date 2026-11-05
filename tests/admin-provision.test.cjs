const assert = require("node:assert/strict");
const { test } = require("node:test");
const { provisionAdmin, strongPassword } = require("../scripts/provision-admin.cjs");

function harness({
  exists = true,
  missingRoles = false,
  matches = true,
  blocked = false,
  databaseError = null,
} = {}) {
  const password = "fixture-vault-value-96#Q!";
  const env = {
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-fixture",
    SUPABASE_PUBLISHABLE_KEY: "public-fixture",
    SUPER_ADMIN_EMAIL: "admin@example.test",
    SUPER_ADMIN_PASSWORD: password,
  };
  let user = exists
    ? {
        id: "admin-id",
        email: env.SUPER_ADMIN_EMAIL,
        email_confirmed_at: blocked ? null : "2026-01-01",
        app_metadata: { retained: true },
      }
    : null;
  let assigned = false;
  const writes = { create: 0, passwords: 0, metadata: 0, roles: 0, revoked: 0 };
  const logs = [];
  const admin = {
    auth: {
      admin: {
        async listUsers() {
          return { data: { users: user ? [user] : [] }, error: null };
        },
        async createUser(input) {
          writes.create++;
          assert.equal(input.password, password);
          user = {
            id: "admin-id",
            email: input.email,
            app_metadata: {},
            email_confirmed_at: "2026-01-01",
          };
          return { data: { user }, error: null };
        },
        async updateUserById(id, input) {
          assert.equal(id, user.id);
          if (input.password) {
            writes.passwords++;
            assert.equal(input.password, password);
            matches = true;
          }
          if (input.app_metadata) {
            writes.metadata++;
            user.app_metadata = input.app_metadata;
          }
          return { data: { user }, error: null };
        },
        async getUserById(id) {
          assert.equal(id, user.id);
          return { data: { user }, error: null };
        },
      },
    },
    from(table) {
      assert.equal(table, "user_roles");
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        async maybeSingle() {
          return {
            data: assigned ? { role: "supreme_admin" } : null,
            error: databaseError ?? (missingRoles ? { code: "PGRST205" } : null),
          };
        },
        async insert(row) {
          assert.equal(row.user_id, user.id);
          assert.equal(row.role, "supreme_admin");
          writes.roles++;
          assigned = true;
          return { error: null };
        },
      };
      return q;
    },
  };
  const auth = {
    auth: {
      async signInWithPassword(input) {
        assert.equal(input.password, password);
        return {
          data: { user: matches ? user : null, session: matches ? {} : null },
          error: matches ? null : { status: 400 },
        };
      },
      async signOut(input) {
        assert.equal(input.scope, "local");
        writes.revoked++;
        return { error: null };
      },
    },
  };
  return {
    env,
    writes,
    logs,
    user: () => user,
    run: (options = {}) =>
      provisionAdmin({
        env,
        expectedProject: "project",
        factory: (_url, key) => (key === "service-fixture" ? admin : auth),
        log: (text) => logs.push(text),
        ...options,
      }),
  };
}
test("provisioning previews an existing account without changing credentials or granting a role", async () => {
  const h = harness();
  const r = await h.run();
  assert.equal(r.applied, false);
  assert.deepEqual(h.writes, { create: 0, passwords: 0, metadata: 0, roles: 0, revoked: 0 });
});
test("apply requires a matching explicit development project and refuses production", async () => {
  for (const options of [{ expectedProject: undefined }, { expectedProject: "different" }]) {
    const h = harness();
    await assert.rejects(h.run({ apply: true, ...options }), /expected-project/);
    assert.equal(h.writes.create + h.writes.passwords + h.writes.roles + h.writes.metadata, 0);
  }
  const h = harness();
  h.env.NODE_ENV = "production";
  await assert.rejects(h.run({ apply: true }), /production/);
  assert.equal(h.writes.passwords + h.writes.metadata, 0);
  const http = harness();
  http.env.SUPABASE_URL = "http://project.supabase.co";
  await assert.rejects(http.run({ apply: true }), /canonical HTTPS/);
  assert.equal(http.writes.passwords + http.writes.metadata, 0);
});
test("placeholder, short and missing operator passwords are refused before any mutation", async () => {
  for (const value of [
    undefined,
    "change-me",
    "password123456789",
    "a-strong-unique-password",
    "short",
  ]) {
    assert.equal(strongPassword(value), false);
    const h = harness();
    h.env.SUPER_ADMIN_PASSWORD = value;
    await assert.rejects(h.run({ apply: true }), /Placeholder passwords are refused/);
    assert.equal(h.writes.create + h.writes.passwords + h.writes.roles + h.writes.metadata, 0);
  }
  const sameAsEmail = harness();
  sameAsEmail.env.SUPER_ADMIN_PASSWORD = sameAsEmail.env.SUPER_ADMIN_EMAIL;
  await assert.rejects(sameAsEmail.run({ apply: true }), /Placeholder passwords are refused/);
  assert.equal(
    sameAsEmail.writes.passwords + sameAsEmail.writes.metadata + sameAsEmail.writes.roles,
    0,
  );
});
test("creating a missing admin is idempotent and records database and server-managed roles", async () => {
  const h = harness({ exists: false });
  assert.equal((await h.run({ apply: true })).created, true);
  assert.equal((await h.run({ apply: true })).created, false);
  assert.deepEqual(h.writes, { create: 1, passwords: 0, metadata: 1, roles: 1, revoked: 2 });
});
test("existing admin passwords are never changed by role provisioning; metadata is preserved", async () => {
  const h = harness();
  await h.run({ apply: true });
  await h.run({ apply: true });
  assert.equal(h.writes.passwords, 0);
  assert.equal(h.writes.metadata, 1);
  assert.equal(h.writes.roles, 1);
  assert.equal(h.user().app_metadata.retained, true);
  assert.doesNotMatch(h.logs.join(""), /fixture-vault|admin@example|service-fixture/);
});
test("a mismatched existing password requires an explicit reset flag before changing it", async () => {
  const h = harness({ matches: false });
  await assert.rejects(h.run({ apply: true }), /not silently replaced/);
  assert.equal(h.writes.passwords + h.writes.metadata + h.writes.roles, 0);
  assert.equal((await h.run({ apply: true, resetPassword: true })).passwordChanged, true);
  assert.equal(h.writes.passwords, 1);
});
test("missing user_roles uses an Auth marker that only the operator service credential can write", async () => {
  const h = harness({ missingRoles: true });
  assert.equal(
    (await h.run({ apply: true })).roleSource,
    "server-managed-auth-with-configured-email",
  );
  assert.deepEqual(h.user().app_metadata.aa_dashboard_roles, ["supreme_admin"]);
  assert.equal(h.writes.roles, 0);
});
test("blocked accounts, missing public key and unexpected role lookup errors fail without changes", async () => {
  const blocked = harness({ blocked: true });
  await assert.rejects(blocked.run({ apply: true }), /explicitly unban/);
  const broken = harness({ databaseError: { code: "42501" } });
  await assert.rejects(broken.run({ apply: true }), /role lookup failed/);
  const missing = harness();
  delete missing.env.SUPABASE_PUBLISHABLE_KEY;
  await assert.rejects(missing.run({ apply: true }), /no account changes/);
  for (const h of [blocked, broken, missing])
    assert.equal(h.writes.passwords + h.writes.metadata + h.writes.roles, 0);
});
