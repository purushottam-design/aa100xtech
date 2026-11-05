const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const migration = fs.readFileSync(
  "supabase/migrations/20261105170000_admin_role_storage_recovery.sql",
  "utf8",
);
test("role storage recovery is rerunnable, grants no accounts, and prevents public privilege assignment", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;
      INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');`);
    await db.exec(migration);
    assert.equal((await db.query("select count(*)::int as n from public.user_roles")).rows[0].n, 0);
    await db.exec(`SET ROLE service_role;
      INSERT INTO public.user_roles(user_id,role) VALUES ('00000000-0000-4000-8000-000000000001','supreme_admin'),('00000000-0000-4000-8000-000000000002','customer');
      RESET ROLE;`);
    await db.exec(migration);
    assert.equal((await db.query("select count(*)::int as n from public.user_roles")).rows[0].n, 2);
    await db.exec(
      `SET ROLE authenticated; SET request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';`,
    );
    assert.deepEqual((await db.query("select role::text as role from public.user_roles")).rows, [
      { role: "customer" },
    ]);
    await assert.rejects(
      db.exec("update public.user_roles set role='supreme_admin'"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec(
        "insert into public.user_roles(user_id,role) values ('00000000-0000-4000-8000-000000000002','supreme_admin')",
      ),
      /permission denied/,
    );
    await db.exec("RESET ROLE; SET ROLE anon;");
    await assert.rejects(db.exec("select * from public.user_roles"), /permission denied/);
    await db.exec("RESET ROLE;");
    assert.equal(
      (
        await db.query(
          "select relrowsecurity as enabled from pg_class where oid='public.user_roles'::regclass",
        )
      ).rows[0].enabled,
      true,
    );
  } finally {
    await db.close();
  }
});
test("role recovery refuses an incompatible table without converting or deleting its rows", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(
      "CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); CREATE TABLE public.user_roles(user_id uuid, role text); INSERT INTO user_roles VALUES (null,'legacy-row');",
    );
    await assert.rejects(db.exec(migration), /incompatible/);
    await db.exec("ROLLBACK");
    assert.deepEqual((await db.query("select role from user_roles")).rows, [
      { role: "legacy-row" },
    ]);
  } finally {
    await db.close();
  }
});
