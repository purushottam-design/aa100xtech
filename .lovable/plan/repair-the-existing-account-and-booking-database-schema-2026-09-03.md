# Repair the existing account and booking database schema

## Goal
Add only the three missing tables and the minimum backward-compatible profile columns required by the current application. Preserve the existing `public.profiles` table, all profile rows, the existing authentication system, and the current UI.

## Changes
1. Create one idempotent Supabase migration for project `ryircgxjsieovvbmprqv` that:
   - Leaves `public.profiles` in place and adds missing nullable/defaulted columns with `ADD COLUMN IF NOT EXISTS`.
   - Backfills `full_name` from the existing `name` column and creates safe unique usernames for existing rows without deleting data.
   - Creates or extends the `app_role` enum with `supreme_admin`, `employee`, `customer`, `job_seeker`, and `partner`.
   - Creates `public.user_roles`, `public.access_requests`, and `public.consultation_bookings` with the exact columns, constraints, foreign keys, and indexes used by the app.
   - Adds explicit Data API grants, enables RLS, installs owner/admin read policies, public access-request insertion, and admin-only review access.
   - Adds a hardened `has_role` security-definer function and updated-at trigger while preventing normal users from inserting, updating, or deleting role rows.
   - Reloads the API schema cache.
2. Replace the unsafe/full combined schema artifact with this focused migration so it cannot rename `profiles`, delete rows, or recreate unrelated tables.
3. Update generated TypeScript database metadata only where it differs from the migration, including profile relationships and database functions.
4. Make the existing admin bootstrap/profile writes compatible with the preserved legacy profile shape plus the additive columns, without creating a second auth path.

## Verification
- Run focused TypeScript checks/tests through the project harness.
- Confirm the migration is idempotent and contains no `DROP TABLE`, profile rename, destructive delete, or public role-write grant.
- If DDL execution is unavailable, provide the exact SQL file and clearly state that it must be run in the SQL Editor for project `ryircgxjsieovvbmprqv`.
- After execution, query the connected API schema and verify `profiles`, `user_roles`, `access_requests`, and `consultation_bookings`, then exercise `/auth` and the bootstrap flow in the live app.
