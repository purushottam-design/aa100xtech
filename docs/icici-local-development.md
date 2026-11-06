# Local consultation development and controlled ICICI UAT — 6 November 2026

The application changes are implemented. Local simulation works, and authenticated initiation on the existing HTTPS tunnel has been verified. Complete live bank UAT is still pending: the new handoff migration requires the database owner's SQL Editor, and ICICI Status responses have not passed verification. No live booking was marked Paid.

The follow-up readiness check now verifies every handoff column using `LIMIT 0` before enabling the local HTTPS transition. Missing/incomplete storage, unavailable credentials and connection failures leave simulation available while disabling transfer with a safe explanation. Readiness refreshes through the existing availability refresh behavior; no payment or grant is created by this probe.

The latest read-only live recheck still finds the handoff table unavailable (HTTP 404), database read permission denied (HTTP 403), and the existing UAT booking Pending with no paid timestamp. Rechecking the same bank reference returned HTTP 403. No additional Initiate Sale was performed during the follow-up.

## Using the consultation form

Open `http://127.0.0.1:3000/consultation`, select a plan and complete the existing form. The normal Proceed to Payment/Razorpay path retains its existing order, price, signature and SDK behavior.

The additional localhost-only ICICI panel offers two actions:

- **Simulate ICICI locally** validates the form and displays simulated success, failure or pending states. It makes no payment API call, creates no booking/order and cannot enter the real Payment Successful screen. It does not depend on bank credentials or payment database availability.
- **Continue to HTTPS ICICI UAT** requires a legitimate Super Admin session on localhost. It transfers the booking intent to the configured HTTPS tunnel using a one-time server authorization. Confirm the transition there, then use the existing payment summary and ICICI Pay button. No bank initialization happens on HTTP localhost or during confirmation itself.

The real ICICI radio remains unavailable on HTTP localhost. The callback remains:

```text
https://tractor-nautical-snowbird.ngrok-free.dev/api/payments/icici/callback
```

No private environment file, production configuration or administrator password was changed. `https://aa100xtech.com` remains separate. This adapter still rejects production ICICI bank environments/endpoints.

## Handoff security and required migration

Run [20261106140000_icici_uat_handoffs.sql](../supabase/migrations/20261106140000_icici_uat_handoffs.sql) in the confirmed development project's SQL Editor. Existing payment tables are available; this is an additional, private authorization table. The configured Management API token returns HTTP 403, so this migration has **not** been applied remotely by this work. An authenticated live transition currently fails closed with `503 ICICI_HANDOFF_STORAGE_UNAVAILABLE`.

The handoff is enabled only in development, with UAT test mode, trusted proxy configuration and `DEV_TUNNEL_ORIGIN` exactly matching the HTTPS callback origin. The bridge accepts only the configured `*.ngrok-free.dev` destination and the exact local origins `http://127.0.0.1:3000` or `http://localhost:3000`. Caller-provided destinations are not used.

1. A same-origin localhost JSON POST, with CSRF headers and a verified Supabase Super Admin session, creates a server-side booking intent and a random 256-bit ticket. Only its SHA-256 hash is stored. It expires after 90 seconds.
2. The browser sends only that ticket by native form POST to the allowlisted HTTPS destination. Neither a Supabase token nor a localhost authentication cookie is copied. Application handoff URLs contain no ticket or session credential. The later bank-hosted redirect includes its bank-issued `tranCtx`, as required by ICICI; its value is not logged.
3. The destination atomically claims the ticket, rechecks the account/role, and creates its own random `__Host-aa-icici-uat` cookie: HttpOnly, Secure, SameSite=Strict, Path=/, no Domain attribute. Its hash is stored server-side. A separate random CSRF value appears in the confirmation form; only its hash is stored.
4. Same-origin confirmation requires the destination cookie, matching Origin and CSRF value, an unexpired ticket and the presented state. An atomic state transition admits one confirmation and rejects replay/races.
5. The destination authorization lasts ten minutes and is bound to one checkout UUID and the server-stored booking. Availability, preparation, initiation and status recheck account confirmation, ban state and Super Admin authorization. The shared JSON route rejects a different checkout before any payment action.
6. The HTTPS origin issues its own checkout capability. Only that origin stores it in sessionStorage for the bank return. It grants no access to general admin APIs. A bank callback still authenticates through its signature rather than a browser cookie.

