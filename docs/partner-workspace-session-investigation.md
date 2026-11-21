# Partner Workspace session investigation

Latest focused recheck: [Supabase configuration audit](partner-workspace/CONFIGURATION_AUDIT.md). It distinguishes effective local settings, failed deployment/management verification, real HTTP checks and fixture-based session tests. No unverified database switch was made.

## Update — 19 November 2026

The availability-only page described below has been replaced by a native secure workspace foundation. Its layout checks the shared session and approved Partners membership/canonical account, while `/api/partner-workspace/[operation]` independently validates live Auth, membership and RLS. Guests redirect to existing login; backend/schema outages show a retry/setup state rather than missing membership. Historical findings below remain the record of the earlier scoped investigation, not current route availability.

The read-only diagnostic was rerun: runtime browser/server refs still match, master confirmation is still absent, and the configured hostname still returns `ENOTFOUND`. Thus the unreachable backend itself is **not fixed** by UI/code changes. No credentials, project selection or database records were changed. Current scope and verification: [implementation status](partner-workspace/IMPLEMENTATION_STATUS.md).

Checked on 18 November 2026 against the local development checkout at `http://127.0.0.1:3000`.

## Findings

- `/partner-workspace` had no Next page, layout, API operations, or membership adapter. The global `SiteAccessGate` treated this missing route as private and mounted `ProtectedRoute`, whose Supabase session error could mask the missing-page result. The previous generic guest preview did not implement the Partners product.
- Effective development browser and server configuration both select `ryircgxjsieovvbmprqv`. Public/server publishable keys and the service-role key are present. The service-role JWT's declared project ref matches that runtime ref; this is a local consistency check, not proof that credentials are accepted by the service.
- Repository evidence in `docs/admin-provisioning-uat.md` identifies that ref as the owner-confirmed **development** project. `supabase/config.toml` instead contains `xkzxtosqaqxxfezicthy`; it does not configure the runtime clients. No project or credentials were changed.
- `CM365_EXPECTED_MASTER_REF` is unset. The existing preflight reports `AWAITING_MASTER_CONFIRMATION`, `MASTER_CONFIRMATION_REQUIRED` and `SOURCE_REF_REQUIRED`. The intended deployed production master cannot be verified from the local configuration alone.
- DNS lookup of `ryircgxjsieovvbmprqv.supabase.co` returns `ENOTFOUND`. Control lookups of `supabase.com` and `registry.npmjs.org` succeed. Auth health and membership schema requests fail before receiving an HTTP response. This does not establish whether the project was paused, deleted, renamed, or affected by a DNS problem.
- The existing browser client uses the effective public environment variables and localStorage on `127.0.0.1`; the Lovable session broker is only used on its preview domains. Existing server RPC authentication verifies bearer tokens using Supabase Auth. No separate Partners session system exists.
- There are no `cm365_` declarations in the application implementation or target migrations, nor registered `getAccessState`/workspace operations. The PRD and parity ledger describe pending work, not installed functionality. Existing `partners/*` RPCs concern the separate AA public partnership applications.
- Live `cm365_memberships` existence, RLS, membership records and database functions are **unverified**, not established absent: the database endpoint is unreachable. No membership was created and no migration was applied.

## Scoped change

Added an explicit `/partner-workspace` availability page stating that the integration is not installed. Only this exact entry bypasses the global session gate because it contains no private data or actions. Nested workspace URLs are not made public. Login links use the existing safe return-path helper; existing authentication, authorization, RPC handlers and credentials are unchanged.

This fixes the misleading entry-page session failure. It does **not** implement the workspace or restore connectivity to Supabase.

## Recheck

Run `node --use-system-ca scripts/partner-workspace/diagnose.cjs` from the repository root. It loads development environment precedence, reports safe configuration status, checks DNS, then reads Auth health/settings and a zero-row membership schema query. It never prints keys, tokens, Auth users or membership rows, and performs no writes. The membership check requires the existing server credential; a `PGRST205` response means the table is absent from the exposed schema cache, rather than an account lacking membership.

Once connectivity is restored, verify the actual deployed AA master through authorized deployment/project settings before pinning a project or applying reviewed migrations. The source implementation and live schemas must be inspected before creating the namespaced schema and real workspace membership/account operations described in the PRD. Do not substitute the source project or the stale TOML ref automatically.

## Validation

- Browser regression at port 3000: the entry returns HTTP 200, shows the installation notice and correct login return link, and makes no Auth requests even when Auth is unavailable.
- Existing customer authentication, guest-preview/session lifecycle and Partners environment tests pass. Read-only diagnostic tests cover DNS/configuration failures, missing schema responses and secret redaction.
- Live sign-in, membership authorization and schema checks remain blocked by the unresolved configured hostname; full workspace testing also requires its missing implementation and reviewed migrations.

Rollback of this scoped change consists of removing the availability page and its exact-path exception in `SiteAccessGate`. No database rollback is required.
