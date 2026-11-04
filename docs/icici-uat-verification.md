# ICICI UAT verification - 2026-11-03

> Follow-up requested by the owner: local guest testing is now enabled through
> `ICICI_UAT_GUEST_CHECKOUT=true` in `.env.development.local`. The configured
> trusted HTTPS tunnel accepts anonymous availability/preparation/initiation in
> development only. Live guest availability returns HTTP 200, `available:true`;
> cross-site initiation remains HTTP 403 and forged callbacks HTTP 400. All 36
> focused ICICI tests and TypeScript pass. The administrator-only results below
> describe the earlier audit; production gates and incomplete bank UAT are
> unchanged. See `docs/icici-uat.md` for the local guest opt-in conditions.

## Outcome

Application checks pass and a real, isolated UAT Initiate Sale response has been verified. End-to-end bank UAT is **not complete**: STATUS for that reference returns unsigned HTTP 403. No hosted payment was completed, no real callback/advice was received, and no consultation records were written by the protocol probes. Production settings, Razorpay implementations and UAT verification flags were not changed.

`ICICI_ENVIRONMENT=uat`, `ICICI_SIGNING_MODE=sorted-fields`, `ICICI_UAT_TEST_MODE=true` and `ICICI_UAT_TESTS_PASSED=false` remain in effect. The existing local `ICICI_UAT_MERCHANT_CONFIRMED=true` is configuration, not evidence that all bank onboarding and registration requirements have been satisfied.

## Authentication root cause and actual checks

`src/lib/icici-uat-access.server.ts` contains `ICICI_UAT_TEST_ACCESS_REQUIRED`. It validates the bearer token through Supabase Auth `getUser`, then uses the existing server-side `authorizeSuper` helper. Browser role metadata is never sufficient.

The app uses local-storage Supabase sessions and explicit bearer headers, not an auth cookie. A localhost login does not sign the user in on ngrok. Visiting the API in the address bar does not attach a local-storage bearer token even when the application is signed in. The application client attaches the current session and refreshes availability after sign-in/sign-out.

A normal password sign-in using the existing configured administrator account succeeded. No user provisioning, role assignment, password reset or dashboard provisioning helper was invoked. Temporary test sessions were signed out with local scope, preserving the user's other sessions.

Actual tunnel results:

| Request                                                             | Actual result                                                                                  |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Anonymous availability                                              | HTTP 200, `available:false`, `ICICI_UAT_TEST_ACCESS_REQUIRED`                                  |
| Authenticated configured Super Administrator availability           | HTTP 200, `available:true` for controlled testing                                              |
| Authenticated checkout preparation with intentionally invalid input | HTTP 400, `INVALID_REQUEST`: authorization passed and schema validation rejected before writes |
| Anonymous preparation with the same input                           | HTTP 403, `ICICI_UAT_TEST_ACCESS_REQUIRED`                                                     |
| Invalid form callback signature                                     | HTTP 400, `ICICI_INVALID_SIGNATURE`                                                            |
| Invalid form advice signature                                       | HTTP 400, `ICICI_INVALID_SIGNATURE`                                                            |

Both availability responses report the configured and resolved origin as `https://tractor-nautical-snowbird.ngrok-free.dev`, transport `https://localhost:3000`, and source `trusted-proxy`. Tester eligibility is not bank certification or customer availability.

The new tests use the real RBAC helper to verify database-assigned and custom Super Administrator roles. Customer, employee, company-admin, manager, anonymous and invalid-session cases remain blocked. Forged `user_metadata.role=supreme_admin` cannot grant access. Existing configured-admin compatibility still requires a server-validated Supabase session.

## Database limitations

Read-only service-role `LIMIT 0` probes passed for all 15 checkout columns and every booking field used by ICICI preparation/settlement. PostgREST metadata exposes `settle_icici_uat_checkout`. Metadata does not prove deployed constraints, triggers or RPC privileges; the catalog checks in `supabase/diagnostics/icici_uat_readiness.sql` remain relevant. No database migrations or business-record mutations were performed against the configured project.

The configured project does not expose `user_roles` or `admin_roles` (`PGRST205`). `profiles.status` and `profiles.is_active` return `42703`. The existing shared helper therefore recognizes the configured administrator through its established, server-side environment-email compatibility path. This work neither introduced nor expanded that fallback. Database-assigned administrators and account-status enforcement require the database owner to resolve RBAC schema parity. No roles were automatically granted, and successful configured-admin testing must not be presented as proof of the missing RBAC tables.

## Protocol validation and real bank results

The supplied documents were read locally without printing or committing secret values:

- `Secure_Hash_Functions_Reference.pdf`, Node.js page 3.
- `ICICI_PG_Initiate_Sale_API.pdf`, initiation/STATUS pages 3-4, hashing/redirect page 6, callback page 7, advice page 8 and response codes page 10.
- `PG_Interface_Specifiation_V0.5.pdf`, form STATUS pages 40-43 and hash contracts pages 66-68.

The configured field-hashing implementation matches the Node.js reference: sort top-level keys, omit `secureHash` and null/undefined, preserve nested JSON order, concatenate values, then apply UTF-8 HMAC-SHA256 and lowercase hexadecimal encoding. Hash comparison is constant-time. The separate JSON-v2 implementation remains independent; no signing-mode or content-type fallback was introduced.

Merchant ID, Aggregator ID and secret are present and pass static validation. A bank-verified Initiate Sale response also matched merchant, aggregator and reference, establishing the configured initiation signing contract beyond offline fixtures.

