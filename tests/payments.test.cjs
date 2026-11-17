const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { createHmac } = require("node:crypto");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const ts = require("typescript");

function load(file, mocks = {}, globals = {}) {
  return require("./helpers/load-server.cjs")(file, mocks, {
    Request,
    Response,
    Headers,
    URL,
    Buffer,
    AbortSignal,
    console: { info() {}, error() {}, warn() {} },
    process: {
      env: {
        RAZORPAY_KEY_ID: "rzp_test_fixture",
        RAZORPAY_KEY_SECRET: "test-secret",
        RAZORPAY_CURRENCY: "INR",
        ICICI_ENABLED: "true",
        ICICI_ENVIRONMENT: "production",
      },
    },
    ...globals,
  });
}
const icici = load("src/lib/icici.server.ts");
test("ICICI supplied reference hash preserves exact sorting, serialization, zero, false and UTF-8 rules", () => {
  const input = {
    z: "₹ café",
    a: "100.50",
    b: { z: 1, a: 2 },
    secureHash: "ignored",
    n: null,
    omitted: undefined,
    c: false,
    d: 0,
  };
  const expected = createHmac("sha256", "test-secret")
    .update('100.50{"z":1,"a":2}false0₹ café', "utf8")
    .digest("hex");
  assert.equal(icici.generateSecureHash(input, "test-secret"), expected);
  assert.equal(icici.verifyReferenceSecureHash(input, expected, "test-secret"), true);
  for (const hash of ["", "bad", "0".repeat(64), expected.toUpperCase(), expected + "0"])
    assert.equal(icici.verifyReferenceSecureHash(input, hash, "test-secret"), false);
  assert.equal(
    icici.verifyReferenceSecureHash({ ...input, a: "200" }, expected, "test-secret"),
    false,
  );
  assert.notEqual(
    icici.generateSecureHash({ a: "100.00" }, "test-secret"),
    icici.generateSecureHash({ a: 100 }, "test-secret"),
  );
  assert.throws(() => icici.generateSecureHash({}, ""), /secret/);
  assert.equal(input.secureHash, "ignored", "Reference signing must not mutate caller data");
});
test("ICICI initiation, status and forged callbacks cannot become live from environment flags", async () => {
  for (const name of ["initiate", "status", "callback"]) {
    const route = load(`src/app/api/payments/icici/${name}/route.ts`, {
      "@/lib/icici.server": icici,
    });
    const request = new Request(`https://example.test/api/payments/icici/${name}`, {
      method: "POST",
      headers: { "x-aa-rpc": "1", origin: "https://example.test" },
      body: JSON.stringify({ paymentStatus: "SUCCESS", secureHash: "0".repeat(64) }),
    });
    const response = await route.POST(request);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "ICICI_INTEGRATION_NOT_VERIFIED");
  }
  assert.equal(
    icici.assertPaymentOrigin(
      new Request("https://example.test", {
        headers: { "x-aa-rpc": "1", origin: "https://attacker.test" },
      }),
    ).status,
    403,
  );
});
test("Razorpay order creation and existing signature algorithm retain their original API contract", async () => {
  const calls = [];
  const razorpay = load(
    "src/lib/consultations.server.ts",
    {},
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        return Response.json({ id: "order_test", amount: 250000, currency: "INR" });
      },
    },
  );
  const result = await razorpay.createRazorpayOrder({
    amountInPaise: 250000,
    receipt: "CONS-TEST1234",
    notes: { bookingId: "CONS-TEST1234", planId: "quick" },
  });
  assert.equal(result.ok, true);
  assert.equal(calls[0].url, "https://api.razorpay.com/v1/orders");
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    amount: 250000,
    currency: "INR",
    receipt: "CONS-TEST1234",
    notes: { bookingId: "CONS-TEST1234", planId: "quick" },
  });
  const signature = createHmac("sha256", "test-secret").update("order_test|pay_test").digest("hex");
  assert.equal(
    razorpay.verifyRazorpaySignature({ orderId: "order_test", paymentId: "pay_test", signature }),
    true,
  );
  assert.equal(
    razorpay.verifyRazorpaySignature({ orderId: "order_other", paymentId: "pay_test", signature }),
    false,
  );
});