All handoff rows are private under RLS and inaccessible to anonymous/authenticated database roles. Body sizes are bounded while streaming. Ticket responses use no-store/no-referrer; the confirmation page also restricts form actions and framing with CSP. Production builds disable the bridge and localhost testing panel. Both the old guest flag and a passed-UAT flag are unable to replace Super Admin authorization.

If destination authorization expires during bank testing, sign in independently on ngrok to check the original checkout. Do not copy a localhost token or automatically issue another SALE. A signed callback can still reconcile independently of the browser authorization.

## Actual verification results

- Full Node test suite after the readiness follow-up: **198 passed**, zero failures.
- Payment browser suite: **18 passed**, including desktop/mobile simulation and Razorpay regression coverage.
- TypeScript check and production build: **passed**.
- Targeted ESLint on all changed payment source/tests: **passed**.
- Scanned 158 production public JavaScript bundles: **no configured ICICI merchant, aggregator or secret values found**. Razorpay server handlers, selector metadata and ICICI signing source match their original versions.

| Check | Actual outcome |
| --- | --- |
| Localhost consultation UI | Desktop/mobile browser checks passed; simulation sends zero POST requests |
| Localhost real ICICI | Unavailable with `ICICI_WRONG_ORIGIN`, including for a legitimate Super Admin |
| Ngrok without login | Denied with `ICICI_UAT_TEST_ACCESS_REQUIRED` |
| Super Admin login | Verified independently on localhost and ngrok; tokens were not reused across origins |
| Authenticated ngrok availability | HTTP 200, `available: true` |
| Existing payment tables | `icici_uat_checkouts` and `consultation_bookings` read-only schema probes returned HTTP 200 |
| New handoff table | HTTP 404; migration required; local UI now disables transition while preserving simulation; direct authenticated transition still fails closed with HTTP 503 |
| Live Initiate Sale | Application HTTP 200; the bank response passed the existing signature/identity checks |
| Hosted redirect | `https://pgpayuat.icici.bank.in/tsp/pg/api/v2/authRedirect`, with nonempty `tranCtx`; its value was not logged |
| Independent live Status Check | First HTTP 200 response failed signature verification; subsequent inspection returned HTTP 403. Both were rejected |
| Forged live form callback | HTTP 400; could not settle a booking |
| Live booking status | `payment_status=PENDING`, `booking_status=PENDING`, `paid_at=null` |
| Real hosted instrument payment and genuine bank callback | Not performed/received; still required |
| STATUS-to-database settlement | Verified with independently signed fixture responses and the actual settlement migrations in isolated PostgreSQL |

The synthetic live UAT record is retained for checking the same attempt:

```text
Booking:   CONS-30B3C283040A4A1A82349E4CE868A757
Reference: IC30b3c283040a4a1a82
Amount:    INR 2,500 (existing Quick Consultation price)
```

Only initiation was performed; no card, UPI, OTP or other instrument was submitted. No production gateway was contacted. Test sessions were revoked locally after verification, preserving other sessions.

The bank's STATUS failure needs ICICI confirmation of endpoint access/IP allowlisting and the signed response contract. The code does not try an alternate signing algorithm, trust a callback success claim, accept an unsigned response or bypass TLS/signature checks. `ICICI_UAT_TESTS_PASSED` remains false.

