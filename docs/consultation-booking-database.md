# Restore consultation booking persistence

## Duplicate submission protection

The live audit found two rows with identical submitted details: `CONS-86E088F681` and `CONS-7FF461D40C`, created 29.69 seconds apart with different Razorpay order IDs. Neither is paid. Matching details are evidence of possible repeated submission, not permission to delete or merge bookings; both records and their external orders were preserved.

The former handler generated a fresh random booking ID for every request. Its React `creating` state prevented many clicks while a request was active but did not identify a retry after completion, lost response, reload or a return to the form. No evidence establishes that React Strict Mode itself triggered the reported requests.

The corrected submission flow adds:

- A synchronous ref guard before any asynchronous work, alongside the existing disabled/loading button. A revision guard ignores a response from a dialog that has since been reset.
- One random UUID request key per normalized set of booking details. The browser retains only a SHA-256 digest of the details and the random key in session storage, not the form's personal data. Unchanged retries reuse the key across reloads; changed details get a new intent. Completing/dismissing a confirmed booking clears the saved intent so another intentional booking remains possible. If session storage is unavailable, the in-memory key still protects retries during that component lifetime.
- A required `idempotencyKey` UUID in `createConsultationBooking` input, separate from the unchanged base form schema. The website supplies it automatically. Existing custom API clients must supply and reuse one UUID for retries of one booking. ICICI's shared Razorpay handler uses its existing checkout UUID as the key.
- A deterministic `CONS-...` ID from that key. The table's **existing UNIQUE `booking_id` constraint** atomically reserves one intent across concurrent requests and server instances. No new migration or schema column is needed. A duplicate insert reads the saved row and compares every submitted/plan field; it never overwrites it.
- If an order is already saved, a replay returns that same booking ID/order ID. If preparation is unconfirmed, it returns `ok:false`, `BOOKING_PREPARATION_PENDING` and the same booking ID, without another gateway order request. Paid/refunded bookings cannot restart payment. Reusing a key with different details returns `IDEMPOTENCY_CONFLICT`.

A gateway failure or ambiguous interrupted preparation keeps the one pending row reserved. It is deliberately not retried against the bank automatically; check the same booking or contact support to reconcile it. A network retry must not replace its key simply because an HTTP request failed. HTTP 200 remains the existing RPC envelope status: callers must inspect `data.ok` and the returned code rather than infer booking/payment success from HTTP status alone.

Implementation: `src/lib/consultation-submission.ts` owns browser retry identity; `src/lib/consultation-idempotency.server.ts` derives the database reservation ID and compares payloads; the existing consultation provider and backend handler use them. `getRazorpayCheckoutKeyId()` exposes only the existing public checkout key for order reuse; bank API calls and signing algorithms are unchanged. No merchant secrets reach the browser. UI markup, plan prices and existing payment feedback are preserved.

### Verification

All 66 automated tests, nine payment browser tests, TypeScript, production build and targeted lint passed. Tests cover simultaneous inserts against actual isolated PostgreSQL, one order attempt, stable replay IDs, conflicting payloads, completed payments, interrupted preparation, browser reload identity, same-tick double clicks and returning to unchanged form details. The existing Razorpay/ICICI tests still pass.

Against the live Supabase database, a temporary production-build server blocked every gateway request. Two simultaneous API requests plus a retry retained exactly **one** synthetic booking, `CONS-02ADE208FAD7E0D0FE50B096`, INR 2,500, PENDING/PENDING, no gateway order. The first gateway attempt was blocked only after an independent read confirmed the row existed; subsequent requests did not attempt the gateway again. All responses returned the same booking ID. A changed-payload replay returned `IDEMPOTENCY_CONFLICT`. That synthetic row was retained for inspection; no real order or payment was created.

Server Supabase access succeeds. The separate `SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` health checks still return `401 Invalid API key`; these are independent of successful server bookings. Provider-tracking columns remain absent (`42703`), the ICICI checkout table remains absent (`PGRST205`), and its signing/confirmation flags remain unset. Follow the existing manual configuration steps below for browser authentication and ICICI UAT. The deduplication fix needs **no SQL migration**.

## Live verification after the repair (2026-10-27)

The owner applied the SQL repair. The service-role REST schema now exposes `public.consultation_bookings` and its required base columns, including GET/POST/PATCH permissions. The server credentials authenticate successfully. Initial requests encountered a temporary timeout; subsequent schema, insert and read checks succeeded. The verification script now distinguishes network/certificate/credential failures from missing-schema errors instead of recommending a migration for every connection failure.

Two deliberately synthetic pending rows were retained:

| Test | Booking ID | Result |
| --- | --- | --- |
| Direct database insertion plus independent retrieval | `CONS-VERIFY-1e528fcca2eb49ba8d35` | Persisted; INR 2,500; PENDING/PENDING; no gateway order |
| Actual production-build Next.js booking API against the live database | `CONS-03469CAFB0` | Persisted; INR 2,500; PENDING/PENDING; no gateway order |

