# ICICI UAT verification - 2026-10-30

## Current outcome

Application checks pass; actual bank UAT has not been completed. The user
explicitly confirmed that merchant activation and callback registration have not
yet been confirmed by ICICI. `ICICI_UAT_MERCHANT_CONFIRMED=false` therefore remains
the current blocking configuration gate. Neither bank confirmation nor completed
UAT was fabricated.

## Database

The current configured Supabase project returns HTTP 200 for read-only,
`LIMIT 0` requests selecting every required booking/payment tracking column and
all 15 checkout columns. Its service-role OpenAPI schema contains both
`icici_uat_checkouts` and `/rpc/settle_icici_uat_checkout`. Database API readiness
now passes, unlike the preceding audit. No migration, table recreation, data
update or reset was needed or executed in this follow-up.

The migration ledger is not exposed by PostgREST (`406 PGRST106`). A service-role
API key does not provide arbitrary SQL execution. Exact read-only SQL for the
ledger, columns, indexes, constraints, triggers, RLS and function privileges is
provided in [supabase/diagnostics/icici_uat_readiness.sql](../supabase/diagnostics/icici_uat_readiness.sql).
Paste that complete file into Supabase SQL Editor for catalog verification. The
existing migrations already use transactions; do not rerun their plain CREATE
statements blindly. No new repair migration is indicated by current API probes.

## Prepared environment

The ignored `.env.local` contains these nonsecret settings. Merchant credentials
and Supabase server credentials remain in the existing `.env` unchanged:

```dotenv
ICICI_SIGNING_MODE=sorted-fields
ICICI_RETURN_URL=https://aa100xtech.com/api/payments/icici/callback
ICICI_UAT_ENABLED=true
ICICI_UAT_MERCHANT_CONFIRMED=false
ICICI_UAT_TESTS_PASSED=false
ICICI_UAT_TEST_MODE=true
```

Existing server configuration also supplies `ICICI_MERCHANT_ID`,
`ICICI_AGGREGATOR_ID`, `ICICI_SECRET_KEY`, `ICICI_ENVIRONMENT=sandbox`, the correct
optional `ICICI_BASE_URL`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. `uat`
is also a supported environment. Values of credentials are deliberately omitted.

The public HTTPS domain is real and was selected by the user. Both the main
domain and its Lovable preview redirect to the existing public application.
Live GET probes on that deployment return HTTP 500 for ICICI availability and
callback, and its HTML uses the older Vite-based application rather than the
local Next.js build. The selected callback is a deployment target, not an already
verified working endpoint. Deploy the Next.js server and its environment there
before bank registration/testing. A successful Next callback GET probe should
be HTTP 405 because the payment callback intentionally accepts POST only.

The running local Next.js server has loaded `.env.local` and returns the new
merchant-confirmation diagnostic. Restart development after future environment
changes if it does not reload; a hosted application needs its runtime settings
and a restart/redeployment. Plain HTTP localhost cannot match the callback.

## Protocol verification

- **Signing:** `icici-signing.server.ts` matches the Node.js reference PDF p3 and
  API guide p6. It excludes `secureHash`, sorts only top-level keys, skips
  null/undefined, JSON-stringifies nested arrays/objects in their original order,
  and uses UTF-8 HMAC-SHA256 with lowercase hexadecimal output. Zero and false
  are retained. Unknown response fields participate in verification. The
  existing implementation was kept; no signing-mode fallback was introduced.
- **Initiate Sale:** fixed documented HTTPS UAT v2 URL, `payType=0`, server-owned
  merchant reference, server-derived INR amount, currency code 356, customer
  email/name, transaction date, callback and signature. Aggregator ID is included
  when configured. `customerMobileNo` is optional in interface p9, so its omission
  is not a missing mandatory field.
- **Redirect:** a verified signed `R1000` response must provide an allowlisted
  HTTPS `redirectURI` and `tranCtx`. Only the documented bank hosted page is used.
- **Callback:** accepts `application/x-www-form-urlencoded` POST, rejects duplicate
  fields and invalid hashes, ignores query claims, matches the stored merchant
  reference/transaction, and calls independent STATUS verification. It returns a
  303 to the consultation page; the owning browser retrieves the stored outcome
  using its original checkout capability. A callback alone cannot mark payment paid.
- **STATUS:** interface p40 requires form POST with field hashing. The code checks
  the response signature, merchant/aggregator/reference, transaction ID, amount,
  optional returned currency and final transaction codes. The current API guide
  p4 includes amount in STATUS responses; the existing strict amount match is
  retained. Only `SUC` with successful request and transaction codes can settle.
  The database RPC stores settlement atomically and protects against replay or
  replacement. Fixtures pass; a real bank STATUS round trip remains unverified.

## Controlled initial UAT

The previous customer selector required completed UAT before it could be used for
the first browser test. The new explicit `ICICI_UAT_TEST_MODE=true` permits that
test only for a server-verified, signed-in super administrator. Preparation and
initiation enforce the same restriction; hiding a radio is not the boundary.
An invalid token, ordinary user or anonymous caller is rejected before either
action executes. The ICICI client forwards the existing Supabase session and
availability refreshes on sign-in/sign-out. No page elements or Razorpay payment
implementation were changed.

Required credentials, merchant activation, registered HTTPS origin and database
readiness must still pass. This also works in a deployed production Next.js
build pointed at the bank's UAT environment; it cannot enable a production bank
environment. The live-bank environment and endpoints remain rejected regardless
of flags or user role. `ICICI_UAT_TESTS_PASSED` stays false while testing, then may
be set true only after the actual bank UAT suite passes. Callback/advice and
capability-protected status retrieval do not require an active tester login.

## Actual local response

HTTP 200, no-store, with development diagnostics:

```json
{
  "icici": false,
  "environment": "uat",
  "available": false,
  "code": "ICICI_INTEGRATION_NOT_VERIFIED",
  "reason": "ICICI_UAT_MERCHANT_CONFIRMED must be true after the corresponding UAT approval.",
  "blocked": ["ICICI_UAT_MERCHANT_CONFIRMED"]
}
```

Initiation and callback probes return HTTP 503 at this same activation gate,
before bank transport or database writes. Production availability returns a
generic reason and omits field-level diagnostics. Diagnostic logs contain no
credential values, bearer tokens, customer data or raw bank/database exceptions.

## Verification and remaining steps

All 78 automated tests passed, including the ICICI protocol fixtures, real SQL
settlement/RLS tests in isolated PostgreSQL, Razorpay regressions, and five new
controlled-UAT/access/client tests. All nine payment browser tests passed,
including desktop/mobile disabled state, selectable ICICI fixture, callbacks,
pending/success/failure/cancellation and booking deduplication. TypeScript,
targeted lint and the production Next.js build passed. Rendered-template parity
tests confirm the existing layout is preserved.
Scanning all 137 production client JS/JSON/map assets found no configured ICICI
signing secret or Supabase service-role key. `.env.local` is ignored by Git.

The current API's single reported configuration blocker is merchant confirmation.
To clear it, obtain actual ICICI activation and return-URL registration confirmation
before changing that flag to true. The public deployment must also be updated to
serve this Next.js callback. These are external prerequisites; a real UAT payment
has not been claimed or attempted while activation is unconfirmed.

After deployment and bank confirmation, keep tests-passed false, sign in as a
super administrator on the matching HTTPS origin, check availability, and start
one synthetic UAT booking. Complete the bank's test cases; verify the hosted
redirect, callback, independent STATUS and persisted settlement. Test decline,
pending, tampering and repeat delivery. Only then record UAT completion and turn
off controlled test mode. No real production payment is authorized by these flags.
