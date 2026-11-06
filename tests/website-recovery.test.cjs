const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");

const repair = fs.readFileSync("supabase/repairs/restore_website_requests.sql", "utf8");
const verification = `SELECT
  to_regclass('public.candidate_submissions') IS NOT NULL AS candidates,
  to_regclass('public.website_requests') IS NOT NULL AS requests,
  to_regprocedure('public.submit_website_request(uuid,text,jsonb,text,text,text)') IS NOT NULL AS submission,
  (SELECT NOT public AND file_size_limit=5242880 AND allowed_mime_types=ARRAY['application/pdf']
    FROM storage.buckets WHERE id='website-resumes') AS private_pdf`;

async function fixture() {
  const db = await PGlite.create();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY,bucket_id text,name text);`);
  return db;
}

test("SQL Editor recovery saves a PDF application through the real handler and retains private, idempotent records", async () => {
  const db = await fixture();
  try {
    await db.exec(repair);
    assert.ok(Object.values((await db.query(verification)).rows[0]).every(Boolean));
    const objects = new Map();
    const adapter = {
      storage: {
        from(bucket) {
          assert.equal(bucket, "website-resumes");
          return {
            async upload(path, bytes) {
              if (objects.has(path)) return { error: { statusCode: "409" } };
              objects.set(path, bytes);
              return { error: null };
            },
            async remove(paths) {
              for (const path of paths) objects.delete(path);
              return { error: null };
            },
          };
        },
      },
      async rpc(name, data) {
        assert.equal(name, "submit_website_request");
        const result = await db.query(
          "SELECT public.submit_website_request($1,$2,$3,$4,$5,$6) AS created",
          [
            data.request_id,
            data.request_kind,
            JSON.stringify(data.request_payload),
            data.request_hash,
            data.sender_hash,
            data.destination,
          ],
        );
        return { data: result.rows[0].created, error: null };
      },
      from(table) {
        assert.equal(table, "website_requests");
        return {
          update(value) {
            return {
              async eq(column, id) {
                assert.equal(column, "id");
                await db.query("UPDATE website_requests SET notification_status=$1 WHERE id=$2", [
                  value.notification_status,
                  id,
                ]);
                return { error: null };
              },
            };
          },
        };
      },
    };
    const { saveWebsiteRequest } = load(
      "src/lib/website-requests.server.ts",
      {
        "@/integrations/supabase/client.server": { supabaseAdmin: adapter },
      },
      { File, FormData, process: { env: { NODE_ENV: "production" } } },
    );
    const input = {
      id: "00000000-0000-4000-8000-000000000001",
      kind: "career",
      name: "Test Applicant",
      email: "applicant@example.test",
      phone: "+910000000000",
      role: "Developer",
      requirements: "Build responsive pages with source files.",
      experience: "Two years of web development.",
      startedAt: Date.now() - 5000,
    };
    const request = () => {
      const form = new FormData();
      form.set("data", JSON.stringify(input));
      form.set(
        "attachment",
        new File(["%PDF-1.4\nSynthetic resume\n%%EOF"], "resume.pdf", { type: "application/pdf" }),
      );
      return new Request("https://aa100xtech.com/api/website/requests", {
        method: "POST",
        headers: { origin: "https://aa100xtech.com", "x-aa-rpc": "1" },
        body: form,
      });
    };
    assert.deepEqual(await (await saveWebsiteRequest(request())).json(), {
      saved: true,
      notification: "not_configured",
    });
    assert.deepEqual(await (await saveWebsiteRequest(request())).json(), {
      saved: true,
      notification: "previously_saved",
    });
    assert.equal(objects.size, 1);
    const candidate = (await db.query("SELECT full_name,file_path FROM candidate_submissions"))
      .rows[0];
    assert.equal(candidate.full_name, input.name);
    assert.ok(objects.has(candidate.file_path));
    assert.equal((await db.query("SELECT count(*) AS n FROM website_requests")).rows[0].n, 1);

    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query("SELECT * FROM website_requests"), /permission denied/);
      await assert.rejects(
        db.query("SELECT submit_website_request($1,$2,$3,$4,$5,$6)", [
          input.id,
          "career",
          "{}",
          "hash",
          "sender",
          "hr@example.test",
        ]),
        /permission denied/,
      );
      await db.exec("RESET ROLE");
    }
    // Recovery also fixes an incorrectly public dedicated bucket without deleting objects or applications.
    await db.exec(`INSERT INTO storage.objects VALUES('00000000-0000-4000-8000-000000000002','website-resumes','existing.pdf');
      UPDATE storage.buckets SET public=true,file_size_limit=99999999,allowed_mime_types=ARRAY['text/html'] WHERE id='website-resumes';`);
    await db.exec(repair);
    assert.ok(Object.values((await db.query(verification)).rows[0]).every(Boolean));
    assert.equal((await db.query("SELECT count(*) AS n FROM candidate_submissions")).rows[0].n, 1);
    assert.equal((await db.query("SELECT count(*) AS n FROM storage.objects")).rows[0].n, 1);
  } finally {
    await db.close();
  }
});

test("recovery rolls back when an existing intake table has incompatible columns", async () => {
  const db = await fixture();
  try {
    await db.exec(
      "CREATE TABLE contact_messages(id uuid PRIMARY KEY); INSERT INTO contact_messages VALUES('00000000-0000-4000-8000-000000000001');",
    );
    await assert.rejects(db.exec(repair), /does not exist/);
    await db.exec("ROLLBACK");
    assert.equal((await db.query("SELECT count(*) AS n FROM contact_messages")).rows[0].n, 1);
    assert.equal(
      (await db.query("SELECT to_regclass('public.website_requests') IS NULL AS absent")).rows[0]
        .absent,
      true,
    );
    assert.equal((await db.query("SELECT count(*) AS n FROM storage.buckets")).rows[0].n, 0);
  } finally {
    await db.close();
  }
});