const plans = load("src/data/consultations.ts");
const schemas = load("src/lib/consultations.schemas.ts");
const { createServerFn } = load("src/lib/backend/server.ts");
function paymentHarness({
  signatureValid = true,
  missing = false,
  paymentPatch = {},
  gatewayOrderPatch = {},
} = {}) {
  let booking = missing
    ? null
    : {
        booking_id: "CONS-TEST1234",
        razorpay_order_id: "order_test",
        razorpay_payment_id: null,
        payment_status: "PENDING",
        amount: 2500,
        currency: "INR",
      };
  const writes = [];
  const db = {
    from() {
      let patch,
        excludePaid = false;
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        neq(key, value) {
          if (key === "payment_status" && value === "PAID") excludePaid = true;
          return q;
        },
        update(value) {
          patch = value;
          return q;
        },
        async maybeSingle() {
          if (patch) {
            if (!booking || (excludePaid && booking.payment_status === "PAID"))
              return { data: null, error: null };
            writes.push(patch);
            booking = { ...booking, ...patch };
          }
          return { data: booking && { ...booking }, error: null };
        },
        then(resolve) {
          return q.maybeSingle().then(resolve);
        },
      };
      return q;
    },
  };
  const api = load("src/lib/backend/handlers/consultations.ts", {
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => ({ userId: "fixture-customer" }),
    },
    "@/lib/payment-database.server": { associatePaymentCustomer: async () => {} },
    "@/lib/backend/server": { createServerFn },
    "@/data/consultations": plans,
    "@/lib/consultations.schemas": schemas,
    "@/integrations/supabase/client.server": { supabaseAdmin: db },
    "@/lib/consultations.server": {
      verifyRazorpaySignature: () => signatureValid,
      fetchRazorpayPayment: async () => ({
        id: "pay_test",
        order_id: "order_test",
        status: "captured",
        amount: 250000,
        currency: "INR",
        ...paymentPatch,
      }),
      fetchRazorpayOrder: async () => ({
        id: "order_test",
        receipt: "CONS-TEST1234",
        amount: 250000,
        currency: "INR",
        notes: { bookingId: "CONS-TEST1234", planId: "quick" },
        ...gatewayOrderPatch,
      }),
    },
  });
  return {
    api,
    writes,
    verify: (patch = {}) =>
      api.verifyConsultationPayment({
        data: {
          bookingId: "CONS-TEST1234",
          razorpayOrderId: "order_test",
          razorpayPaymentId: "pay_test",
          razorpaySignature: "test_signature",
          ...patch,
        },
      }),
    get booking() {
      return booking;
    },
  };
}
test("verified captured Razorpay payment settles once; concurrent retries are idempotent", async () => {
  const h = paymentHarness();
  const results = await Promise.all([h.verify(), h.verify()]);
  assert.equal(h.writes.length, 1);
  assert.equal(h.booking.payment_status, "PAID");
  assert.equal(results.filter((r) => r.duplicate).length, 1);
  assert.ok(results.every((r) => r.status === "paid"));
  await assert.rejects(h.verify({ razorpayPaymentId: "pay_other" }), /different settled/);
});
test("invalid signatures, amounts, currency and order mismatch never settle or downgrade a booking", async () => {
  for (const options of [
    { signatureValid: false },
    { paymentPatch: { amount: 1 } },
    { paymentPatch: { currency: "USD" } },
    { paymentPatch: { order_id: "order_other" } },
  ]) {
    const h = paymentHarness(options);
    await assert.rejects(h.verify());
    assert.equal(h.writes.length, 0);
    assert.equal(h.booking.payment_status, "PENDING");
  }
});
test("authorized payments remain pending and verified failures remain failed", async () => {
  const pending = paymentHarness({ paymentPatch: { status: "authorized" } });
  assert.equal((await pending.verify()).status, "pending");
  assert.equal(pending.writes.length, 0);
  const failed = paymentHarness({ paymentPatch: { status: "failed" } });
  assert.equal((await failed.verify()).status, "failed");
  assert.equal(failed.booking.payment_status, "FAILED");
});
test("a missing persisted booking never returns a paid or confirmed response", async () => {
  const missing = paymentHarness({ missing: true });
  await assert.rejects(missing.verify(), /Booking records could not be loaded/);
  assert.equal(missing.writes.length, 0);
});

