# Marketing form 503 investigation — 5 November 2026

Historical record: the later shared-form replacement verified successful live brand and influencer persistence, idempotent retries and cleanup of its temporary records. The readiness diagnostic now passes. See [marketing-intake.md](marketing-intake.md) for the current implementation and verification status; the blocker below describes the earlier investigation.

## Verified runtime findings

- The effective development server URL and browser URL both select project `ryircgxjsieovvbmprqv`. Development environment precedence is `.env.development.local`, `.env.local`, then `.env`; the active Supabase values come from `.env`.
- The server uses a legacy JWT **service-role** key. Requests to the existing influencer tables and rate-limit function are accepted. No runtime environment or credential changes were necessary, and no secret values were printed or modified.
- `brand_campaign_inquiries` and `marketing_intake_receipts` return HTTP 404 / `PGRST205` through this project's REST API. `save_marketing_intake` returns HTTP 404 / `PGRST202`. The required private media-kit bucket is also not visible to the server.
- The function check used an invalid campaign kind, which the migration rejects before inserting anything if the function exists. It did not create an application or inquiry.
- This is the immediate cause of the form's 503: the application cannot access its persistence schema through PostgREST. API responses alone cannot establish whether SQL objects are physically absent, the migration ran in a different SQL context, grants differ, or the API schema cache is stale. The reported SQL Editor success does not establish API visibility.
- The configured Management API token separately returns HTTP 403 for a read-only SQL query. The CLI's `project_admin_read` permission is unrelated to the application's REST insert permissions. No migration was applied by this investigation.
- Repeated previous local submissions also exhausted the existing hourly throttle and returned 429. A schema check now precedes that limiter, so the observed unavailable receipt-table failure does not consume additional submission slots. Existing counters have not been reset or bypassed.

## Implementation fixes

The standalone forms and embedded `/influencers` forms now share `/api/marketing/brand` and `/api/marketing/creator`, the same validation/persistence workflow and the same database receipt requirement. Existing embedded fields are validated and retained by server adapters; unspecified campaign preferences are stored as unspecified rather than invented. Selected creators are rechecked for public approval and consent.

The embedded brand form has a required privacy checkbox so its stored processing consent is explicit. Its layout, other fields and styling remain intact. The older image-upload application endpoint remains available for its existing separate form.

Each form keeps its retry token, blocks concurrent clicks, preserves details on failure, and displays success only when the shared handler returns a confirmed reference. The common client transport also rejects malformed responses and `ok: true` responses without a reference.

Safe server diagnostics include the operation and normalized database error code, such as `operation=check_marketing_schema; database_code=PGRST205`. Database messages, credentials and submitted contact data are excluded from logs and public errors.

Changed application files:

- `src/lib/marketing-form.server.ts` — shared format validation and embedded-form adapters.
- `src/lib/marketing-submission.ts` — shared browser transport and receipt verification.
- `src/lib/marketing-intake.server.ts` — schema check before throttling, stage diagnostics and shared persistence.
- `src/lib/marketing-errors.server.ts` — safe database-code diagnostics and accurate 429 responses.
- `src/lib/marketing-intake.ts` — stored campaign types preserve original embedded briefs.
- `src/components/marketing-intake-form.tsx`, `influencer-program-application.tsx`, `campaign-enquiry-form.tsx`, and `influencer-partner-landing.tsx` — connect the existing forms to the common flow.
- `src/components/brand-inquiry-management.tsx` — display the original campaign type, timeline, package, target audience and creator selection.
- `scripts/diagnose-marketing-intake.cjs` — report active project, runtime API codes and incorrect key types safely.
- `scripts/apply-marketing-intake.cjs` — support the separate recovery migration with `--recover`.

## Manual database verification and recovery

1. Open the SQL Editor for **project `ryircgxjsieovvbmprqv`**, checking the selected project and branch.
2. Run `supabase/diagnostics/marketing_intake.sql`. It returns the actual SQL-side table/function identities, columns, RLS flags, routine grants and bucket configuration without selecting private records. Null object identities establish that the objects are absent in that SQL context.
3. Run `supabase/migrations/20261105143000_marketing_intake_recovery.sql` in that same editor. It is additive and rerunnable: existing tables and submitted records are retained, service-role grants are restored, RLS remains enabled, the private bucket is configured, and PostgREST is notified to reload configuration and schema metadata. The original migration is preserved.
4. Confirm the migration's final verification row reports `true` for all checks, then run `npm run diagnose:marketing` after the API cache reload. All readiness checks must pass. SQL success alone is insufficient.
5. Test one real brand and one real creator submission, confirm their returned references in the private tables/admin screens, and test the embedded forms. If a previous rate window is still active, wait for it to expire rather than bypassing the limiter.

An authorized Management API token is an optional alternative to SQL Editor:

```powershell
npm.cmd run repair:marketing -- --apply --recover
```

The personal access token needs database read/write access only for that helper. Do not substitute it for `SUPABASE_SERVICE_ROLE_KEY`. The publishable/anon key is for browser/auth operations; the secret/service-role key remains server-only. Direct database connection credentials are a separate authentication method. None needs to be exposed to frontend code.

## Test and verification status

- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd test`: **157 passed**, no failures.
- Five targeted Playwright checks: **5 passed**. They cover both standalone forms, both embedded forms, preserved input/retry IDs, loading/error/success states and responsive widths. Submission responses are intercepted to avoid synthetic production records.
- Real PostgreSQL/PGlite integration tests execute the actual recovery SQL and `save_marketing_intake` as `service_role`. All four form variants persist; duplicate requests return the original reference; changed retries conflict; RLS blocks anonymous/private access; recovery can be rerun without losing records; approval/publication is not automatic.
- Additional tests cover missing/invalid credentials, table permissions, unavailable schema without consuming rate slots, malformed response bodies, and refusing fake success without a database reference.
- **Live Supabase persistence remains unverified and the issue is not marked resolved.** Live checks still report the unavailable marketing API schema. No production submissions were inserted, deleted or overwritten by this investigation, and no live schema changes were made.