| Bank check                                              | Actual result                                                                                                               |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Initial sandbox-constrained Initiate Sale               | No verifiable response, `ICICI_STATUS_UNKNOWN`; no automatic retry                                                          |
| Initial sandbox-constrained STATUS                      | HTTP 403 HTML, rejected                                                                                                     |
| Separate nonexistent-reference STATUS outside sandbox   | HTTP 200 JSON, `P0039` (request not found), but response signature did not verify; rejected                                 |
| Independently tracked UAT Initiate Sale outside sandbox | HTTP 200 JSON, `R1000`, valid 64-character signature, signature verified                                                    |
| Initiation identity checks                              | Merchant, aggregator and unique reference passed                                                                            |
| Hosted redirect                                         | Allowlisted `https://pgpayuat.icici.bank.in/tsp/pg/api/v2/authRedirect` with nonempty `tranCtx`; token not logged or opened |
| STATUS for that actual reference, twice                 | HTTP 403 HTML, `Server: awselb/2.0`, no signature; `ICICI_STATUS_UNKNOWN`                                                   |
| Hosted bank payment                                     | Not performed                                                                                                               |
| Real bank callback/advice                               | Not received                                                                                                                |
| Signed successful STATUS and real database confirmation | Not achieved                                                                                                                |

The independently tracked attempt used the supplied bank guide's synthetic customer details and INR 1 example with the existing configured UAT merchant/key. It created only a bank-hosted UAT session, with no instrument submitted and no application booking. Its reference and sanitized results are retained in the ignored `.migration/icici-uat-bank-probe.json` for bank support. An earlier ambiguous request was not automatically retried; the outside-sandbox attempt used a separate unique reference.

The STATUS denial may involve endpoint permissions, IP allowlisting or bank policy; the exact cause needs ICICI confirmation. The separate not-found response signature also needs explanation. Neither failure is accepted as success or worked around by skipping verification.

## Application changes

Availability previously checked only checkout `id` and four booking tracking columns. It now probes all columns needed by preparation and reconciliation, still using `LIMIT 0` and reading no customer records. A partial schema can no longer be reported ready merely because the table exists.

The consultation UI explains the same-origin Super Administrator sign-in requirement and uses a safe preparation-unavailable message for storage failures. Raw server diagnostics are not rendered. Existing markup, layout, classes, animation and responsive design are retained.

New tests cover real RBAC behavior and both UI error states. The signing, initiation, callback, advice, status, settlement SQL and Razorpay implementations were audited and retained.

Files changed in this audit:

- `src/lib/icici-checkout.server.ts`
- `src/components/consultation-booking.tsx`
- `tests/icici-availability.test.cjs`
- `tests/icici-authorization.test.cjs` (new)
- `tests/e2e/payments.spec.ts`
- `docs/icici-uat-verification.md`
- `docs/icici-uat.md`

## Verification results

- `npm test`: **114 passed**, including protocol signing/verification, mocked Initiate Sale, callback tampering/duplicates, pending/failed/success status matching, ownership, concurrent reservation, provider locking, and real settlement SQL/RLS/replay tests in isolated PostgreSQL.
- `npm run typecheck`: passed.
- Targeted ESLint: passed.
- `npm run build`: passed on Next.js 16.4.3; all six ICICI routes are present.
- Payment browser suite against the completed local production build on port 3100: **16 passed**, covering desktop/mobile, ICICI readiness/errors, and unchanged Razorpay success/pending/failure/cancellation behavior. Payment providers are mocked in those UI tests.
- Initial UI run against dev during concurrent build: 15 passed / 1 mobile dialog timeout. The complete built-server rerun passed without a product workaround.
- Built frontend scan: 139 JS/JSON/map assets contained no configured ICICI signing key or Supabase service-role key.

A separate existing credential hygiene issue was observed: the configured administrator password matches public site contact text. This is not environment-secret injection by the ICICI changes. The owner should rotate that password through the established account process and server environment; no password or production setting was changed by this audit. Its value is deliberately omitted.

## Remaining manual steps

1. Ask ICICI to resolve STATUS access for the tracked UAT reference, checking the exact endpoint, egress-IP allowlisting and form field mapping. Confirm the error-response signature contract. Share sanitized evidence, never merchant keys.
2. Confirm registration of the exact HTTPS POST callback and form advice URLs under `https://tractor-nautical-snowbird.ngrok-free.dev/api/payments/icici/`. Both handlers exist. Advice requires the bank hash and independent STATUS, not a browser session.
3. Have the database owner resolve RBAC schema parity in the intended UAT project and explicitly assign tester roles as needed. Verify payment constraints/RPC privileges with the supplied read-only SQL. Do not run automatic role-grant or provisioning shortcuts.
4. Sign in on ngrok, use synthetic consultation details in a confirmed isolated test database, and start a new application-owned checkout. Complete the bank payment using only ICICI-issued UAT instruments and OTP instructions.
5. Verify a signed callback, independent signed successful STATUS, and exactly one atomic booking confirmation with matching reference, transaction ID, amount and currency. Replay callback/advice/status to test idempotency.
6. Complete bank-issued pending, rejection/cancellation, expiry and recovery cases. Recheck the same reference after ambiguity; never issue another SALE automatically. Without the owning browser capability, use support rather than exposing checkout data.
7. Only after the actual bank suite passes may an authorized owner set `ICICI_UAT_TESTS_PASSED=true` on that UAT deployment. Live ICICI remains unsupported. Keep production `aa100xtech.com` and Razorpay settings separate and unchanged.