## Validation coverage and commands

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
node node_modules/@playwright/test/cli.js test tests/e2e/payments.spec.ts
```

The browser suite verifies responsive simulation, zero writes during simulation, Razorpay default/success/pending/failure/cancellation behavior, ICICI availability changes, selection locking, preparation failures and double-submit behavior. Bank UI responses in those browser cases are fixtures; they do not certify ICICI.

The handoff tests execute the actual new SQL against isolated PostgreSQL and exercise actual server handlers with fixture Auth identities. They cover source authorization, production/HTTP/destination rejection, private grants, expiry, role revocation, CSRF, ticket/confirmation races, checkout scope and missing/incomplete/readied handoff storage. The settlement integration test combines the real signed STATUS verifier with real settlement SQL: invalid signatures and wrong amounts do not write settlement, pending remains pending, matching verified success atomically confirms the booking, and repeats/failures cannot downgrade Paid.

## All files changed for this payment task

Earlier app-view, administrator-role and careers-recovery changes remain in the working tree and are outside this payment task. Its complete file list is:

The readiness follow-up modified eight entries in that list: the handoff server module, availability route, local-testing component, consultation component, handoff tests, payment browser tests, consultation JSX baseline and this report. It did not create another UAT payment attempt.

| File | Change |
| --- | --- |
| `.env.example` | Documents simulation, HTTPS-only callback, retired guest flag and handoff prerequisite |
| `src/components/consultation-booking.tsx` | Adds local testing panel and restores the newly authorized HTTPS checkout |
| `src/components/icici-local-testing.tsx` | New explicit simulation and guarded native POST transition UI |
| `src/lib/icici-checkout.ts` | Same-origin handoff resume client and bounded request timeout |
| `src/lib/icici-handoff.server.ts` | New server-only ticket, destination confirmation, CSRF, scoped authorization lifecycle and zero-row storage readiness check |
| `src/lib/icici-origin.server.ts` | Removes the HTTP origin exception |
| `src/lib/icici-routes.server.ts` | Authenticates before body processing and enforces checkout-bound authorization |
| `src/lib/icici-uat-access.server.ts` | Requires verified Super Admin or scoped authorization; removes guest/passed-flag bypasses |
| `src/lib/icici.server.ts` | Rejects HTTP callback configuration in every environment |
| `src/app/api/payments/icici/availability/route.ts` | Local-only testing capabilities; authorization/cookie-aware response variation |
| `src/app/api/payments/icici/status/route.ts` | Requires tester authorization in addition to checkout capability |
| `src/app/api/payments/icici/transition/route.ts` | New localhost ticket issuance endpoint |
| `src/app/api/payments/icici/handoff/route.ts` | New HTTPS ticket presentation and confirmation endpoint |
| `src/app/api/payments/icici/handoff/resume/route.ts` | New same-origin checkout restoration endpoint |
| `supabase/migrations/20261106140000_icici_uat_handoffs.sql` | New private, persistent one-time grant storage |
| `tests/icici-handoff.test.cjs` | New PostgreSQL-backed security/lifecycle coverage |
| `tests/icici-settlement.test.cjs` | New signed STATUS-to-database settlement integration coverage |
| `tests/icici-availability.test.cjs` | Uses authenticated tester fixtures and validates cookie variation |
| `tests/icici-uat-access.test.cjs` | Enforces retirement of bypasses and checkout-scoped route access |
| `tests/icici.test.cjs` | Tests rejection of the former localhost callback exception |
| `tests/e2e/payments.spec.ts` | Adds desktop/mobile no-write simulation checks; retains Razorpay coverage |
| `tests/fixtures/migration-parity.json` | Approves only the consultation component's intentional added UI |
| `docs/icici-availability.md` | Labels older environment observations as historical and links this report |
| `docs/icici-uat.md` | Updates operating instructions to the current secure flow |
| `docs/icici-uat-verification.md` | Supersedes the obsolete guest note while retaining historical evidence |
| `docs/icici-local-development.md` | This implementation, verification and remaining-UAT report |

The Razorpay server handlers, signatures, SDK loader, prices, gateway selector and existing booking/settlement migrations were not edited. Neither the ICICI signing implementation nor TLS validation was weakened.
