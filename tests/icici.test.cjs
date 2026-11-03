const assert = require("node:assert/strict");
const { createHmac, webcrypto } = require("node:crypto");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const fs = require("node:fs");
const load = require("./helpers/load-server.cjs");
const signing = load("src/lib/icici-signing.server.ts");
const secret = "local-fixture-secret";
const env = {
  ICICI_UAT_ENABLED: "true",
  ICICI_UAT_MERCHANT_CONFIRMED: "true",
  ICICI_SIGNING_MODE: "sorted-fields",
  ICICI_ENVIRONMENT: "uat",
  ICICI_MERCHANT_ID: "fixture-merchant",
  ICICI_AGGREGATOR_ID: "fixture-aggregator",
  ICICI_SECRET_KEY: secret,
  ICICI_RETURN_URL: "https://uat.example.test/api/payments/icici/callback",
};
function bankHarness(mode = "sorted-fields", responses = []) {
  const calls = [];
  const bank = load(
    "src/lib/icici.server.ts",
    {},
    {
      process: { env: { ...env, ICICI_SIGNING_MODE: mode } },
      fetch: async (url, options) => {
        calls.push({ url, options });
        const next = responses.shift();
        if (next instanceof Error) throw next;
        const data = {
          merchantId: env.ICICI_MERCHANT_ID,
          aggregatorID: env.ICICI_AGGREGATOR_ID,
          merchantTxnNo: "IC123456789012345678",
          ...next,
        };
        const requestIsForm =
          options.headers["content-type"] === "application/x-www-form-urlencoded";
        if (mode === "json-v2" && !requestIsForm) {
          const { body, hash } = signing.signMinifiedJson(data, secret);
          return new Response(body, { headers: { securehash: hash } });
        }
        return Response.json({
          ...data,
          secureHash: signing.signSortedFields(data, secret),
        });
      },
    },
  );
  return { bank, calls };
}

test("transaction hashes match the supplied Web Crypto logic and change with transaction data", async () => {
  const payload = {
    txnDate: "20241121115413",
    transactionType: "SALE",
    returnURL: "http://localhost:3000/consultation",
    payType: 0,
    merchantTxnNo: "757588587575",
    merchantId: "T_S00017",
    customerName: "Narayan",
    customerMobileNo: "917709356362",
    customerEmailID: "narayan.kapase@phicommerce.com",
    currencyCode: "356",
    amount: "100.00",
    aggregatorID: "A100000000007164",
    addlParam2: "111",
    addlParam1: "000",
    secureHash: "excluded",
  };
  const encoder = new TextEncoder();
  const key = await webcrypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const text = Object.keys(payload)
    .sort()
    .filter((key) => key !== "secureHash")
    .map((key) => payload[key])
    .join("");
  const expected = Buffer.from(
    await webcrypto.subtle.sign("HMAC", key, encoder.encode(text)),
  ).toString("hex");
  const bank = bankHarness().bank;
  assert.equal(bank.generateSecureHash(payload, secret), expected);
  assert.equal(
    JSON.parse(signing.signedJson(payload, secret, "sorted-fields").body).secureHash,
    expected,
  );
  for (const patch of [
    { merchantTxnNo: "NEXT1" },
    { amount: "101.00" },
    { txnDate: "20241121115414" },
  ])
    assert.notEqual(bank.generateSecureHash({ ...payload, ...patch }, secret), expected);
});

