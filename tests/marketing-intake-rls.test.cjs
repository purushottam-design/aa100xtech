const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
test("marketing migration provides atomic idempotency, server IDs and private RLS with optional publication consent", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
   CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);
   CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   CREATE TABLE public.partner_applications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),full_name text,email text,phone text,country text,platforms text,handle text,niche text,motivation text,target_level text,status text DEFAULT 'pending',reviewed_by uuid,reviewed_at timestamptz,created_at timestamptz DEFAULT now());
   ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;GRANT ALL ON public.partner_applications TO service_role;`);
    await db.exec(
      fs.readFileSync("supabase/migrations/20261026090000_influencer_partnership.sql", "utf8"),
    );
    await db.exec(
      fs.readFileSync("supabase/migrations/20261105120000_marketing_intake.sql", "utf8"),
    );
    const token = "00000000-0000-4000-8000-000000000001";
    await db.exec(
      fs.readFileSync("supabase/migrations/20261105120000_marketing_intake.sql", "utf8"),
    );
    const payload = {
      full_name: "Synthetic Creator",
      display_name: "Synthetic Creator",
      email: "private@example.test",
      phone: "+919876543210",
      country: "India",
      processing_consent: true,
      publication_consent: false,
    };
    const save = (kind, token, hash, payload) =>
      db.query("SELECT public.save_marketing_intake($1,$2,$3,$4) AS receipt", [
        kind,
        token,
        hash,
        JSON.stringify(payload),
      ]);
    const first = (await save("creator", token, "hash", payload)).rows[0].receipt;
    assert.equal(first.created, true);
    assert.notEqual(first.reference, token);
    const repeat = (await save("creator", token, "hash", payload)).rows[0].receipt;
    assert.equal(repeat.created, false);
    assert.equal(repeat.reference, first.reference);
    await assert.rejects(save("creator", token, "changed", payload), /Submission conflict/);
    const application = (await db.query("SELECT * FROM partner_applications")).rows[0];
    assert.equal(application.publication_consent, false);
    assert.equal(application.influencer_review_status, "pending");
    assert.equal(application.is_influencer, true);
    assert.equal((await db.query("SELECT * FROM influencer_profiles")).rows.length, 0);
    await save("brand", "00000000-0000-4000-8000-000000000002", "brand", {
      privacy: true,
      company: "Synthetic brand",
    });
    assert.equal(
      (await db.query("SELECT status FROM brand_campaign_inquiries")).rows[0].status,
      "New",
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      for (const sql of [
        "SELECT * FROM brand_campaign_inquiries",
        "SELECT * FROM marketing_intake_receipts",
        "UPDATE brand_campaign_inquiries SET notes='forged'",
        "SELECT save_marketing_intake('brand',gen_random_uuid(),'x','{}')",
      ]) {
        await assert.rejects(db.query(sql), /permission denied/);
      }
      await db.exec("RESET ROLE");
    }
    assert.equal(
      (await db.query("SELECT public FROM storage.buckets WHERE id='influencer-media-kits'"))
        .rows[0].public,
      false,
    );
    const recovery = fs.readFileSync(
      "supabase/migrations/20261105143000_marketing_intake_recovery.sql",
      "utf8",
    );
    await db.exec(recovery);
    await db.exec(recovery);
    assert.equal(
      (await db.query("SELECT count(*)::int AS count FROM brand_campaign_inquiries")).rows[0].count,
      1,
    );
    await db.exec("SET ROLE service_role");
    const receipt = (
      await save("brand", "00000000-0000-4000-8000-000000000003", "service-role-proof", {
        privacy: true,
        company: "Synthetic service-role check",
      })
    ).rows[0].receipt;
    assert.equal(receipt.created, true);
    assert.equal(
      (
        await db.query("SELECT status FROM brand_campaign_inquiries WHERE id=$1", [
          receipt.reference,
        ])
      ).rows[0].status,
      "New",
    );
    await db.exec("RESET ROLE");
  } finally {
    await db.close();
  }
});
