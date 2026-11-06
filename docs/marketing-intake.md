# Influencer applications and brand campaign inquiries

## Shared forms on the influencer page

`/influencers` now renders the same `MarketingIntakeForm` component as the two standalone marketing routes. The influencer form appears first, with equal-width desktop columns and a vertical stack below 1024px. Generated field IDs keep labels and validation messages unique when both forms appear together. The old embedded cards, `InfluencerProgramApplication` component and their unused styles were removed. The general campaign form used elsewhere remains available.

Both standalone routes and all form fields, optional details, upload controls, privacy/publication consent, validation, loading states, error recovery and submission references are retained. Directory collaboration selections pass through the shared brand form and are checked against current publication and consent before storage.

The current marketing diagnostic passes every readiness check. Live brand and influencer submissions were each saved through the local HTTP API and independently read back from Supabase; retrying returned the same reference without duplication. The influencer remained pending and unpublished. The two clearly marked temporary records and their receipts were removed after verification; only the four verification attempts were removed from the local throttle counter. No notifications were sent, and no migrations or environment changes were made for this replacement.

For the historical post-migration 503 investigation and recovery steps, see [marketing-intake-investigation.md](marketing-intake-investigation.md). The earlier live-access blocker described there is now resolved.

Public pages:

- `/influencer-marketing/for-influencers`
- `/influencer-marketing/for-brands`

The existing Marketing → Influencer Marketing menu links to both pages and the approved creator directory. Existing registration and campaign forms remain available.

Both new pages use the supplied form references: a centered single-page card, rounded pill inputs, compact two-column contact fields, simple platform choices and a full-width submit button. Optional extra details expand inline. The forms retain all required data validation and submit to the existing secure endpoints.

## Database setup

If a form returns HTTP 503, run `npm run diagnose:marketing`. This checks the current server credential, all required tables/functions, campaign columns and the private storage bucket without submitting an application. A working influencer directory alone does not verify the new marketing schema.

Apply `supabase/migrations/20261105120000_marketing_intake.sql` to the same Supabase project used by the app. It requires the existing influencer partnership migration. It is transactional and can be rerun safely.

The helper uses the same environment configuration and Supabase Management API as the project's influencer repair script:

```powershell
node --use-system-ca scripts/apply-marketing-intake.cjs
node --use-system-ca scripts/apply-marketing-intake.cjs --apply
```

Equivalent commands are `npm run diagnose:marketing` for the runtime schema check and `npm run repair:marketing -- --apply` for applying the migration. The application keeps visitor-facing errors free of SQL paths and setup instructions; server logs identify `MARKETING_SCHEMA_MISSING` and the precise migration needed. A missing migration continues to return 503 until it has actually been applied.

The first command checks prerequisites without making changes. The second applies and verifies the migration. `SUPABASE_ACCESS_TOKEN` needs `database_read` and `database_write` access to the configured project. A project service-role key cannot apply SQL migrations. Alternatively, run the migration in that project's Supabase SQL editor.

During implementation, the configured Management API token returned HTTP 403 at the read-only prerequisite check; no live schema changes were made. The complete migration has been verified in local PostgreSQL using PGlite.

Runtime uses existing `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and authentication configuration. No additional UI packages or public login requirements were added.

## Administration and consent

Creator submissions go into the existing private `partner_applications` table with `pending` review status. `/admin/influencers` requires `partners.view`; changes and publication require `partners.review`. Search includes city, category and platform. The existing profile editor creates drafts on approval. Publication requires recorded applicant consent, approval and admin confirmation. Privacy consent is required; publication consent is optional and unchecked initially.

`/admin/brand-inquiries` requires `leads.view`. Updating status and internal notes requires `leads.edit`. CSV export additionally requires `leads.export`; its values are escaped against spreadsheet formula execution. Budget, category, platform and status filters apply to exports. Contact details are never included in public directory responses. No team assignment field is added because the existing lead permissions do not define an assignment workflow.

PDF media kits are checked for PDF signatures and downloaded as attachments with a sandbox policy. JPG, PNG and WebP uploads are decoded, resized and re-encoded without metadata. Files are limited to 5 MB and stored in a separate private `influencer-media-kits` bucket. Downloads fetch by application ID, require `partners.view`, and never expose a public storage URL. Ambiguous database failures retain private uploaded files to avoid deleting attachments after a possible commit; unreferenced objects can be removed later after checking application references.

## Submission and notifications

Both handlers enforce same-origin requests, server-side Zod validation, a honeypot, form completion timing, streamed request size limits and the existing atomic hourly rate limiter. IDs and timestamps come from PostgreSQL. A unique submission token and payload fingerprint make retries idempotent, including attachment contents. Only a confirmed database receipt displays success. No profile is published, payment created or influencer booked by submission.

Brand notifications reuse the configured Resend service and official contact destination. `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` remain optional. Saved inquiries record notification status (`sent`, `failed`, or `not_configured`); a notification failure does not discard the inquiry. An idempotent retry does not send a second email.

## Verification

```powershell
npm.cmd run typecheck
npm.cmd test
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
node node_modules/@playwright/test/cli.js test tests/e2e/marketing-intake.spec.ts
npm.cmd run build
```

Unit and SQL tests cover validation, consent, failed persistence, attachment restrictions and cleanup, atomic retries, and private database access. Browser tests intercept submission endpoints to avoid adding synthetic applications to the live database; they cover real form interactions, failure recovery, input preservation, navigation and responsive widths. Run a real application and inquiry acceptance check in the intended Supabase environment after the migration is installed.
