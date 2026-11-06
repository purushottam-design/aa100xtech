const assert = require("node:assert/strict");
const fs = require("node:fs");
const { test } = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const load = require("./helpers/load-server.cjs");

test("only an independently signed matching STATUS success can settle the actual booking transaction", async () => {
  const db = await PGlite.create();
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE TABLE consultation_bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id text UNIQUE,amount integer,currency text DEFAULT 'INR',razorpay_order_id text,razorpay_payment_id text,payment_status text DEFAULT 'PENDING',booking_status text DEFAULT 'PENDING',created_at timestamptz DEFAULT now());`);
    for (const file of [
      "20261026120000_dual_gateway_tracking.sql",
      "20261027150000_icici_uat_checkouts.sql",
    ])
      await db.exec(fs.readFileSync("supabase/migrations/" + file, "utf8"));
    const id = "00000000-0000-4000-8000-000000000001";
    await db.exec(`INSERT INTO consultation_bookings(booking_id,amount,payment_gateway,gateway_order_id) VALUES('UAT-FIXTURE',2500,'icici','ICFIXTURE');
      INSERT INTO icici_uat_checkouts(id,token_hash,booking_data,amount_paise,merchant_reference,booking_id,gateway,state) VALUES('${id}','${"a".repeat(64)}','{}',250000,'ICFIXTURE','UAT-FIXTURE','icici','pending');`);
    const secret = "fixture-secret";
    const env = {
      ICICI_UAT_ENABLED: "true",
      ICICI_UAT_MERCHANT_CONFIRMED: "true",
      ICICI_ENVIRONMENT: "uat",
      ICICI_SIGNING_MODE: "sorted-fields",
      ICICI_MERCHANT_ID: "fixture-merchant",
      ICICI_SECRET_KEY: secret,
      ICICI_RETURN_URL: "https://uat.example.test/api/payments/icici/callback",
    };
    const signing = load("src/lib/icici-signing.server.ts");
    let response = {
        responseCode: "0000",
        txnID: "TXN1",
        amount: "2500.00",
        currencyCode: "356",
        txnStatus: "SUC",
        txnResponseCode: "0000",
      },
      validSignature = false;
    let settlements = 0;
    const client = {
      rpc: async (_name, input) => {
        settlements++;
        await db.query("SELECT settle_icici_uat_checkout($1,$2,$3,$4,$5)", [
          input.checkout_uuid,
          input.merchant_ref,
          input.transaction_ref,
          input.verified_amount_paise,
          input.verified_status,
        ]);
        return { error: null };
      },
    };
    const server = load(
      "src/lib/icici-checkout.server.ts",
      {
        "@/integrations/supabase/client.server": { supabaseAdmin: client },
        "@/lib/payment-database.server": { paymentAdmin: client },
        "@/lib/backend/handlers/consultations": {},
      },
      {
        process: { env },
        fetch: async (url, options) => {
          assert.equal(url, "https://pgpayuat.icicibank.com/tsp/pg/api/command?reqType=JSON");
          const request = Object.fromEntries(new URLSearchParams(options.body));
          assert.equal(request.transactionType, "STATUS");
          assert.equal(request.originalTxnNo, "ICFIXTURE");
          const data = {
            merchantId: env.ICICI_MERCHANT_ID,
            merchantTxnNo: "ICFIXTURE",
            ...response,
          };
          return Response.json({
            ...data,
            secureHash: validSignature ? signing.signSortedFields(data, secret) : "0".repeat(64),
          });
        },
      },
    );
    const checkout = {
      id,
      merchant_reference: "ICFIXTURE",
      amount_paise: 250000,
      booking_id: "UAT-FIXTURE",
      gateway: "icici",
      gateway_transaction_id: null,
    };
    const status = async () =>
      (
        await db.query(
          "SELECT payment_status,booking_status,gateway_transaction_id FROM consultation_bookings",
        )
      ).rows[0];
    await assert.rejects(server.reconcileIciciCheckout(checkout), /could not be verified/);
    assert.equal(settlements, 0);
    assert.equal((await status()).payment_status, "PENDING");
    validSignature = true;
    response = { ...response, amount: "1.00" };
    await assert.rejects(server.reconcileIciciCheckout(checkout), /does not match/);
    assert.equal(settlements, 0);
    response = { ...response, amount: "2500.00", txnStatus: "REQ" };
    await server.reconcileIciciCheckout(checkout);
    assert.equal((await status()).payment_status, "PENDING");
    response = { ...response, txnStatus: "SUC" };
    await server.reconcileIciciCheckout(checkout, "TXN1");
    assert.deepEqual(await status(), {
      payment_status: "PAID",
      booking_status: "CONFIRMED",
      gateway_transaction_id: "TXN1",
    });
    await server.reconcileIciciCheckout(checkout, "TXN1");
    response = { ...response, txnStatus: "REJ" };
    await server.reconcileIciciCheckout(checkout, "TXN1");
    assert.equal((await status()).payment_status, "PAID");
  } finally {
    await db.close();
  }
});
