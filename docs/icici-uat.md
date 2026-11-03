# ICICI PG v2: UAT integration

The implementation is UAT-only. The current signing mode is `sorted-fields`, as instructed by the merchant and confirmed against the supplied bank reference. Local configuration permits controlled Super Administrator testing while `ICICI_UAT_TESTS_PASSED=false`. An isolated UAT Initiate Sale response has been verified, but STATUS is blocked and no payment has completed. See the [current verification report](icici-uat-verification.md) for actual results, authorization/schema limitations and remaining bank dependencies. Existing Razorpay credentials, SDK, order/verification functions, pricing and page layout are preserved.

## Document reconciliation

The three supplied PDFs were read from Downloads without committing them, copying their embedded credentials into source, or logging their credential values:

- `PG_Interface_Specifiation_V0.5.pdf`: Initiate Sale pp6–16, hosted redirect and form response pp23–28, STATUS pp40–43, hashing pp66–68, UAT URLs p73.
- `ICICI_PG_Initiate_Sale_API.pdf`: initiation/status pp3–4, field hashing p6, form callback p7, advice p8, response codes pp10–12 and URLs p15.
- `Secure_Hash_Functions_Reference.pdf`: Node.js implementation p3 and the accompanying language references.

API version v2 does **not** establish the hash version. The API guide specifies field hashing for JSON, while the interface's separate Hash Calculation v2 specifies JSON hashing in a header. Both are implemented independently; configuration must select the bank-confirmed contract. There is no fallback or automatic retry using another mode.

| `ICICI_SIGNING_MODE` | JSON request signing | JSON response verification |
| --- | --- | --- |
| `sorted-fields` | Sort top-level keys; concatenate scalar values and JSON-encoded nested values; omit null/undefined and `secureHash`; UTF-8 HMAC-SHA256, lowercase hex in body `secureHash` | Recompute over every response field except `secureHash`, including unknown fields; constant-time comparison |
| `json-v2` | HMAC-SHA256 over `JSON.stringify(payload)` with original key order; transmit those exact minified bytes; lowercase hex in HTTP `securehash` header; no body signature | Minify the parsed JSON, retaining key order; compare with HTTP `securehash`; reject a body signature rather than switching modes |

Interface p40 explicitly defines STATUS requests as form-encoded. They use field hashing and POST to `https://pgpayuat.icicibank.com/tsp/pg/api/command?reqType=JSON`; the JSON response retains the documented field signature. `reqType=JSON` requests a JSON response, not JSON-v2 signing. This is independent of the selected JSON Initiate Sale contract. The JSON-looking STATUS example in the API guide does not override the interface's explicit form content type. Confirm this mapping with ICICI during UAT; no alternate encoding is tried automatically.

Form callbacks/advice always use the documented field hash over **POST body fields only**. URL query parameters are excluded. Duplicate form keys, missing/malformed hashes, tampering, wrong merchant/aggregator/reference and transaction mismatches are rejected. The adapter supports the default form-encoded payment advice; JSON advice requires a separately confirmed onboarding contract and is rejected for now.

## Server configuration

### Local guest testing

At the owner's request, `.env.development.local` now enables
`ICICI_UAT_GUEST_CHECKOUT=true`. With test mode enabled, guests can prepare and
initiate consultation checkout on the exact configured `DEV_TUNNEL_ORIGIN`
without login/signup. This opt-in requires `NODE_ENV=development`, trusted HTTPS
forwarding and a matching callback origin; it has no effect in production builds.
Origin/CSRF checks, checkout capabilities, bank signature verification and
independent STATUS settlement remain enforced. It never sets
`ICICI_UAT_TESTS_PASSED=true`. Use the ngrok HTTPS page rather than localhost.
The unresolved bank STATUS HTTP 403 still prevents verified completion.

Use a separate HTTPS UAT deployment and test Supabase database. Do not use real customer booking information. Keep merchant secrets in server environment settings; never add `NEXT_PUBLIC_` credentials. Existing `.env` values were not modified.

Required existing variables:

