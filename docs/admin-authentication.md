# Super Admin authentication investigation and operation

Investigated against the configured Supabase project and running Next.js development server on 5 November 2026. No real credentials, account identifiers or tokens are included here.

## Architecture and root cause

This is Next.js 16.4.3 / React 19 with Supabase Auth and Postgres. The modal is `src/components/dashboard-login-dialog.tsx`. It calls the same-origin POST RPC `/api/rpc/dashboard-auth/dashboardLogin`, registered in `src/lib/backend/registry.server.ts` and implemented in `src/lib/backend/handlers/dashboard-auth.ts`. The protected RPC middleware is `src/integrations/supabase/auth-middleware.ts`.

`/app/admin` is the existing public dashboard chooser/login gateway. The actual Super Admin dashboard is `/admin` (`PANEL_PATH.super`). The gateway can render to signed-out visitors; private dashboard data and all administrative actions require a verified, authorized session server-side.

The rejected login was an authorization/provisioning failure, not a tunnel cookie error:

1. The original dashboard handler compared submitted credentials with environment passwords, then created or reset Auth users during public login. Its profile/role writes did not consistently inspect errors. The final lookup only checked `user_roles`; an error produced an empty role list and the generic “These credentials do not open this dashboard.” response.
2. Live read-only probes returned `PGRST205` for `public.user_roles`; `admin_roles` was also unavailable. The profile uses a legacy schema: explicit `status` / `is_active` selection returned `42703`. Ignoring these errors hid the actual setup problem.
3. The configured `SUPER_ADMIN_EMAIL` account exists and is confirmed, but the provisioning preview found no database role or operator-owned Auth role marker. Its environment password is a placeholder. It has deliberately not been promoted or reset automatically.
4. The separate, existing `ADMIN_EMAIL` identity exists and successfully authenticates with its configured password. Other server authorization paths already recognized that verified, server-configured account. Dashboard login did not use their shared resolver, creating inconsistent results.
5. The modal ignored failures from `supabase.auth.setSession()` and treated exceptions as invalid credentials. The former public bootstrap/password-sync endpoints could also create or silently reset privileged accounts.

## Implemented behavior

- Passwords are verified by `supabase.auth.signInWithPassword()` against Supabase's existing password hashes. Application code never compares a submitted password to an environment password or maintains a second hash implementation.
- Login, panel visibility and administrative API guards use the shared `resolveAccess` model. Database roles/custom roles remain supported. The existing verified `ADMIN_EMAIL` compatibility rule is retained.
- A dedicated dashboard account can also be provisioned using an operator-controlled `app_metadata.aa_dashboard_roles` role **and** its matching server-configured dashboard email. User-editable `user_metadata` never grants administrative access. Markers copied onto another email do not grant access.
- Public login performs no account creation, password reset, role insertion or profile writes. The former public bootstrap endpoint rejects with HTTP 403. Public signup rejects configured administrator addresses. The old password-sync RPC is inert for compatibility.
- Inactive/suspended accounts are denied, including Super Admins. Modern and legacy profiles work without selecting nonexistent status columns. Unexpected status lookup failures fail closed.
- Protected RPCs validate bearer claims and fetch the live Auth user/session. A revoked session is rejected with HTTP 401 even if its JWT has not expired. Network/service failures use safe error messages, with no raw upstream details or secrets.
- The modal checks session storage before redirecting, prevents duplicate submissions and restores loading state after failures. Logout revokes the current session, clears cached account data and reports a failed logout rather than pretending it succeeded.
- Existing UI markup, styles and animations are preserved. The JSX baseline change only approves the extracted logout event handler.

## Session storage, HTTPS and ngrok

This application already uses Supabase's persisted **browser storage** session with automatic refresh and bearer authorization on RPC requests. It does not use application authentication cookies, so changing cookie Domain/SameSite flags would not repair this error. The local and HTTPS tunnel origins have separate browser storage; sign in on the origin you intend to use.

RPCs use relative URLs and retain their same-origin custom-header/Origin checks. The existing `DEV_TUNNEL_ORIGIN` forwarding validation remains pinned to the exact HTTPS ngrok origin; no wildcard CORS or proxy trust was added.

