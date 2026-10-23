# Unified Super Admin & Multi-Admin System

Your app already has a super admin console, four fixed admin roles, granular permissions,
activity logs, login history, support, notifications, content blocks, reports and 2FA.
This plan closes the gaps between that and the full specification, and makes the phone
app and the admin website behave as one system on one backend.

## What is missing today

- Roles are fixed in code — you cannot create your own role (e.g. "Regional Manager").
- Admin records have no photo, employee ID or department.
- No session list, no "force logout", no "view as admin".
- The permission list does not cover courses/products, orders, payments/refunds, leads,
  FAQs, reviews, categories, app/website management.
- The phone app's admin screen shows only a subset of what the website admin shows.
- No admin notification centre (new order, failed payment, suspicious login, etc.).

## Phase 1 — Data foundation

New tables (with access rules so only admins can reach them):

- `roles` — custom roles: name, description, colour, system flag.
- `role_permissions` — which permissions each role holds.
- `admin_roles` — which roles each admin account holds.
- `departments` — simple named list.
- `admin_sessions` — active sign-ins with device, browser, IP, last seen.
- `admin_notifications` — the admin notification centre feed, permission-aware.
- `leads`, `orders`, `catalog_products`, `faqs`, `reviews` — the business modules the
  spec lists that have no storage yet.

Extra fields on the admin profile: photo, employee ID, department, last activity.

## Phase 2 — Permissions and roles engine

- Expand the permission catalogue to every module in your list, each with the actions
  that apply (view / create / edit / delete / approve / publish / export / manage).
- Effective permissions = role permissions + individual permissions, resolved on the
  server on every request. Super admin always bypasses.
- Role management screen: create, edit, duplicate, delete a role; assign permissions in
  a matrix; assign admins to it. Custom roles work everywhere automatically.

## Phase 3 — Admin management upgrade

- Admin table gains photo, employee ID, department, last activity; search by name,
  email, phone or employee ID; filters for role, department, status, last login,
  created date.
- Create/edit form covers all fields including role + individual permission overrides.
- Emergency actions: suspend, deactivate, lock, force logout, remove all sessions,
  reset password, strip permissions — each behind a confirmation dialog, and the
  destructive ones behind a super-admin password re-check.
- Admin hierarchy view: super admin at the top with each admin and their modules.

## Phase 4 — Security, sessions, impersonation

- Sessions page: every active admin sign-in with device, browser, IP and location, with
  per-session and all-session termination.
- Login history gains device/browser/location and suspicious flagging.
- "View as admin": super admin only, time-limited, always logged, with a clear
  "Viewing as <name>" banner and a one-click exit.
- Super admin 2FA can be made mandatory, and can be required for other admins.

## Phase 5 — Modules and dashboard

- Module pages for the new areas (products/courses, categories, orders, payments and
  refunds, leads, banners, FAQs, reviews, app management, website management), each one
  permission-gated on both the screen and the server.
- Dashboard overview cards: total/active/new users, total/active admins, revenue,
  orders, pending orders, leads, tickets, app installs, website visitors, plus the
  growth charts already present.
- Admin notification centre in the top bar, filtered by what each admin may see.

## Phase 6 — Phone app parity

- The app's admin section renders the same module list, the same permission checks and
  the same data as the website, driven by the same backend calls.
- Super admin and every admin can sign in from either place with one account; a change
  made in one shows up in the other.

## Technical notes

- All new data lives in the existing Lovable Cloud database; no second backend.
- Every server function re-verifies: signed in, account active, role, permission, and
  resource access — hiding a button is never the only check.
- Permission checks route through one shared resolver so new modules, roles and
  platforms plug in without touching the core.
- Existing fixed roles are migrated into the new `roles` table as system roles, so
  nothing currently working breaks.

## Suggested order

Phases run in sequence; each one is usable on its own. Phase 1 and 2 are the largest
because they replace the hardcoded role system with a database-driven one.
