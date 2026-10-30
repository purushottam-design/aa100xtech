# Influencer Partner Program

The existing `/influencers` route now contains the twelve program sections, an on-page join form, verified-client rankings and consented partner stories. The shared header, footer, public profile routes and detailed application route are retained.

## Database and environment setup

The checks on 30 October 2026 identified the running application's HTTP 503 and two separate environment issues:

- The running application reports `INFLUENCER_SCHEMA_MISSING`. The existing service-role key authenticated successfully, but `partner_applications`, `influencer_profiles` and `take_influencer_submission_slot` were absent from the API schema. Application submission stops at the rate-limit function before attempting an insert. The key is a valid service-role JWT for the configured project; replacing it with an anonymous key is not a fix.
- A direct Node probe using the default certificate store rejected the HTTPS certificate chain with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. The same probe worked with trusted system CAs. The npm startup commands now select the system CA store where supported to retain trusted connectivity after restarting.
- The previous public Supabase key was rejected. The replacement key supplied on 30 October is now configured in both public-key variables in the ignored `.env.local` file and passes `/auth/v1/settings` with HTTP 200. The REST metadata root can return HTTP 401 for a valid publishable key, so the diagnostics now use auth settings to check the credential independently of database objects and grants. Public profile queries return `404 / PGRST205`, confirming the remaining schema blocker; application writes use the server key.

No live database changes were made. The page therefore shows unavailable states instead of invented partners, conversion counts or testimonials.

