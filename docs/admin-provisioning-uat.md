# Development Super Admin provisioning and ICICI UAT

## Role repair on 6 November 2026

The user requested repair of the existing configured development Super Admin account and explicitly chose to keep its password. The new operator-only `--role-only` option repairs a confirmed existing account without signing in, creating accounts or changing passwords. Apply still requires the matching development project and refuses production, blocked accounts and combination with `--reset-password`.

The role repair was applied to the confirmed development project and independently verified through Auth's administrator API: `roleVerified: true`, `passwordChanged: false`, `created: false`. The existing server-managed `app_metadata.aa_dashboard_roles` mechanism now supplies the missing `supreme_admin` role. The database role table remains unavailable; no database migration was applied. Public login and its authorization checks are unchanged.

The actual running website's dashboard-login RPC then authenticated the dedicated account and its bearer token successfully accessed the protected `getMyAccess` RPC with `isSuper: true`. Only the temporary verification session was revoked afterward; the user's existing password and other sessions were preserved.

```powershell
npm.cmd run admin:provision -- --role-only --expected-project ryircgxjsieovvbmprqv
npm.cmd run admin:provision -- --role-only --apply --expected-project ryircgxjsieovvbmprqv
```

`passwordReady` describes the local environment value used by password-based provisioning. It can remain false during role-only repair because the existing Auth password is preserved and is not checked or reset by this operation. The following findings describe the earlier password-reset workflow.

## Findings on 5 November 2026

The operator confirmed `ryircgxjsieovvbmprqv` is the intended development project and explicitly authorized a reset of the configured `SUPER_ADMIN_EMAIL` account after supplying a new password locally. No production changes are authorized.

`npm run admin:provision` correctly loads Next development environment files. The effective password comes from **`.env.development.local`**, overriding `.env`. Inspection without printing its value confirmed it is too short and matches a placeholder pattern. This is the exact reason `passwordReady` is false; the password is present, not missing. Both files contain a rejected value. This was not an environment-loader priority bug.

Precedence is inherited `process.env`, `.env.development.local`, `.env.local`, `.env.development`, then `.env`. `scripts/next.cjs` forwards CLI arguments and enables the operating system CA store where supported; it does not load or overwrite administrator credentials. `scripts/provision-admin.cjs` calls the installed `@next/env` loader in development mode. Tests now verify precedence and prompted process overrides. Next expands `$` references in dotenv files, another reason to use the masked prompt for arbitrary password characters.

The current dry run reports:

```json
{
  "credentialSource": "SUPER_ADMIN",
  "accountExists": true,
  "passwordReady": false,
  "passwordIssue": "too-short",
  "databaseRoleTableAvailable": false,
  "databaseRoleLookupCode": "PGRST205",
  "hasDatabaseRole": false,
  "hasProvisionedRole": false
}
```

The Auth account exists. Its dedicated operator-owned `aa_dashboard_roles` marker is absent. The server-role PostgREST lookup cannot find/expose `public.user_roles`. An authenticated-user RLS policy alone does not explain a schema lookup error on a service-role request. Catalog verification through the configured Supabase management token returned **HTTP 403**, so the API alone cannot prove whether the table is absent versus excluded from/stale in the schema cache.

## Safe password entry and authorized reset

Run these commands in the IDE's **interactive terminal**, from the project directory. Do not paste a password into chat, command arguments, shell history, test artifacts or Git.

Preview using a new password:

```powershell
npm run admin:provision:secure -- --expected-project ryircgxjsieovvbmprqv
```

When ready to perform the already-authorized reset for this development account:

```powershell
npm run admin:provision:secure -- --expected-project ryircgxjsieovvbmprqv --apply --reset-password
```

The earlier PowerShell-style option names (`-ExpectedProject`, `-Apply`, `-ResetPassword`) are also accepted by this Node helper. It does not run a `.ps1` file or change Windows execution policy.

1. The first preflight checks the project using the existing environment files; it may still show `passwordReady: false`.
2. Enter a unique password of **16–128 characters**, then confirm it. Typed characters and length markers are hidden. Store it in your own password manager; this command creates no password file or generated default.
3. The helper passes it only in the child process environment, which correctly outranks the placeholder files. The second preview **must show `passwordReady: true`**. If not, apply never runs.
4. Only explicit `--apply --reset-password` changes an existing password. All apply operations require the matching `--expected-project` and refuse `NODE_ENV=production`. Canonical HTTPS Supabase URLs are enforced before accessing Auth.
5. A successful apply reports `passwordVerified: true` and `roleVerified: true`. The script signs in using the supplied password, verifies the operator-owned role and revokes its verification session locally. It does not silently confirm or unban blocked accounts.
6. A final read-only preview checks the entered password's readiness and the assigned role again before discarding the transient secret references.

The supplied password is not persisted in `.env`, `.env.local` or `.env.development.local`, and the parent terminal environment is unchanged. A later plain `npm run admin:provision` still reads the old file value; that does **not** mean an already-reset Auth password was reverted. Runtime login verifies Supabase's stored hash, not the environment password. Use the newly entered password in the dashboard modal. To repeat a readiness check, use the masked command and enter it again.

If you intentionally maintain credentials in ignored local environment files instead, remove conflicting definitions and put the intended value in the highest-priority file. Inherited terminal values still win. Never prefix administrator passwords/service keys with `NEXT_PUBLIC_`. The masked workflow avoids dotenv quoting/expansion and plaintext file storage entirely.