test("payment administration requires permission and maps legacy records without exposing signatures or contacts", async () => {
  const display = load("src/lib/payment-gateways.ts");
  let allowed = false;
  const row = {
    id: "row",
    booking_id: "CONS-LEGACY",
    customer_name: "Test Customer",
    email: "private@example.test",
    razorpay_signature: "private-signature",
    phone: "private-phone",
    amount: 2500,
    currency: "INR",
    razorpay_order_id: "order_legacy",
    razorpay_payment_id: "pay_legacy",
    payment_status: "PAID",
    created_at: "2026-01-01",
    updated_at: "2026-01-02",
  };
  const q = {
    select() {
      return q;
    },
    order() {
      return q;
    },
    async range() {
      return { data: [row], error: null };
    },
  };
  class AccessError extends Error {
    status = 403;
  }
  const api = load("src/lib/backend/handlers/payments.ts", {
    "@/lib/backend/server": { createServerFn },
    "@/integrations/supabase/auth-middleware": {
      requireSupabaseAuth: async () => ({ userId: "test-admin" }),
    },
    "@/lib/backend/request-context.server": { setResponseStatus() {} },
    "@/integrations/supabase/client.server": { supabaseAdmin: { from: () => q } },
    "@/lib/rbac.server": {
      AccessError,
      authorize: async () => {
        if (!allowed) throw new AccessError("Forbidden");
      },
    },
    "@/lib/payment-gateways": display,
  });
  await assert.rejects(api.listPayments({ data: {} }), /Forbidden/);
  allowed = true;
  const result = await api.listPayments({ data: { gateway: "razorpay" } });
  assert.equal(result.total, 1);
  assert.equal(result.rows[0].gateway, "razorpay");
  assert.equal(result.rows[0].transactionId, "pay_legacy");
  assert.equal(result.rows[0].customerId, null);
  for (const key of ["email", "phone", "razorpay_signature"])
    assert.equal(key in result.rows[0], false);
  assert.equal((await api.listPayments({ data: { gateway: "icici" } })).total, 0);
});

test("customer association trusts only a server-verified existing session and leaves guest checkout intact", async () => {
  let authorization = null;
  let verifiedUser = null;
  const updates = [];
  const association = load("src/lib/payment-database.server.ts", {
    "@/lib/backend/request-context.server": { getRequestHeader: () => authorization },
    "@/integrations/supabase/client.server": {
      supabaseAdmin: {
        auth: {
          getUser: async (token) => {
            assert.equal(token, "test-token");
            return { data: { user: verifiedUser }, error: null };
          },
        },
        from: () => ({
          update: (value) => ({
            eq: async (column, valueId) => {
              updates.push({ value, column, valueId });
              return { error: null };
            },
          }),
        }),
      },
    },
  });
  await association.associatePaymentCustomer("CONS-GUEST");
  assert.equal(updates.length, 0);
  authorization = "Bearer test-token";
  await association.associatePaymentCustomer("CONS-INVALID");
  assert.equal(updates.length, 0);
  verifiedUser = { id: "verified-account" };
  await association.associatePaymentCustomer("CONS-VALID");
  assert.deepEqual(JSON.parse(JSON.stringify(updates)), [
    { value: { customer_id: "verified-account" }, column: "booking_id", valueId: "CONS-VALID" },
  ]);
});

