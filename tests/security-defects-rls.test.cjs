const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("security reports enforce ownership, server-only writes, idempotency, rate limits and private attachments in PostgreSQL", async () => {
  const db = await PGlite.create();
  const owner = "00000000-0000-4000-8000-000000000001";
  const other = "00000000-0000-4000-8000-000000000002";
  const id = "00000000-0000-4000-8000-000000000010";
  const hash = "a".repeat(64);
  const payload = {
    fullName: "Test Customer",
    email: "customer@example.test",
    phone: "+910000000000",
    company: "",
    category: "Authentication",
    title: "Test login issue",
    description: "A synthetic authentication issue for isolated testing.",
    priority: "High",
  };
  try {
    await db.exec(`
      CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth; CREATE SCHEMA storage;
      CREATE TABLE auth.users(id uuid PRIMARY KEY);
      INSERT INTO auth.users VALUES ('${owner}'),('${other}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('test.user_id',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth, storage TO authenticated,anon,service_role;
      CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE TABLE storage.objects(bucket_id text,name text);
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      GRANT SELECT,INSERT ON storage.objects TO anon,authenticated;
      CREATE POLICY legacy_permissive_uploads ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);
    `);
    const migration = fs.readFileSync(
      "supabase/migrations/20261117140000_security_identity_defects.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    const asRole = async (role, sql, args = []) => {
      await db.exec(`SET ROLE ${role}`);
      try {
        return await db.query(sql, args);
      } finally {
        await db.exec("RESET ROLE");
      }
    };
    const submit = (ticketId = id, ownerId = owner, payloadHash = hash) =>
      asRole("service_role", "SELECT public.submit_security_defect($1,$2,$3,$4::jsonb) AS result", [
        ticketId,
        ownerId,
        payloadHash,
        JSON.stringify(payload),
      ]);
    const first = (await submit()).rows[0].result;
    assert.equal(first.created, true);
    assert.equal(first.status, "Open");
    const retry = (await submit()).rows[0].result;
    assert.equal(retry.created, false);
    assert.equal(retry.ticket_number, first.ticket_number);
    await assert.rejects(submit(id, owner, "b".repeat(64)), /Report conflict/);
    await assert.rejects(submit(id, other), /Report conflict/);
    await db.query("SELECT set_config('test.user_id',$1,false)", [owner]);
    assert.equal(
      (await asRole("authenticated", "SELECT id FROM public.security_defects")).rows.length,
      1,
    );
    await db.query("SELECT set_config('test.user_id',$1,false)", [other]);
    assert.equal(
      (await asRole("authenticated", "SELECT id FROM public.security_defects")).rows.length,
      0,
    );
    await assert.rejects(
      asRole("anon", "SELECT * FROM public.security_defects"),
      /permission denied/,
    );
    await assert.rejects(
      asRole("authenticated", "UPDATE public.security_defects SET status='Resolved'"),
      /permission denied/,
    );
    await assert.rejects(
      asRole("authenticated", "DELETE FROM public.security_defects"),
      /permission denied/,
    );
    await assert.rejects(
      asRole("authenticated", "INSERT INTO public.security_defects(id) VALUES(gen_random_uuid())"),
      /permission denied/,
    );
    await assert.rejects(
      asRole("authenticated", "SELECT public.submit_security_defect($1,$2,$3,$4::jsonb)", [
        id,
        owner,
        hash,
        JSON.stringify(payload),
      ]),
      /permission denied/,
    );
    for (let i = 11; i <= 15; i++)
      await submit(`00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    await assert.rejects(submit("00000000-0000-4000-8000-000000000016"), /Report limit reached/);
    assert.equal(
      (await submit()).rows[0].result.created,
      false,
      "Retries still work at the report limit",
    );
    await asRole(
      "service_role",
      "UPDATE public.security_defects SET status='In Review' WHERE id=$1",
      [id],
    );
    assert.equal((await submit()).rows[0].result.status, "In Review");
    await assert.rejects(
      asRole("service_role", "UPDATE public.security_defects SET status='Published' WHERE id=$1", [
        id,
      ]),
      /check constraint/,
    );
    await db.exec(
      "INSERT INTO storage.objects VALUES('security-defect-attachments','private.pdf'),('other-bucket','legacy.pdf')",
    );
    assert.deepEqual((await asRole("authenticated", "SELECT name FROM storage.objects")).rows, [
      { name: "legacy.pdf" },
    ]);
    await assert.rejects(
      asRole(
        "authenticated",
        "INSERT INTO storage.objects VALUES('security-defect-attachments','forged.pdf')",
      ),
      /row-level security/,
    );
    assert.equal(
      (await db.query("SELECT public FROM storage.buckets WHERE id='security-defect-attachments'"))
        .rows[0].public,
      false,
    );
  } finally {
    await db.close();
  }
});
