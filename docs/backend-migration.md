# Backend migration to Next.js

The migration retains the existing Supabase project, database schema, RLS policies, storage bucket names, authentication persistence, payment implementation, and business handlers. No database migration or live mutation is required by this framework change.

## Server function transport

All 106 existing server functions retain their import paths and callable signatures in `src/lib/*.functions.ts`. Those files now contain browser-safe, typed RPC entrypoints. Type-only references preserve inferred response types and validator input types without importing server implementations into the browser.

The original implementation bodies live in `src/lib/backend/handlers/`. The compatibility builder in `src/lib/backend/server.ts` applies the same validators and authentication middleware before executing each handler. It is a local server-only implementation; it does not depend on TanStack Start.

Next.js handles the transport at `/api/rpc/[...path]`. `registry.server.ts` explicitly lists the 106 allowed module/function combinations. Requests cannot select arbitrary files, exports, or import paths. Each original GET or POST method remains enforced. JSON request/response envelopes preserve existing values, Zod validation failures, and the error messages consumed by forms.

The browser sends its existing Supabase access token as a Bearer authorization header. The server validates JWT claims through Supabase before constructing the authenticated context. Original role and permission checks remain inside the handler bodies. Private service credentials and server implementation modules have `server-only` boundaries.

RPC requests require a custom header, reject cross-site fetches and mismatched Origin headers, accept POST bodies only as JSON, and send no CORS authorization. Existing public affiliate APIs retain their separate CORS and API-key behavior.

`request-context.server.ts` uses Node AsyncLocalStorage so concurrent requests keep independent authorization headers, IP/user-agent values, response statuses, and cookies. The 2FA unlock cookie is returned through the actual HTTP response. RPC responses use `Cache-Control: no-store` and vary by authorization and cookie.

## Preserved handler inventory

| Module           | Functions |
| ---------------- | --------: |
| accounts         |        12 |
| admin-management |        13 |
| admin-panels     |         4 |
| admin-security   |         8 |
| admin-seed       |         1 |
| affiliate        |        12 |
| app-settings     |         2 |
| consultations    |         3 |
| dashboard-auth   |         1 |
| partners         |         2 |
| push             |         3 |
| rates            |         1 |
| roles            |         7 |
| super-admin-plus |        25 |
| super-admin      |        12 |
| **Total**        |   **106** |

The synchronous `describeAgent` export remains available through a shared pure helper.

## Public route handlers

| Existing URL                      | Methods       | Behavior                                                                                   |
| --------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `/api/public/v1/health`           | GET, OPTIONS  | Checks the configured Supabase project's auth/catalog connection and booking storage       |
| `/api/public/v1/conversions`      | POST, OPTIONS | Validates API key, attributes an affiliate, applies commission and duplicate guards        |
| `/api/public/v1/coupons/validate` | POST, OPTIONS | Resolves active coupon/affiliate/product and computes discount                             |
| `/api/public/v1/track/click`      | POST, OPTIONS | Records attribution with hashed IP and duplicate protection                                |
| `/go/[affiliateId]/[slug]`        | GET           | Records referral click, sets attribution cookie, and redirects to the original destination |

The original HTTP implementations remain in their source modules; Next `route.ts` adapters invoke them directly. Public API preflight now returns an empty 204 body, as required by the Web Response API. The health handler now reads the same server Supabase environment variables as the application instead of a separate hardcoded public connection.

## Verification

Run `node --test tests/backend-rpc.test.cjs` (or the project test script). Six tests verify:

- An explicit registry, HTTP method enforcement, and rejection of cross-site/missing-header requests before execution.
- Zod validation and malformed JSON rejection before business logic.
- Concurrent request isolation, status forwarding, and 2FA Set-Cookie forwarding.
- Missing, malformed, and forged Bearer tokens are rejected; verified claims reach handlers.
- All 106 typed browser stubs match the explicit registry.
- Public OPTIONS responses have a valid empty 204 body.

These tests mock the SDK and application handlers and perform no database writes. The existing navigation/form tests separately exercise successful inserts and failure behavior through mocks.

Live login can provision/update the configured admin account as part of the original business logic. Live account CRUD, 2FA enrollment, candidate uploads, affiliate/conversion writes, notifications, and Razorpay transactions must be exercised only with approved test accounts/data and payment test credentials. They are not run automatically against production by this migration.
