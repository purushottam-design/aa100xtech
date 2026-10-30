const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("partner ranking SQL is rerunnable, private, consent-aware and counts one confirmed client once", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE TABLE public.partner_applications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text,email text,phone text,status text DEFAULT 'pending',reviewed_by uuid,reviewed_at timestamptz,created_at timestamptz DEFAULT now());
      ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON public.partner_applications TO service_role;`);
    await db.exec(
      fs.readFileSync("supabase/migrations/20261026090000_influencer_partnership.sql", "utf8"),
    );
    const migration = fs.readFileSync(
      "supabase/migrations/20261030190000_influencer_partner_program.sql",
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    const admin = "00000000-0000-4000-8000-000000000099";
    const first = "00000000-0000-4000-8000-000000000001";
    const second = "00000000-0000-4000-8000-000000000002";
    await db.query("INSERT INTO auth.users(id) VALUES ($1)", [admin]);
    for (const [id, name] of [
      [first, "first"],
      [second, "second"],
    ]) {
      await db.query(
        "INSERT INTO partner_applications(id,full_name,email,is_influencer,status,influencer_review_status,processing_consent,publication_consent) VALUES ($1,$2,'private@example.test',true,'approved','approved',true,true)",
        [id, name],
      );
      await db.query(
        "INSERT INTO influencer_profiles(id,application_id,slug,display_name,city,state,category,biography,publication_status,consent_confirmed) VALUES ($1,$1,$2,$2,'Test City','Test State','Technology','Synthetic test introduction','published',true)",
        [id, name],
      );
    }
    const asRole = async (role, sql, args = []) => {
      await db.exec(`SET ROLE ${role}`);
      try {
        return await db.query(sql, args);
      } finally {
        await db.exec("RESET ROLE");
      }
    };
    const publicStats = async () =>
      (await asRole("anon", "SELECT * FROM get_influencer_partner_stats() ORDER BY profile_id"))
        .rows;
    assert.equal((await publicStats())[0].converted_clients, 0);
    await db.query(
      "INSERT INTO influencer_client_referrals(profile_id,client_reference,updated_by) VALUES ($1,'client-001',$2)",
      [first, admin],
    );
    assert.equal((await publicStats())[0].converted_clients, 0, "Leads alone never count");
    await assert.rejects(
      db.query(
        "UPDATE influencer_client_referrals SET status='converted' WHERE client_reference='client-001'",
      ),
      /check constraint/,
    );
    await db.query(
      "UPDATE influencer_client_referrals SET status='converted',confirmed_at=now(),confirmed_by=$1,evidence_reference='invoice-001' WHERE client_reference='client-001'",
      [admin],
    );
    assert.equal((await publicStats())[0].converted_clients, 1);
    await assert.rejects(
      db.query(
        "INSERT INTO influencer_client_referrals(profile_id,client_reference,status,confirmed_at,confirmed_by,updated_by,evidence_reference) VALUES ($1,'client-001','converted',now(),$2,$2,'invoice-001')",
        [second, admin],
      ),
      /duplicate key/,
    );
    await assert.rejects(
      db.query(
        "INSERT INTO influencer_client_referrals(profile_id,client_reference,status,confirmed_at,confirmed_by,updated_by,evidence_reference) VALUES ($1,'CLIENT-001','converted',now(),$2,$2,'invoice-001')",
        [second, admin],
      ),
      /check constraint/,
    );
    for (const role of ["anon", "authenticated"]) {
      await assert.rejects(
        asRole(role, "SELECT * FROM influencer_client_referrals"),
        /permission denied/,
      );
      await assert.rejects(
        asRole(role, "UPDATE influencer_client_referrals SET status='converted'"),
        /permission denied/,
      );
    }
    await db.exec("UPDATE influencer_client_referrals SET status='reversed'");
    assert.equal(
      (await publicStats())[0].converted_clients,
      0,
      "Reversals remove conversion credit",
    );
    const columns = Object.keys((await publicStats())[0]).sort();
    assert.deepEqual(
      columns,
      ["converted_clients", "created_at", "profile_id", "total_leads"],
      "No private client or evidence references leave the RPC",
    );
    await db.query(
      "INSERT INTO influencer_testimonials(profile_id,quote,approved_by) VALUES ($1,'A genuine approved quote used only in SQL tests.',$2)",
      [first, admin],
    );
    assert.equal(
      (await asRole("anon", "SELECT quote FROM influencer_testimonials")).rows.length,
      0,
    );
    await assert.rejects(
      asRole("anon", "SELECT approved_by FROM influencer_testimonials"),
      /permission denied/,
    );
    await assert.rejects(
      db.exec("UPDATE influencer_testimonials SET publication_status='published'"),
      /check constraint/,
    );
    await db.exec(
      "UPDATE influencer_testimonials SET publication_status='published',consent_confirmed=true",
    );
    assert.equal(
      (await asRole("anon", "SELECT quote FROM influencer_testimonials")).rows.length,
      1,
    );
    await db.query("UPDATE partner_applications SET publication_consent=false WHERE id=$1", [
      first,
    ]);
    assert.equal(
      (await publicStats()).some((row) => row.profile_id === first),
      false,
      "Consent withdrawal hides public ranking immediately",
    );
    assert.equal(
      (await asRole("anon", "SELECT quote FROM influencer_testimonials")).rows.length,
      0,
      "A private profile cannot have a public story",
    );
    await db.exec(migration);
    assert.equal(
      (await db.query("SELECT count(*)::int AS count FROM influencer_client_referrals")).rows[0]
        .count,
      1,
      "Reapplying the migration preserves client records",
    );
  } finally {
    await db.close();
  }
});
