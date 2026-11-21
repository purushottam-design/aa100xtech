# Supabase / Partner Workspace configuration audit

Checked 19 November 2026. No credentials or account records are included here.

## Follow-up: owner supplied the production browser project

The owner has now confirmed production `NEXT_PUBLIC_SUPABASE_URL` as `https://xkzxtosqaqxxfezicthy.supabase.co` and project ref `xkzxtosqaqxxfezicthy`. Production `SUPABASE_URL` remains unreadable/unverified in the hosting settings. The earlier placeholder-only reply is superseded by this concrete browser-project confirmation.

Read-only checks against the confirmed browser project:

- DNS resolves; the Auth gateway responds over verified TLS. The old configured hostname still returns `ENOTFOUND`.
- Effective local server and browser publishable keys are equal, but both are rejected by the confirmed project's Auth settings endpoint with **HTTP 401**.
- The distinct opaque `SUPABASE_SECRET_KEY` candidate in `.env` is also rejected by that project's Auth settings endpoint with **HTTP 401**. This variable is not the server credential used by the application.
- The effective `SUPABASE_SERVICE_ROLE_KEY` is a JWT declaring the old `ryircgxjsieovvbmprqv` ref. It was not sent to the confirmed project's database endpoint.
- No accepted matching credentials are currently available for the confirmed project. Required live membership/schema checks remain blocked by authentication; table absence is not established.

Consequently no runtime URL/key/pin has been changed. Changing only URLs would retain rejected public keys and a server credential for a different project. The owner has been asked to place the matching public and server-only credentials directly in `.env.local`, without sharing secrets in chat. After successful read-only credential verification, both runtime URLs can be updated together, stale overrides removed and configuration pinned/restarted. Production private server settings must also be checked by the authorized hosting operator.

A reusable explicit target probe has been added:

```powershell
node --use-system-ca scripts/partner-workspace/diagnose.cjs --target-ref=xkzxtosqaqxxfezicthy
```

It reports the selected probe target separately, compares the configured runtime against it, performs read-only checks, and skips a known mismatched service JWT. It never changes environment values or prints credentials. Latest diagnostic/environment/security subset: **15 passed**. Target probing reports DNS resolved, public Auth requests 401 and membership-schema check skipped as `credential-project-mismatch`.

The remaining sections record the initial audit before this concrete production browser-project confirmation.

## Configuration evidence

| Source                            | Observed configuration                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env`                            | Browser and server URL select `ryircgxjsieovvbmprqv.supabase.co`; service credential is present.                                                |
| `.env.local`                      | Overrides browser/server publishable keys; does not override project URLs. Key acceptance is unverified because the endpoint cannot be reached. |
| `.env.development.local`          | No Supabase URL/key overrides.                                                                                                                  |
| Effective Next development config | Both runtime URLs select `ryircgxjsieovvbmprqv`.                                                                                                |
| Server credential metadata        | JWT declares the same project ref. This is a local consistency check, not verification of the signature or credential acceptance.               |
| `supabase/config.toml`            | Contains `xkzxtosqaqxxfezicthy`. Runtime clients do not read this file. It does not establish the production master.                            |
| `CM365_EXPECTED_MASTER_REF`       | Unset; intended master remains unverified.                                                                                                      |

No project URL, key, expected-master pin, CLI link, Auth identity, role, RLS policy or database row was changed.

## Deployment verification attempts

- Available tool discovery found no deployment/Supabase settings connector.
- There is no `.vercel/project.json` linking this checkout to a verified deployment project. The existing `.vercel/output` directory is an older build artifact, not authoritative production settings.
- Read-only GitHub deployments request returned no deployment entries. It supplies no production environment values.
- Vercel CLI read-only identity discovery did not establish a usable authenticated session. Retrying with system CA verification and update notifications disabled still failed; TLS certificate checks were not disabled.
- The configured Supabase management credential was used only for a read-only project-list request; the management API returned **HTTP 401**. No project details or credentials were printed.
- Public `https://aa100xtech.com/partner-workspace` returned HTTP 200 and contained the new workspace loading markup. This establishes deployed route/code presence only, not authoritative private deployment settings or successful login.
- The user's production-confirmation reply contained literal `[verified production URL]` / `[verified project ref]` placeholders. These are not usable project identifiers. Actual non-secret URLs/ref have been requested before any configuration switch.

## Current diagnosis

The configured `ryircgxjsieovvbmprqv.supabase.co` hostname returns **DNS ENOTFOUND**. Control DNS lookups for `supabase.com`, `registry.npmjs.org` and `aa100xtech.com` succeed. This confirms a failure for the configured hostname in the local environment; it does not establish whether a project was removed, paused or affected by DNS configuration.

Auth health, valid-session validation, credential acceptance, live membership/schema existence and RLS behavior cannot be verified against that endpoint. A DNS failure is not evidence of missing tables or membership. No production account/password sign-in attempts or schema installations were performed.

Workspace access requires `cm365_memberships` (`user_id`, `role`, `status`) plus the appropriate active canonical account (`cm365_team_accounts`, `cm365_lead_team_accounts` with valid `lead_domain`, or `cm365_influencer_accounts` with an explicit `influencer_id`). Business screens additionally require the reconciled tables/functions for their modules. The foundation SQL is still a review candidate outside automatic migrations; its live installation is unverified.

## Code corrections in this audit

1. The read-only diagnostic no longer puts opaque `sb_secret_` API keys in a Bearer header. JWT service keys keep their existing bearer behavior.
2. A thrown Auth/network failure from workspace session validation now produces the explicit retryable `AUTH_UNAVAILABLE` response, without raw provider details or missing-membership classification.
3. Canonical accounts fail closed unless `active` is the boolean `true` and an account ID is present. Malformed links do not grant access.
4. Browser regression coverage now checks retry behavior on both `/partner-workspace` and `/partner-workspace/overview`. Tests also cover opaque-key headers, thrown provider errors and malformed account links.

The earlier admin-login configuration-error improvements remain in the working tree and are preserved separately.

## Verification results

- Workspace security/diagnostic/environment/inventory tests: **16 passed**. The security/diagnostic subset including the latest regression cases was also rerun: **10 passed**. Candidate SQL tests run in isolated PostgreSQL, not the live service.
- TypeScript check: passed.
- Targeted lint on modified workspace/diagnostic/test files: passed.
- Real local HTTP requests after starting the existing `npm.cmd run dev` script: both workspace entry and overview returned **200**, containing secure loading markup. Session API without a token returned **401 SIGN_IN_REQUIRED**. A synthetic invalid token against the unreachable configured Auth service returned **503 AUTH_UNAVAILABLE**, not a missing-membership result.
- Browser session-state subset: **6 passed**. Guest redirect, retry behavior on both workspace routes and pending/disabled/missing membership views all passed. Browser responses are fixtures, not proof of live authentication or persistence.

The first browser attempt encountered `ECONNREFUSED` because no local server was running. The development server was then started at `http://127.0.0.1:3000`, and the tests were rerun. No production deployment or migration was performed.

## What remains required

Provide actual production `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and intended master ref from authorized hosting settings (URLs/ref only, no keys in chat), or restore authorized read-only deployment/project access. Then verify that project and its Auth endpoint; confirm matching project credentials locally and in hosting. Do not substitute `xkzxtosqaqxxfezicthy` merely because TOML mentions it.

After endpoint verification, check live membership/account columns and required functions with authorized read-only access. Review source/target schema differences before any separately approved migration. Restart development and rebuild/redeploy hosting only after the verified configuration is installed. Finally test a real authorized account and membership on both routes; that acceptance is still pending.