test("localhost consultation return is allowed only in development with matching origin", () => {
  const local = {
    ...env,
    NODE_ENV: "development",
    ICICI_RETURN_URL: "http://localhost:3000/consultation",
  };
  const bank = load("src/lib/icici.server.ts", {}, { process: { env: local } });
  const config = bank.iciciUatConfig();
  assert.equal(config.returnURL, local.ICICI_RETURN_URL);
  const origin = load("src/lib/icici-origin.server.ts", {}, { process: { env: local } });
  origin.assertIciciOrigin(
    new Request("http://localhost:3000/api/payments/icici/initiate"),
    config.origin,
  );
  assert.throws(() =>
    origin.assertIciciOrigin(new Request("http://attacker.test/"), config.origin),
  );
  for (const patch of [
    { NODE_ENV: "production" },
    { ICICI_RETURN_URL: "http://attacker.test/consultation" },
    { ICICI_RETURN_URL: "http://localhost:3000/consultation?forged=1" },
  ]) {
    const invalid = load(
      "src/lib/icici.server.ts",
      {},
      { process: { env: { ...local, ...patch } } },
    );
    assert.throws(() => invalid.iciciUatConfig());
  }
});

test("local consultation bank POST rewrites to verified callback while page GET renders normally", () => {
  const { NextRequest } = require("next/server");
  const { proxy } = load(
    "src/proxy.ts",
    {},
    {
      process: {
        env: {
          NODE_ENV: "development",
          ICICI_RETURN_URL: "http://localhost:3000/consultation",
        },
      },
    },
  );
  const post = new NextRequest("http://localhost:3000/consultation?forged=1", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "merchantTxnNo=REF1&secureHash=untrusted",
  });
  assert.equal(
    proxy(post).headers.get("x-middleware-rewrite"),
    "http://localhost:3000/api/payments/icici/callback",
  );
  assert.equal(
    proxy(new NextRequest("http://localhost:3000/consultation")).headers.get(
      "x-middleware-rewrite",
    ),
    null,
  );
});

test("ICICI signing modes have independent preimages, transport and verification without fallback", () => {
  const input = {
    z: "₹ café",
    a: "100.00",
    nested: { z: 1, a: 2 },
    zero: 0,
    flag: false,
    empty: "",
    nil: null,
  };
  const sortedPreimage = '100.00false{"z":1,"a":2}₹ café0';
  assert.equal(
    signing.signSortedFields(input, secret),
    createHmac("sha256", secret).update(sortedPreimage).digest("hex"),
  );
  const raw = signing.signMinifiedJson(input, secret);
  assert.equal(raw.body, JSON.stringify(input));
  assert.equal(raw.hash, createHmac("sha256", secret).update(JSON.stringify(input)).digest("hex"));
  assert.notEqual(raw.hash, signing.signSortedFields(input, secret));
  const first = signing.signedJson(input, secret, "sorted-fields");
  assert.equal(first.headers.securehash, undefined);
  assert.equal(JSON.parse(first.body).secureHash, signing.signSortedFields(input, secret));
  const second = signing.signedJson(input, secret, "json-v2");
  assert.equal(second.headers.securehash, raw.hash);
  assert.equal(Object.hasOwn(JSON.parse(second.body), "secureHash"), false);
  assert.equal(
    signing.verifyJsonResponse(input, new Headers({ securehash: raw.hash }), secret, "json-v2"),
    true,
  );
  assert.equal(
    signing.verifyJsonResponse(
      { ...input, secureHash: signing.signSortedFields(input, secret) },
      new Headers(),
      secret,
      "json-v2",
    ),
    false,
  );
  assert.equal(
    signing.verifyJsonResponse(
      input,
      new Headers({ securehash: raw.hash }),
      secret,
      "sorted-fields",
    ),
    false,
  );
  assert.throws(
    () => signing.signMinifiedJson({ ...input, secureHash: "any" }, secret),
    /must not contain/,
  );
  assert.equal(signing.sameHash(raw.hash, raw.hash.toUpperCase()), false);
  assert.notEqual(
    signing.signSortedFields(input, secret),
    signing.signSortedFields({ ...input, unknownBankField: "included" }, secret),
  );
});