```dotenv
ICICI_MERCHANT_ID=<bank-issued UAT merchant ID>
ICICI_AGGREGATOR_ID=<bank-issued UAT aggregator ID, if applicable>
ICICI_SECRET_KEY=<bank-issued UAT secret>
ICICI_ENVIRONMENT=uat
ICICI_BASE_URL=https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale
SUPABASE_URL=<test project URL>
SUPABASE_SERVICE_ROLE_KEY=<valid server key for that test project>
```

Use the matching existing public Supabase settings for that test deployment's authentication. The optional `ICICI_BASE_URL`, when set, must equal the exact UAT initiation URL above. Bank endpoints are otherwise fixed in server code and never accept client-provided URLs. Production URLs are not used.

Configuration prepared in the ignored `.env.local` (existing secrets remain in `.env`):

```dotenv
ICICI_SIGNING_MODE=sorted-fields
ICICI_RETURN_URL=https://aa100xtech.com/api/payments/icici/callback
ICICI_UAT_ENABLED=true
ICICI_UAT_MERCHANT_CONFIRMED=false
ICICI_UAT_TESTS_PASSED=false
ICICI_UAT_TEST_MODE=true
```

`ICICI_RETURN_URL` must be HTTPS, at most 128 characters, use the exact callback path and contain no user credentials, query string or fragment. The application origin must match it. Have ICICI register it and any required source IP/certificate allowlists. Register `/api/payments/icici/advice` on that origin for form-encoded payment advice.

For local development (`npm run dev`) only, `ICICI_RETURN_URL=http://localhost:3000/consultation` is also supported. Set `ICICI_SIGNING_MODE=sorted-fields`, keep the bank secret in server-only `ICICI_SECRET_KEY`, and set `ICICI_TRUST_PROXY=false`. Browse `http://localhost:3000`. Each initiation signs the actual transaction fields, including amount, reference, customer mobile number, return URL and timestamp, with the sorted-value HMAC-SHA256 algorithm. Form POSTs to `/consultation` are internally rewritten to the verified callback handler, which reconciles bank status before returning to the page. The bank must permit this return URL; server-to-server advice cannot reach localhost. Existing UAT activation and access gates still apply. Production builds require the HTTPS callback URL above.

The current merchant instruction selects **method 1**, `ICICI_SIGNING_MODE=sorted-fields`, matching API guide p6 and the Node.js reference p3. Use `json-v2` only for a separately confirmed Hash Calculation v2 contract. Do not infer it from `/v2/initiateSale` or try another mode after a failure.

After bank activation and registration of the HTTPS callback, set `ICICI_UAT_MERCHANT_CONFIRMED=true`. Keep `ICICI_UAT_TESTS_PASSED=false` during initial testing. With `ICICI_UAT_TEST_MODE=true`, a signed-in super administrator can see/select ICICI and use checkout/initiation APIs. The server validates the Supabase user token and super-admin role for availability, preparation and initiation; anonymous customers and non-admins remain blocked. Availability refreshes when the signed-in session changes. This works on a deployed production Next.js build using the **UAT bank environment**, as well as development. The test-mode flag never changes UAT approval and never permits a live bank environment.

Set `ICICI_UAT_TESTS_PASSED=true` only after actual bank UAT cases succeed. Completed UAT permits the existing customer UAT path without requiring a super-admin session; disable `ICICI_UAT_TEST_MODE` then. Availability also requires the matching HTTPS origin and working checkout/payment storage. Callback, advice and capability-protected status reconciliation remain independent of the tester's login, so a bank return cannot be stranded by an expired admin session. No browser-supplied flag or claimed role grants test access.

`aa100xtech.com` is an existing public domain selected by the user. The current public deployment still serves the older application and returns HTTP 500 for ICICI availability/callback GET probes. Deploy the Next.js application and server environment before using this callback with the bank. A domain's existence is not evidence that this code is deployed or that ICICI has registered it. Plain `http://localhost:3000` still cannot match this HTTPS origin.

`ICICI_ENVIRONMENT=production` is rejected regardless of all flags. Live ICICI is intentionally unsupported until a future reviewed production activation. No `ICICI_ENABLED` or other legacy flag can enable it.

## Migrations and storage

