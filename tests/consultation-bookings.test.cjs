const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");
const plans = load("src/data/consultations.ts");
const repair = fs.readFileSync(
  "supabase/migrations/20261027160000_restore_consultation_bookings.sql",
  "utf8",
);
const form = {
  idempotencyKey: "00000000-0000-4000-8000-000000000001",
  planId: "quick",
  fullName: "Synthetic Customer",
  companyName: "",
  email: "booking-test@example.test",
  phone: "+910000000000",
  country: "India",
  service: plans.consultationServices[0],
  preferredDate: "2027-01-01",
  preferredTime: "11:00",
  timezone: "Asia/Kolkata",
  meetingPlatform: "Google Meet",
  projectDescription: "Synthetic persisted consultation test.",
};

async function database() {
  const db = await PGlite.create();
  await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reference text NOT NULL, user_id uuid NOT NULL);
    INSERT INTO public.bookings(reference,user_id) VALUES ('EXISTING-KEEP','00000000-0000-4000-8000-000000000001');`);
  await db.exec(repair);
  return db;
}

// Translate the handler's actual Supabase query chain to isolated PostgreSQL.
// No mock success is returned: INSERT/UPDATE/SELECT and constraints execute in SQL.
function handler(
  db,
  { insertError = null, linkError = null, readError = null, gatewayFailure = false } = {},
) {
  const warnings = [];
  let gatewayCalls = 0,
    paymentReads = 0,
    sequence = 0;
  const identifier = (name) => {
    assert.match(name, /^[a-z_]+$/);
    return `"${name}"`;
  };
  const client = {
    from(table) {
      assert.equal(table, "consultation_bookings");
      let action = "read",
        payload,
        columns = "*";
      const filters = [];
      const q = {
        insert(value) {
          action = "insert";
          payload = value;
          return q;
        },
        update(value) {
          action = "update";
          payload = value;
          return q;
        },
        select(value = "*") {
          columns = value;
          return q;
        },
        eq(key, value) {
          filters.push([key, "=", value]);
          return q;
        },
        neq(key, value) {
          filters.push([key, "<>", value]);
          return q;
        },
        is(key, value) {
          assert.equal(value, null);
          filters.push([key, "IS NULL"]);
          return q;
        },
        single() {
          return execute(true);
        },
        maybeSingle() {
          return execute(false);
        },
        then(resolve, reject) {
          return execute(false).then(resolve, reject);
        },
      };
      async function execute(single) {
        const failure =
          action === "insert" ? insertError : action === "update" ? linkError : readError;
        if (failure) return { data: null, error: failure };
        const values = [];
        const param = (value) => {
          values.push(value);
          return `$${values.length}`;
        };
        const returning =
          columns === "*"
            ? "*"
            : columns
                .split(",")
                .map((s) => identifier(s.trim()))
                .join(",");
        let sql;
        if (action === "insert") {
          const entries = Object.entries(payload);
          sql = `INSERT INTO consultation_bookings(${entries.map(([key]) => identifier(key)).join(",")}) VALUES (${entries.map(([, value]) => param(value)).join(",")}) RETURNING ${returning}`;
        } else {
          const assignments =
            action === "update"
              ? Object.entries(payload)
                  .map(([key, value]) => `${identifier(key)}=${param(value)}`)
                  .join(",")
              : "";
          const where =
            filters
              .map(
                ([key, operator, value]) =>
                  `${identifier(key)} ${operator}${operator === "IS NULL" ? "" : " " + param(value)}`,
              )
              .join(" AND ") || "true";
          sql =
            action === "read"
              ? `SELECT ${returning} FROM consultation_bookings WHERE ${where}`
              : `UPDATE consultation_bookings SET ${assignments} WHERE ${where} RETURNING ${returning}`;
        }
        try {
          const result = await db.query(sql, values);
          // Match PostgREST's date serialization instead of the direct driver's Date.
          if (result.rows[0]?.preferred_date instanceof Date)
            result.rows[0].preferred_date = result.rows[0].preferred_date
              .toISOString()
              .slice(0, 10);
          return {
            data: result.rows[0] ?? null,
            error: single && !result.rows.length ? { code: "PGRST116" } : null,
          };
        } catch (error) {
          return { data: null, error };
        }
      }
      return q;
    },
  };
  const api = load(
    "src/lib/backend/handlers/consultations.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: client },
      "@/lib/payment-database.server": {
        associatePaymentCustomer: async () => {},
      },
      "@/lib/consultations.server": {
        getRazorpayCheckoutKeyId: () => "rzp_test_fixture",
        generateBookingId: () => `CONS-PERSIST${++sequence}`,
        createRazorpayOrder: async (input) => {
          gatewayCalls++;
          const { rows } = await db.query(
            "SELECT * FROM consultation_bookings WHERE booking_id=$1",
            [input.receipt],
          );
          assert.equal(
            rows.length,
            1,
            "A real database row must already exist when the gateway is called",
          );
          assert.equal(rows[0].payment_status, "PENDING");
          assert.equal(rows[0].razorpay_order_id, null);
          assert.equal(rows[0].amount * 100, input.amountInPaise);
          return gatewayFailure
            ? {
                ok: false,
                code: "GATEWAY_UNAVAILABLE",
                message: "Gateway unavailable",
              }
            : {
                ok: true,
                id: `order_persist${gatewayCalls}`,
                amount: input.amountInPaise,
                currency: "INR",
                keyId: "rzp_test_fixture",
              };
        },
        verifyRazorpaySignature: () => true,
        fetchRazorpayPayment: async (paymentId) => {
          paymentReads++;
          return {
            id: paymentId,
            order_id: "order_persist1",
            status: "captured",
            amount: 250000,
            currency: "INR",
          };
        },
      },
    },
    {
      console: {
        warn: (...values) => warnings.push(values.join(" ")),
        error() {
          assert.fail("No raw database error logs");
        },
      },
    },
  );
  return {
    api,
    warnings,
    create: (patch = {}) => api.createConsultationBooking({ data: { ...form, ...patch } }),
    gatewayCalls: () => gatewayCalls,
    paymentReads: () => paymentReads,
  };
}

test("consultation repair preserves bookings and existing consultations, and enforces private server CRUD", async () => {
  const db = await database();
  try {
    const h = handler(db);
    const created = await h.create();
    assert.equal(created.ok, true);
    await db.exec(repair);
    assert.equal(
      (await db.query("SELECT reference FROM bookings")).rows[0].reference,
      "EXISTING-KEEP",
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM consultation_bookings")).rows[0].n,
      1,
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(
        db.query("SELECT email FROM consultation_bookings"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("UPDATE consultation_bookings SET amount=1"),
        /permission denied/,
      );
      await db.exec("RESET ROLE");
    }
    await db.exec("SET ROLE service_role");
    assert.equal(
      (await db.query("SELECT booking_id FROM consultation_bookings")).rows[0].booking_id,
      created.bookingId,
    );
    await db.exec("RESET ROLE");
    assert.equal(
      (
        await db.query(
          "SELECT relrowsecurity AS rls FROM pg_class WHERE oid='consultation_bookings'::regclass",
        )
      ).rows[0].rls,
      true,
    );
    await db.exec(
      fs.readFileSync("supabase/migrations/20261026120000_dual_gateway_tracking.sql", "utf8"),
    );
    await db.exec(
      fs.readFileSync("supabase/migrations/20261027150000_icici_uat_checkouts.sql", "utf8"),
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM consultation_bookings")).rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});

test("backend persists and retrieves the exact pending booking and order before returning success", async () => {
  const db = await database();
  try {
    await db.exec("SET ROLE service_role");
    const h = handler(db);
    const result = await h.create();
    assert.equal(result.ok, true);
    assert.equal(h.gatewayCalls(), 1);
    const { rows } = await db.query("SELECT * FROM consultation_bookings WHERE booking_id=$1", [
      result.bookingId,
    ]);
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row.customer_name, form.fullName);
    assert.equal(row.email, form.email);
    assert.equal(row.meeting_platform, form.meetingPlatform);
    assert.equal(row.timezone, form.timezone);
    assert.equal(row.razorpay_order_id, result.orderId);
    assert.equal(row.amount, 2500);
    assert.equal(result.amount, 250000);
    assert.equal(row.payment_status, "PENDING");
    assert.equal(row.booking_status, "PENDING");
    const verified = await h.api.verifyConsultationPayment({
      data: {
        bookingId: result.bookingId,
        razorpayOrderId: result.orderId,
        razorpayPaymentId: "pay_persist1",
        razorpaySignature: "fixture-signature",
      },
    });
    assert.equal(verified.status, "paid");
    const paid = (
      await db.query(
        "SELECT payment_status,booking_status FROM consultation_bookings WHERE booking_id=$1",
        [result.bookingId],
      )
    ).rows[0];
    assert.deepEqual(paid, {
      payment_status: "PAID",
      booking_status: "CONFIRMED",
    });
  } finally {
    await db.close();
  }
});

test("missing tables, RLS/constraint errors and missing returning rows cannot start a gateway or report success", async () => {
  const db = await database();
  try {
    for (const code of ["PGRST205", "42501", "23514"]) {
      const h = handler(db, {
        insertError: {
          code,
          message: "sensitive-value",
          details: "sensitive-value",
        },
      });
      const result = await h.create();
      assert.equal(result.ok, false);
      assert.equal(result.code, "BOOKING_STORAGE_UNAVAILABLE");
      assert.equal(h.gatewayCalls(), 0);
      assert.doesNotMatch(JSON.stringify([result, h.warnings]), /sensitive-value/);
    }
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM consultation_bookings")).rows[0].n,
      0,
    );
  } finally {
    await db.close();
  }
});

test("gateway and order-link failures preserve pending records and never expose payable order details", async () => {
  for (const options of [
    { gatewayFailure: true },
    { linkError: { code: "42501", message: "sensitive-value" } },
  ]) {
    const db = await database();
    try {
      const h = handler(db, options);
      const result = await h.create();
      assert.equal(result.ok, false);
      assert.equal("orderId" in result, false);
      assert.equal(h.gatewayCalls(), 1);
      const row = (await db.query("SELECT * FROM consultation_bookings")).rows[0];
      assert.equal(row.payment_status, "PENDING");
      assert.equal(row.booking_status, "PENDING");
      assert.equal(row.razorpay_order_id, null);
    } finally {
      await db.close();
    }
  }
});

test("database read failures cannot return successful booking/payment confirmation", async () => {
  const db = await database();
  try {
    const h = handler(db, {
      readError: { code: "PGRST205", message: "sensitive-value" },
    });
    await assert.rejects(
      h.api.verifyConsultationPayment({
        data: {
          bookingId: "CONS-NOT-SAVED",
          razorpayOrderId: "order_persist1",
          razorpayPaymentId: "pay_persist1",
          razorpaySignature: "fixture-signature",
        },
      }),
      /Payment confirmation is pending/,
    );
    assert.equal(h.paymentReads(), 0);
    assert.doesNotMatch(JSON.stringify(h.warnings), /sensitive-value/);
  } finally {
    await db.close();
  }
});

test("concurrent duplicate submissions reserve one booking and create only one gateway order", async () => {
  const db = await database();
  try {
    const h = handler(db);
    const results = await Promise.all([h.create(), h.create()]);
    assert.equal(h.gatewayCalls(), 1);
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM consultation_bookings")).rows[0].n,
      1,
    );
    assert.equal(results[0].bookingId, results[1].bookingId);
    assert.ok(results.some((result) => result.ok));
    const replay = await h.create();
    const original = results.find((result) => result.ok);
    assert.equal(replay.ok, true);
    assert.equal(replay.bookingId, original.bookingId);
    assert.equal(replay.orderId, original.orderId);
    assert.equal(h.gatewayCalls(), 1);
  } finally {
    await db.close();
  }
});

test("the same request key cannot overwrite details or create another paid booking", async () => {
  const db = await database();
  try {
    const h = handler(db);
    const created = await h.create();
    const conflict = await h.create({
      projectDescription: "Different details must use a new booking intent.",
    });
    assert.equal(conflict.ok, false);
    assert.equal(conflict.code, "IDEMPOTENCY_CONFLICT");
    assert.equal(h.gatewayCalls(), 1);
    await h.api.verifyConsultationPayment({
      data: {
        bookingId: created.bookingId,
        razorpayOrderId: created.orderId,
        razorpayPaymentId: "pay_persist1",
        razorpaySignature: "fixture-signature",
      },
    });
    const paidReplay = await h.create();
    assert.equal(paidReplay.ok, false);
    assert.equal(paidReplay.code, "BOOKING_ALREADY_PAID");
    assert.equal(paidReplay.bookingId, created.bookingId);
    assert.equal(h.gatewayCalls(), 1);
    const intentional = await h.create({
      idempotencyKey: "10000000-0000-4000-8000-000000000002",
    });
    assert.equal(intentional.ok, true);
    assert.notEqual(intentional.bookingId, created.bookingId);
  } finally {
    await db.close();
  }
});

test("a failed or ambiguous order attempt reuses its booking without issuing another gateway request", async () => {
  const db = await database();
  try {
    const h = handler(db, { gatewayFailure: true });
    const failed = await h.create();
    const repeated = await h.create();
    assert.equal(failed.ok, false);
    assert.equal(repeated.ok, false);
    assert.equal(repeated.code, "BOOKING_PREPARATION_PENDING");
    assert.equal(failed.bookingId, repeated.bookingId);
    assert.equal(h.gatewayCalls(), 1);
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM consultation_bookings")).rows[0].n,
      1,
    );
    await assert.rejects(h.create({ idempotencyKey: undefined }));
    assert.equal(h.gatewayCalls(), 1);
  } finally {
    await db.close();
  }
});

test("browser retry keys survive reloads without storing customer form data", async () => {
  const storage = new Map();
  const globals = {
    crypto: require("node:crypto").webcrypto,
    TextEncoder,
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
  };
  const client = load("src/lib/consultation-submission.ts", {}, globals);
  const details = JSON.stringify({
    name: "private-customer-name",
    email: "private@example.test",
  });
  const first = await client.consultationAttempt(details, null);
  assert.equal((await client.consultationAttempt(details, first)).key, first.key);
  const reloaded = load("src/lib/consultation-submission.ts", {}, globals);
  assert.equal((await reloaded.consultationAttempt(details, null)).key, first.key);
  assert.doesNotMatch([...storage.values()].join(""), /private/);
  assert.notEqual((await client.consultationAttempt(details + "changed", first)).key, first.key);
  client.clearConsultationAttempt();
  assert.equal(storage.size, 0);
});