For the second check, a temporary server process blocked **all** gateway requests before they could reach either bank. Its interceptor queried Supabase at the moment the Razorpay order call was attempted and verified that the complete pending booking already existed. The application correctly returned `GATEWAY_UNAVAILABLE` for that intentionally blocked gateway, rather than reporting checkout success. A subsequent independent database read found the saved booking. A forged payment signature was rejected by the real verification API and left the booking unconfirmed. The temporary interceptor is not application code and is not deployed.

Razorpay's configured runtime credentials were checked with the documented read-only `GET /v1/orders?count=1` endpoint: HTTP 200. Only response status was inspected; no customer/order data was printed, no order was created, and no payment or refund was initiated. Reference: [Razorpay Fetch All Orders](https://razorpay.com/docs/api/orders/fetch-all/).

All 62 automated tests, eight payment browser tests, production build, TypeScript and targeted lint passed. Tests cover successful server-verified settlement, invalid signatures, amount/currency/reference mismatches, missing records, replay protection and database failures. Successful payment settlement was tested with local fixtures/isolated PostgreSQL, not a real charge. Existing UI, consultation pricing and application features are preserved.

Remaining manual configuration:

- `SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` currently return `401 Invalid API key`. Replace both with a valid **public** key for the same configured project; rebuild/restart for browser settings. Never put the server key into either variable.
- Provider-neutral columns are still absent (`42703`), and `icici_uat_checkouts` is absent (`PGRST205`). Apply `20261026120000_dual_gateway_tracking.sql`, then `20261027150000_icici_uat_checkouts.sql`, only if not already applied. The base consultation migration does not replace these.
- ICICI is correctly unavailable. Its sandbox credentials are populated but unverified; `ICICI_SIGNING_MODE`, `ICICI_RETURN_URL`, `ICICI_UAT_ENABLED`, `ICICI_UAT_MERCHANT_CONFIRMED` and `ICICI_UAT_TESTS_PASSED` are unset. Follow `docs/icici-uat.md` after bank confirmation. Production ICICI remains disabled. No ICICI bank request was made.

## Cause and table choice

The configured project's live administrative REST schema exposes `public.bookings` but not `public.consultation_bookings`. A zero-row administrative query of the latter returns `404 / PGRST205`. The current server key authenticates successfully; the table is missing from the configured project's exposed schema, rather than an insert being rejected by row-level security. REST alone cannot distinguish a physically missing table from one hidden by missing grants or a stale schema cache. Historical consultation migrations exist in this repository but do not establish that this project's consultation table is available. The repair handles creation, server grants and schema reload safely.

The live `bookings` schema requires `user_id` and has fields such as `reference`, `service_title`, `booking_date`, `booking_time` and contact details. It lacks the dedicated consultation plan/category/duration, company/country/timezone/meeting-platform fields, Razorpay signature and provider-neutral tracking. Mapping the guest consultation flow to it would require inventing a user association or changing its schema and the existing booking model. It is left untouched.

Previously, the backend performed a best-effort table check, proceeded to Razorpay even after a database error, ignored failed inserts, and returned `ok: true`. Payment verification also allowed a missing booking to return `paid` without any persisted confirmation. These fallbacks are removed.

The corrected flow is:

1. Validate the existing form and derive the existing server-side plan price.
2. Insert a complete pending consultation and require its returned database row to match the booking ID, amount, currency and pending states.
3. Only then call the existing Razorpay order function.
4. Persist the order ID on that same pending row and require the returned row to match before returning checkout information.
5. Verify payment against the persisted row and confirm only after a successful database settlement. Missing/unreadable records remain unconfirmed; the customer must check status/contact support before paying again.

Database failures return safe failure messages without customer details, raw SQL errors or credentials in logs. A gateway or order-link failure retains the pending booking; no row is deleted. The Razorpay SDK, signature algorithm, API credentials, pricing and UI are preserved. The ICICI UAT flow continues to reserve and persist its booking before its existing bank call; its activation gates remain unchanged.

## Exact Supabase SQL Editor steps

1. Open the Supabase Dashboard and select the project whose **Project URL matches `SUPABASE_URL`** in your server environment. Do not paste server keys into chat, browser code or SQL.
2. Open **SQL Editor → New query**. Use the project's administrative `postgres` role, on the primary database.
3. Paste the entire contents of `supabase/migrations/20261027160000_restore_consultation_bookings.sql` and click **Run**. Run the complete transaction together.
4. This creates only the missing consultation table, its constraints, indexes, timestamp trigger and server-only access. RLS is enabled on the new table, with no public/client policies: guest submissions go through the validated server endpoint, and admin retrieval uses the existing server authentication/RBAC boundary. If the consultation table already exists physically, the repair enables RLS and restores server CRUD grants without replacing its columns, rows or policies. `public.bookings`, its records and policies are not changed. Running this repair again preserves existing consultation rows and policies.
5. In a new query, verify the relation and RLS without reading any customer data:

```sql
SELECT to_regclass('public.consultation_bookings') AS consultation_table;
SELECT relrowsecurity
FROM pg_class
WHERE oid = 'public.consultation_bookings'::regclass;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'consultation_bookings'
ORDER BY ordinal_position;
```