test("ICICI configuration is UAT-only, explicitly confirmed and never inferred from API version", () => {
  for (const patch of [
    { ICICI_UAT_ENABLED: "false" },
    { ICICI_UAT_MERCHANT_CONFIRMED: "false" },
    { ICICI_SIGNING_MODE: "" },
    { ICICI_SIGNING_MODE: "auto" },
    { ICICI_ENVIRONMENT: "production" },
    { ICICI_SECRET_KEY: "" },
    { ICICI_RETURN_URL: "http://uat.example.test/api/payments/icici/callback" },
    {
      ICICI_RETURN_URL: "https://uat.example.test/api/payments/icici/callback?attacker=1",
    },
    { ICICI_BASE_URL: "https://pgpay.icicibank.com/pg/api/v2/initiateSale" },
  ]) {
    const bank = load("src/lib/icici.server.ts", {}, { process: { env: { ...env, ...patch } } });
    assert.throws(() => bank.iciciUatConfig());
  }
  for (const mode of ["sorted-fields", "json-v2"])
    assert.equal(bankHarness(mode).bank.iciciUatConfig().mode, mode);
});

for (const mode of ["sorted-fields", "json-v2"]) {
  test(`ICICI ${mode} initiates only hosted UAT with the server amount and a verified allowlisted redirect`, async () => {
    const h = bankHarness(mode, [
      {
        responseCode: "R1000",
        showOTPCapturePage: "N",
        redirectURI: "https://pgpayuat.icicibank.com/tsp/pg/api/v2/authRedirect",
        tranCtx: "opaque-context",
      },
    ]);
    const result = await h.bank.initiateIciciSale({
      reference: "IC123456789012345678",
      amountPaise: 2_000_000,
      email: "synthetic@example.test",
      name: "Synthetic Tester",
      phone: "917709356362",
    });
    assert.equal(
      result.redirectUrl,
      "https://pgpayuat.icicibank.com/tsp/pg/api/v2/authRedirect?tranCtx=opaque-context",
    );
    const request = JSON.parse(h.calls[0].options.body);
    assert.equal(request.amount, "20000.00");
    assert.equal(request.currencyCode, "356");
    assert.equal(request.payType, 0);
    assert.equal(request.customerMobileNo, "917709356362");
    if (mode === "sorted-fields")
      assert.equal(request.secureHash, signing.signSortedFields(request, secret));
    assert.equal(request.returnURL, env.ICICI_RETURN_URL);
    assert.match(request.txnDate, /^\d{14}$/);
    assert.match(h.calls[0].url, /^https:\/\/pgpayuat\.icicibank\.com\//);
    assert.equal(h.calls[0].options.redirect, "error");
    assert.equal(
      mode === "json-v2"
        ? Object.hasOwn(request, "secureHash")
        : Object.hasOwn(h.calls[0].options.headers, "securehash"),
      false,
    );
    const bad = bankHarness(mode, [
      {
        responseCode: "R1000",
        redirectURI: "https://attacker.test/checkout",
        tranCtx: "context",
      },
    ]);
    await assert.rejects(
      bad.bank.initiateIciciSale({
        reference: "IC123456789012345678",
        amountPaise: 100,
        email: "test@example.test",
        name: "Test",
      }),
      /could not be verified/,
    );
    const failed = bankHarness(mode, [new Error("contains-sensitive-bank-details")]);
    await assert.rejects(
      failed.bank.initiateIciciSale({
        reference: "IC123456789012345678",
        amountPaise: 100,
        email: "test@example.test",
        name: "Test",
      }),
      (error) => !error.message.includes("sensitive"),
    );
    assert.equal(failed.calls.length, 1, "No retry and no signing-mode fallback");
  });
}

test("ICICI STATUS success requires independent signed matching transaction, amount and success codes", async () => {
  const valid = {
    responseCode: "000",
    txnStatus: "SUC",
    txnResponseCode: "0000",
    txnID: "TXN123",
    amount: "20000.00",
    transactionType: "SALE",
  };
  for (const mode of ["sorted-fields", "json-v2"]) {
    const h = bankHarness(mode, [{ ...valid }]);
    const result = await h.bank.queryIciciStatus({
      reference: "IC123456789012345678",
      amountPaise: 2_000_000,
    });
    assert.equal(result.status, "paid");
    const form = new URLSearchParams(h.calls[0].options.body);
    assert.equal(h.calls[0].options.headers["content-type"], "application/x-www-form-urlencoded");
    assert.equal(form.get("transactionType"), "STATUS");
    assert.equal(form.get("originalTxnNo"), "IC123456789012345678");
    assert.equal(form.get("merchantTxnNo"), form.get("originalTxnNo"));
    assert.equal(
      form.get("secureHash"),
      signing.signSortedFields(Object.fromEntries(form), secret),
    );
  }
  for (const patch of [
    { merchantId: "other" },
    { aggregatorID: "other" },
    { merchantTxnNo: "other" },
    { amount: "0.01" },
    { currencyCode: "840" },
    { txnID: "" },
    { transactionType: "REFUND" },
  ]) {
    const h = bankHarness("sorted-fields", [{ ...valid, ...patch }]);
    await assert.rejects(
      h.bank.queryIciciStatus({
        reference: "IC123456789012345678",
        amountPaise: 2_000_000,
      }),
    );
  }
  for (const [patch, expected] of [
    [{ txnStatus: "REQ", txnResponseCode: "P0030" }, "pending"],
    [{ txnStatus: "ERR", txnResponseCode: "P9100" }, "pending"],
    [{ responseCode: "R1000" }, "pending"],
    [{ txnStatus: "SUC", txnResponseCode: "039" }, "pending"],
    [{ txnStatus: "REJ", txnResponseCode: "039" }, "failed"],
  ]) {
    const h = bankHarness("sorted-fields", [{ ...valid, ...patch }]);
    assert.equal(
      (
        await h.bank.queryIciciStatus({
          reference: "IC123456789012345678",
          amountPaise: 2_000_000,
        })
      ).status,
      expected,
    );
  }
});

test("ICICI form callbacks include unknown POST fields in signatures and reject tampering", () => {
  const { bank } = bankHarness("json-v2");
  const fields = {
    merchantId: env.ICICI_MERCHANT_ID,
    aggregatorID: env.ICICI_AGGREGATOR_ID,
    merchantTxnNo: "IC123456789012345678",
    responseCode: "0000",
    txnID: "TXN123",
    futureField: "must-sign",
  };
  const signed = {
    ...fields,
    secureHash: signing.signSortedFields(fields, secret),
  };
  assert.equal(bank.verifyIciciCallback(signed), fields.merchantTxnNo);
  assert.throws(
    () => bank.verifyIciciCallback({ ...signed, futureField: "changed" }),
    /could not be verified/,
  );
  assert.throws(
    () => bank.verifyIciciCallback({ ...signed, merchantTxnNo: "another" }),
    /could not be verified/,
  );
});

const bookingFixture = {
  planId: "premium",
  fullName: "Synthetic Tester",
  companyName: "",
  email: "synthetic@example.test",
  phone: "+910000000000",
  country: "India",
  service: "Website Development",
  preferredDate: "2027-01-01",
  preferredTime: "11:00",
  timezone: "Asia/Kolkata",
  meetingPlatform: "Google Meet",
  projectDescription: "Synthetic booking used only in offline tests.",
};
function checkoutHarness({ initiationFails = false } = {}) {
  const sessions = new Map(),
    bookings = new Map();
  let bankStarts = 0,
    razorpayStarts = 0,
    statusChecks = 0;
  const bank = bankHarness().bank;
  const database = {
    from(table) {
      const store = table === "icici_uat_checkouts" ? sessions : bookings;
      const filters = [];
      let action = "read",
        payload,
        many = false;
      const query = {
        select() {
          return query;
        },
        limit() {
          return query;
        },
        abortSignal() {
          return query;
        },
        eq(k, v) {
          filters.push((row) => row[k] === v);
          return query;
        },
        neq(k, v) {
          filters.push((row) => row[k] !== v);
          return query;
        },
        upsert(value) {
          action = "upsert";
          payload = value;
          return query;
        },
        insert(value) {
          action = "insert";
          payload = value;
          return query;
        },
        update(value) {
          action = "update";
          payload = value;
          return query;
        },
        maybeSingle() {
          return execute();
        },
        then(resolve, reject) {
          many = true;
          return execute().then(resolve, reject);
        },
      };
      async function execute() {
        let row;
        if (action === "upsert") {
          row = store.get(payload.id);
          if (!row) {
            row = {
              currency: "INR",
              state: "ready",
              gateway: null,
              booking_id: null,
              gateway_order_id: null,
              gateway_transaction_id: null,
              redirect_url: null,
              expires_at: new Date(Date.now() + 3600000).toISOString(),
              ...payload,
            };
            store.set(row.id, row);
            // PostgreSQL jsonb does not preserve the client's key order.
            row.booking_data = Object.fromEntries(Object.entries(row.booking_data).sort());
          }
        } else if (action === "insert") {
          row = { ...payload };
          store.set(payload.booking_id, row);
        } else {
          row = [...store.values()].find((value) => filters.every((filter) => filter(value)));
          if (row && action === "update") Object.assign(row, payload);
        }
        const cloned = row ? JSON.parse(JSON.stringify(row)) : null;
        return { data: many ? (cloned ? [cloned] : []) : cloned, error: null };
      }
      return query;
    },
    rpc: async (_name, input) => {
      const row = sessions.get(input.checkout_uuid);
      row.state = input.verified_status;
      row.gateway_transaction_id = input.transaction_ref;
      return { data: true, error: null };
    },
  };
  const api = load(
    "src/lib/icici-checkout.server.ts",
    {
      "@/integrations/supabase/client.server": { supabaseAdmin: database },
      "@/lib/payment-database.server": { paymentAdmin: database },
      "@/lib/backend/handlers/consultations": {
        createConsultationBooking: async () => {
          razorpayStarts++;
          return {
            ok: true,
            bookingId: "RPBOOK1",
            orderId: "order_existing",
            amount: 2000000,
            currency: "INR",
            keyId: "rzp_test_fixture",
            planName: "Premium Strategy Session",
            duration: "1.5 Hours",
          };
        },
      },
      "@/lib/icici.server": {
        ...bank,
        initiateIciciSale: async () => {
          bankStarts++;
          if (initiationFails) throw new bank.IciciPaymentError("ICICI_STATUS_UNKNOWN", "Pending");
          return {
            redirectUrl:
              "https://pgpayuat.icicibank.com/tsp/pg/api/v2/authRedirect?tranCtx=fixture",
          };
        },
        queryIciciStatus: async () => {
          statusChecks++;
          return { status: "pending", transactionId: null };
        },
      },
    },
    { process: { env: { ...env, RAZORPAY_KEY_ID: "rzp_test_fixture" } } },
  );
  return {
    api,
    sessions,
    bookings,
    counts: () => ({ bankStarts, razorpayStarts, statusChecks }),
  };
}
const capability = {
  id: "00000000-0000-4000-8000-000000000001",
  token: "b".repeat(64),
};

test("ICICI checkout reservation prevents concurrent charges, provider switching and repeat initiation", async () => {
  const h = checkoutHarness();
  // Use a real supported service name, retaining the rest of the synthetic booking.
  const plans = load("src/data/consultations.ts");
  const booking = { ...bookingFixture, service: plans.consultationServices[0] };
  const prepared = await h.api.prepareCheckout({
    ...capability,
    booking,
    amount: 1,
  });
  assert.equal(prepared.amount_paise, 2_000_000);
  const calls = await Promise.allSettled([
    h.api.startCheckout({ ...capability, gateway: "icici" }),
    h.api.startCheckout({ ...capability, gateway: "icici" }),
  ]);
  assert.equal(calls.filter((result) => result.status === "fulfilled").length, 1);
  assert.deepEqual(h.counts(), {
    bankStarts: 1,
    razorpayStarts: 0,
    statusChecks: 0,
  });
  await h.api.startCheckout({ ...capability, gateway: "icici" });
  assert.equal(h.counts().bankStarts, 1);
  await assert.rejects(
    h.api.startCheckout({ ...capability, gateway: "razorpay" }),
    /already started/,
  );
  await assert.rejects(
    h.api.readCheckout({ ...capability, token: "c".repeat(64) }),
    /could not be found/,
  );
  await assert.rejects(
    h.api.prepareCheckout({
      ...capability,
      booking: { ...booking, planId: "quick" },
    }),
    /different booking details/,
  );
});

test("an ambiguous ICICI initiation is reconciled without issuing a second bank request", async () => {
  const h = checkoutHarness({ initiationFails: true });
  const plans = load("src/data/consultations.ts");
  await h.api.prepareCheckout({
    ...capability,
    booking: { ...bookingFixture, service: plans.consultationServices[0] },
  });
  await assert.rejects(h.api.startCheckout({ ...capability, gateway: "icici" }), /Pending/);
  assert.equal(h.sessions.get(capability.id).state, "initiating");
  const retry = await h.api.startCheckout({ ...capability, gateway: "icici" });
  assert.equal(retry.pending, true);
  await h.api.checkoutStatus(capability);
  assert.deepEqual(h.counts(), {
    bankStarts: 1,
    razorpayStarts: 0,
    statusChecks: 1,
  });
});

test("ICICI callback route ignores query claims, rejects duplicate fields and acknowledges advice only after reconciliation", async () => {
  const bank = bankHarness().bank;
  const received = [];
  let reconciliationFails = false;
  const routes = load("src/lib/icici-routes.server.ts", {
    "@/lib/icici.server": bank,
    "@/lib/icici-checkout.server": {
      checkoutForBankReference: async (reference) => ({
        id: capability.id,
        gateway: "icici",
        amount_paise: 2000000,
        merchant_reference: reference,
      }),
      reconcileIciciCheckout: async (checkout, transaction) => {
        if (reconciliationFails)
          throw new bank.IciciPaymentError("ICICI_STATUS_UNKNOWN", "Status pending");
        received.push([checkout.merchant_reference, transaction]);
      },
    },
  });
  const fields = {
    merchantId: env.ICICI_MERCHANT_ID,
    aggregatorID: env.ICICI_AGGREGATOR_ID,
    merchantTxnNo: "IC123456789012345678",
    responseCode: "0000",
    txnID: "TXN1",
    amount: "20000.00",
  };
  const form = new URLSearchParams({
    ...fields,
    secureHash: signing.signSortedFields(fields, secret),
  }).toString();
  const request = (body) =>
    new Request(
      "https://uat.example.test/api/payments/icici/callback?responseCode=paid&merchantTxnNo=forged",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
  const callback = await routes.receiveIciciCallback(request(form));
  assert.equal(callback.status, 303);
  assert.equal(
    new URL(callback.headers.get("location")).searchParams.get("icici_return"),
    capability.id,
  );
  assert.deepEqual(received, [[fields.merchantTxnNo, "TXN1"]]);
  assert.equal((await routes.receiveIciciCallback(request(form + "&txnID=duplicate"))).status, 400);
  assert.equal(
    (await routes.receiveIciciCallback(request(form.replace("20000.00", "1.00")))).status,
    400,
  );
  assert.equal((await routes.receiveIciciCallback(request(form), true)).status, 200);
  reconciliationFails = true;
  assert.equal((await routes.receiveIciciCallback(request(form))).status, 303);
  assert.equal((await routes.receiveIciciCallback(request(form), true)).status, 503);
});

test("ICICI checkout migration enforces private storage, atomic settlement and replay protection", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE TABLE public.consultation_bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id text UNIQUE, amount integer, currency text DEFAULT 'INR', razorpay_order_id text, razorpay_payment_id text, payment_status text DEFAULT 'PENDING', booking_status text DEFAULT 'PENDING', created_at timestamptz DEFAULT now());`);
    await db.exec(
      fs.readFileSync("supabase/migrations/20261026120000_dual_gateway_tracking.sql", "utf8"),
    );
    await db.exec(
      fs.readFileSync("supabase/migrations/20261027150000_icici_uat_checkouts.sql", "utf8"),
    );
    const id = "00000000-0000-4000-8000-000000000001";
    await db.exec(`INSERT INTO consultation_bookings(booking_id,amount,payment_gateway,gateway_order_id) VALUES ('BOOK1',20000,'icici','REF1');
      INSERT INTO icici_uat_checkouts(id,token_hash,booking_data,amount_paise,merchant_reference,booking_id,gateway,state) VALUES ('${id}','${"a".repeat(64)}','{}',2000000,'REF1','BOOK1','icici','pending');`);
    const settle = (txn, amount, status) =>
      db.query("SELECT settle_icici_uat_checkout($1,'REF1',$2,$3,$4) AS changed", [
        id,
        txn,
        amount,
        status,
      ]);
    await assert.rejects(settle("TXN1", 100, "paid"), /does not match/);
    assert.equal((await settle("TXN1", 2_000_000, "paid")).rows[0].changed, true);
    assert.equal((await settle("TXN1", 2_000_000, "paid")).rows[0].changed, false);
    await assert.rejects(settle("TXN2", 2_000_000, "paid"), /cannot be replaced/);
    await settle("TXN1", 2_000_000, "failed");
    const booking = (
      await db.query(
        "SELECT payment_status,booking_status,gateway_transaction_id FROM consultation_bookings WHERE booking_id='BOOK1'",
      )
    ).rows[0];
    assert.deepEqual(booking, {
      payment_status: "PAID",
      booking_status: "CONFIRMED",
      gateway_transaction_id: "TXN1",
    });
    await assert.rejects(
      db.exec("UPDATE icici_uat_checkouts SET state='pending' WHERE merchant_reference='REF1'"),
      /settled checkout/,
    );
    await assert.rejects(
      db.exec("UPDATE icici_uat_checkouts SET gateway='razorpay' WHERE merchant_reference='REF1'"),
      /cannot change provider/,
    );
    const secondId = "10000000-0000-4000-8000-000000000002";
    await db.exec(`INSERT INTO consultation_bookings(booking_id,amount,payment_gateway,gateway_order_id) VALUES ('BOOK2',20000,'icici','REF2');
      INSERT INTO icici_uat_checkouts(id,token_hash,booking_data,amount_paise,merchant_reference,booking_id,gateway,state) VALUES ('${secondId}','${"d".repeat(64)}','{}',2000000,'REF2','BOOK2','icici','pending');`);
    await assert.rejects(
      db.query("SELECT settle_icici_uat_checkout($1,'REF2','TXN1',2000000,'paid')", [secondId]),
      /duplicate key/,
    );
    assert.equal(
      (await db.query("SELECT payment_status FROM consultation_bookings WHERE booking_id='BOOK2'"))
        .rows[0].payment_status,
      "PENDING",
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`SET ROLE ${role}`);
      await assert.rejects(db.query("SELECT * FROM icici_uat_checkouts"), /permission denied/);
      await assert.rejects(settle("TXN1", 2_000_000, "paid"), /permission denied/);
      await db.exec("RESET ROLE");
    }
  } finally {
    await db.close();
  }
});
