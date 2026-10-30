# Consultation ICICI availability diagnosis (initial audit)

This records the initial audit before the subsequent database repair and local
configuration. The current database API readiness checks pass; `.env.local` now
sets the instructed signing mode and callback. See [the current verification
report](icici-uat-verification.md) and [updated UAT instructions](icici-uat.md)
for current status, controlled super-admin testing, and the merchant-confirmation
gate that is deliberately still false.

## Findings on 2026-10-30

The gateway is correctly unavailable with the current local configuration. The
booking succeeds through the existing Razorpay branch; it does not establish
ICICI readiness. No credentials, bank approvals, or database records were changed.

Next.js loads `.env`. There is no `.env.local`, `.env.development`,
`.env.development.local`, `.env.production`, or `.env.production.local` here.
The existing merchant ID, aggregator ID and signing secret are nonempty, the
environment is `sandbox`, and the base URL matches the supported UAT initiation
endpoint. Presence is verified; bank activation and credential validity are not.
There are no duplicate ICICI definitions or `NEXT_PUBLIC_` ICICI credentials.
Remote deployment environment settings were not accessible in this local audit.

These settings are absent, rather than incorrectly named or failing to load:

- `ICICI_SIGNING_MODE`
- `ICICI_RETURN_URL`
- `ICICI_UAT_ENABLED`
- `ICICI_UAT_MERCHANT_CONFIRMED`
- `ICICI_UAT_TESTS_PASSED`

Before this fix, the first failing predicate in `iciciUatConfig()` was
`process.env["ICICI_UAT_ENABLED"] !== "true"`. Missing merchant confirmation,
signing mode and callback URL also fail that gate. Completed UAT approval is a
further availability requirement. The route caught the error without explanation
and returned HTTP 200 with `{"icici":false,"environment":"uat"}`.

A read-only `LIMIT 0` query against the configured Supabase project additionally
confirmed:

| Requirement | Result | Required migration |
| --- | --- | --- |
| `public.icici_uat_checkouts` | Missing, HTTP 404 / `PGRST205` | `20261027150000_icici_uat_checkouts.sql` |
| Consultation payment tracking columns | Missing, HTTP 400 / `42703` | `20261026120000_dual_gateway_tracking.sql` |

The first direct Node probes encountered certificate trust errors/timeouts;
using Node's `--use-system-ca` completed both read-only checks. This observation
does not mean the running Next.js process has a certificate problem. TLS
verification was kept enabled. No migrations were applied during this audit.

`http://localhost:3000` also cannot match the required HTTPS callback origin.
Use an ICICI-registered HTTPS UAT domain (or approved HTTPS development tunnel)
for both browsing the application and `ICICI_RETURN_URL`. Setting a different
HTTPS return URL while browsing plain localhost does not satisfy this check.

## Exact UI and server flow

1. `src/components/consultation-booking.tsx` fetches availability on mount and
   sets `iciciAvailable` only when the server boolean is exactly `true`.
2. With availability false, booking preparation uses the existing Razorpay
   handler and does not create a neutral ICICI checkout capability.
3. The modal passes `iciciAvailable && !!checkout` to `PaymentGatewaySelector`.
   With this configuration, both terms are false.
4. `src/components/payment-gateway-selector.tsx` overrides ICICI display metadata
   with that value. Its radio uses `disabled={!gateway.available}` and shows
   `Currently unavailable` when false. The static `available: false` metadata
   is a safe default, not a permanent gate; runtime availability overrides it.
5. `src/app/api/payments/icici/availability/route.ts` calls the server readiness
   check. It requires valid UAT configuration, completed UAT approval, matching
   origin, database credentials, checkout storage and payment tracking columns.
6. `src/lib/icici-routes.server.ts` validates configuration and origin again
   before payment requests. With current settings, initiation returns HTTP 503,
   `ICICI_INTEGRATION_NOT_VERIFIED`, before any bank call.
7. The implemented adapter uses HMAC-SHA256, a bank-confirmed signing mode,
   fixed UAT endpoints, verified hosted redirects, and independent signed STATUS
   reconciliation. Callback claims alone cannot confirm payment.

There is no `ICICI_ENABLED`, `ICICI_ENV`, `ICICI_API_KEY`,
`ICICI_ENCRYPTION_KEY`, `ICICI_CLIENT_ID`, `ICICI_CLIENT_SECRET`,
`ICICI_PAYMENT_URL`, or `ICICI_CALLBACK_URL` lookup in this adapter. The callback
setting is `ICICI_RETURN_URL`; the endpoint override is `ICICI_BASE_URL`.
Aggregator ID and base URL are optional, with validation when supplied. No
unnecessary mandatory field was found. The adapter intentionally supports UAT
and sandbox only; `ICICI_ENVIRONMENT=production` is rejected. `NODE_ENV` controls
diagnostic visibility, not gateway activation. No database feature flag or
remote provider-status API participates in availability.

## Changes

