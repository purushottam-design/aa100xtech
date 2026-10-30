# AA100X TECH influencer partnership program

This extends the existing Next.js / Supabase project. It reuses the current navbar, footer, authentication, admin navigation, role/permission resolver, RPC transport, design components, application route and `partner_applications` table. Existing accounts and submissions are preserved.

## Routes and components

| Route | Purpose |
| --- | --- |
| `/influencers` | Public landing page, benefits, workflow, FAQs, featured partners and searchable directory |
| `/influencers/[slug]` | Real approved public profile, social accounts, approved gallery/videos, sharing and dynamic metadata |
| `/partners/apply?opportunity=paid-promotion` | Extended existing influencer application route; separate private and public fields, two consent checkboxes and uploads |
| `/partners/apply` | Existing 30-level affiliate application remains available |
| `/admin/influencers` | Influencer Management: private application queue, review, information requests, public profile editor, media selection, consent withdrawal, publication and featuring |
| `/` | Shows an additional featured-partners section only when published featured records exist |
| `/sitemap.xml` | Includes `/influencers` and currently published profile URLs; no cached withdrawn listings |

The existing **Join Us** dropdown now contains **Jobs** and **Influencer Partners**. Account controls remain enabled. Shared styles are unchanged; the program's presentation styles are scoped in `src/app/influencers/influencers.css`.

Main components: `influencer-application-form`, `influencer-directory`, `influencer-management`, `influencer-share` and `featured-influencers`. Local optimized editorial photography and its source/license notes are in `public/influencers/`; these photos never represent approved partners.

## API endpoints

| Method / endpoint | Authorization and purpose |
| --- | --- |
| `POST /api/influencers/apply` | Public, same-origin multipart submission, Zod validation, per-address HMAC rate limit, private image storage, pending application |
| `POST /api/influencers/upload` | Existing bearer authentication plus `partners.review`; upload media for an existing influencer application |
| `GET /api/influencers/media/[applicationId]/[imageId].webp` | Checks current public RLS visibility and image inclusion, or an authenticated admin with `partners.view`; streams private media with `no-store` |
| `GET /api/rpc/influencers/listInfluencerApplications` | Existing bearer authentication plus `partners.view`; private application review queue |
| `POST /api/rpc/influencers/saveInfluencer` | Existing bearer authentication plus `partners.review`; review decisions, profile editing, publication, consent withdrawal and collaboration tracking |

Supreme admins are authorized by the existing RBAC system. Other administrators need the existing partner view/review permissions; no public role receives edit access. The middleware checks account status through the existing authorization resolver.

## Database setup

Apply **only** the new migration to the existing Supabase project using the normal migration process or SQL editor:

`supabase/migrations/20261026090000_influencer_partnership.sql`

Do not reset the database or replay the repository's historical base-schema migrations. The new migration:

- Adds influencer application fields and consent records to `partner_applications`, without deleting or rewriting existing submissions.
- Creates `influencer_profiles` containing only curated public information, with unique slugs and a one-to-one application relation.
- Separates application review status (`pending`, `under_review`, `approved`, `rejected`) from profile publication (`draft`, `published`, `unpublished`). It preserves the legacy application `status` behavior for older admin screens.
- Creates a private `influencer-media` bucket with no anonymous write/read policies. Only the server writes assets.
- Creates a server-only atomic rate-limit function and table; records use an HMAC of the address rather than a raw address and expire after an hour.
- Adds a public read policy requiring an approved application, both recorded consents, admin confirmation and published status. RLS rechecks the private application's current consent without exposing private application fields.
- Retains pending direct inserts for the unrelated existing affiliate form while preventing clients from forging influencer approval or consent.

Existing paid-promotion submissions appear in the review queue. Historical applications without recorded consent cannot be publicly published; applicants must submit the current consenting form. There is no automatic migration of private details into public pages.

## Configuration

Keep server credentials only in `.env` and the hosting provider's server environment:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — must be a valid administrative key for the same project
- Existing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the unchanged browser authentication

Never prefix the server key with `NEXT_PUBLIC_`. No additional external service or image-hosting credential is required. `sharp` is a direct runtime dependency for decoding/re-encoding uploaded images, bounding dimensions and removing EXIF/GPS metadata. `@electric-sql/pglite` is a development-only dependency for isolated PostgreSQL migration/RLS tests; it is not a production database.

The prior live check rejected the configured server key with **Invalid API key**. Live submission, private media and admin verification require a valid key and the migration. A directory service failure is displayed as unavailable, rather than being presented as an empty database. Local Node requests behind the current certificate environment may need `NODE_OPTIONS=--use-system-ca`; TLS verification is never disabled in application code.

### Directory connection troubleshooting (2026-10-27)

Read-only checks against the configured project found:

- Server/browser URLs and publishable keys match. The publishable key authenticates successfully.
- The public directory query returns `404 / PGRST205`: `public.influencer_profiles` is absent from the REST API schema cache. A separate zero-row query of `partner_applications.is_influencer` returns `400 / 42703` (missing column), confirming that the influencer schema has not been provisioned.
- Both the configured `SUPABASE_SERVICE_ROLE_KEY` and the separately configured `SUPABASE_SECRET_KEY` return `401 Invalid API key`. The application admin client uses **`SUPABASE_SERVICE_ROLE_KEY`**; changing only `SUPABASE_SECRET_KEY` will not fix it. Set the former to a valid server key for the same project. The existing client supports both legacy service-role JWTs and new `sb_secret_...` keys.
- On this Windows machine, default Node requests fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Running Node 24 with `--use-system-ca` succeeds in verifying the certificate and reveals the database errors above.

