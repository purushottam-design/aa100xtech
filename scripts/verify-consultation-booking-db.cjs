// Default: schema check only. --write-test intentionally retains one synthetic
// pending row and verifies it by a separate read. Never contacts either gateway.
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("node:crypto");
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch(input, init) {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_secret_") && headers.get("authorization") === `Bearer ${key}`)
          headers.delete("authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers, cache: "no-store" });
      },
    },
  });
  const columns = "id,booking_id,amount,currency,payment_status,booking_status,razorpay_order_id";
  const schema = await client
    .from("consultation_bookings")
    .select(columns)
    .limit(0)
    .abortSignal(AbortSignal.timeout(8000));
  if (schema.error) {
    let code = ["PGRST205", "42P01", "42501", "PGRST204", "42703"].includes(schema.error.code)
      ? schema.error.code
      : "UNAVAILABLE";
    const description = `${schema.error.message} ${schema.error.details}`;
    if (/Invalid API key|Invalid JWT/i.test(description)) code = "INVALID_CREDENTIALS";
    else if (/TimeoutError|AbortError|timed out/i.test(description)) code = "NETWORK_TIMEOUT";
    else if (/UNABLE_TO_VERIFY_LEAF_SIGNATURE|certificate/i.test(description)) code = "TLS_TRUST";
    const action = ["PGRST205", "42P01", "PGRST204", "42703"].includes(code)
      ? "Apply the repair to the configured project and reload the API schema."
      : code === "42501"
        ? "Verify the service role's table permissions."
        : "Check server credentials, certificate trust and network access; this result does not establish that the table is missing.";
    throw new Error(`Consultation schema check failed (${code}). ${action}`);
  }
  if (!process.argv.includes("--write-test")) {
    console.log(JSON.stringify({ ok: true, phase: "schema", wroteData: false }));
    return;
  }
  const bookingId = `CONS-VERIFY-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  const saved = await client
    .from("consultation_bookings")
    .insert({
      booking_id: bookingId,
      customer_name: "Database persistence test",
      email: "database-test@example.test",
      phone: "+910000000000",
      country: "India",
      service: "Website Development",
      plan_id: "quick",
      consultation_plan: "Quick Consultation",
      consultation_type: "standard",
      duration: "15 Minutes",
      amount: 2500,
      currency: "INR",
      preferred_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      preferred_time: "10:00",
      timezone: "Asia/Kolkata",
      meeting_platform: "Google Meet",
      project_description: "Synthetic persistence verification. No payment was initiated.",
      payment_status: "PENDING",
      booking_status: "PENDING",
    })
    .select(columns)
    .single()
    .abortSignal(AbortSignal.timeout(8000));
  if (saved.error || !saved.data)
    throw new Error(
      `The test write could not be confirmed. Check booking_id ${bookingId} before retrying; no payment was initiated.`,
    );
  const read = await client
    .from("consultation_bookings")
    .select(columns)
    .eq("booking_id", bookingId)
    .single()
    .abortSignal(AbortSignal.timeout(8000));
  if (
    read.error ||
    read.data?.id !== saved.data.id ||
    read.data.amount !== 2500 ||
    read.data.currency !== "INR" ||
    read.data.payment_status !== "PENDING" ||
    read.data.booking_status !== "PENDING" ||
    read.data.razorpay_order_id !== null
  )
    throw new Error(
      `The persisted row could not be verified. Check booking_id ${bookingId}; no payment was initiated.`,
    );
  console.log(
    JSON.stringify({
      ok: true,
      phase: "persisted-and-retrieved",
      bookingId,
      databaseId: read.data.id,
      amount: read.data.amount,
      currency: read.data.currency,
      paymentStatus: read.data.payment_status,
      bookingStatus: read.data.booking_status,
      paymentInitiated: false,
      syntheticRowRetained: true,
    }),
  );
}
main().catch((error) => {
  // Only our fixed messages are printed; never log a raw SDK error/URL/key.
  console.error(
    error instanceof Error &&
      /^(Set SUPABASE_|Consultation schema check failed|The test write could not|The persisted row could not)/.test(
        error.message,
      )
      ? error.message
      : "Database verification could not complete. Check server configuration, certificate trust and network access.",
  );
  process.exitCode = 1;
});
