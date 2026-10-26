const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");

test("the real migration enforces publication, consent, private applications, and server-only writes in PostgreSQL", async () => {
  const db = await PGlite.create();
  try {
    // Minimal existing Supabase schema; no network calls or production data.
    await db.exec(`
      CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA storage;
      CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      CREATE TABLE public.partner_applications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL, email text NOT NULL, phone text, status text NOT NULL DEFAULT 'pending', reviewed_by uuid, reviewed_at timestamptz, created_at timestamptz DEFAULT now());
      ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
      GRANT INSERT ON public.partner_applications TO anon, authenticated;
      GRANT ALL ON public.partner_applications TO service_role;
      CREATE POLICY "Anyone can submit a partner application" ON public.partner_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
      INSERT INTO public.partner_applications(full_name,email) VALUES ('Existing applicant','private@example.test');
    `);
    await db.exec(
      fs.readFileSync("supabase/migrations/20261026090000_influencer_partnership.sql", "utf8"),
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS count FROM public.partner_applications")).rows[0]
        .count,
      1,
      "Existing applications survive the migration",
    );
    const applicationId = "00000000-0000-4000-8000-000000000001";
    await db.query(
      "INSERT INTO public.partner_applications(id,full_name,email,is_influencer,processing_consent,publication_consent) VALUES ($1,'Test Creator','private@example.test',true,true,true)",
      [applicationId],
    );
    await db.query(
      "INSERT INTO public.influencer_profiles(application_id,slug,display_name,city,state,category,biography) VALUES ($1,'test-creator','Test Creator','Test City','Test State','Technology','Synthetic test biography')",
      [applicationId],
    );
    const asRole = async (role, sql) => {
      await db.exec(`SET ROLE ${role}`);
      try {
        return await db.query(sql);
      } finally {
        await db.exec("RESET ROLE");
      }
    };
    const visible = async () =>
      (await asRole("anon", "SELECT slug FROM public.influencer_profiles")).rows.length;
    assert.equal(await visible(), 0, "Pending drafts are private");
    await db.exec(
      "UPDATE public.partner_applications SET status='approved',influencer_review_status='approved' WHERE is_influencer;",
    );
    assert.equal(await visible(), 0, "Approval alone cannot publish");
    await db.exec("UPDATE public.influencer_profiles SET publication_status='published'");
    assert.equal(await visible(), 0, "Admin consent confirmation is required");
    await db.exec("UPDATE public.influencer_profiles SET consent_confirmed=true");
    assert.equal(await visible(), 1);
    await assert.rejects(
      asRole("anon", "SELECT email,phone FROM public.partner_applications"),
      /permission denied/,
    );
    await assert.rejects(
      asRole("authenticated", "UPDATE public.influencer_profiles SET featured=true"),
      /permission denied/,
    );
    await assert.rejects(
      asRole(
        "anon",
        "INSERT INTO public.partner_applications(full_name,email,is_influencer,status,publication_consent) VALUES ('Forged','forged@example.test',true,'approved',true)",
      ),
      /row-level security/,
    );
    await asRole(
      "anon",
      "INSERT INTO public.partner_applications(full_name,email) VALUES ('Legacy affiliate','affiliate@example.test')",
    );
    await db.exec(
      "UPDATE public.partner_applications SET publication_consent=false WHERE is_influencer",
    );
    assert.equal(
      await visible(),
      0,
      "Consent withdrawal hides profiles immediately, even without editing profile rows",
    );
    await db.exec(
      "UPDATE public.partner_applications SET publication_consent=true,influencer_review_status='rejected' WHERE is_influencer",
    );
    assert.equal(await visible(), 0, "Rejection removes public access");
    await db.exec(
      "UPDATE public.partner_applications SET influencer_review_status='approved' WHERE is_influencer; UPDATE public.influencer_profiles SET publication_status='unpublished'",
    );
    assert.equal(await visible(), 0, "Unpublished slugs cannot be read");
    assert.equal(
      (await db.query("SELECT public FROM storage.buckets WHERE id='influencer-media'")).rows[0]
        .public,
      false,
    );
    await assert.rejects(
      asRole("anon", "SELECT public.take_influencer_submission_slot('attacker')"),
      /permission denied/,
    );
    for (let i = 1; i <= 6; i++)
      assert.equal(
        (
          await asRole(
            "service_role",
            "SELECT public.take_influencer_submission_slot('test-rate-key') AS allowed",
          )
        ).rows[0].allowed,
        i <= 5,
      );
    console.log(
      "Migration and RLS verified against isolated PostgreSQL; live Supabase data was not accessed.",
    );
  } finally {
    await db.close();
  }
});
