# Consultation ICICI availability

Current behavior and actual live checks: [6 November local development/UAT report](icici-local-development.md). Real UAT requires Super Admin authorization; the guest bypass and HTTP callback exception are removed.

## Historical origin diagnosis (2026-11-02)

The active local configuration loads `.env.local` before `.env`. Both currently
set `ICICI_RETURN_URL` to `https://aa100xtech.com/api/payments/icici/callback`.
The configured return origin is **`https://aa100xtech.com`**. A live GET through
**`http://localhost:3000`** returns `ICICI_WRONG_ORIGIN`; its actual request
origin is **`http://localhost:3000`**. Plain `http://127.0.0.1:3000` is also
rejected. HTTPS and the origin (scheme, hostname, port) must match exactly.
These are read-only observations; no credentials or local environment files
were changed. Historical reports below predate the current environment settings.

`iciciAvailability` validates `iciciUatConfig`, then the shared
`assertIciciOrigin`, then UAT tester/customer access and database readiness.
Checkout preparation/initiation/status and controlled tester access use the
same origin resolver. Configuration still requires the actual callback route
**`/api/payments/icici/callback`**, HTTPS, at most 128 characters, and no URL
credentials, query or fragment. Bank callback/advice signature verification
and independent STATUS reconciliation are unchanged; a bank callback is
intentionally not subject to the browser same-origin/CSRF check.

### Local UAT using an explicitly configured HTTPS tunnel

1. Create an HTTPS tunnel to the local Next.js server. Use its actual assigned
   hostname; the application does not start a tunnel or accept arbitrary tunnel
   domains. Have ICICI register that callback before bank testing.
2. Set these **server-only** values in ignored `.env.local`, replacing the
   example hostname with the real tunnel hostname:

   ```dotenv
   ICICI_RETURN_URL=https://your-assigned-tunnel.example/api/payments/icici/callback
   ICICI_TRUST_PROXY=true
   ```

3. Configure the trusted tunnel/proxy to strip incoming `X-Forwarded-Host` and
   `X-Forwarded-Proto` and overwrite them with **one** external hostname (with
   port if nondefault) and `https`. Bind Next.js to loopback locally, for example
   `npm run dev -- --hostname 127.0.0.1 --port 3000`. Do not expose that backend
   to untrusted direct traffic. If the tunnel cannot guarantee header
   overwriting, put a trusted reverse proxy in between or use an HTTPS staging
   deployment instead.
4. Restart Next.js, then browse `https://your-assigned-tunnel.example/consultation`.
   Opening localhost while setting a different HTTPS callback still fails.
   Changing/rotating the tunnel requires updating the full return URL and the
   bank registration, then restarting.

`ICICI_TRUST_PROXY` defaults to false. Only the exact value `true` opts in.
Without that opt-in, the resolver uses only the URL supplied by Next.js and
does not substitute forwarding headers or the browser `Origin` header. Next.js
may already normalize that URL using server/proxy metadata, so protected ingress
is necessary to keep the supplied URL authoritative as well.
In proxy mode, both forwarding headers are
mandatory; HTTP, missing/partial headers, comma-separated chains, URL
credentials, paths, query/fragment and mismatched domains/ports are rejected.
`Forwarded` and `X-Forwarded-Port` are not used; include any nondefault HTTPS
port in `X-Forwarded-Host`. Browser `Origin` must independently match the resolved
origin on JSON POSTs, and `x-aa-rpc`/Fetch Metadata checks remain enforced.

The Route Handler `Request` has no authenticated socket peer. The explicit
proxy flag is an infrastructure trust contract, **not** authentication of a
header sender: use private ingress/firewall rules so only the trusted proxy
can reach Next.js, and overwrite forwarding headers at the final trusted hop.
Do not enable the flag on an unprotected public backend. See the official
[Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting)
and [nginx header override documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header).

### Production/staging application domains

