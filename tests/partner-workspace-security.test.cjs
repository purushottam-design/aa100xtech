const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");
const ids = Array.from(
  { length: 8 },
  (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
);

test("candidate SQL enforces roles, ownership, domains, atomic approvals, deadlines and stock consistency", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.user_id',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
      INSERT INTO auth.users(id) VALUES ${ids.map((id) => `('${id}')`).join(",")};`);
    await db.exec(
      fs.readFileSync("supabase/partner-workspace/001_workspace_candidate.sql", "utf8"),
    );
    for (const [i, role] of [
      "admin",
      "imtm",
      "imtm",
      "lead_team",
      "lead_team",
      "influencer",
    ].entries()) {
      await db.query(
        "INSERT INTO cm365_memberships(user_id,role,status) VALUES($1,$2,'approved')",
        [ids[i], role],
      );
      if (i < 3)
        await db.query("INSERT INTO cm365_team_accounts(user_id,name,active) VALUES($1,$2,true)", [
          ids[i],
          `Synthetic staff ${i}`,
        ]);
      if (i === 3 || i === 4)
        await db.query(
          "INSERT INTO cm365_lead_team_accounts(user_id,name,active,lead_domain) VALUES($1,'Synthetic collector',true,$2)",
          [ids[i], i === 3 ? "influencer" : "gamer"],
        );
    }
    const asUser = async (i, sql, args = []) => {
      await db.query("SELECT set_config('app.user_id',$1,false)", [ids[i]]);
      await db.exec("SET ROLE authenticated");
      try {
        return await db.query(sql, args);
      } finally {
        await db.exec("RESET ROLE");
      }
    };
    const lead = {
      name: "Synthetic creator",
      email: "test@example.test",
      socials: [
        {
          platform: "instagram",
          handle: "synthetic",
          url: "https://instagram.com/synthetic",
          followers: 1200,
        },
      ],
    };
    await assert.rejects(asUser(6, "SELECT cm365_add_lead('influencer',$1)", [lead]), /Forbidden/);
    await assert.rejects(asUser(3, "SELECT cm365_add_lead('gamer',$1)", [lead]), /Forbidden/);
    const leadId = (await asUser(3, "SELECT cm365_add_lead('influencer',$1) AS id", [lead])).rows[0]
      .id;
    assert.equal((await asUser(3, "SELECT * FROM cm365_influencer_leads")).rows.length, 1);
    assert.equal((await asUser(4, "SELECT * FROM cm365_influencer_leads")).rows.length, 0);
    await assert.rejects(
      asUser(3, "UPDATE cm365_influencer_leads SET name='forged'"),
      /permission denied/,
    );
    await assert.rejects(
      asUser(3, "SELECT cm365_add_lead('influencer',$1)", [lead]),
      /duplicate key/,
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM cm365_influencer_leads")).rows[0].n,
      1,
    );
    // A later duplicate rolls back every identity reservation and the lead itself.
    const multi = {
      ...lead,
      socials: [{ ...lead.socials[0], handle: "new-identity" }, lead.socials[0]],
    };
    await assert.rejects(
      asUser(3, "SELECT cm365_add_lead('influencer',$1)", [multi]),
      /duplicate key/,
    );
    assert.equal(
      (await db.query("SELECT * FROM cm365_influencer_identities WHERE handle='new-identity'")).rows
        .length,
      0,
    );
    const influencer = (await asUser(0, "SELECT cm365_convert_lead($1) AS id", [leadId])).rows[0]
      .id;
    assert.equal(
      (await asUser(0, "SELECT cm365_convert_lead($1) AS id", [leadId])).rows[0].id,
      influencer,
    );
    const accounts = (await db.query("SELECT id FROM cm365_team_accounts ORDER BY name")).rows;
    await asUser(0, "SELECT cm365_assign($1,$2)", [influencer, accounts[1].id]);
    assert.equal((await asUser(1, "SELECT * FROM cm365_influencers")).rows.length, 1);
    assert.equal((await asUser(2, "SELECT * FROM cm365_influencers")).rows.length, 0);
    await assert.rejects(
      asUser(2, "SELECT cm365_log_contact($1,'call','forged')", [influencer]),
      /Forbidden/,
    );
    await asUser(
      1,
      "SELECT cm365_log_contact($1,'call','Discussed the brief',now(),'Send proposal')",
      [influencer],
    );
    assert.equal((await asUser(1, "SELECT * FROM cm365_follow_up_tasks")).rows.length, 1);
    const terms = {
      brand: "Synthetic brand",
      collaboration: "paid",
      currency: "INR",
      amount: 1000,
      advance: 100,
      summary: "Synthetic negotiated and agreed deal terms",
      agreementStatus: "agreed",
      deliverables: [{ platform: "instagram", type: "reel", quantity: 1, dueDate: "2027-01-01" }],
    };
    const revision = (await asUser(1, "SELECT cm365_save_draft($1,0,$2) AS r", [influencer, terms]))
      .rows[0].r;
    await assert.rejects(
      asUser(1, "SELECT cm365_save_draft($1,0,$2)", [influencer, terms]),
      /Stale/,
    );
    await assert.rejects(asUser(1, "SELECT cm365_submit_deal($1,99)", [influencer]), /Stale/);
    const approval = (
      await asUser(1, "SELECT cm365_submit_deal($1,$2) AS id", [influencer, revision])
    ).rows[0].id;
    await assert.rejects(
      asUser(1, "SELECT cm365_submit_deal($1,$2)", [influencer, revision]),
      /Forbidden/,
    );
    await assert.rejects(
      asUser(1, "SELECT cm365_save_draft($1,$2,$3)", [influencer, revision, terms]),
      /Forbidden/,
    );
    await assert.rejects(
      asUser(1, "SELECT cm365_decide_deal($1,'approved','forged')", [approval]),
      /Forbidden/,
    );
    await db.query(
      "UPDATE cm365_influencers SET review_started_at=now()-interval '2 days' WHERE id=$1",
      [influencer],
    );
    await asUser(0, "SELECT cm365_decide_deal($1,'changes_requested','Please revise the brief')", [
      approval,
    ]);
    await assert.rejects(
      asUser(0, "SELECT cm365_decide_deal($1,'approved','stale decision')", [approval]),
      /Stale/,
    );
    const after = (await db.query("SELECT * FROM cm365_influencers WHERE id=$1", [influencer]))
      .rows[0];
    assert.ok(Number(after.paused_seconds) >= 172799);
    assert.equal(after.stage, "changes_requested");
    const snapshot = (
      await db.query("SELECT snapshot FROM cm365_deal_approvals WHERE id=$1", [approval])
    ).rows[0].snapshot;
    assert.equal(snapshot.amount, 1000);
    await db.query(
      "UPDATE cm365_influencers SET assigned_at=now()-interval '20 days' WHERE id=$1",
      [influencer],
    );
    await assert.rejects(
      asUser(1, "SELECT cm365_save_draft($1,$2,$3)", [influencer, revision, terms]),
      /Forbidden/,
    );
    await asUser(0, "SELECT cm365_assign($1,$2)", [influencer, accounts[2].id]);
    assert.equal(
      (await asUser(1, "SELECT * FROM cm365_influencer_comm_log")).rows.length,
      0,
      "Reassigned staff loses private history",
    );
    await db.query("UPDATE cm365_memberships SET status='disabled' WHERE user_id=$1", [ids[2]]);
    assert.equal(
      (await asUser(2, "SELECT * FROM cm365_influencers")).rows.length,
      0,
      "Revocation applies on the next query",
    );
    await assert.rejects(
      asUser(6, "SELECT cm365_complete_task((SELECT id FROM cm365_follow_up_tasks LIMIT 1))"),
      /Forbidden/,
    );
    const product = (
      await asUser(0, "SELECT cm365_create_operation('products',$1) AS id", [
        { name: "Synthetic product", sku: "TEST-001" },
      ])
    ).rows[0].id;
    await asUser(0, "SELECT cm365_adjust_stock($1,10,'Initial receipt',$2)", [product, ids[6]]);
    await asUser(0, "SELECT cm365_adjust_stock($1,10,'Initial receipt',$2)", [product, ids[6]]);
    assert.equal((await db.query("SELECT stock FROM cm365_products")).rows[0].stock, 10);
    await assert.rejects(
      asUser(0, "SELECT cm365_adjust_stock($1,-11,'Invalid quantity',$2)", [product, ids[7]]),
      /check constraint/,
    );
    assert.equal((await db.query("SELECT stock FROM cm365_products")).rows[0].stock, 10);
    const dashboard = (await asUser(0, "SELECT cm365_dashboard(current_date-6) AS d")).rows[0].d;
    assert.equal(dashboard.leads, 1);
    assert.equal(dashboard.activity.length, 7);
    assert.equal(
      dashboard.activity.reduce((n, day) => n + day.leads, 0),
      1,
    );
    await assert.rejects(asUser(3, "SELECT cm365_dashboard(current_date-6)"), /Forbidden/);
  } finally {
    await db.close();
  }
});

test("workspace domain prevents privilege input, keeps domain homes separate and accounts for review pauses", () => {
  const domain = load("src/lib/partner-workspace/domain.ts");
  const ordinary = { state: "approved", role: "lead_team", domain: "gamer" };
  assert.equal(domain.canOpen(ordinary, "creators"), false);
  assert.equal(domain.canOpen(ordinary, "gamer-leads"), true);
  assert.equal(domain.workspaceHome(ordinary), "/partner-workspace/gamer-leads");
  const lead = {
    name: "Synthetic",
    socials: [
      {
        platform: "instagram",
        handle: "@SYNTHETIC",
        url: "https://instagram.com/synthetic",
        followers: 10,
      },
    ],
  };
  assert.equal(domain.leadSchema.parse(lead).socials[0].handle, "synthetic");
  assert.equal(domain.leadSchema.safeParse({ ...lead, role: "admin" }).success, false);
  assert.equal(
    domain.leadSchema.safeParse({
      ...lead,
      socials: [{ ...lead.socials[0], url: "javascript:alert(1)" }],
    }).success,
    false,
  );
  assert.equal(
    domain
      .assignmentDeadline(
        "2026-11-01T00:00:00Z",
        86400,
        "2026-11-05T00:00:00Z",
        Date.parse("2026-11-07T00:00:00Z"),
      )
      .toISOString(),
    "2026-11-11T00:00:00.000Z",
  );
  assert.equal(domain.csvCell("=1+1"), '"\'=1+1"');
});

test("CSV preserves quoted data and original rows while rejecting ownership and broken input", () => {
  const { parseLeadCsv } = load("src/lib/partner-workspace/import.ts");
  const rows = parseLeadCsv(
    'name,platform,handle,url,followers,notes\r\n"Creator, Example",instagram,synthetic,https://instagram.com/synthetic,1.2k,"Line one\nLine two"\r\nBad,instagram,,invalid,0,no',
  );
  assert.equal(rows[0].lead.followers, undefined);
  assert.equal(rows[0].lead.socials[0].followers, 1200);
  assert.equal(rows[0].lead.name, "Creator, Example");
  assert.equal(rows[1].row, 3);
  assert.equal(rows[1].lead, null);
  assert.throws(() => parseLeadCsv("name,handle,role\nTest,test,admin"), /Remove role/);
  assert.throws(() => parseLeadCsv('name,handle\n"Bad,test'), /unclosed/);
});

test("native controller rejects cross-site, invalid payloads, unauthenticated and restricted memberships", async () => {
  const { ApiError } = load("src/lib/partner-workspace/server/access.ts");
  let authCalls = 0,
    state = "approved",
    authError = null;
  const route = load("src/app/api/partner-workspace/[operation]/route.ts", {
    "@/lib/partner-workspace/server/access": {
      ApiError,
      authenticate: async () => {
        authCalls++;
        if (authError) throw authError;
        return { db: {}, user: {} };
      },
      resolveAccess: async () => ({ state }),
    },
    "@/lib/partner-workspace/server/operations": {
      operate: async (_, __, ___, access) => {
        if (access.state !== "approved") throw new ApiError(403, "ACCESS_RESTRICTED", "Restricted");
        return {};
      },
    },
  });
  const request = (headers = {}, body = "{}") =>
    new Request("http://127.0.0.1:3000/api/partner-workspace/dashboard", {
      method: "POST",
      headers: { "x-aa-rpc": "1", "content-type": "application/json", ...headers },
      body,
    });
  const params = { params: Promise.resolve({ operation: "dashboard" }) };
  assert.equal((await route.POST(request({ origin: "https://evil.example" }), params)).status, 403);
  assert.equal(authCalls, 0);
  assert.equal((await route.POST(request({}, "{"), params)).status, 400);
  assert.equal((await route.POST(request({}, " ".repeat(524289)), params)).status, 413);
  authError = new ApiError(401, "SIGN_IN_REQUIRED", "Sign in");
  assert.equal((await route.POST(request(), params)).status, 401);
  authError = new ApiError(503, "AUTH_UNAVAILABLE", "Retry");
  assert.equal((await route.POST(request(), params)).status, 503);
  authError = null;
  state = "pending";
  assert.equal((await route.POST(request(), params)).status, 403);
  state = "approved";
  assert.equal((await route.POST(request(), params)).status, 200);
});

test("access resolver distinguishes missing, pending, disabled and schema failures without trusting metadata roles", async () => {
  const { resolveAccess } = load("src/lib/partner-workspace/server/access.ts");
  const user = {
    id: ids[0],
    email: "synthetic@example.test",
    user_metadata: { role: "admin", full_name: "Synthetic" },
  };
  function database(membership, account, error = null) {
    return {
      from(table) {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return table === "cm365_memberships"
              ? { data: membership, error }
              : { data: account, error: null };
          },
        };
      },
    };
  }
  assert.equal((await resolveAccess(database(null, null), user)).state, "missing");
  assert.equal(
    (await resolveAccess(database({ role: "admin", status: "pending" }, null), user)).state,
    "pending",
  );
  assert.equal(
    (await resolveAccess(database({ role: "admin", status: "approved" }, { active: false }), user))
      .state,
    "disabled",
  );
  assert.equal(
    (
      await resolveAccess(
        database({ role: "influencer", status: "approved" }, { id: ids[1], active: true }),
        user,
      )
    ).state,
    "disabled",
  );
  const approved = await resolveAccess(
    database(
      { role: "lead_team", status: "approved" },
      { id: ids[1], active: true, lead_domain: "gamer" },
    ),
    user,
  );
  assert.equal(approved.state, "approved");
  assert.equal(approved.role, "lead_team");
  assert.equal(approved.domain, "gamer");
  for (const account of [{ id: ids[1], active: "false" }, { active: true }]) {
    assert.equal(
      (await resolveAccess(database({ role: "admin", status: "approved" }, account), user)).state,
      "disabled",
    );
  }
  await assert.rejects(
    resolveAccess(
      database(null, null, { code: "PGRST205", message: "private schema detail" }),
      user,
    ),
    (e) => e.code === "SCHEMA_REQUIRED" && !e.message.includes("private schema"),
  );
  await assert.rejects(
    resolveAccess(database(null, null, { message: "fetch failed" }), user),
    (e) => e.code === "DATABASE_UNAVAILABLE",
  );
});

test("workspace authentication rejects missing sessions, revoked tokens, mismatched projects and provider outages", async () => {
  let authResponse = { data: { user: null }, error: { status: 401 } },
    calls = 0;
  const env = {
    SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
    NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic",
  };
  const access = load(
    "src/lib/partner-workspace/server/access.ts",
    {
      "@supabase/supabase-js": {
        createClient() {
          calls++;
          return {
            auth: {
              async getUser() {
                if (authResponse.throw) throw new Error("private network detail");
                return authResponse;
              },
            },
          };
        },
      },
    },
    { process: { env } },
  );
  const request = (token) =>
    new Request("https://local.test", {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  await assert.rejects(access.authenticate(request()), (e) => e.status === 401);
  assert.equal(calls, 0);
  await assert.rejects(
    access.authenticate(request("revoked")),
    (e) => e.code === "SESSION_EXPIRED",
  );
  authResponse = { data: { user: null }, error: { status: 0, name: "AuthRetryableFetchError" } };
  await assert.rejects(
    access.authenticate(request("synthetic")),
    (e) => e.status === 503 && e.code === "AUTH_UNAVAILABLE",
  );
  authResponse = { data: { user: { id: ids[0] } }, error: null };
  assert.equal((await access.authenticate(request("synthetic"))).user.id, ids[0]);
  authResponse = { throw: true };
  await assert.rejects(
    access.authenticate(request("synthetic")),
    (e) => e.code === "AUTH_UNAVAILABLE" && !e.message.includes("private network"),
  );
  env.CM365_EXPECTED_MASTER_REF = "bbbbbbbbbbbbbbbbbbbb";
  await assert.rejects(
    access.authenticate(request("synthetic")),
    (e) => e.code === "CONFIGURATION_REQUIRED",
  );
});