The latest read-only checks pass for all required booking/checkout columns and show the settlement RPC in the service-role API schema. No repair migration or live database write was needed in this follow-up. The REST API does not expose the migration ledger, indexes or trigger catalog. Run [the exact read-only SQL](../supabase/diagnostics/icici_uat_readiness.sql) in Supabase SQL Editor to inspect those details. Do not blindly replay the historical migrations: their plain CREATE statements are intentionally not rerunnable. No tables, rows or migration records were recreated or removed.

The new table is private under RLS; only `service_role` may read/write it or execute settlement. It stores booking details and a SHA-256 hash of a random 256-bit checkout capability. The capability is sent in JSON POST bodies, never in URLs. The owning browser keeps it in session storage for the bank return. Bank credentials and full bank payloads are never returned or logged.

Preparation does not create an external order. When ICICI UAT is available, a neutral checkout appears in the existing summary and the selected provider is reserved atomically on Pay. Choosing Razorpay calls its existing server order handler and SDK; choosing ICICI creates a separate bank reference and never creates a Razorpay order. Amounts are derived from the existing server-side plan. For the premium plan, 2,000,000 paise becomes the bank's decimal string `20000.00`, and the button reads `Pay with ICICI Bank ₹20,000`.

Each checkout gets one stable alphanumeric merchant reference (maximum 20 characters). Concurrent initiation and provider switching are blocked once reserved. A repeated successful initiation reuses the verified redirect/order. Network uncertainty, failed signature checks or a lost initiation response retain the reservation: STATUS reconciliation must run before another charge is considered. A ready checkout expires after one hour; pending reconciliation remains available after that. Confirmed bank rejection permits a deliberate new checkout; no automatic payment retry occurs.

## Status and callbacks

Initiation posts to `https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale` with `payType=0`. It verifies response signing, echoed merchant/aggregator/reference, `R1000`, and an allowlisted HTTPS UAT `authRedirect` URL before returning `redirectURI?tranCtx=...`. The two UAT redirect hosts appearing in the supplied PDFs are allowed; arbitrary hosts, paths, ports, credentials or extra URL parameters are rejected. HTTP redirects from the bank API itself are not followed. Server requests have a 15-second deadline and no initiation retry.

A callback is never payment proof by itself. The server calls STATUS using the stored reference, verifies its field signature, merchant/aggregator, reference, transaction ID, amount and any supplied currency. The transaction must be a SALE when the bank returns a transaction type. The documented STATUS examples omit currency; the original immutable initiation is INR/356, and any returned currency must match.

Only STATUS `responseCode=000/0000`, `txnStatus=SUC` and `txnResponseCode=000/0000` can settle a booking. A database RPC locks the checkout and atomically records its unique transaction and confirms the associated booking. Replays return without confirming again; a different transaction cannot replace an existing settlement. Paid records cannot be downgraded by delayed pending/failure notifications.

`REQ`, timeouts, unknown codes, unverifiable responses and incomplete matches remain pending. Verified `REJ` is failed. The kit does not provide a distinct final cancellation code: browser cancellation or a description string never authorizes a retry or booking confirmation; STATUS remains authoritative, and cancellation is displayed as failed if the bank confirms rejection. The existing separate Razorpay cancelled screen is unchanged. Confirm any desired separate ICICI cancellation-code mapping with the bank rather than inventing one.