Set `ICICI_RETURN_URL=https://<that-environment-domain>/api/payments/icici/callback`
in each deployment's server environment and browse that same HTTPS domain.
For the current public domain the full value is
`https://aa100xtech.com/api/payments/icici/callback`. A staging or preview domain
needs its own registered matching return URL; an arbitrary preview hostname is
not implicitly allowed. Enable `ICICI_TRUST_PROXY` only under the protected
ingress/header-overwriting contract above when `request.url` describes the
internal upstream. Otherwise leave it false. Restart/redeploy after changes.
Do not globally enable Next.js host-header trust to fix this integration.

This supports production **Next.js builds/hosting** of this existing UAT
adapter. It does not add ICICI live-bank support: `ICICI_ENVIRONMENT` remains
`uat` or `sandbox`. Merchant confirmation, completed UAT, and authenticated
super-admin test-mode gates remain enforced. Currently tests-passed is false
and controlled test mode is true; a matching origin alone does not open customer
payments. Razorpay credentials, SDK, handlers and pricing are unchanged.

### Verify `GET /api/payments/icici/availability`

Use a real GET (the route has no HEAD handler):

```powershell
# Current local mismatch: expect available:false and ICICI_WRONG_ORIGIN.
curl.exe -sS -D - http://localhost:3000/api/payments/icici/availability
# After configuring the real tunnel or matching hosted domain:
curl.exe -sS -D - https://your-assigned-tunnel.example/api/payments/icici/availability
```

Every response is HTTP 200 with `Cache-Control: no-store`, `Vary: Authorization`,
canonical `available` and legacy `icici` booleans. HTTP 200 means the check ran;
only `available:true` means ICICI is ready for that caller. In development an
origin failure includes safe origins, for example:

```json
{
  "icici": false,
  "environment": "uat",
  "available": false,
  "code": "ICICI_WRONG_ORIGIN",
  "reason": "Request origin must match the HTTPS origin of ICICI_RETURN_URL. Browse the configured HTTPS website or UAT tunnel.",
  "origins": {
    "configured": "https://aa100xtech.com",
    "request": "http://localhost:3000",
    "transport": "http://localhost:3000",
    "source": "request-url"
  }
}
```

With trusted proxy forwarding, `origins.request` is the validated external
HTTPS origin, `transport` shows the URL supplied by Next.js, and `source` is
`trusted-proxy`. Only normalized origins are exposed, never raw header values,
full return URLs, tokens, merchant IDs, secrets or database errors. Production
responses retain generic failure reasons without diagnostic origins or logs.

For initial UAT, an unauthenticated curl may report
`ICICI_UAT_TEST_ACCESS_REQUIRED` after the origin is corrected. Sign in as a
super administrator on the matching HTTPS site and inspect the availability
GET in browser Network; it sends the existing Bearer session automatically.
Do not paste session tokens into documentation or shell commands. An available
response still requires working checkout/payment database schema. Failed flags,
auth, storage or schema checks remain failures.

On the consultation form, availability refreshes on opening/closing the dialog,
session changes, window focus and network reconnection. Requests time out after
10 seconds and stale responses are discarded. The form waits for the initial
check before preparing a checkout. ICICI is selectable only after availability
and checkout preparation both succeed. Loading/failure text is shown; if a
selected ICICI option becomes unavailable, its Pay button is disabled until it
is available again or the customer chooses an enabled method. Focus/reopen the
dialog to retry after fixing configuration. No payment is started by the GET.

## Historical initial audit (2026-10-30)

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

| Requirement                           | Result                         | Required migration                         |
| ------------------------------------- | ------------------------------ | ------------------------------------------ |
| `public.icici_uat_checkouts`          | Missing, HTTP 404 / `PGRST205` | `20261027150000_icici_uat_checkouts.sql`   |
| Consultation payment tracking columns | Missing, HTTP 400 / `42703`    | `20261026120000_dual_gateway_tracking.sql` |

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