## Role recovery and migration

`PGRST205` is a diagnostic warning for this provisioning process, not a password-validation error. The legitimate operator fallback records `supreme_admin` in Auth **app_metadata**, and server authorization requires both that marker and the configured dedicated email. User-editable `user_metadata` cannot grant this role. Only the operator's service credential writes the marker; only the selected account is provisioned.

For database-backed role management, open the **confirmed development** project's SQL Editor:

1. Run `supabase/diagnostics/admin_roles.sql` (read-only). It inspects the catalog, columns, RLS and grants without listing accounts or credentials.
2. If `public.user_roles` is absent, apply `supabase/migrations/20261105170000_admin_role_storage_recovery.sql` there. If the table exists, inspect its schema/grants first; do not infer that a missing schema-cache entry permits blindly changing an unrelated table.
3. The migration restores the original role table shape, keeps RLS enabled, gives authenticated users SELECT under RLS and service-role-only mutation grants, grants no roles to any account, and reloads PostgREST. It is rerunnable and refuses incompatible existing tables instead of converting or deleting data.
4. Existing compatible `app_role` enums are preserved. If panel-specific enum labels are missing, apply the project's original enum-extension migrations before provisioning those panels. The Super Admin recovery requires the original `supreme_admin` label.
5. Rerun provisioning after recovery to record the account-specific database role. If the supplied password already matches Auth, use `--apply` without `--reset-password`.

The catalog query was denied and the migration has **not** been applied remotely. Its behavior was tested locally against PostgreSQL via PGlite, including repeat application, preserved rows, anonymous denial, private reads and rejection of authenticated self-promotion.

## Authentication and ICICI checks

The previous shared login/RBAC fix remains in place. No additional dashboard or website design changes were necessary in this task. This application stores the Supabase browser session in its existing localStorage-backed adapter, automatically refreshes it, and attaches its bearer token to payment/RPC calls. It does not use application authentication cookies; changing HttpOnly/Secure/SameSite/domain settings would not repair the missing provisioning state. HTTPS and exact-origin proxy validation remain enforced.

The development server was initially stopped: localhost refused connections and ngrok returned HTTP 502 `ERR_NGROK_8012`. It was started with `npm run dev`, restoring the existing tunnel. No payment was initiated.

The existing, already-authorized `ADMIN_EMAIL` account was verified through the actual HTTPS login RPC. Its authenticated availability request returned HTTP 200:

```json
{
  "icici": true,
  "environment": "uat",
  "available": true,
  "origins": {
    "configured": "https://tractor-nautical-snowbird.ngrok-free.dev",
    "request": "https://tractor-nautical-snowbird.ngrok-free.dev",
    "transport": "https://localhost:3000",
    "source": "trusted-proxy"
  }
}
```

An anonymous request returned HTTP 200 with `available: false` and `code: ICICI_UAT_TEST_ACCESS_REQUIRED`. After revoking the verification session, the same held token was also rejected with that code. Non-super users, forged metadata and invalid tokens are covered by shared-RBAC authorization tests. The configured development guest override is **false**; it was not enabled to obtain this result.

No ICICI credentials, trusted-origin checks, Razorpay code, RLS enforcement or TLS verification were weakened. Availability confirms readiness for controlled UAT, not bank transaction success or completed UAT certification. `ICICI_UAT_TESTS_PASSED` was not changed. No current availability blocker was observed for the existing authorized account.

The dedicated `SUPER_ADMIN_EMAIL` reset and its subsequent login remain pending the operator's successful masked entry. The operator reported they had not retried the updated helper. `passwordReady: true` is verified with fixtures only until that real input succeeds; no real dedicated-account success is claimed.

## Files changed for this follow-up

- `scripts/provision-admin.cjs`: project/TLS/production guards, safe environment-source/password-reason/schema diagnostics, required-readiness mode, verified-result flags.
- `scripts/provision-admin-secure.cjs`: hidden local entry, confirmation, transient child environment, preview before apply, explicit target/reset forwarding and final preview.
- `package.json`: `admin:provision:secure` command.
- `.env.example`, `docs/admin-authentication.md`: corrected flags and configuration guidance.
- `supabase/diagnostics/admin_roles.sql`, `supabase/migrations/20261105170000_admin_role_storage_recovery.sql`: read-only catalog diagnosis and unapplied safe schema recovery.
- `tests/admin-provision.test.cjs`, `tests/admin-secure-entry.test.cjs`, `tests/admin-environment.test.cjs`, `tests/admin-role-recovery.test.cjs`: safety, precedence, masked-entry and actual RLS regression coverage.
- `docs/admin-provisioning-uat.md`: this report.

Validation results: `npm test` **185 passed**, zero failures; final focused environment/provisioning/role-recovery/security checks **17 passed**; `npm run typecheck` passed; targeted ESLint passed. No production build was needed for this follow-up's CLI, SQL, test and documentation changes; the application/authentication source and UI were unchanged.

Start the app with `npm run dev` (or the existing pinned `npm run dev:ngrok` launcher). Keep the same HTTPS tunnel open, sign in at `/app/admin`, then reopen consultation checkout so availability is requested with the signed-in session. A plain browser address-bar visit to the availability URL does not automatically attach this application's localStorage bearer token and can correctly report access required.