1. Verify that `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` refer to the same active project. Also verify their browser counterparts, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Retain the project-matching `SUPABASE_SERVICE_ROLE_KEY` on the server only. Never replace a public key with a service-role key.
2. If the application objects are missing, run `supabase/repairs/restore_influencer_applications.sql` in that project's SQL editor. This complete repair creates missing application objects, supports the original legacy table, retains existing records, enforces RLS and the server-only rate limit, and reloads the API schema cache. It is rerunnable and does not require replaying the repository's unrelated historical migrations. If the base schema is already complete, skip the repair.
3. Apply `supabase/migrations/20261030190000_influencer_partner_program.sql`. It adds the private referral ledger, consented testimonials and public aggregate function. It is additive and rerunnable, without seed partners or quotes.
4. Restart `npm run dev`. The npm commands now launch Node with `--use-system-ca` where supported, so the installed operating-system CA store is trusted while certificate verification stays enabled. This is [Node's documented system-CA mechanism](https://nodejs.org/learn/http/enterprise-network-configuration). Older Node versions without that flag need a current supported Node release or an explicitly configured `NODE_EXTRA_CA_CERTS` file. Putting `NODE_USE_SYSTEM_CA` in a Next-loaded `.env` file is insufficient for the already-running Node process.
5. Run `npm run diagnose:influencers`. This command only reads API schemas and zero-row table queries; it does not insert applications, consume submission rate limits or print credentials. All checks should report `ready: true`. Then retry the form. Production environment changes require restarting or redeploying the Next.js app; `NEXT_PUBLIC_*` changes require a rebuild.

The migration uses Supabase roles, `auth.users`, the existing influencer tables and their public-eligibility function. It must run with the project's migration privileges. Browser requests never need migration or service-role credentials.

`SUPABASE_SERVICE_ROLE_KEY` authenticates REST operations; it does not provide a SQL migration connection. To let a local migration tool apply the repair, provide a server-only database connection string separately as `SUPABASE_DB_URL` in `.env.local`, or run the repair in the project's SQL editor. Do not send passwords in chat or prefix the connection string with `NEXT_PUBLIC_`.

Alternatively, set `SUPABASE_ACCESS_TOKEN` in `.env.local` to a Supabase personal access token scoped to the configured project with **Database / Database: Read-write** permission. The token's account must also have database access to that project. `npm run repair:influencers` previews the target and the two SQL files without connecting or changing data. `npm run repair:influencers -- --apply` checks database access with a read-only query, then installs both files in one transaction through the [Supabase Management API](https://supabase.com/docs/reference/api/v1-run-a-query). No Project Settings or account-wide Projects permissions are required. HTTP 403 means the token's project scope, database permission or account access must be corrected. It preserves existing applications, rate-limit records and profiles, and creates no sample applicants. A failure in either SQL file rolls back both. The command uses `SUPABASE_URL`; it never silently chooses the different historical project in `supabase/config.toml`. It refuses conflicting server/browser URLs or a conflicting `SUPABASE_PROJECT_ID`. It does not create or rotate API keys; fix the rejected public key in both public-key environment variables, then restart the app and run the diagnostics again. Remove the personal access token from the local environment when it is no longer needed.

Live token checks returned `Missing required permission(s): database_read`, including for a SELECT-only query in write mode. Explicitly grant **Database Read** (`database_read`) as well as **Database Read-write** (`database_write`) when creating the scoped token. The repair command reports these known missing permission names without printing API error bodies or credentials. Alternatively, run the combined `.migration/restore-influencers.sql` in the configured project's SQL editor; it contains the same tested transaction and no credentials.

Development POST failures now return a safe error code and an actionable static message, for example `INFLUENCER_SCHEMA_MISSING`. Production retains the generic user-facing error. Server logs include only a known error code and static remediation; raw database errors, application contents and connection strings are never logged.

## Recording confirmed clients

Use the existing `/admin/influencers` workflow to approve an application and publish a consented profile. Its new program panel is available after a profile exists. Existing `partners.view` and `partners.review` permissions control reads and writes.

- Record a stable, canonical CRM business-client ID and its private verification reference. Reuse the same CRM ID for repeat orders from that business; an order ID is not a distinct client ID.
- Pending, rejected and reversed referrals do not count as converted clients. To confirm a conversion, select `converted`, supply evidence and explicitly confirm that the client conversion has been reviewed. Reviewer identity and confirmation time are assigned on the server.
- Re-saving the same profile/client updates its existing record. A converted client cannot be credited to two partners. Review and reverse an incorrect attribution before confirming another attribution.
- Client IDs, evidence and reviewer IDs remain private. Public reads receive only profile ID, total leads, confirmed conversion count and profile creation date.

Rankings sort by confirmed converted clients descending, then profile creation date ascending and profile ID for stable ties. The same ordered data drives the top spotlight and leaderboard. Follower counts, raw leads and the older manual `featured` profile field do not determine program ranks. Levels are derived as Starter 0–2, Growth 3–5, Pro 6–10 and Elite 11+.

## Testimonials and applications

No approved testimonials were provided. Keep the testimonial section empty until a partner has approved the exact quote for publication. Administrators can save drafts and publish or unpublish consented quotes in the program panel. Both the quote and its associated profile must be eligible for public display; unpublishing the profile or withdrawing its consent hides the story too.

The new join form submits to the existing `/api/influencers/apply` endpoint with the existing validation, private review and publication-consent rules. State, country and audience locations remain required by that workflow. A failed save keeps the applicant's inputs, and success appears only after the API confirms persistence. The original detailed application and file-upload flow remain available.

## Verification

Run `npm test`, `npm run typecheck` and `npm run build`. Program tests cover conversion-based sorting, ties, level boundaries, partial-data failures, admin authorization, evidence review, quote consent, duplicate attribution and PostgreSQL RLS. The SQL test applies the migration twice to an isolated database; it does not alter live Supabase.

After database setup, verify with real consented profiles:

1. Publish an approved profile and check that its actual statistics load on `/influencers`.
2. Save a pending referral; its converted count must remain unchanged.
3. Confirm that client with evidence and refresh the page. Both spotlight and leaderboard must use the new count.
4. Re-save the same CRM client, then attempt to credit it to another profile. The first action must not add another client; the second must be rejected.
5. Reverse the conversion and refresh. Its converted count and derived level must decrease.
6. Save an unpublished testimonial, then publish it with the partner's permission. Only the consented published version should appear. Confirm that withdrawing publication hides it.
7. Check the join form and the existing detailed application on mobile and desktop. Use a designated test application; browser regression tests intercept submissions and do not create real applicants.