test("payment tracking migration preserves historical records and prevents settlement replacement across gateways", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE TABLE public.consultation_bookings(id uuid DEFAULT gen_random_uuid() PRIMARY KEY, booking_id text UNIQUE, customer_name text, amount integer, currency text DEFAULT 'INR', razorpay_order_id text, razorpay_payment_id text, razorpay_signature text, payment_status text DEFAULT 'PENDING', booking_status text DEFAULT 'PENDING', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
      INSERT INTO public.consultation_bookings(booking_id,amount,razorpay_order_id,razorpay_payment_id,payment_status,updated_at) VALUES ('OLD',2500,'order_old','pay_old','PAID','2026-01-01T00:00:00Z'), ('OLD-REFUND',2500,'order_old_refund','pay_old_refund','REFUNDED','2026-01-01T00:00:00Z');`);
    await db.exec(
      fs.readFileSync("supabase/migrations/20261026120000_dual_gateway_tracking.sql", "utf8"),
    );
    const old = (
      await db.query("SELECT * FROM public.consultation_bookings WHERE booking_id='OLD'")
    ).rows[0];
    assert.equal(old.amount, 2500);
    assert.equal(old.razorpay_payment_id, "pay_old");
    assert.equal(old.payment_status, "PAID");
    assert.equal(new Date(old.updated_at).toISOString(), "2026-01-01T00:00:00.000Z");
    await db.exec(
      "UPDATE public.consultation_bookings SET booking_status='CONFIRMED' WHERE booking_id='OLD'",
    );
    assert.equal(
      (await db.query("SELECT paid_at FROM public.consultation_bookings WHERE booking_id='OLD'"))
        .rows[0].paid_at,
      null,
      "An unknown historical payment date is never guessed",
    );
    await assert.rejects(
      db.exec(
        "UPDATE public.consultation_bookings SET payment_status='PAID' WHERE booking_id='OLD-REFUND'",
      ),
      /refunded payment/,
    );
    await db.exec(
      "INSERT INTO public.consultation_bookings(booking_id,amount,razorpay_order_id) VALUES ('NEW',2500,'order_new'); UPDATE public.consultation_bookings SET razorpay_payment_id='pay_new',payment_status='PAID' WHERE booking_id='NEW'",
    );
    const paid = (
      await db.query("SELECT * FROM public.consultation_bookings WHERE booking_id='NEW'")
    ).rows[0];
    assert.equal(paid.gateway_transaction_id, "pay_new");
    assert.equal(paid.gateway_order_id, "order_new");
    assert.ok(paid.paid_at);
    await assert.rejects(
      db.exec(
        "UPDATE public.consultation_bookings SET payment_status='FAILED' WHERE booking_id='NEW'",
      ),
      /settled payment/,
    );
    await assert.rejects(
      db.exec(
        "UPDATE public.consultation_bookings SET payment_gateway='icici',gateway_transaction_id='bank_other' WHERE booking_id='NEW'",
      ),
      /settled payment/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO public.consultation_bookings(booking_id,amount,razorpay_order_id,razorpay_payment_id,payment_status) VALUES ('DUPLICATE',2500,'order_new','pay_new','PAID')",
      ),
      /unique constraint/,
    );
    await assert.rejects(
      db.exec(
        "INSERT INTO public.consultation_bookings(booking_id,amount,payment_status) VALUES ('UNVERIFIED',2500,'PAID')",
      ),
      /verified gateway/,
    );
    await db.exec(
      "UPDATE public.consultation_bookings SET payment_status='REFUNDED' WHERE booking_id='NEW'",
    );
    await assert.rejects(
      db.exec(
        "UPDATE public.consultation_bookings SET payment_status='PAID' WHERE booking_id='NEW'",
      ),
      /refunded payment/,
    );
    await db.exec(
      "INSERT INTO public.consultation_bookings(booking_id,amount,payment_gateway,gateway_order_id) VALUES ('BANK-PENDING',2500,'icici','bank_order');",
    );
    assert.equal(
      (
        await db.query(
          "SELECT payment_status FROM public.consultation_bookings WHERE booking_id='BANK-PENDING'",
        )
      ).rows[0].payment_status,
      "PENDING",
    );
  } finally {
    await db.close();
  }
});