Supabase documents why a JWT signature check alone cannot detect logout; see [session validation](https://supabase.com/docs/guides/auth/server-side/advanced-guide) and [signout scopes](https://supabase.com/docs/guides/auth/signout). The live provider probe and application RPC test both confirmed rejection after revoking the test session.

## Environment and controlled provisioning

Keep server and browser public Supabase variables pointed at the same project:

```dotenv
SUPABASE_URL=<existing-project-url>
SUPABASE_PUBLISHABLE_KEY=<existing-public-key>
SUPABASE_SERVICE_ROLE_KEY=<existing-server-only-service-key>
NEXT_PUBLIC_SUPABASE_URL=<same-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<same-public-key>
DEV_TUNNEL_ORIGIN=https://tractor-nautical-snowbird.ngrok-free.dev
SUPER_ADMIN_EMAIL=<intended-dedicated-admin-email>
SUPER_ADMIN_PASSWORD=<unique-password-of-at-least-16-characters>
```

Do not prefix administrator credentials or service keys with `NEXT_PUBLIC_`. Actual `.env` credentials were not edited. The examples now leave passwords empty instead of suggesting a usable default. Runtime login always uses the stored Auth password; editing an environment password alone does not change that password.

The existing administrator can use the `ADMIN_EMAIL` account's actual password now. To repair the dedicated account, choose a strong value for `SUPER_ADMIN_PASSWORD` locally, then:

```powershell
# Read-only preview; reports booleans, never credentials.
npm run admin:provision

# Missing account: create it and provision its role.
# Existing account with matching stored password: grant the role without reset.
npm run admin:provision -- --apply --expected-project <confirmed-dev-ref>

# ONLY when intentionally replacing an existing account's stored password:
npm run admin:provision -- --apply --reset-password --expected-project <confirmed-dev-ref>
```

The current dedicated account already exists. If its stored password differs from the new environment password, only the last, explicit command will change it. The script refuses placeholders/short passwords and does not silently confirm or unban existing blocked accounts. Preview and repeated role provisioning are idempotent. The verification session is revoked locally afterward; other browser sessions are not globally signed out by the verification step.

`--legacy` explicitly selects `ADMIN_EMAIL` / `ADMIN_PASSWORD`; `--panel company` (or interview/marketing/business) selects that panel's complete credential pair. Email/password variables are never mixed between account pairs.

No database migration was applied for this fix. When `user_roles` is available, the provisioning command inserts the missing canonical role there. If it is genuinely missing (`PGRST205` / `42P01`), the server-owned Auth marker plus configured email provides the controlled role source. Other database errors stop provisioning. Restore the project's role migrations separately before using database-backed role-management features; do not create an ad-hoc permissive role table or public admin registration endpoint.

To revoke a metadata-backed dedicated role, remove it from the account's server-managed `aa_dashboard_roles` app metadata through the Supabase operator tools and remove any corresponding database role. Removing its dedicated email from server configuration also disables the metadata path. For the legacy operator account, remove `ADMIN_EMAIL` from configuration as well. Restart after configuration changes.

## Changed authentication files

- `src/lib/backend/handlers/dashboard-auth.ts`: provider password verification, shared authorization, safe failures, denied-session revocation.
- `src/lib/admin-env.server.ts`: verified configured-email roles and server-managed dedicated role markers; removed password matching/reset helpers.
- `src/lib/rbac.server.ts`: consistent role resolution, legacy profiles and active-account enforcement.
- `src/lib/backend/handlers/accounts.ts`: shared guards/account roles, legacy profile reading, reserved-address signup protection and retirement of public admin provisioning.
- `src/lib/backend/handlers/admin-panels.ts`, `admin-management.ts`, `super-admin.ts`, `super-admin-plus.ts`, `admin-seed.ts`: consistent shared authorization and status checks.
- `src/integrations/supabase/auth-middleware.ts`: live-session verification and safe service errors.
- `src/components/dashboard-login-dialog.tsx`: checked session persistence and submission/error handling.
- `src/hooks/use-session.ts`: unmounted-component and initialization-error handling.
- `src/components/app-shell.tsx`, `src/components/admin-panel-shell.tsx`, `src/routes/_authenticated/dashboard.tsx`: checked current-session logout and cache clearing.
- `src/routes/auth.tsx`: removed password-sync call from normal sign-in.
- `scripts/provision-admin.cjs`, `scripts/next.cjs`, `package.json`, `.env.example`: operator provisioning command and configuration guidance.
- `tests/dashboard-auth.test.cjs`, `tests/admin-provision.test.cjs`, `tests/backend-rpc.test.cjs`, `tests/e2e/dashboard-auth.spec.ts`, `tests/fixtures/migration-parity.json`: regression/security/browser coverage and preserved-UI baseline.

Complete corrected implementations are in those source files. Prior marketing/payment changes in the working tree are separate from this fix.

## Running and verification

```powershell
npm run dev
# Or the existing configured ngrok development launcher:
npm run dev:ngrok

npm test
npm run typecheck
npm run build

# Opt-in live UI check using existing ADMIN_EMAIL / ADMIN_PASSWORD.
# Does not create users, change roles or reset passwords.
$env:ADMIN_LIVE_E2E='true'
# Optional AFTER dedicated account provisioning:
# $env:ADMIN_LIVE_ACCOUNT='dedicated'
$env:PLAYWRIGHT_BASE_URL='https://tractor-nautical-snowbird.ngrok-free.dev'
$env:PLAYWRIGHT_NO_COPY_PROMPT='1'
# On this machine Node requires its OS certificate store for HTTPS requests.
# Use a Node version that supports this flag (the verified run used Node 24).
$env:NODE_OPTIONS='--use-system-ca'
npx playwright test tests/e2e/dashboard-auth.spec.ts --reporter=list
```

Use Node 20.9+ and the installed lockfile dependencies (`npm ci` if needed). Restart development after changing server environment values; rebuild for changed browser public variables. Production runs with `npm run build` followed by `npm start`.

Live UI tests disable screenshots, video, traces and Playwright page snapshots because they enter operator credentials. Their cleanup revokes only their own session. Diagnostic artifacts produced during initial debugging were removed; later runs disable form-value capture and avoid verbose request diagnostics containing authorization headers. The isolated ngrok browser context blocks service workers so its origin-scoped interstitial header remains interceptable; service-worker behavior is not covered by this auth test. Production service-worker code was not changed.

## Verification results

| Requested scenario                     | Result and evidence                                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Correct password and Super Admin role  | PASS: real shared-handler/RBAC tests and live existing `ADMIN_EMAIL` login, HTTPS browser redirects to `/admin` and displays Admin console.                                 |
| Wrong password                         | PASS: generic invalid-credentials response without role reads; browser error/loading state verified.                                                                        |
| Nonexistent user                       | PASS: fixture rejected identically to a wrong password.                                                                                                                     |
| Valid account without Super Admin role | PASS: customer/company/ordinary-user fixtures denied; forged user metadata denied; temporary denied sessions revoked.                                                       |
| Refresh after login                    | PASS: live HTTPS browser reload retains access and renders Admin console.                                                                                                   |
| Logout/session invalidation            | PASS: live HTTPS browser logout redirects to app login; the held access token then receives HTTP 401 from a protected RPC.                                                  |
| Unauthenticated direct access          | PASS: live `/admin` navigation redirects to `/auth`; `/app/admin` remains the intended public chooser without private data. Anonymous/forged bearer API access is rejected. |
| HTTPS ngrok login                      | PASS: both browser tests passed against the supplied domain. Exact-origin RPC checks remain enabled.                                                                        |
| Expired/invalid/revoked session        | PASS: claims-verification rejection fixtures and real provider/application revoked-session rejection.                                                                       |
| Network/backend failures               | PASS: provider/status/role failures fail closed; simulated browser network failure restores the login button and displays an error.                                         |

`npm test`: **178 passed**, zero failures. Final focused auth, provisioning, RPC, RBAC and UI-parity checks: **35 passed**. `npm run typecheck`: passed. Production `npm run build`: passed. HTTPS browser run: **2 passed**. Provisioning tests verify preview-only default, repeatability, missing-account creation, controlled role grant, missing-role-table handling, blocked accounts and explicit password reset requirements using fixtures.

The live run used the existing configured administrator. The dedicated `SUPER_ADMIN_EMAIL` account was **not** provisioned or password-reset, because its supplied password is a placeholder. After replacing that local environment value and deliberately running the provisioning command, run the live test with that credential pair to independently verify the dedicated account. Database-backed role editing still requires restoration of the original role schema; this fix does not pretend that missing role-management tables exist.

Full ESLint enforcement on the older backend files still encounters existing `no-explicit-any` violations. The changed files pass formatting and lint when that pre-existing rule debt is excluded; no lint rules or project checks were disabled in repository configuration.
