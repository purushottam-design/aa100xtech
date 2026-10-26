# Razorpay and ICICI payment preparation

## Current state

The existing payment flow is the consultation booking dialog shared by `/consultation`, the mobile app and booking CTAs. It uses typed RPC endpoints backed by Supabase `consultation_bookings`, creates Razorpay orders server-side and opens the existing Razorpay Checkout SDK.

Razorpay remains the default and active provider. ICICI appears as a disabled, clearly **Currently unavailable** option. ICICI is **not connected to a bank API** and is not production-ready. Its product/version, official merchant kit, request/response contracts, credentials and bank-issued sandbox vectors have not been supplied or validated. No bank URLs or payload formats have been guessed.

The official [ICICI Developer Portal](https://developer.icicibank.com/) lists gateway integration kits and a Sandbox → UAT → Production onboarding path. The merchant's exact gateway contract must be obtained from that portal or their ICICI integration team. Third-party copies of integration documents are not treated as authoritative.

## Customer flow

1. The customer selects a consultation plan and enters the existing booking details.
2. The existing server creates the Razorpay order, deriving the INR amount from the server-side plan. Existing API names and credentials remain intact.
3. The existing summary now shows **Choose Your Payment Method**, with Razorpay selected and ICICI disabled. Both cards display the same server-returned amount, without additional fees.
4. Payment opens the original Razorpay checkout. The frontend never independently marks a payment successful.
5. The server verifies the existing HMAC signature, order/payment binding, amount and currency. Captured payments are successful. Authorized/unconfirmed payments remain pending, with a **Check payment status** action that verifies the same payment without creating another order or charge. Invalid signatures do not change database records.
6. Verified failures and checkout dismissal retain the existing failed/cancelled screens. Concurrent verification retries do not overwrite settled transactions.

The existing best-effort storage fallback is retained for backwards compatibility. When a booking row is unavailable, verification additionally fetches the authoritative Razorpay order and binds its receipt, booking notes and amount/currency to the submitted booking. That does not create a local payment record; reliable live tracking still requires working Supabase storage. No live payment was attempted during implementation.

## Modified files

- `.env.example`: adds empty, server-only ICICI placeholders; existing Razorpay variables remain unchanged.
- `src/components/consultation-booking.tsx`: mounts gateway selection and adds pending verification/recheck behavior.
- `src/lib/backend/handlers/consultations.ts`: protects duplicate results with signature/order checks, checks capture state and uses conditional settlement updates. Existing endpoint names and order creation remain intact.
- `src/lib/consultations.server.ts`: adds a read-only Razorpay order lookup for the existing storage fallback. The existing create-order and signature functions, credentials and SDK URLs are preserved.
- `src/components/super-admin-console.tsx` and `src/components/admin-panel-page.tsx`: add read-only payment management to the existing Super Admin console and Business dashboard.
- `src/lib/backend/registry.server.ts`: explicitly registers the admin-only payment-list RPC.
- Existing registry/baseline tests are updated only for the requested payment additions.

## New files and local endpoints

| File / endpoint | Purpose |
| --- | --- |
| `src/lib/payment-gateways.ts` | Client-safe labels, provider choices and status display mapping |
| `src/lib/payment-database.server.ts` | Migration-local table types and optional customer association from a server-verified existing session; guest checkout remains supported |
| `src/components/payment-gateway-selector.tsx` | Accessible radio cards using the existing design; ICICI cannot be selected |
| `src/lib/icici.server.ts` | Supplied reference HMAC implementation, constant-time reference comparison, same-origin checks and closed integration gate |
| `POST /api/payments/icici/initiate` | Same-origin request check, then `503 ICICI_INTEGRATION_NOT_VERIFIED`; no bank calls or database writes |
| `POST /api/payments/icici/status` | Same-origin request check, then the same unavailable response; no unverified status claims |
| `POST /api/payments/icici/callback` | Always unavailable; never accepts a callback as paid or sends a successful bank acknowledgement |
| `src/lib/backend/handlers/payments.ts` | Existing bearer authentication, active-account RBAC and `payments.view`; maps only payment-list fields to the browser |
| `src/lib/payments.functions.ts` / `POST /api/rpc/payments/listPayments` | Browser-safe typed admin payment-list entrypoint |
| `src/components/payment-management.tsx` | Customer name, booking/order ID, amount, gateway, transaction ID, status/date, search, pagination and gateway filtering |
| `supabase/migrations/20261026120000_dual_gateway_tracking.sql` | Additive provider-neutral tracking and settlement protections |
| `tests/payments.test.cjs` | Hash, disabled bank routes, Razorpay contract/security, pending/failed/concurrent verification and actual PostgreSQL migration tests |
| `tests/e2e/payments.spec.ts` | Existing checkout, responsive selector, disabled ICICI, mocked Razorpay checkout outcomes and invalid/unauthorized APIs |

## Database migration

Apply the new payment migration to the existing project through the normal Supabase migration process or SQL editor. **Do not reset the database or replay historical base-schema migrations.**

The existing `consultation_bookings` table is retained. New columns are `customer_id` (nullable for guest bookings), `payment_gateway` (defaults to Razorpay), `gateway_order_id`, `gateway_transaction_id` and `paid_at`. New signed-in bookings associate the account only after the server verifies the existing session; form-supplied account IDs are never trusted. This association is best-effort on deployments without the new migration, so guest and existing checkout behavior remain available. Existing amount, currency, business order ID, payment status, created/updated timestamps and legacy Razorpay fields remain in place.

Historical records are not rewritten. Reads fall back to their original Razorpay IDs; existing created/updated timestamps remain available, but an unknown historical payment date is shown as **Not recorded** rather than guessed. A trigger mirrors future legacy Razorpay writes into the generic fields atomically, so checkout does not depend on deploying new insert payloads. The trigger prevents a settled payment from being replaced by another transaction/gateway or downgraded by late failure callbacks. Unique provider transaction indexes prevent transaction reuse across bookings, including after refund. Existing duplicate transaction references cause migration failure and rollback for manual review; the migration does not delete, deduplicate or alter existing payments to force success.

No anonymous write permissions are added. The new admin payment view is read-only and requires the existing server permission `payments.view`.

## ICICI reference hash

`generateSecureHash` reproduces the supplied reference's top-level key sorting, `secureHash` exclusion, omission of null/undefined, JSON serialization of nested objects/arrays, UTF-8 HMAC-SHA256 and lowercase hexadecimal output. Zero and false are included. Nested keys are not recursively sorted. The input is not mutated.

This is a **reference utility, not a verified ICICI signature protocol**. Tests use local reference vectors, not bank-issued certification cases. Neither callbacks nor real transactions use this utility until ICICI confirms the exact field order, numeric/string representation, nested serialization, secret encoding and response/callback signing rules. Adding environment variables cannot bypass the closed gate.

## Configuration and activation

The example environment now includes:

```env
ICICI_MERCHANT_ID=""
ICICI_AGGREGATOR_ID=""
ICICI_SECRET_KEY=""
ICICI_BASE_URL=""
ICICI_ENVIRONMENT="sandbox"
```

These are provisional placeholders, not a claim that a particular ICICI product requires exactly these fields. Additional/different credentials, API IDs, certificates, encryption keys, callback settings or merchant identifiers may be required by the actual bank kit. Keep all secrets in local/server hosting configuration; never prefix them `NEXT_PUBLIC_` or paste them into chat. Razorpay keys are not replaced or edited.

Before making ICICI selectable:

1. Confirm the precise ICICI product/version and obtain its official merchant integration kit, endpoint allowlist, request/response schemas, hash/encryption rules, status query and callback acknowledgement contracts.
2. Obtain sandbox credentials and bank-issued success/failure/pending/cancellation/signature test vectors. Register approved return/callback URLs and any IP/certificate requirements.
3. Implement the reviewed bank adapter, replacing the currently unavailable local routes. Bind references, amounts and callbacks to server-owned bookings; never accept browser return parameters as proof of payment.
4. Move gateway-specific order initiation behind the selected provider: the current preserved flow still creates a Razorpay order before the selection summary. ICICI must not reuse that order or trigger an unnecessary Razorpay order when enabled.
5. Implement/review idempotent provider attempts and reconciliation so a pending bank transaction cannot race a second provider charge. Database protections currently prevent replacing/double-settling a booking; they cannot undo two external charges initiated by an unimplemented bank adapter.
6. Apply the additive migration after reviewing existing duplicate references. Verify authenticated customer association where applicable; historical guest bookings retain a null account ID.
7. Pass sandbox API, callback tampering/replay, amount/order mismatch, timeout, duplicate and provider-switching tests before changing either availability gate. ICICI UAT/production approval and live credentials follow the bank's onboarding requirements.

## Verification limits

The detected Razorpay configuration is **live**, so automated tests use intercepted SDK/API responses and local fixtures. No real charge, refund or ICICI transaction is sent. Existing live Supabase configuration had previously rejected its service key; database migration tests therefore execute the actual SQL in isolated PostgreSQL, rather than claiming a live migration was applied. New records require valid Supabase server access for production tracking.

Run `npm test`, `npm run typecheck`, `npm run build`, and (with the app on port 3100) `npm run test:e2e -- tests/e2e/payments.spec.ts`. Repository-wide lint/browser baseline issues from previous work remain separate from the new payment checks.

### Results on 2026-10-26

- Production build and TypeScript checks passed.
- All 41 automated tests passed, including ten payment tests and the actual SQL migration executed in isolated PostgreSQL. The live migration has not been applied.
- All six payment browser tests passed on desktop/mobile. Three existing route, API-security and full-page runtime regression checks also passed (nine selected browser tests total). Screenshots are under `.migration/browser-results/`.
- New payment files pass ESLint. Repository-wide lint still reports existing issues; modified Razorpay server files pass lint and the existing consultation component's lint count did not increase.
- A fresh read-only check of Supabase booking storage returned `401 Invalid API key`. A valid `SUPABASE_SERVICE_ROLE_KEY` for the configured project is still required for persistent booking/payment records and live admin verification.
- Real Razorpay charges/refunds and ICICI sandbox/production transactions were not run. ICICI's exact official specification, credentials and bank-issued vectors remain pending; its routes and customer selection remain disabled.

Official Razorpay references: [signature and payment-status verification](https://razorpay.com/docs/server-integration/python/test-app/), [fetch order by ID](https://razorpay.com/docs/api/orders/fetch-with-id/).