6. The repair already runs `NOTIFY pgrst, 'reload schema';`. Allow a few seconds for REST schema refresh. If the table exists in SQL but REST still returns PGRST205, run that notification again, then verify that `public` is in the project's Data API exposed schemas. Keep RLS enabled.
7. For provider-neutral tracking and ICICI UAT, apply `20261026120000_dual_gateway_tracking.sql` **only if not already applied**, followed by `20261027150000_icici_uat_checkouts.sql` **only if not already applied**. Restore the missing base table first, regardless of filename timestamp order. Those existing migrations intentionally stop on duplicate transaction references instead of deleting or rewriting historical payments. Inspect their migration state before running them; do not replay the repository's historical base-schema migrations or reset the database.
8. Restart the Next.js server after any environment change. Use a valid `SUPABASE_SERVICE_ROLE_KEY` for that same project, only on the server. The latest read-only check accepted this server key. Separately, the configured publishable key returned `401 Invalid API key`; replace matching public/server publishable settings with a valid public key for this project if browser authentication requires it. Do not replace any public variable with the server key.

## Persistence verification without charging a customer

The repair does not create a fake successful payment or alter any existing booking. To smoke-test the table in SQL Editor without retaining test rows, run this transaction; the final rollback is intentional:

```sql
BEGIN;
INSERT INTO public.consultation_bookings (
  booking_id, customer_name, email, phone, country, service,
  plan_id, consultation_plan, consultation_type, duration, amount,
  preferred_date, preferred_time, timezone, meeting_platform, project_description
) VALUES (
  'CONS-DBTEST-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  'Database smoke test', 'database-test@example.test', '+910000000000', 'India',
  'Website Development', 'quick', 'Quick Consultation', 'standard', '15 Minutes', 2500,
  CURRENT_DATE + 7, '10:00', 'Asia/Kolkata', 'Google Meet', 'Synthetic persistence check only'
) RETURNING booking_id, amount, currency, payment_status, booking_status;

SELECT booking_id, amount, currency, payment_status, booking_status
FROM public.consultation_bookings
WHERE booking_id LIKE 'CONS-DBTEST-%' AND email = 'database-test@example.test';
ROLLBACK;
```

For **durable end-to-end** verification, use a dedicated test deployment/database and Razorpay test keys. Submit the unchanged form once; inspect the exact returned booking ID using:

```sql
SELECT booking_id, amount, currency, razorpay_order_id, payment_status, booking_status
FROM public.consultation_bookings
WHERE booking_id = '<the returned booking ID>';
```

Before checkout, the row must exist, contain the returned order ID and remain `PENDING/PENDING`. No payment is needed to verify this persistence step. Complete a bank-provided test instrument only if testing settlement; the final row must then become `PAID/CONFIRMED` once. Never claim live persistence from an intercepted browser response or from the rollback-only SQL check above.

For a durable **database-only** test without invoking either payment gateway, the repository also includes:

```powershell
# Read-only schema/access check:
node --use-system-ca scripts/verify-consultation-booking-db.cjs
# Explicitly insert and independently retrieve one synthetic pending booking:
node --use-system-ca scripts/verify-consultation-booking-db.cjs --write-test
```

The write test deliberately retains its synthetic row and prints its exact booking ID, database ID and pending states after a separate successful read. It never creates a gateway order or claims payment success. Existing records are never removed. `--use-system-ca` is for this machine's Node 24 certificate environment; TLS verification remains enabled.

This workspace has a valid REST service key, but no PostgreSQL connection string/password or Supabase Management API token. REST access does not provide a DDL endpoint. The project owner applied the SQL Editor repair, after which live persistence was verified as described above. No existing live booking rows were modified; only the two explicitly synthetic pending test bookings were inserted.

## Implementation and checks

- `src/lib/backend/handlers/consultations.ts`: persist-before-gateway creation, durable order linking, safe database diagnostics, and no successful verification without a saved/confirmed booking.
- `src/components/consultation-booking.tsx`: preparation failures use an accurate warning label without printing the error payload; existing markup, form values and pricing are unchanged.
- `src/lib/icici-routes.server.ts`: preserve request context when invoking shared booking handlers so optional account association also works from ICICI's checkout routes.
- `supabase/migrations/20261027160000_restore_consultation_bookings.sql`: repeatable base-table/access repair; existing provider-tracking and UAT migrations remain separate and compatible.
- `scripts/verify-consultation-booking-db.cjs`: read-only schema check or explicit synthetic insert followed by an independent read, without gateway calls.
- Booking/payment unit and browser tests: isolated PostgreSQL insert, read, order link and settlement; RLS and rerun safety; failures before/after gateway creation; form retention and no checkout on storage failure.

All 62 automated tests, eight payment browser tests, production build, TypeScript and targeted lint passed. Persistence was verified in isolated PostgreSQL and, after the owner's SQL repair, against the actual configured Supabase project and Next.js booking API, with gateway requests blocked as described above.