To finish database setup, apply `supabase/migrations/20261026090000_influencer_partnership.sql` **once** through the existing project's SQL editor or normal migration process. Do not reset the database or replay historical migrations. This migration preserves existing applications and creates the directory, consent policies, private bucket and submission limiter together. If the table exists after migration but the API still reports `PGRST205`, reload the PostgREST schema cache with `NOTIFY pgrst, 'reload schema';`. Verify the `anon` SELECT grant and the migration's publication/consent policy; do not disable RLS or substitute an admin key for public reads.

For local development on this machine, use Node 24's system CA support at process startup:

```powershell
$env:NODE_OPTIONS = "--use-system-ca"
npm.cmd run dev
```

Preserve any other required `NODE_OPTIONS` flags when adding this flag. An organization-specific CA can alternatively be configured with `NODE_EXTRA_CA_CERTS` pointing to its trusted PEM certificate bundle before Node starts. Keep certificate verification enabled. These are runtime settings; adding them to Next.js `.env` after Node has started does not configure its certificate trust.

The public loader bounds each database request to eight seconds, keeps reads uncached, and reports only fixed, actionable warning text at most once per failure category every five minutes per server instance. It never logs SDK messages, URLs or credentials. Failures return an unavailable state, never partial results or stale published records. The homepage and individual profile routes render an availability message without throwing into a development error overlay; genuinely missing profiles still return 404. A successful empty directory retains its existing invitation to join. Admin/authentication behavior and database policies are unchanged.

Verification: all 47 automated tests (including isolated PostgreSQL migration/RLS checks), the five existing influencer Playwright tests, production build, TypeScript and lint on changed source/test files passed. Browser checks against the local development server confirmed HTTP 200 and visible unavailable states on `/`, `/influencers` and a profile route, with no console errors, uncaught errors or development error overlay. Live successful reads and authenticated publication remain unverified until the migration and valid server key are configured; no production records were modified.

## Admin workflow

1. Open **Influencer Management** from existing admin navigation. Search/filter the private queue.
2. Review identity, social accounts, audience, private terms, proposed deliverables and uploaded media. Record any information needed in **Request additional information**; save and use the provided email link to contact the applicant. Email delivery remains manual; this does not silently send messages or require a new email provider.
3. Set **Approved** and save. A public profile is created as a **draft**, using a unique default slug. Approval never publishes automatically.
4. Edit only the public fields. Review biography and partnership description for private contact details, rates or other confidential text. Select profile/cover/gallery images and approved content URLs. Audience counts are self-reported; absent counts stay unknown rather than being invented.
5. Confirm the applicant's recorded publication consent. Set **Published** and save. The creator then appears in the directory, profile route and sitemap. Featuring also adds the creator to the program page and homepage.
6. Set **Unpublished**, reject/reopen the application, or record consent withdrawal to remove public access. Consent withdrawal cannot be reversed by checking an admin box: a new applicant consent is required. Media requests recheck visibility rather than relying on long-lived public or signed URLs.

The admin can remove photos from the public gallery and clear profile/cover selections. Original application uploads remain private for application review; public removal does not delete existing records.

## Verification

- `npm test`: existing regression checks plus influencer schema, endpoint, authorization, approval/draft/publication/withdrawal, private media and image sanitization tests. The PostgreSQL test applies the actual SQL migration to an isolated database and checks RLS, preserved submissions, private storage configuration and throttling.
- `npm run typecheck` and `npm run build`.
- With the app running on port 3100: `npm run test:e2e -- tests/e2e/influencers.spec.ts`. Covers desktop/tablet/mobile pages, navbar integration, application validation/error retention/submission with intercepted responses, images, consent fields, protected admin routing and actual invalid/unauthorized API requests. No browser test submits valid applications to production.
- Directory filtering, profile rendering and sitemap use real database records in production. The production database migration and live authenticated create/review/publish flow must be verified after valid Supabase configuration is available.

The repository already has unrelated global lint errors and browser failures involving the app-login header assertion and home-page tablet overflow. New source files are linted separately; unrelated pages/styles are not reformatted to address those issues.

### Results on 2026-10-26

- Production build and TypeScript checks passed.
- All 31 unit, handler, regression and isolated PostgreSQL/RLS tests passed.
- All five new influencer browser tests passed at desktop, tablet and mobile sizes. Screenshots are saved under `.migration/browser-results/`.
- The full browser suite passed 8 of 11 tests. The three existing failures are the app-login test expecting no header (desktop/mobile) and the homepage's existing tablet footer overflow. The influencer routes include scoped contact-address wrapping and passed their tablet checks.
- New TypeScript/TSX and test files pass lint. Global lint still reports existing repository issues (3423 errors and two warnings on this run).
- Read-only live checks: `influencer_profiles` is not yet present in Supabase, and the server administrative key returns `401 Invalid API key`. Live writes and authenticated admin publication were therefore not performed. Apply the migration and supply the valid key before live verification.