The browser return uses HTTP 303 to the existing consultation page with only a checkout ID. The owning browser resumes its stored session and fetches the verified result; booking details and schedule are preserved. Advice returns HTTP 200 only after reconciliation is stored. A failed advice reconciliation returns a non-200 response so the bank can retry; a browser return can show pending when STATUS is temporarily unavailable. No background cron is installed: register bank advice and use Check payment status for pending reconciliation.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/payments/icici/availability` | `available` and legacy `icici` booleans; safe reason/field names in development; requires confirmed UAT config, completed UAT approval, matching origin and working schema |
| `POST /api/payments/icici/checkout` | `{id, token, booking}`; validate existing booking schema and derive price; idempotent preparation |
| `POST /api/payments/icici/initiate` | `{id, token, gateway}`; reserve one provider and create/reuse its attempt |
| `POST /api/payments/icici/status` | `{id, token}`; reconcile and return only the owning customer's booking/result |
| `POST /api/payments/icici/callback` | Signed bank form, independent STATUS verification, browser 303 return |
| `POST /api/payments/icici/advice` | Signed bank form, independent STATUS verification, durable 200 acknowledgement |

The three JSON POST endpoints require same-origin requests with `x-aa-rpc: 1`. Generate `id` with `crypto.randomUUID()` and `token` from 32 cryptographically random bytes encoded as lowercase hex. Retry preparation with the same values and same booking. Changing details requires a fresh checkout. Never log the capability or paste it into a shared URL. Before UAT completion, checkout preparation and initiation also require the authenticated super-admin bearer token and explicit test mode; the ICICI browser client forwards the existing Supabase session automatically. The status endpoint remains protected by the original checkout capability, and callbacks/advice require the bank signature plus independent STATUS verification.

## UAT tests for either explicitly selected mode

1. Obtain the bank's confirmation of mode and endpoint/signature mapping, valid UAT secret, bank-issued signing vectors and activated test merchant. Register HTTPS return/advice URLs and any bank allowlists. Apply migrations to the test database and use synthetic booking details/test instruments only.
2. Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build` and `npm.cmd run test:e2e -- tests/e2e/payments.spec.ts` against the test server. Offline fixtures exercise both signing implementations and must not be reported as bank certification.
3. With the confirmed single mode and API flags above, prepare one checkout, initiate ICICI once, inspect the allowlisted bank-hosted redirect and complete the bank-supplied success case. Verify STATUS and database settlement before reporting success. Test the ₹20,000 premium amount and unchanged other plan prices. Do not create a real Razorpay charge while testing ICICI.
4. Run bank-issued rejection, cancellation, pending, expiry and eventual-success cases. Recheck the same pending reference; do not issue another SALE. Test a bank/advice outage and return without the original browser session. Check that unverifiable outcomes remain pending with a support path.
5. Tamper with callback fields/hash, add unsigned fields, duplicate a form key, use wrong merchant/reference/amount/currency, and send a query-string success claim. None may confirm a booking. Repeat valid callbacks and status requests concurrently: assert one stored settlement/confirmation and unchanged transaction ID.
6. Double-click initiation and retry after an ambiguous timeout. Attempt switching providers while pending. Assert one external attempt per checkout, no fallback signing request and no Razorpay order for ICICI. Perform a separate Razorpay test-key checkout to verify the existing order/signature/SDK behavior and feedback.
7. Before the bank UAT suite passes, use `ICICI_UAT_TEST_MODE=true` and sign in as a super administrator on the matching HTTPS UAT application. Confirm anonymous and non-admin visitors cannot select or initiate ICICI. After the bank suite passes, explicitly set `ICICI_UAT_TESTS_PASSED=true` and `ICICI_UAT_TEST_MODE=false` on that UAT deployment, then test the existing customer radio/button and browser return. Do not change to a production bank endpoint; live ICICI remains unsupported.

## Implementation files

`src/lib/icici-signing.server.ts` contains the independent algorithms. `icici.server.ts` contains UAT configuration, bank transport, signing verification and status validation. `icici-checkout.server.ts` owns checkout reservations and persistence; `icici-routes.server.ts` validates requests and callbacks. `icici-checkout.ts` is a credential-free browser client. The existing consultation dialog and gateway selector retain their classes/layout and use the UAT branch only when available. Existing Razorpay server implementations were not edited. Tests cover bank transport fixtures, capability checks, concurrent initiation, mismatches, callback authentication and the actual SQL/RLS migration in isolated PostgreSQL.

Verification on 2026-10-27: all 57 automated tests and seven payment browser tests passed, including the mocked confirmed-UAT premium checkout and existing Razorpay success/pending/failure/cancellation cases. TypeScript, the final production build, lint on changed payment source/tests and `git diff --check` passed. The running local application reports `icici:false` and rejects initiation with `503 ICICI_INTEGRATION_NOT_VERIFIED`, as required with unconfirmed settings. No real bank request, payment, production database mutation or `.env` edit was performed. Offline tests do not replace bank-issued UAT certification.