- Configuration validation identifies missing/blank settings, invalid values
  and disabled approval flags. It normalizes surrounding whitespace for
  nonsecret settings and preserves the secret's bytes.
- Availability uses the same validator as the payment adapter, requesting the
  additional completed-UAT approval check. It reports origin, server database
  settings, missing schema and storage access failures with safe reasons.
- The endpoint returns canonical `available` and retains legacy `icici`.
  Development responses and server logs include safe diagnostics; production
  returns only availability and a generic failure reason. Neither raw exceptions
  nor environment values are returned or logged by these diagnostics.
- The consultation component reads `available`, with compatibility for `icici`.
  The selector's disabled condition, layout and Razorpay implementation are
  preserved.
- `.env.example` documents diagnostics and origin requirements. Regression tests
  cover valid configuration, automatic runtime enablement, missing/blank
  credentials, flags, invalid configuration, origins, storage and secret safety.

The current development response is HTTP 200, `Cache-Control: no-store`:

```json
{
  "icici": false,
  "environment": "uat",
  "available": false,
  "code": "ICICI_INTEGRATION_NOT_VERIFIED",
  "reason": "Missing ICICI configuration",
  "missing": [
    "ICICI_SIGNING_MODE",
    "ICICI_RETURN_URL",
    "ICICI_UAT_ENABLED",
    "ICICI_UAT_MERCHANT_CONFIRMED",
    "ICICI_UAT_TESTS_PASSED"
  ]
}
```

Checks stop at the first failing stage. After resolving configuration, an origin
failure or database failure may become the reported reason. All five missing
configuration names are reported together.

## Manual configuration and testing

Keep the existing server-only merchant credentials. Add the following to `.env`
or `.env.local` for local UAT, and to the deployment's server environment when
testing a hosted UAT application:

```dotenv
# Choose ONLY the bank-confirmed mode: sorted-fields OR json-v2.
ICICI_SIGNING_MODE=<bank-confirmed-mode>
ICICI_RETURN_URL=https://<registered-uat-host>/api/payments/icici/callback
# Set true after the corresponding bank confirmation / completed UAT step.
ICICI_UAT_ENABLED=false
ICICI_UAT_MERCHANT_CONFIRMED=false
ICICI_UAT_TESTS_PASSED=false
```

The existing `ICICI_ENVIRONMENT=sandbox` is supported; `uat` is also supported.
The existing `ICICI_BASE_URL` is correct. No new API/client/encryption key is
required by this implementation. Do not guess signing mode from the API version.

1. Confirm the merchant's signing contract, UAT credentials and activated test
   account with ICICI. Register the HTTPS return/advice endpoints and required
   network allowlists.
2. Apply the two missing migrations above to the intended UAT database, in
   tracking-then-checkout order, after checking migration state. They preserve
   bookings and intentionally stop on conflicting historical references. Do not
   reset the database or blindly replay older migrations.
3. Populate signing mode and return URL; enable the UAT and merchant-confirmed
   flags only after their requirements are met. The APIs support initial UAT
   testing while `ICICI_UAT_TESTS_PASSED=false` keeps the customer radio disabled.
4. Restart `npm run dev` after editing environment files. For production builds
   or hosted environment changes, restart/redeploy the server. Reload the page:
   the browser checks availability on mount, rather than polling an open modal.
5. Follow the bank UAT cases in [icici-uat.md](icici-uat.md), using test instruments
   and synthetic booking details. Set `ICICI_UAT_TESTS_PASSED=true` only after
   those cases pass, then restart and reload on the matching HTTPS origin.
6. Check Network: `GET /api/payments/icici/availability` should return
   `available:true` and `icici:true`. Start a fresh booking; neutral checkout
   preparation must succeed. The ICICI radio should become selectable.
7. Choose ICICI and pay once. Inspect `POST /api/payments/icici/initiate` and the
   verified bank-hosted redirect. Verify success through STATUS and database
   settlement, then test rejection, pending, cancellation, callback tampering
   and repeated requests. An ICICI attempt must not create a Razorpay order.

Automated fixtures verify application behavior, not bank-issued credential
validity or UAT certification. Production ICICI remains unsupported by this
adapter and cannot be activated by changing these flags.

## Verification

- All 73 automated tests passed, including seven new availability tests.
- All nine existing payment browser tests passed. The confirmed-UAT browser case
  also passed after switching its fixture to the canonical `available:true`
  response, without a legacy `icici` field. Existing legacy-response behavior
  passed in the full browser run.
- TypeScript, lint on changed source/tests, formatting and the production build
  passed. Rendered-template parity checks passed without page/layout changes.
- A scan of 137 production client JS/JSON/map assets found neither the configured
  ICICI signing secret nor the Supabase service-role key.
- The running local endpoint returned the missing-settings response above;
  initiation still returned HTTP 503 before contacting the bank.
- No real bank initiation, charge, refund, database write, migration, environment
  edit or remote deployment was performed.
