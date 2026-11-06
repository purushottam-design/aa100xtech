# Careers form and HR resume email

## Upload recovery on 6 November 2026

The live PDF attachment failure comes from missing backend setup. The read-only development check returned `PGRST205` for the website/candidate tables, found no submission RPC and did not find the private resume bucket. A Management API database query returned HTTP 403 for missing `database_read` access. The user chose to run the repair through Supabase SQL Editor.

Run the entire [single-transaction repair](../supabase/repairs/restore_website_requests.sql) in the confirmed development project `ryircgxjsieovvbmprqv`. Its final verification query should return five `true` values. The repair restores the existing website prerequisites, submission function and dedicated private PDF bucket, retaining existing records and storage objects. It rolls back if existing intake tables have incompatible columns.

After running it, use `npm.cmd run diagnose:website` and retry the career form with a PDF. Live submission recovery is pending execution of this SQL; no successful live upload is claimed yet. Email notifications remain a separate configuration requirement described below.

Verification: ten focused tests passed, including the actual server handler saving a PDF application into isolated PostgreSQL, retry deduplication, anonymous access denial, private bucket recovery, retained records and rollback on incompatible schemas. The storage API is mocked in that isolated integration test; the real SQL, request parsing and submission function execute unchanged.

The global `/careers` Apply section now uses the existing detailed
`CandidateApplicationForm` once, replacing the short application form. The
separate duplicate task section is removed; its `#task-application` anchor still
reaches the form. Role-card choices preselect the role. `/careers/apply` retains
the same shared form, and the London page's existing form is unchanged.

After a validated application and optional PDF are saved, the existing Resend
notification sends to `hr@aa100xtech.com`. The validated uploaded bytes are
attached as `resume.pdf` in base64; no public resume URL is created. Existing
5 MB/PDF checks, private storage, database save verification, request idempotency
and duplicate-notification protection remain. The format follows the
[Resend send-email attachment reference](https://resend.com/docs/api-reference/emails/send-email).

A failed save never sends an email. A saved application with failed or missing
mail configuration shows a warning instead of claiming that HR was emailed.
Provider acceptance is not proof of inbox delivery. No background retry worker
or live email-delivery acceptance is claimed.

## Configuration still required

The read-only readiness check returned missing tables (`PGRST205`), no submission
RPC, no private resume bucket and `notificationsConfigured: false`. These are
existing connected-project dependencies, not a successful live submission.

An authorized Supabase administrator must review migration state and apply the
existing required migrations to the verified project:

1. `supabase/migrations/20261103110000_website_content_prerequisites.sql`
2. `supabase/migrations/20261103120000_website_requests.sql`
3. `supabase/migrations/20261103121000_website_resume_storage.sql`

Configure `RESEND_API_KEY` and a provider-verified `NOTIFICATION_FROM_EMAIL` in
the server environment (`.env.local` locally and the existing deployment's
environment settings). Do not put credentials in client variables or commit
them. The HR recipient is already set in `src/data/site.ts`.

Run `npm.cmd run diagnose:website` again, restart the local server after changing
environment variables, then verify an authorized application with a real PDF,
the private saved record, provider acceptance and receipt at the HR inbox.
No production migration, live test email or deployment was performed here.

Automated verification uses mocked provider/storage calls and browser request
interception; it cannot establish actual email delivery.

Verification completed: production build, TypeScript and targeted ESLint passed;
133 unit/integration tests passed; four browser scenarios passed for the shared
form, uploads/retries, navigation/layout and honest email-failure feedback. A
focused browser recheck additionally passed role-card preselection and desktop /
mobile screenshot inspection. Provider tests confirm the exact HR recipient,
PDF attachment bytes, duplicate suppression, and no email after a failed save.
