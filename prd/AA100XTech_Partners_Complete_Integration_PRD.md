# AA100XTech + Partners — Complete Integration PRD
## Product Requirements, Migration Specification and Codex Execution Brief

**Version:** 1.0  
**Prepared for:** Krishna Murari / AA100X Tech Pvt. Ltd.  
**Prepared on:** 17 November 2026 (India)  
**Delivery repository:** https://github.com/purushottam-design/aa100xtech  
**Source application:** Partners - Creator Moves 365  
**Source Lovable project:** https://lovable.dev/projects/596d7dbe-aa8e-4a98-9859-a133b7678ff6  
**Document status:** Implementation-ready requirements; live database identification and source access remain execution prerequisites.

> **Owner's requirement:** “Hame sabhi kuchh AA100XTech pe rakhna hai, sara function.”  
> AA100XTech ke sabhi existing features aur data rahenge. Partners ka poora public website experience, private workspace, admin system, backend business logic, users aur files AA100XTech mein integrate honge. Final production application ek AA100XTech website, ek codebase aur ek Supabase project par chalega.

This document specifies work for Codex. Preparing it has not changed either application's code, production databases, Auth accounts or deployment.

---

## 1. Required outcome and non-negotiable rules

1. Implement the complete Partners product inside the existing AA100XTech repository and website.
2. Preserve AA100XTech's existing functionality, URLs, redirects, forms, payment flows, accounts, permissions, content and stored data.
3. Include the full Partners workflows: public marketing, brand/influencer intake, staff administration, IMTM, Influencer Lead Team, Gamer Lead Team, CRM, imports, duplicates, assignment, follow-ups, deal workspaces, approvals, creator credentials, creator portal, messages, files, companies, campaigns, projects, products, inventory, allocations, shipments, reporting and AI matching.
4. Use the **verified existing AA100XTech Supabase project** as the intended production master. Confirm its actual deployed URL/ref before targeting a database. Do not select a different project merely because it is accessible.
5. Final production Auth, application tables, Storage, relevant database functions and scheduled jobs must use that one master Supabase project.
6. Build native AA100XTech pages and forms. Linking to the old Partners application, embedding its pages in an iframe, or displaying static dashboard mockups does not satisfy this PRD.
7. Move the Partners business backend into AA100XTech's server implementation. The old Partners deployment and its Supabase project must not remain runtime dependencies after cutover.
8. Migrate existing source business data, account associations, attachments and history as well as source functionality. Keep source provenance and reconcile every migrated entity.
9. Do not overwrite AA100XTech tables, roles, Auth users, SQL helpers, triggers, policies or Storage objects with same-named Partners objects.
10. Do not silently widen permissions. Admin-only functions remain admin-only; creators, IMTM and lead collectors keep their existing boundaries.
11. Complete features end to end: interface, validation, server operation, persistence, permissions, loading/error states and verification.
12. Retain source features that are currently restricted or legacy without reopening them to unauthorized users. A hidden route is not permission to make it public.
13. No new business scope such as automatic cold-email campaigns, native mobile apps, subscriptions or payment gateways is implied.
14. No force push, history rewrite or replacement of the repository. Preserve the Lovable-connected Git history.
15. Do not call a phase complete while it only uses fixtures, while schema prerequisites are missing, or while credentials prevent its real acceptance checks. State the exact remaining blocker.

## 2. Evidence and current-state findings

### 2.1 Inspected baselines

| Item | Observed baseline | Consequence |
| --- | --- | --- |
| AA100XTech branch | `main` | Recheck the latest branch when implementation begins. |
| AA100XTech inspected commit | `8f2ac0d187aa2c8c8218ea6d417e02a49ef32207` | This PRD is grounded in this code snapshot, not an assumption about an older Lovable build. |
| AA100XTech framework | Next.js `16.4.3`, React `19.2.4`, TypeScript, Tailwind CSS 4 | Keep Next.js App Router; adapt the source application to it. |
| AA100XTech route inventory | 71 `page.tsx` modules, including routes with configured redirects | File existence is not proof that every page is reachable or operational in production. |
| AA100XTech server transport | Existing allowlisted RPC transport and handlers | Preserve existing contracts; add a separate Partners namespace. |
| Partners inspected commit | `dd09e0b44087c823624aab423b4c0275cb7a67bd` | Read the same source revision or document any newer revision used. |
| Partners framework | TanStack Start, TanStack Router, React 19, TypeScript, Tailwind CSS 4 | Do not paste its root router, Vite configuration or generated route tree over AA100XTech. |
| Partners source inventory | 539 file entries; 46 authenticated leaf route modules | Full source route mapping is included in Appendix A. |
| Partners backend | 25 operation modules containing 173 registered operation declarations | Appendix C lists every observed operation and coarse access classification. |
| Partners schema sources | 56 distinct table declarations across the external base schema and target migrations | Appendix B maps all 56 names; live schema drift must still be inspected. |
| Partners current backend config | `src/integrations/backend/config.ts` selects ref `hvcznonjilfmyizlmlkq` | This is the source application's code-selected backend, not the selected master destination. |
| AA100XTech repository config | `supabase/config.toml` contains ref `xkzxtosqaqxxfezicthy` | Browser/server runtime clients actually read environment variables. This ref alone does not prove the live destination. |
| Live database access | Neither application's live database schema/data was verified during this PRD audit | No row counts, storage totals, live feature success or password portability are claimed. |

Counts above describe inspected code declarations, not a live service audit. Source generated database types lag some later migrations, so use live introspection plus the complete migration set during implementation.

### 2.2 Important conflicts already identified

| Conflict | Required resolution |
| --- | --- |
| Both applications use `profiles`, `user_roles`, `notifications` and `products` for different purposes | Preserve AA100XTech names; namespace imported Partners entities. |
| AA100XTech `app_role` has company-wide roles; old Partners `app_role` has `admin/member` | Do not replace or reuse the existing enum for imported legacy role data. |
| Partners already has `cm365_memberships` with app-specific roles | Use it as the Partners authorization boundary linked to the master Auth identity. |
| Source root paths collide with AA100XTech's `/admin`, `/team`, `/dashboard`, `/auth`, `/settings`, `/influencers` and `/partners` | Place the private product under `/partner-workspace`; reuse public AA100XTech pages intentionally. |
| AA100XTech currently redirects `/influencers` to `/influencer-partners` | Preserve this known redirect unless a separately documented product change is approved. Do not assume the source showcase can replace it. |
| Partners' public influencer showcase is static editorial content | Keep it distinct from consented, published public directory records. Editorial images must not become fake registered creators. |
| Partners public forms currently point to official AA100XTech forms on a Vercel hostname | Reuse those AA100XTech form components and handlers natively on the current AA100XTech origin. Remove production dependence on the old absolute hostname. |
| Existing AA marketing copy includes offers starting at ₹500 and custom-quoted campaigns; source packages use different price points | Keep existing offers/prices and identify the imported campaign offers distinctly. Do not globally overwrite a generic Starter/Growth/Premium price or create contradictory FAQs. |
| Partners schema history includes obsolete backend migration instructions and demo seeds | Do not blindly execute the old files. Produce a reviewed, namespaced migration representing the final required schema. |
| Partners generic helper/trigger names can collide with AA100XTech helpers and Auth hooks | Name every imported object explicitly and inspect dependencies before creating it. |
| A Partners approved-deal flag uses the term “Affiliate Partner” | This must not automatically create an AA100XTech affiliate, commission or payout. Link only through an explicit, audited business action. |
| Source registered operations can have a broader coarse classification than their UI routes | Retain the operation's ownership checks and the source route restrictions; a coarse `staff` label alone is not a complete permission rule. |

### 2.3 Historical diagnostics are leads, not current facts

AA100XTech's repository delivery notes describe earlier missing website-intake tables, email configuration gaps, an empty published influencer directory and existing repository-wide lint debt. Codex must rerun diagnostics in the selected environment. Do not copy these old findings into the final completion report as if they had just been verified.

## 3. Product scope: what must remain in AA100XTech

| Existing AA100XTech area | Required preservation |
| --- | --- |
| Corporate website | Home, about, founders, clients, portfolio, service pages, real estate and current navigation/content. |
| Marketing and service proposals | Existing influencer marketing, social ads, service enquiry, proposal and business plan flows. |
| Influencer/public partnership pages | Influencer partners, program packages, join pages, applications, review queue, approved profiles, directory filters and profile details. |
| General partnership | Existing `/partners`, `/partners/apply`, `/partners/plans` and their different business meaning. |
| Careers | Careers pages, application form, resume handling and HR/admin review. |
| Consultation | Booking, availability, validation, payment links/status and existing recovery behavior. |
| Payments | Existing Razorpay behavior and current ICICI UAT restrictions, callbacks, idempotency and verification. Do not activate ICICI production mode as a side effect. |
| Accounts | Existing Auth, profiles, password flows, dashboard, notifications, settings and team behavior. |
| Administration | Super Admin, Company, Interview, Marketing and Business panels; role management, permissions, sessions, security, 2FA, CMS and website inbox. |
| Affiliate system | Applications, affiliate dashboard/admin, referrals, clicks, conversions, coupons and payouts. |
| Content/catalog/support | Blog, catalog, legal pages, content blocks, support and related stored entities. |
| Integrations | Current public APIs, redirects, sitemap, SEO metadata, notifications and configured providers. |

Appendix D records the 71 existing page modules. Preserve configured aliases/redirects and API routes in addition to that list.

## 4. Final information architecture

### 4.1 Public website

Keep the corporate home as the main AA100XTech home. Add a clear Influencer & Brand Partnerships entry, a Partners workspace login entry and relevant links in existing menus. Preserve the existing header, service navigation and footer structure.

| Experience | AA100XTech destination | Requirement |
| --- | --- | --- |
| Partners product overview | `/creator-moves-365` | Add the source's relevant product story, audience benefits, joining journey, network and capabilities to the existing page. |
| Influencer marketing | `/influencer-marketing` | Retain existing real directory/filtering/campaign enquiry behavior and integrate source marketing sections. |
| Brand page | `/influencer-marketing/for-brands` | Source brand sections, packages, FAQs, comparison and native brand inquiry. |
| Influencer recruitment | `/influencer-marketing/for-influencers` | Source creator benefits/journey plus the existing native application workflow. |
| Existing program/partnership pages | Current URLs | Keep their data model and pricing purpose distinct from brand campaign packages. |
| Published profile details | Existing `/influencers/[slug]` contract | Preserve published/approved/consented access rules. |
| Existing public aliases | Current `next.config.ts` redirect rules | Preserve `/influencers`, `/influencer-programs` and legacy `/app/*` behavior. |
| Workspace entry | `/partner-workspace` | Resolve the signed-in user's allowed workspace home. |
| Authentication | Existing `/auth` plus safe return destination | One master Auth session. No separate password database. |

The source's public design must be integrated into the AA100XTech design system. It need not overwrite the corporate home pixel for pixel.

### 4.2 Private workspace

Use `/partner-workspace/*` for Partners routes. Do not reuse the existing `/partners` prefix because AA100XTech already uses it for another public flow.

Default homes:

| Partners membership | Home |
| --- | --- |
| Admin | `/partner-workspace/overview` |
| IMTM | `/partner-workspace/overview` |
| Lead Team: influencer | `/partner-workspace/lead-dashboard` |
| Lead Team: gamer | `/partner-workspace/gamer-leads` |
| Influencer/creator | `/partner-workspace/creator` |

Give admins a usable navigation path to every active administrative module, including modules currently reached through the source Admin Hub. Keep the streamlined IMTM and lead collector navigation.

Use “Partner Workspace” or an equivalent clear label within AA100XTech. “Creator Moves 365” remains the product brand where appropriate.

## 5. Identity, roles and permissions

### 5.1 One identity, independent product permissions

- Master `auth.users.id` is the authentication identity.
- Existing AA100XTech roles stay in their current structures.
- Partners membership stays in `cm365_memberships`, keyed to that Auth user.
- Partners roles remain `admin`, `imtm`, `lead_team`, `influencer`.
- `lead_team_accounts.lead_domain` remains `influencer` or `gamer`; this is a specialization, not an extra company-wide role.
- Existing company-wide roles include `supreme_admin`, `company_admin`, `interview_admin`, `marketing_admin`, `business_admin`, `manager`, `employee`, `customer`, `job_seeker`, `partner`. Preserve their behavior.
- A source Partners admin must not become an AA100XTech `supreme_admin`.
- An AA100XTech customer, affiliate, employee or marketing admin does not gain private Partners access automatically.
- Bootstrap Partners access for an existing verified AA100XTech Super Admin through an explicit, logged operator step. Normal runtime Partners authorization still resolves membership from trusted database state.
- Public AA100XTech account registration, if already available, stays available for its original purpose. It must not create approved staff/creator memberships.
- Preserve the source's admin-provisioned staff model and creator approval/login-issuance gate. Do not add public staff signup.
- Validate membership status and canonical account activity on every protected operation. Pending, disabled, missing or malformed links fail closed.
- Revoke Partners access without disabling a shared Auth identity that still serves a valid AA100XTech role. Account removal/reset/ban handlers must be adapted for shared identities.

### 5.2 Functional permission matrix

“A” below means a valid approved Partners admin membership, including a Super Admin who has been explicitly linked to that membership.

| Capability | A | IMTM | Influencer Lead Team | Gamer Lead Team | Creator | Public / ordinary AA account |
| --- | --- | --- | --- | --- | --- | --- |
| Public pages/forms | Yes | Yes | Yes | Yes | Yes | Yes |
| Staff provisioning, role/domain changes | Yes | No | No | No | No | No |
| Global lead overview and admin exports | Yes | No | No | No | No | No |
| Add/view own influencer leads | Yes | Through existing staff lead-first workflow | Yes | No | No | No |
| Add/view own gamer leads | Yes | No | No | Yes | No | No |
| Edit saved influencer identity/social identity | Yes | No | No | No | No | No |
| Delete saved people/business records | Yes | No | No | No | No | No |
| Current assigned influencer workspace | Yes | Own assignments only | No | No | No | No |
| Log communication/notes and negotiate | Yes | Own assignments only | No | No | No | No |
| Submit a deal for review | Yes | Own workable assignment only | No | No | No | No |
| Approve/reject/reopen deals | Yes | No | No | No | No | No |
| Issue creator credentials | Yes, with eligibility checks | No | No | No | No | No |
| Creator collaborations/messages/files | Admin authorized view | Current assigned staff, permitted data | No | No | Own linked record, shared data only | No |
| Companies, projects, products, inventory, allocations | Yes | Preserve source restrictions | No | No | Own collaboration projections only | No |
| Reports, duplicate review, bulk revert | Yes | No | No | No | No | No |
| Workspace settings | Edit | Existing permitted read | No | No | No | No |
| AI matching | Yes | Only where source workflow permits; quota applies | No | No | No | No |

Some source APIs classify operations as `staff` even where their page is admin-only. Preserve their explicit handler checks and source route restrictions; do not broaden the UI based solely on the registry classification.

## 6. Required functional behavior

### FR-01 — Shared authentication and account lifecycle

- Reuse the master AA100XTech Auth client/session. Provide safe, allowlisted return paths for workspace login.
- Preserve forgot-password, reset-password, sign-out and session recovery. If existing AA flows already implement them, extend those rather than create a second session store.
- Add namespaced recovery views only where needed; preserve existing route contracts.
- Distinguish a network/backend failure from no membership and from an expired session. A temporary error must show a retry state instead of falsely removing access.
- Session/account changes invalidate role-scoped query caches. A previous user's roster must never flash for the next user.
- No authorization from request body roles, client flags or user-editable Auth metadata.
- Staff/creator credential management must not unexpectedly reset an existing shared AA identity's password. Reuse/link accounts safely; any global credential reset must be explicit and audited.

**Acceptance:** Existing AA login still works; provisioned staff reaches the correct workspace; a customer cannot open a staff endpoint; deactivating a membership blocks the next protected operation.

### FR-02 — Admin Hub, staffing and role changes

Preserve IMTM Create, IMTM Overview/team accounts, Lead Team management, creator account administration, memberships, role/access management, profile statistics and administrative overview.

Support creation, profile updates, activation/deactivation and explicit credential reset where authorized. Preserve source changeable staff roles and record old/new role, actor and timestamp.

Keep source ownership stable across IMTM ↔ Lead Team changes using the canonical Auth user id. Role-specific account ids are provenance, not a reason to lose the person's submitted leads. Recheck last-admin protection and prevent administrators from silently granting themselves a higher company-wide role.

Removal functions must revoke the relevant product membership, handle dependent assignments/data according to the source rules and retain necessary audit history. Never delete a shared AA100XTech Auth user merely to remove Partners access.

**Acceptance:** A staff role change retains the person's historical submissions and does not create a duplicate Auth identity.

### FR-03 — Influencer Lead Team

Support manual add, own leads, import preview/import, source indicators, own statistics and eligible edits. Preserve source fields: name, platform, handle/profile URL, email, phone, followers, average likes/views, city, categories, locations, status, notes, gender and multiple social accounts.

- Resolve submitter from the authenticated session.
- Use stable `created_by_user_id`; preserve original role/account/member provenance.
- Saved identity fields and saved social identity are admin-only to change.
- Prevent imported ownership, assigned staff, role, approval or privilege columns.
- Collecting a lead does not publish an influencer or approve a deal.
- Admin review/conversion is idempotent and preserves the originating lead association.
- Keep staff-submitted lead history visible to the original person across role changes where the source allows it.

**Acceptance:** A collector sees only their own influencer leads; a different collector cannot read/edit them by changing a URL or request id.

### FR-04 — Gamer Lead Team

Preserve gamer manual add, CSV/XLSX and Google workbook intake, preview, row outcome summary, contributor statistics, filters, admin exports and source tracking.

Gamer data must remain in its own entity set and never appear in influencer lead counts, imports or ownership reports. Gamer members see only the gamer workspace and their profile. Preserve admin-only deletes/exports and source edit restrictions.

**Acceptance:** An influencer collector cannot call gamer operations; a gamer collector cannot reach influencer Lead Team operations.

### FR-05 — Imports and Google Sheets

- Retain CSV/Excel header aliases, field mapping, multiple social profiles, count normalization, preview and row-level validation.
- Retain file and Google Sheet flows with a shared progress component.
- Show phases such as reading, validating, importing and completed; keep accurate inserted/duplicate/invalid/skipped/failed totals.
- Retries must not duplicate accepted rows or erase the original file's row numbers.
- Page/chunk imports. Do not send an entire large database to the browser.
- Use server-side allowlisted Google Sheets/workbook parsing with bounds, timeout and clear access errors. Never treat arbitrary input URLs as an unrestricted server fetch.
- Do not require access to private Google Sheets unless an existing authorized integration supports it.
- Persist provenance and duplicate attempts. Do not import role, assignment or approval claims from a spreadsheet.

**Acceptance:** One representative multi-profile CSV, XLSX and permitted Google Sheet import all produce traceable, accurate outcomes; retry does not duplicate records.

### FR-06 — Influencer CRM, filters and duplicate control

Preserve names, social accounts, contact data, identity normalization, current assignment, category/location/gender metrics, contact status, deal status, approval state and agreement associations.

Use the source's canonical platform+handle/URL identity rules. Multiple profiles belong to one record where the source recognizes them. Preserve duplicate reservations, exact matching, duplicate attempts, admin review decisions and legacy review history.

All relevant list screens need server-side pagination, whitelisted search/sort/filter inputs, consistent counts and empty states. Any-profile filtering must use the source-maintained follower/view/like/platform aggregates rather than only the first social account.

**Acceptance:** Duplicate inputs from manual add and imports cannot create competing canonical identities; a later profile matching the filter still includes the creator.

### FR-07 — Ownership, assignment and the seven-day deal window

- Preserve current owner/assignment, assignment history, timestamps and admin reassignment/reset.
- Derive the assignment deadline from assigned time + 7 days + recorded admin-review pause time.
- Show on-track, urgent, overdue, paused, completed, closed and unassigned states consistently.
- Pending admin review pauses the countdown. Resuming review banks paused time without rewriting historical timestamps.
- Only admin can reset/reassign a window.
- Reassignment removes the former IMTM's access immediately on the next authorization check.
- Migrate `assigned_to` using mapped canonical team account ids, not the Auth id by assumption.

**Acceptance:** Review time does not count against the IMTM; a former assignee cannot retrieve workspace messages/files after reassignment.

### FR-08 — IMTM dashboard and daily workspace

Preserve role-specific dashboard totals, own roster, work stages, recent activity, workload, follow-up reminders, notes, contact attempts, agreements and submitted-lead history.

Keep the source's lead-first behavior for new staff submissions; a staff member cannot bypass admin review to create an approved live creator. Use the same stage derivation in server and interface.

Source work stages: new, contacted, follow_up, negotiating, deal_ready, pending_approval, changes_requested, approved, rejected, closed. Do not introduce an independent conflicting status column.

**Acceptance:** Dashboard counts and roster filters agree with server data; all displayed stages derive from the authoritative source status fields.

### FR-09 — Communications, notes and follow-up tasks

Preserve communication channels (call, WhatsApp, Instagram DM, email, meeting, other), outcomes, timestamp, notes, next action, scheduled follow-up, task completion and reminder sweeps.

Internal communications/notes are separate from creator-visible messages. Preserve edit permissions, note authorship and source audit history. In-app logging does not imply sending an email, WhatsApp message or DM automatically.

**Acceptance:** A logged call and scheduled follow-up appear for the assigned IMTM/admin; a creator cannot read private notes.

### FR-10 — Structured deal workspace and deliverables

Preserve draft revisioning and structured fields:

| Area | Required data |
| --- | --- |
| Context | Company, campaign, product and negotiation stage. |
| Collaboration | Paid, barter, affiliate or hybrid. |
| Commercial terms | Currency, initial quote, counteroffer, final amount, advance, remaining balance, payment terms/status and milestones. |
| Agreement | Status, linked agreement file, agreed-at timestamp and negotiation summary. |
| Deliverables | Platform, post/reel/story/short/video/live/other, quantity, one-time/monthly frequency, start/end/due/publish dates. |
| Creative requirements | Brief, caption, hashtags, tags, links, revision allowance and usage notes. |
| Progress | Not started, in progress, submitted, revision, approved, published; creator submission link where permitted. |

Match the source validations, including advance ≤ final, valid dates/currency, up to 12 milestones and up to 50 deliverable rows. Submission requires agreed terms, valid amount according to collaboration type, a meaningful negotiation summary, agreement status/file consistency and at least one dated deliverable.

A tracked payment status is accounting/workflow data. It must not charge a payment method or create an AA100XTech payout automatically.

**Acceptance:** The admin reviews the exact saved draft revision and deliverables, including totals and terms; concurrent edits cannot silently change the submitted snapshot.

### FR-11 — Atomic deal approvals

Preserve submit, pending counts, history, approve, reject, request changes and reopen.

Submission and decision must use transaction-safe database functions with row locking, preserving source migrations 055–057 semantics. Update the approval snapshot, influencer state, paused review time and event log atomically. Never fall back to separate table writes on RPC failure.

Keep approved/submitted terms immutable. Reopening requires an auditable new decision/revision, not editing a past approval. Send notifications after a successful commit; notification failure must not roll back or duplicate a committed approval.

**Acceptance:** Simultaneous submissions/decisions create one valid result; stale decisions return a conflict; failed submission leaves no partial approval.

### FR-12 — Creator login issuance

- Preserve eligibility against the current approved submission, account link and issued state.
- Admin issues access only after source-required approval.
- Keep durable issuance reservation/state and recovery; pending/inactive records must not grant access.
- Atomically activate the linked creator account, membership and influencer issuance state after all checks pass.
- Use the canonical master Auth identity. Safely link an existing verified identity without silently changing its password.
- Never persist plaintext passwords or re-enable a second local-password authentication system.
- Keep creator account administration, status controls and login history/issuance references where present.
- No automatic email/SMS transmission unless that notification behavior/provider is already configured and authorized.

**Acceptance:** Retry or process interruption does not create a second creator login or a half-active account; reopening the approval can block stale issuance.

### FR-13 — Creator portal

Retain creator dashboard, own profile, own deal portal, own collaborations, own deliverable links, product/shipment status, updates and shared message/file access.

Access is through the explicit mapped `influencer_accounts.influencer_id` relationship. Never infer a creator relationship from display name or unverified matching email.

Do not return internal staff notes, private payment evidence, private files, other creators' records or staff-only metadata. Creator uploads remain limited to source-permitted categories and ownership.

**Acceptance:** Creator A cannot read creator B's collaboration, messages, attachment or shipment using a guessed id.

### FR-14 — Private files and attachments

Preserve agreements and workspace files with categories: reference, content set, brief, agreement, payment proof, deliverable, message and other.

- Agreements and workspace files remain private.
- Preserve source file policy: allowed JPG/JPEG, PNG, WebP, GIF, MP4, MOV, WebM, PDF and DOCX; per-file maximum 25 MiB for workspace uploads.
- Preserve tighter existing AA public-media limits separately.
- Validate file size, extension, actual MIME/content as appropriate, record ownership and completion before exposing a file.
- Use short-lived signed download links following a fresh permission check. Do not persist expiring signed URLs as permanent records.
- Map source bucket/path/owner to destination bucket/path/owner with checksums.
- Unshared files must never appear in creator attachment responses.
- Public influencer-media publication remains governed by existing AA review/consent rules.

**Acceptance:** Migrated files download intact; revoked/unshared files are denied; a failed upload is not presented as complete.

### FR-15 — Shared messages and read state

Preserve inbox, paged history, unread counts, staff/creator conversation, permitted attachments and read cursors.

Use atomic message/attachment-sharing logic equivalent to source migration 057. A failed send must not publish a file. Advance the read cursor only through the last displayed message; do not mark unseen incoming messages read. Recheck current assignment on each operation.

**Acceptance:** Concurrent incoming messages remain unread until displayed; creators receive only shared attachments and permitted metadata.

### FR-16 — Companies and offerings

Preserve companies, services/products, product/application links and validated offering records. Keep public company/venture editorial content separate from private operational membership and campaign data.

**Acceptance:** Existing company offerings and links survive migration and can be managed under the correct role.

### FR-17 — Campaigns, projects and participants

Preserve campaigns, creators assigned to campaigns, operational projects, project participants/status, project progress and related deliverables.

Link accepted brand requests to operational campaign/project work through an explicit admin action. A public form submission must not create an approved deal or silently assign staff.

**Acceptance:** Admin can trace a campaign/project to its participants and deliverables; a creator only sees their permitted collaboration projection.

### FR-18 — Products, inventory and allocations

Preserve operational product catalog, stock adjustments, inventory movement history, product allocations, allocation status/quantities and project links.

These entities must use `cm365_products` etc., not overwrite AA100XTech's commercial product/catalog tables. Prevent invalid/negative quantities and preserve consistency under concurrent allocation/stock updates according to the source business rules.

**Acceptance:** Product availability, allocation and shipment quantities remain consistent; repeated requests do not double-decrement stock.

### FR-19 — Shipments and product status

Preserve shipment records, shipment items/events, allocation association, delivery/contact fields, tracking, permitted status changes and creator-facing status.

Preserve source handler/ownership restrictions even where its registry is `staff`; source route/admin restrictions still apply. Shipment details are private.

**Acceptance:** A valid shipment update is visible to the linked creator; an unrelated account cannot retrieve the address or event history.

### FR-20 — Reporting, exports, activity and notifications

Preserve admin overview, lead overview/detail, contributor/IMTM workload, source statistics, approval summaries, reports, activity logs and filtered exports.

- Admin-only exports must be server-authorized and retrieve the complete filtered result across pages.
- Apply spreadsheet formula-injection escaping to exported text where needed.
- Audit actor, action, entity, entity id, result and timestamp without secrets.
- Keep Partners notifications distinct from AA notifications; an optional combined inbox must enforce each source's visibility.
- Preserve read/unread behavior and creator-only projections.
- Follow-up jobs must use the selected master project and deduplicate repeated runs.

**Acceptance:** Export counts match the full filtered result; an ordinary staff/creator token cannot call admin export operations.

### FR-21 — Bulk revert and administrative corrections

Preserve single revert to lead, bulk preview/run, duplicate review, identity correction and admin removal operations. Keep source safety/eligibility checks and historical provenance.

Provide preview counts and reasons for excluded items. Execute in bounded, resumable batches with an operation log. Do not destroy approved deal history or credentials through an unreviewed bulk operation.

**Acceptance:** Re-running a completed revert does not duplicate leads or erase unrelated relationships.

### FR-22 — AI matchmaker

Port the source matching capability to an AA100XTech server endpoint. Preserve staff authorization, durable per-user quota reservation, bounded input, timeout, safe errors and provider configuration.

Reserve quota in the master database before any paid call. Fail closed if authorization/quota storage fails. Do not rely on browser limits or per-instance memory. AI suggestions require human selection and must not auto-approve creators/deals.

**Acceptance:** Unauthorized users and exhausted quotas trigger no paid model call; missing provider configuration shows an actionable unavailable state.

### FR-23 — Public marketing, motion and packages

Retain relevant homepage editorial sections, brand/influencer audience pages, joining journey, visual assets, network portfolio, package comparison, FAQ and animation behavior.

- Use AA100XTech semantic tokens and scoped workspace/public styles. Do not replace global CSS with the source stylesheet.
- Keep animation visible, accessible and readable with reduced motion or JavaScript unavailable.
- Preserve pause/enable controls where the source has them; avoid heavy animations in work tables.
- Show no fabricated creator/brand counts, unverified collaboration logos or guaranteed campaign results.
- Keep supplied assets and their attribution; optimize delivery and preserve image dimensions.
- Preserve established brand campaign price labels from the source:

| Package | Source price label | Source indicative scope |
| --- | --- | --- |
| Starter | Starting at ₹5,999 | Brief review, creator discovery/shortlisting, basic coordination, campaign summary; creator/content quantities confirmed in writing. |
| Growth | ₹15,999 | Up to 10 creators, 4–6 total reels, 10 stories, 3 static posts, coordination, support and reporting. |
| Premium | ₹49,999 | Up to 20 creators, 8–12 total reels/shorts, 20+ story promotions, UGC support, strategy, dedicated coordination and detailed reporting. |
| Enterprise | Custom quote | Custom creator selection, national/international coordination, UGC assets, management and reporting. |

The source labels campaign package quantities/scope as indicative and subject to written confirmation. All quantities are per total campaign, not per creator. Preserve that qualification. Keep the existing AA offers starting at ₹500/custom-quoted campaign options and its separate influencer training/partner program prices intact. Give imported offers distinct product identifiers and labels; do not change an existing offer merely because its package name matches. Do not activate package checkout unless a checkout flow for that exact offer already exists and is verified.

**Acceptance:** Brand and influencer CTAs work inside AA100XTech and the selected package context reaches the native form without leaking private data in URLs.

### FR-24 — Native forms and intake-to-CRM bridge

Reuse existing AA100XTech handlers and data contracts:
- Influencer application: existing `/api/influencers/apply` and upload/program contracts as applicable.
- Brand/campaign enquiries: existing website/proposal/marketing intake contract for the specific form.
- Keep existing spam/rate limits, origin validation, server validation, consent, upload rules, idempotency and request receipt semantics.
- Preserve all source-facing form capabilities by integrating the correct native AA components; no iframe and no old hardcoded Vercel hostname.
- A saved request is the only basis for a success receipt. Preserve filled data on retryable failure.
- Create an explicit link between the original AA intake record and a staged Partners lead/campaign request when appropriate.
- Use an idempotent server transaction or durable outbox so a saved intake cannot disappear between two independent inserts.
- Failure in the CRM bridge must be visible to an admin and retryable without duplicating the original application.
- Admin review decides conversion, assignment and publication. Public consent/approval and private deal approval are separate states.

**Acceptance:** One form submission creates one original AA receipt and at most one staged Partners link, survives retries and never auto-publishes an influencer.

## 7. End-to-end journeys

### 7.1 Brand to campaign

1. Brand reads AA100XTech marketing page and package context.
2. Brand submits the native campaign/proposal form.
3. AA intake is saved and a receipt is returned.
4. Admin sees the request in the existing inbox and the linked Partners intake queue.
5. Admin qualifies the request and creates/links a company and operational campaign/project.
6. Admin/IMTM selects creators under existing access rules.
7. Terms, deliverables, approvals, files, collaboration progress and shipments run in Partner Workspace.
8. Reports are visible to authorized operators. No new brand login is required by this PRD.

### 7.2 Influencer application to published profile

1. Influencer submits the native AA application and required consent.
2. Application remains pending until the existing review workflow completes.
3. Admin links/converts a staged Partners lead without duplicating the same application.
4. IMTM works on assignment and deal; admin approves the saved proposal.
5. Admin issues a creator login if source eligibility is satisfied.
6. Publishing a public profile requires the separate existing AA application approval, consent and publication controls.
7. Internal onboarding or a deal approval alone does not publish private details.

### 7.3 Lead collector to IMTM to creator

1. Collector adds/imports a valid lead.
2. Server validates ownership and duplicate identity.
3. Admin reviews and converts the lead, then assigns an IMTM.
4. IMTM logs contact, follow-up, negotiations, agreed terms and deliverables.
5. Submission atomically creates the approval snapshot and pauses the assignment clock.
6. Admin approves, rejects or requests changes.
7. Eligible creator access is issued atomically and the creator views only their portal.
8. Reassignment/disablement takes effect on subsequent protected reads and writes.

## 8. Data architecture and collision policy

### 8.1 Naming rule

Preserve all existing AA100XTech tables and SQL objects unchanged unless a documented, additive integration requirement needs an extension.

Imported Partners tables use the `cm365_` namespace. Already-prefixed source tables keep their names unless the live target already contains a conflicting object. Appendix B is the authoritative proposed table map.

Two explicit exceptions prevent a second collision:
- Source legacy `duplicate_attempts` → `cm365_legacy_duplicate_attempts`.
- Source active `cm365_duplicate_attempts` → `cm365_duplicate_attempts`.

Source `user_roles` becomes `cm365_legacy_user_roles` for provenance; it must not authorize AA100XTech or replace active `cm365_memberships`. Source `profiles` becomes `cm365_profiles`; the same person can still have their existing AA profile.

### 8.2 Preserve all references

Map every Auth-user reference, canonical account id, owner/assignee id, creator id, approval id, project id, product id, attachment id and object path. Do not assume a column called `created_by` stores an Auth id; inspect its real FK/semantics.

Preserve source record ids where nonconflicting. When remapping is necessary, create a complete, deterministic mapping and rewrite all dependent relationships.

### 8.3 New integration support entities

Names below are proposed additions, not claimed existing tables. Reuse an equivalent target mechanism when it already exists.

| Entity | Minimum purpose and constraints |
| --- | --- |
| `cm365_migration_runs` | Run id, source/target refs, source revision, mode, state, timestamps and checkpoint. |
| `cm365_migration_id_map` | Entity, source project/id, target id, disposition; unique source key. Protect from normal users. |
| `cm365_migration_conflicts` | Ambiguous identity/schema/record conflict and recorded resolution. |
| `cm365_migration_object_map` | Source/target bucket/path, byte size, checksum and verified state. |
| `cm365_intake_links` | Original AA request/application id and linked lead/campaign; unique source receipt. |
| `cm365_public_profile_links` | Optional explicit association between private CRM creator and AA published profile/application. |
| `cm365_integration_outbox` | Durable, retryable intake/notification bridge events if no equivalent reliable outbox exists. |

Keep operational migration manifests access restricted and out of public client types where possible.

### 8.4 SQL objects, enums and triggers

- Inventory functions, enums, indexes, constraints, sequences, views, policies, triggers and grants; tables alone are insufficient.
- Keep AA100XTech's `public.app_role`, `has_role`, Auth hooks and existing role helpers intact.
- Namespace imported generic functions and helper enums; retain existing `cm365_*` functions only after checking target conflicts.
- If legacy source enum data is retained, use a separate `cm365_legacy_app_role`, not the AA enum.
- Do not run source first-user-becomes-admin hooks, broad profile “repair” updates, demo seeds or obsolete shared-database scripts on AA100XTech.
- Do not blindly replay `001_schema.sql` or `003_shared_database_safe.sql`. Build reviewed migrations for the final namespaced schema and current rules.
- Preserve transaction functions from login issuance, approval and workspace integrity migrations with updated table references, access checks and restricted execution.
- Never resolve a permission error by granting unrestricted service execution, disabling RLS or weakening a policy.

## 9. Public profile and application separation

Private CRM influencers, source lead records, AA applications and AA public profiles are separate entities with explicit links.

The existing AA public profile has an application relationship and approval/consent gates. Imported CRM creators do not automatically satisfy those gates. Do not fabricate an application, backdate consent or mark profiles approved to make imported creators public.

For a migrated creator who should be published:
1. Link an already matching, approved and consented AA application/profile where verified.
2. Otherwise keep the private creator private and use the real application/consent review flow.
3. Publish only through existing authorized AA controls.

Select only a public-field allowlist for directory responses. Do not use `SELECT *` over a private CRM table for public search.

## 10. Technical implementation

### 10.1 Target stack and source adaptation

Keep the current Next.js app and its package/runtime conventions. Read repository `AGENTS.md` and the installed Next.js version's bundled docs before coding.

Convert:
- TanStack file routes → Next App Router pages/layouts.
- TanStack navigation/loaders → the appropriate Next navigation/server/client boundaries.
- Source `import.meta.env` reads → AA100XTech public/server environment conventions.
- Source Deno entry points → server-only TypeScript operations in AA100XTech.
- Source Edge-only imports → explicit compatible Node/server dependencies.
- Source generated router and Vite config → no direct copy into the target root.
- Source global styles → scoped tokens/components.
- Source assets → local optimized public assets or the master project's approved Storage buckets.

Use the existing lockfile/package manager selected by the target repository; do not update all dependencies as part of the merge.

### 10.2 Suggested module boundaries

| Area | Suggested target location |
| --- | --- |
| Private pages/layout | `src/app/partner-workspace/` |
| Workspace components | `src/components/partner-workspace/` |
| Typed client API wrappers | `src/lib/partner-workspace/api/` |
| Browser-safe domain rules | `src/lib/partner-workspace/domain/` |
| Server authorization/operations | `src/lib/partner-workspace/server/` |
| Allowlisted API controller | `src/app/api/partner-workspace/[operation]/route.ts` |
| AI endpoint | `src/app/api/partner-workspace/ai/match-creators/route.ts` |
| Protected cron endpoint | `src/app/api/partner-workspace/cron/follow-ups/route.ts` |
| Reviewed migrations | Existing `supabase/migrations/` convention |
| Import/migration tooling | `scripts/partner-workspace/` |
| Operational docs | `docs/partner-workspace/` |

These paths are proposed. Adapt to repository rules without changing the product boundaries.

### 10.3 Operation and API contracts

- Port all 173 observed registered operations in Appendix C, preserving business behavior and access gates.
- Maintain an explicit allowlist; no caller-controlled module imports, function names outside the map, raw SQL or arbitrary table selectors.
- Existing AA RPC handlers and public API contracts remain intact.
- Every Partner API operation verifies the master Auth token/session, loads current membership, validates account activity and applies entity-level ownership.
- Authorize before using any service-role client. Privileged server clients bypass RLS, so handler checks are mandatory.
- Resolve actor identity from the verified session. Ignore/reject caller-supplied role, owner and actor impersonation fields.
- Preserve bounded pagination and safe typed inputs. Add body/file limits, rate limits and strict origin/CSRF handling consistent with existing target transport.
- Return stable error categories: 400 invalid input, 401 invalid session, 403 denied, 404 unavailable entity, 409 stale/conflicting state, 413 size limit, 429 quota/rate limit, 5xx retryable service failure.
- Return no-store responses for private data; scope React Query caches by user/membership where appropriate.
- Do not expose privileged keys, database connection strings, Auth password hashes, internal errors or unrestricted signed URLs.
- Preserve the special source health and follow-up cron capabilities in addition to the 173 registry entries.
- Source server-side lead submission helpers and other unregistered internal functions must also be ported where a registered operation depends on them. The operation count is a checklist, not a limit on work.

### 10.4 Environment contract

Reuse existing master variables:
- Browser: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the existing project-id variable where used.
- Server: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and existing server project-id checks.
- Existing payment, mail, AI and other integrations keep their current secret names unless a documented adapter is required.
- Add only server-side cron/integration secrets that are actually necessary.
- Local migration commands may temporarily need separate source and destination credentials. These must not be used by the running production app or committed.
- All production browser/server master URLs/refs must agree. Add a build/startup check and a safe diagnostic output showing only the selected ref.
- Remove source hardcoded runtime ref `hvcznonjilfmyizlmlkq` from production application configuration after migration. It may remain in isolated historical/migration documentation.
- Do not include real credentials in this PRD, implementation reports or commits.

## 11. Supabase security requirements

1. Enable RLS on exposed new tables and match policies to actual role/ownership rules.
2. Deny browser access to private operational tables where the source already requires server-only operations.
3. Use `USING` and `WITH CHECK` for permitted updates; include ownership and immutable-identity constraints.
4. Restrict privileged SQL function execution to intended server roles. Audit any `SECURITY DEFINER` function, fixed search path and explicit authorization.
5. Use invoker-safe views or deny public access to private views.
6. Keep agreement/workspace buckets private and implement object-level checks.
7. Honor deactivation, reassignment and creator-link revocation on every sensitive operation.
8. Do not trust user-editable Auth metadata for authorization.
9. Do not grant source Partners admins access to AA payments, HR, security or company-wide role management.
10. Reevaluate source account removal, Auth ban and password reset logic for a shared identity before porting it.
11. Run database security/performance advisories after the tested schema is applied and document remaining findings.
12. Do not hide security findings by weakening tests, policies, origin checks or existing ICICI UAT gates.

## 12. Migration plan

### Phase M0 — Discovery and protection

- Recheck target/source branches and latest relevant requirements.
- Obtain a complete Partners source checkout/export, including assets, tests and migrations.
- Verify the exact live master AA project URL/ref from deployed configuration and owner-provided project details.
- Inspect both live schemas, migration history, Auth configuration, counts, Storage, scheduled jobs and external functions.
- Inventory all same-name objects and write final mappings before any schema write.
- Back up both projects and verify a restore/recovery method in an isolated environment.
- Keep source production operational while preparation runs.
- Record a target baseline including existing AA entity counts and important settings.

**Exit:** Exact source/target and source access are known; no guessed database target; backups and manifests exist.

### Phase M1 — Additive schema and isolated implementation

- Build reviewed namespaced migrations from the final source schema/rules.
- Preserve AA tables, generic helpers, enum values and Auth hooks.
- Apply first to an isolated local/staging environment; use synthetic fixtures for testing, not production records in public previews.
- Port the server/client/UI modules and create the feature parity ledger.
- Preserve existing target regression behavior before importing real data.

**Exit:** Schema is reproducible and all module paths/permissions are represented.

### Phase M2 — Auth identity reconciliation

Create an id map for all source Auth and account references.

| Case | Rule |
| --- | --- |
| Source user absent in master | Create/import through a supported privileged migration path and record the resulting id. |
| Same verified person already in master | Reuse the existing master identity after verifying ownership/provider identity; preserve AA roles/password behavior. |
| Same email but ambiguous/unverified identity | Record a conflict for operator resolution. Do not automatically grant membership or overwrite an identity. |
| Same UUID belongs to a different target identity | Generate/reuse a safe new id and remap every dependent reference. |
| Password hash migration available and supported | Preserve only through a verified method tested in staging; never promise seamless password transfer without proof. |
| Hash migration unavailable | Use a controlled reset/invitation path; record affected users and verify recovery before release. |
| Source local password hashes/retired credential columns | Never resurrect them as a login backend. Retain only a restricted archival representation if required, or apply the source retirement semantics. |
| Source active session | Do not assume it remains valid against a different Supabase project; verify destination sign-in and session renewal. |

Do not replace the target `auth` schema or bulk overwrite its existing users/identities/sessions. Handle relevant providers, Auth redirects, templates and reset links deliberately.

### Phase M3 — Business-data migration

- Dry-run with row counts, mapping actions and conflict lists.
- Migrate in FK dependency order: mapped identities/memberships/accounts; companies/products; leads/CRM/assignments; campaigns/projects/participants; deals/approvals/drafts/deliverables; files/messages; allocations/shipments; logs/notifications/settings.
- Reconcile current schema drift before loading data.
- Preserve real production records, ids where possible, timestamps, approvals, authors, assignment history, consent provenance and message read state.
- Do not seed sample people/companies/deals from the source SQL into production.
- Retain source demo/test rows only with their true status; never publish them as verified customers/creators.
- Use deterministic idempotent upserts keyed by verified source identity, not loosely matching names.
- Detect deletes/archives and immutable approval data explicitly.
- Save checkpoints and allow resume. Every skipped/merged/remapped/conflicted row must have a reason.
- Do not fire real payment, outreach or notification side effects while replaying historical data.

### Phase M4 — Storage migration

- Inventory source buckets, objects, byte sizes, content types, access class and referenced metadata.
- Copy actual file bytes into namespaced master buckets.
- Use `cm365-agreements` and `cm365-workspace-files` as proposed private destination buckets; use a complete object map.
- Preserve original filenames/metadata where safe while avoiding path collisions.
- Rewrite internal file references to the mapped bucket/path.
- Verify size/checksum and representative authorized download behavior.
- Regenerate signed URLs from destination paths; do not copy expiring source signed URLs.
- Keep existing AA `influencer-media`, resume and other buckets untouched.

### Phase M5 — Providers, jobs and runtime configuration

Port required scheduled follow-up work and AI configuration to AA100XTech/master resources. Preserve current provider configuration rather than inventing new vendors.

Reconfigure relevant Auth redirect URLs, sender identities, app URLs and callback origins to the actual AA deployment. Keep existing payment callbacks and provider secrets correct.

Confirm the application no longer calls the source database/old Edge function/old form hostname for its production operation.

### Phase M6 — Cutover rehearsal and acceptance

Run complete migration in staging, all role tests and existing AA regressions. Exercise real staged persistence with authorized test accounts and payment test mode; mocks alone cannot prove migration completion.

Measure import duration, storage transfer duration and any required write freeze from actual data volume. Do not promise zero downtime or instantaneous password/session continuity.

### Phase M7 — Production cutover

Before cutover, prepare a concrete release manifest, reconciliation results, deployment artifact and rollback procedure.

During the authorized release window:
1. Pause source Partners writes and related source jobs.
2. Take final consistent source checkpoint.
3. Apply any required final additive master migration.
4. Import the delta, including changed/archived/deleted relationships.
5. Verify row/object/identity reconciliation and critical workflows.
6. Deploy the integrated AA build with master-only configuration.
7. Enable the target jobs; ensure the source jobs do not also run.
8. Run role-specific smoke checks and observe errors.
9. Keep source as a restricted recovery snapshot until reconciliation and the agreed observation period pass.

Only the production deployment/data-changing phase needs the applicable operational approval. Do not stop routine implementation and reversible verification for repeated confirmation.

### Phase M8 — Post-cutover reconciliation and retirement

- Ensure all new writes occur in the master.
- Record the final source/target totals and exceptions.
- Redirect old source URLs only after mapping them to safe equivalent AA destinations.
- Do not delete the source project, remove its backups or cancel services merely because deployment succeeded. Retire only after a separate explicit decision.
- Keep an operational report of remaining provider/configuration tasks.

## 13. Reconciliation and rollback

### 13.1 Required reconciliation report

| Area | Required evidence |
| --- | --- |
| Users | Source identities = linked + created + documented unresolved; no unintended target user changes. |
| Membership/accounts | Every active membership has a valid mapped canonical account; disabled/pending states preserved. |
| Business tables | Counts by source table and status, row-id mappings, business-key comparisons and exceptions. |
| Relations | No new FK orphans; mapped owners/assignees/creator links have correct meaning. |
| Deals | Approval totals and immutable terms/revision checksums match; commercial totals preserved. |
| Leads | Original submitter attribution and gamer/influencer separation remain correct. |
| Messages | Conversation counts/order, permitted attachments and read cursors preserved. |
| Storage | All referenced objects accounted for; counts/bytes/checksums verified or listed as unresolved. |
| Existing AA data | Baseline entities remain present; any legitimate integration changes separately itemized. |
| Runtime | Browser/server/jobs use the verified master; no old-source calls in critical journeys. |

A successful migration process exit code is not enough. Do not release with unresolved identity/permission conflicts or missing required attachments.

### 13.2 Rollback rules

- Use additive schema so rolling back the application does not remove AA data.
- Before opening new Partners writes, old deployment/source recovery is comparatively straightforward.
- After new master writes begin, **do not simply point users back to the old database**. Freeze affected Partners writes, capture the master delta and reconcile/replay it, or fix forward.
- Keep unrelated AA business operations running where possible.
- Never restore an entire older database snapshot over a live AA database and discard new AA transactions.
- Revoke/rotate only credentials exposed or specifically affected; do not rotate all production secrets as a routine merge step.
- Document who runs rollback, trigger conditions, data handling and observed recovery result.

## 14. Nonfunctional requirements

| Area | Requirement |
| --- | --- |
| Responsive UI | Usable at 320, 375, 768, 1024 and 1440px; record tables scroll safely or become readable cards. |
| Accessibility | Keyboard access, visible focus, dialog labels, meaningful errors, sufficient contrast and reduced-motion support. |
| Privacy | No PII/private notes in public pages, URLs, analytics or general logs. |
| Performance | Server-paged operational lists, indexed ownership/filter columns, bounded payloads and lazy-loaded secondary modules. |
| Scale verification | Choose an agreed staging lead volume and concurrency profile after discovery; record actual p50/p95 and query plans. Do not claim crore-user capacity from this merge. |
| Reliability | Idempotent writes for imports/intake/approvals/issuance; resumable migration and jobs; clear retry behavior. |
| Time | Store timestamps consistently in UTC; display appropriate viewer timezone, including Asia/Kolkata for India. Preserve source timing semantics. |
| Observability | Request/operation ids, actor/entity audit, failed outbox/job visibility and migration checkpoints, with secret/PII redaction. |
| Search/filtering | Exact server counts where required, safe filters, reset controls and filters consistent across screen/export. |
| Maintainability | Typed boundaries, one shared domain-rule implementation, current lockfile and no parallel duplicate app shell. |

## 15. Acceptance and regression matrix

| ID | Scenario | Pass requirement |
| --- | --- | --- |
| AT-01 | Existing AA public routes/redirects | Baseline pages and configured redirects behave as before; intentional enhancements documented. |
| AT-02 | AA forms/consultation/careers | Original persistence/validation/retry contracts still pass. |
| AT-03 | Existing payments/affiliate | Existing payment/signature/UAT restrictions, referrals and commission behaviors are unchanged. |
| AT-04 | AA admin panels | Super/Company/Interview/Marketing/Business permissions remain correct. |
| AT-05 | Master project consistency | Public/server clients and jobs resolve the same confirmed destination ref. |
| AT-06 | Staff sign-in and routing | Every Partners role/domain reaches its correct native AA home. |
| AT-07 | Disabled/pending/ordinary user | Protected APIs fail closed without exposing private data. |
| AT-08 | Shared identity administration | Removing Partners access does not delete or globally disable an AA customer/admin identity. |
| AT-09 | Manual/imported leads | Validation, stable provenance and own-row access pass. |
| AT-10 | Role changes | Own submitted history survives IMTM ↔ Lead Team change. |
| AT-11 | Gamer isolation | No cross-domain list/count/import/API access. |
| AT-12 | Multi-profile filters/dedup | Any-profile matching works and duplicate reservations prevent competing identities. |
| AT-13 | Imports and Sheets | Preview/progress/outcome totals and retries are correct for all supported formats. |
| AT-14 | Ownership/reassignment | Old assignee loses sensitive access; new assignee and admin have correct access. |
| AT-15 | Assignment deadline | Seven-day window and review pauses match source semantics. |
| AT-16 | Deal draft validation | Valid terms persist; invalid amount/date/file/deliverable combinations are refused. |
| AT-17 | Atomic approval | Concurrent submit/decision and stale revision tests produce no partial updates. |
| AT-18 | Atomic login issuance | Retry/interruption/reopen cases leave no duplicate or half-active creator. |
| AT-19 | Creator isolation | Own portal works; other creator/staff-only data is denied. |
| AT-20 | Private files | Authorized download succeeds; wrong owner/unshared files/expired links are denied. |
| AT-21 | Message integrity | Failed send does not share a file; read cursor does not consume unseen messages. |
| AT-22 | Product/project/shipment | Stock/allocation/history and creator projections remain consistent. |
| AT-23 | Exports and admin tools | Admin-only access and full filtered export totals; bulk preview/idempotency pass. |
| AT-24 | AI matching | Quota/auth failures cause no provider call; authorized response has safe error handling. |
| AT-25 | Native brand/influencer forms | One confirmed AA receipt; idempotent CRM bridge; no old-host/iframe dependency. |
| AT-26 | Public publication gate | Imported/private/draft/unconsented records remain private. |
| AT-27 | Migration rehearsal | Users, rows, links and file bytes reconcile with documented exceptions only. |
| AT-28 | Mobile/accessibility/motion | Key public and workspace journeys work across specified widths and reduced motion. |
| AT-29 | Jobs and notifications | Master job works once; duplicate runs do not duplicate reminders; source job disabled at cutover. |
| AT-30 | Source operation parity | Each Appendix C operation has a target implementation, caller/access mapping and verification result. |
| AT-31 | Source route parity | Each Appendix A route has a native target destination or equivalent preserved legacy behavior. |
| AT-32 | Production dependency scan | No active production call to old source project/function/form hostname. |
| AT-33 | Rollback rehearsal | Application rollback and post-cutover write reconciliation procedure are exercised without overwriting AA data. |

Use meaningful authorization, concurrency, data-integrity and workflow tests. Reuse existing tests and port source regression intent into the target's test setup; do not merely test that a copied string/function exists.

Repository scripts currently include `npm run typecheck`, `npm test`, `npm run build`, `npm run lint` and `npm run test:e2e`. Confirm the selected package manager and current commands before running them. Report pre-existing failures separately; do not claim “all checks pass” if a required check failed or was skipped.

## 16. Implementation sequence and required deliverables

| Stage | Work | Reviewable output |
| --- | --- | --- |
| 1 | Latest source/target audit, exact destination and parity baseline | Feature/route/API/schema collision ledger and current blockers. |
| 2 | Additive namespace schema, Auth/shared identity adapter and migration tooling | Migrations, dry-run, mappings and security tests. |
| 3 | Partner Workspace layout, shared login, roles and account lifecycle | Native role-specific AA entry/navigation and permission tests. |
| 4 | Lead/gamer/import/CRM/ownership/follow-up modules | Working persistence and role-scoped journeys. |
| 5 | Deals/approvals/issuance/creator/messages/files | Transactional end-to-end collaboration workflow. |
| 6 | Companies/campaigns/projects/products/inventory/shipments/reports/AI | Remaining source capabilities with preserved access. |
| 7 | Native public marketing/forms/intake links | All audience flows on AA100XTech. |
| 8 | Full staged migration and regression/UAT | Reconciliation report, test results, screenshots where useful and release/rollback plan. |
| 9 | Authorized production cutover and observation | Verified production outcome and remaining limitations. |

Deliver in the repository:
- Implemented native source capabilities and preserved AA features.
- Reviewed additive SQL migrations and complete object/name mapping.
- Resumable dry-run/import/verify tooling with explicit source/target project checks.
- Environment example updates without real secrets.
- Feature parity ledger covering every Appendix A–C entry.
- Role/authorization, integrity and regression test results.
- Migration reconciliation, release and rollback runbooks.
- Final change report distinguishing code-complete, staging-verified, production-verified and blocked work.

Do not provide invented exact development days or infrastructure pricing before source/live-data discovery. Phase completion is defined by working behavior and evidence.

## 17. Execution prerequisites and open inputs

The requirements are concrete enough to implement the code. These inputs must be resolved before data-changing deployment work:

| Input | Current status | Required action |
| --- | --- | --- |
| Actual AA100XTech live Supabase URL/ref | Not verified; repo config and runtime env may differ | Owner supplies the project URL/ref, or Codex verifies the deployed environment through authorized access. No secret is needed in chat. |
| Complete Partners source access for the executing Codex session | Read access was available through the connected Lovable project during this audit; source GitHub URL was not established | Use the same authorized connector, or provide a GitHub repository/source ZIP/export including assets and migrations. |
| Live source/destination privileged migration access | Not exercised | Configure server-side/local secrets securely in the execution environment. |
| Current production domain/deployment settings | Repository and existing Vercel links identified; exact custom domain/cutover configuration not verified | Derive from the actual deployed AA environment. |
| Current schema/data/storage volume and provider configuration | Not inspected live | Inventory before planning the migration window and final cutover. |

Default product decisions already made: all source functionality and real source data are in scope; existing AA data/features stay; one master Supabase is the intended outcome; no new public staff signup, automatic billing or new brand portal is added.

Ask only for a concrete missing input that authorized tools/configuration cannot resolve. Continue independent implementation and reversible verification while an unrelated release prerequisite is pending.

## 18. Codex execution brief — paste with this complete document

You are implementing the complete integration described in this PRD in the existing repository `purushottam-design/aa100xtech`.

The owner's priority is explicit: ALL Partners - Creator Moves 365 functions must work inside AA100XTech while every existing AA100XTech feature and record remains available. A link, iframe, static dashboard or second production backend is insufficient.

Read this entire document and the repository's current AGENTS.md before editing. The inspected target is Next.js App Router, not TanStack Start. Read the installed version's Next docs. Recheck the latest source/target revisions and create a working branch without rewriting published history.

Obtain the complete Partners source from Lovable project `596d7dbe-aa8e-4a98-9859-a133b7678ff6`, a connected source GitHub repository or an authorized source export. The audited source commit is `dd09e0b44087c823624aab423b4c0275cb7a67bd`. Do not recreate complex source behavior from screenshots or claim exact parity without reading source.

Use `/partner-workspace/*` for private source routes and native existing AA public routes for brand/influencer marketing and forms. Do not overwrite existing `/admin`, `/partners`, `/team`, `/auth`, `/dashboard` or existing redirects. Integrate source design into AA tokens.

Port all 25 operation modules, the 173 listed registered operations and their dependencies into AA server-only code with a strict allowlist and current membership/ownership validation. Preserve transactional approval, login issuance and message/file logic. Existing AA RPC and payment behavior remain intact.

Select the verified current AA Supabase as the intended master. Do not guess the destination from a stale config file or choose an unrelated accessible database. Preserve AA Auth/users/roles/tables, namespace source entities according to Appendix B and reconcile all identities, FKs and Storage objects. Source business roles must not grant company-wide AA privileges. In particular, adapt source password resets/removals/Auth bans for shared master identities.

Implement a resumable migration with dry-run, explicit project checks, source/target id maps, conflict handling, file checksum verification and no replayed external side effects. Keep real data/history, preserve publication consent gates, and do not execute source demo seeds or first-user-admin triggers.

Add an idempotent native intake bridge using current AA application/proposal contracts. Brand/influencer forms must save through AA server handlers with a real receipt. No old-host form embeds.

Work through Section 16 to completion, maintaining the parity ledger. Run the meaningful tests and acceptance checks in Section 15 and existing AA regressions. Distinguish fixture tests from live staging verification. If credentials/access are missing, implement everything independently possible, prepare exact migration/release artifacts, and report the concrete remaining action without falsely claiming production completion.

Do not introduce a broad redesign, new gateway, automated outreach, unrelated SaaS dependencies or security bypasses. Keep changes reviewable. Do not merge/deploy or run irreversible production changes unless the current session separately authorizes that action.

Your final report must state what changed, how source parity and AA preservation were verified, data/file reconciliation results, exact unresolved blockers and how to run/deploy/rollback the result.

## 19. Source references

### Repository evidence

- [AA100XTech inspected snapshot](https://github.com/purushottam-design/aa100xtech/tree/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207)
- [Target AGENTS.md](https://github.com/purushottam-design/aa100xtech/blob/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207/AGENTS.md)
- [Target package.json](https://github.com/purushottam-design/aa100xtech/blob/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207/package.json)
- [Target redirects](https://github.com/purushottam-design/aa100xtech/blob/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207/next.config.ts)
- [Target role/panel model](https://github.com/purushottam-design/aa100xtech/blob/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207/src/lib/admin-panels.ts)
- [Target public profile and application migration](https://github.com/purushottam-design/aa100xtech/blob/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207/supabase/migrations/20261026090000_influencer_partnership.sql)
- [Target environment example](https://github.com/purushottam-design/aa100xtech/blob/8f2ac0d187aa2c8c8218ea6d417e02a49ef32207/.env.example)
- [Source Lovable project](https://lovable.dev/projects/596d7dbe-aa8e-4a98-9859-a133b7678ff6). Important inspected paths: `AGENTS.md`, `src/components/OpsLayout.tsx`, `src/routes/_authenticated/route.tsx`, `src/integrations/backend/config.ts`, `supabase/external/edge/_shared/ops/*`, `supabase/external/target/010–057`, `src/lib/brand-packages.ts`, `src/lib/official-forms.ts`.

### Current platform guidance consulted

- [Supabase backup/restore and Storage object migration](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase migration overview](https://supabase.com/docs/guides/platform/migrating-within-supabase)
- [Supabase changelog](https://supabase.com/changelog)
- [Supabase CLI v3 changes](https://supabase.com/changelog/supabase-cli-v3)

Supabase CLI v3 changed hosted/local targeting. Check the installed CLI version and its current help, then use the appropriate explicit destination targeting. Do not copy old migration commands unverified. Platform backup examples are not permission to restore a complete source database over the existing AA master.

---

## Appendix A — Complete source route disposition

These 46 leaf route modules were observed in the source. The target file column is a proposed native Next implementation location. If a source leaf is already a redirect or legacy view, retain its safe equivalent behavior and record that in the parity ledger. A row is not permission to bypass role checks.

| Source URL pattern | Native AA destination | Target page file | Intended audience |
| --- | --- | --- | --- |
| `/activity` | `/partner-workspace/activity` | `src/app/partner-workspace/activity/page.tsx` | Admin route; preserve source handler checks |
| `/admin` | `/partner-workspace/admin` | `src/app/partner-workspace/admin/page.tsx` | Admin route; preserve source handler checks |
| `/allocations` | `/partner-workspace/allocations` | `src/app/partner-workspace/allocations/page.tsx` | Admin route; preserve source handler checks |
| `/campaigns` | `/partner-workspace/campaigns` | `src/app/partner-workspace/campaigns/page.tsx` | Admin route; preserve source handler checks |
| `/companies` | `/partner-workspace/companies` | `src/app/partner-workspace/companies/page.tsx` | Admin route; preserve source handler checks |
| `/contact` | `/partner-workspace/contact` | `src/app/partner-workspace/contact/page.tsx` | Admin route; preserve source handler checks |
| `/creator` | `/partner-workspace/creator` | `src/app/partner-workspace/creator/page.tsx` | Linked creator; own data |
| `/creators/[id]` | `/partner-workspace/creators/[id]` | `src/app/partner-workspace/creators/[id]/page.tsx` | Admin route; preserve source handler checks |
| `/creators` | `/partner-workspace/creators` | `src/app/partner-workspace/creators/page.tsx` | Admin route; preserve source handler checks |
| `/dashboard` | `/partner-workspace/dashboard` | `src/app/partner-workspace/dashboard/page.tsx` | Admin route; preserve source handler checks |
| `/deal-approvals` | `/partner-workspace/deal-approvals` | `src/app/partner-workspace/deal-approvals/page.tsx` | Admin route; preserve source handler checks |
| `/duplicates` | `/partner-workspace/duplicates` | `src/app/partner-workspace/duplicates/page.tsx` | Admin route; preserve source handler checks |
| `/follow-ups` | `/partner-workspace/follow-ups` | `src/app/partner-workspace/follow-ups/page.tsx` | Admin route; preserve source handler checks |
| `/gamer-leads` | `/partner-workspace/gamer-leads` | `src/app/partner-workspace/gamer-leads/page.tsx` | Admin / gamer Lead Team |
| `/import` | `/partner-workspace/import` | `src/app/partner-workspace/import/page.tsx` | Admin route; preserve source handler checks |
| `/imtm-create` | `/partner-workspace/imtm-create` | `src/app/partner-workspace/imtm-create/page.tsx` | Admin route; preserve source handler checks |
| `/imtm` | `/partner-workspace/imtm` | `src/app/partner-workspace/imtm/page.tsx` | Admin route; preserve source handler checks |
| `/influencer-logins` | `/partner-workspace/influencer-logins` | `src/app/partner-workspace/influencer-logins/page.tsx` | Admin route; preserve source handler checks |
| `/influencers/[id]` | `/partner-workspace/influencers/[id]` | `src/app/partner-workspace/influencers/[id]/page.tsx` | Admin / assigned IMTM |
| `/inventory` | `/partner-workspace/inventory` | `src/app/partner-workspace/inventory/page.tsx` | Admin route; preserve source handler checks |
| `/lead-add` | `/partner-workspace/lead-add` | `src/app/partner-workspace/lead-add/page.tsx` | Influencer Lead Team; source admin controls preserved |
| `/lead-dashboard` | `/partner-workspace/lead-dashboard` | `src/app/partner-workspace/lead-dashboard/page.tsx` | Influencer Lead Team; source admin controls preserved |
| `/lead-import` | `/partner-workspace/lead-import` | `src/app/partner-workspace/lead-import/page.tsx` | Influencer Lead Team; source admin controls preserved |
| `/lead-overview` | `/partner-workspace/lead-overview` | `src/app/partner-workspace/lead-overview/page.tsx` | Admin route; preserve source handler checks |
| `/lead-team` | `/partner-workspace/lead-team` | `src/app/partner-workspace/lead-team/page.tsx` | Admin route; preserve source handler checks |
| `/leads/[id]` | `/partner-workspace/leads/[id]` | `src/app/partner-workspace/leads/[id]/page.tsx` | Admin route; preserve source handler checks |
| `/matchmaker` | `/partner-workspace/matchmaker` | `src/app/partner-workspace/matchmaker/page.tsx` | Admin route; preserve source handler checks |
| `/me` | `/partner-workspace/me` | `src/app/partner-workspace/me/page.tsx` | All approved memberships; own profile |
| `/my-collaborations` | `/partner-workspace/my-collaborations` | `src/app/partner-workspace/my-collaborations/page.tsx` | Linked creator; own data |
| `/my-influencers` | `/partner-workspace/my-influencers` | `src/app/partner-workspace/my-influencers/page.tsx` | Admin / assigned IMTM |
| `/my-leads` | `/partner-workspace/my-leads` | `src/app/partner-workspace/my-leads/page.tsx` | Influencer Lead Team; source admin controls preserved |
| `/my-notifications` | `/partner-workspace/my-notifications` | `src/app/partner-workspace/my-notifications/page.tsx` | Linked creator; own data |
| `/my-shipments` | `/partner-workspace/my-shipments` | `src/app/partner-workspace/my-shipments/page.tsx` | Linked creator; own data |
| `/my-tasks` | `/partner-workspace/my-tasks` | `src/app/partner-workspace/my-tasks/page.tsx` | Admin route; preserve source handler checks |
| `/overview` | `/partner-workspace/overview` | `src/app/partner-workspace/overview/page.tsx` | Admin / assigned IMTM |
| `/ownership` | `/partner-workspace/ownership` | `src/app/partner-workspace/ownership/page.tsx` | Admin route; preserve source handler checks |
| `/panel` | `/partner-workspace/panel` | `src/app/partner-workspace/panel/page.tsx` | Admin route; preserve source handler checks |
| `/permissions` | `/partner-workspace/permissions` | `src/app/partner-workspace/permissions/page.tsx` | Admin route; preserve source handler checks |
| `/products` | `/partner-workspace/products` | `src/app/partner-workspace/products/page.tsx` | Admin route; preserve source handler checks |
| `/projects` | `/partner-workspace/projects` | `src/app/partner-workspace/projects/page.tsx` | Admin route; preserve source handler checks |
| `/reports` | `/partner-workspace/reports` | `src/app/partner-workspace/reports/page.tsx` | Admin route; preserve source handler checks |
| `/settings` | `/partner-workspace/settings` | `src/app/partner-workspace/settings/page.tsx` | Admin route; preserve source handler checks |
| `/shipments` | `/partner-workspace/shipments` | `src/app/partner-workspace/shipments/page.tsx` | Admin route; preserve source handler checks |
| `/submissions` | `/partner-workspace/submissions` | `src/app/partner-workspace/submissions/page.tsx` | Admin route; preserve source handler checks |
| `/team-accounts` | `/partner-workspace/team-accounts` | `src/app/partner-workspace/team-accounts/page.tsx` | Admin route; preserve source handler checks |
| `/team` | `/partner-workspace/team` | `src/app/partner-workspace/team/page.tsx` | Admin route; preserve source handler checks |

### Public, login and special route disposition

| Source route / entry | Native AA disposition |
| --- | --- |
| `/` | Merge relevant editorial/product sections into existing `/creator-moves-365` and corporate partnership sections; preserve corporate home. |
| `/brands` | Existing `/influencer-marketing/for-brands`, source package/marketing content plus native form. |
| `/influencers` | Integrate editorial showcase sections within existing AA influencer marketing pages; preserve current AA root redirect and real publication gates. |
| `/auth`, `/login` | Existing master `/auth` with safe workspace return path; keep source fallback/login aliases scoped. |
| `/forgot-password` | Existing shared recovery or new `/auth/forgot-password` if needed. |
| `/reset-password` | Existing shared recovery or new `/auth/reset-password` if needed. |
| `/access` | Namespaced no-access/pending support view; no public staff signup. |
| Retired `/list`, `/influencer-demo`, `/admin-login` | Safe login/equivalent redirects when resolving old source-domain links; do not introduce obsolete public data views. |
| `/api/match-creators` | `/api/partner-workspace/ai/match-creators`. |
| Source `cm365-api/<operation>` | Native allowlisted AA `/api/partner-workspace/<operation>`; same business behavior and access checks. |
| Source `cm365-api/health` | Safe native health capability; do not report healthy when required master resources fail. |
| Source `cm365-api/cron/follow-ups` | Authenticated job-secret protected native cron endpoint/job on the master. |

## Appendix B — Complete proposed source table map

These 56 table names are declared across the audited source base/target SQL. Introspect the actual live source and destination before writing final DDL. Some are legacy/provenance entities. Preserve their real role; do not grant legacy authorization or re-seed their example rows.

| Source table | Proposed master table | Rule |
| --- | --- | --- |
| `activity_logs` | `cm365_activity_logs` | Imported Partners data; preserve AA names. |
| `ai_usage_events` | `cm365_ai_usage_events` | Imported Partners data; preserve AA names. |
| `campaign_creators` | `cm365_campaign_creators` | Imported Partners data; preserve AA names. |
| `campaigns` | `cm365_campaigns` | Imported Partners data; preserve AA names. |
| `cm365_bulk_revert_runs` | `cm365_bulk_revert_runs` | Preserve app-specific name; check target conflicts. |
| `cm365_duplicate_attempts` | `cm365_duplicate_attempts` | Active duplicate-attempt workflow. |
| `cm365_memberships` | `cm365_memberships` | Canonical Partners membership; mapped master Auth id. |
| `cm365_role_changes` | `cm365_role_changes` | Preserve app-specific name; check target conflicts. |
| `companies` | `cm365_companies` | Imported Partners data; preserve AA names. |
| `contact_attempts` | `cm365_contact_attempts` | Imported Partners data; preserve AA names. |
| `contact_requests` | `cm365_contact_requests` | Imported Partners data; preserve AA names. |
| `creator_applications` | `cm365_creator_applications` | Imported Partners data; preserve AA names. |
| `deal_approval_events` | `cm365_deal_approval_events` | Imported Partners data; preserve AA names. |
| `deal_approvals` | `cm365_deal_approvals` | Imported Partners data; preserve AA names. |
| `deal_deliverables` | `cm365_deal_deliverables` | Imported Partners data; preserve AA names. |
| `deals` | `cm365_deals` | Imported Partners data; preserve AA names. |
| `deliverables` | `cm365_deliverables` | Imported Partners data; preserve AA names. |
| `duplicate_attempts` | `cm365_legacy_duplicate_attempts` | Legacy table; keep distinct from active cm365_duplicate_attempts. |
| `follow_up_alerts` | `cm365_follow_up_alerts` | Imported Partners data; preserve AA names. |
| `follow_up_tasks` | `cm365_follow_up_tasks` | Imported Partners data; preserve AA names. |
| `gamer_leads` | `cm365_gamer_leads` | Imported Partners data; preserve AA names. |
| `imtm_deals` | `cm365_imtm_deals` | Imported Partners data; preserve AA names. |
| `imtm_members` | `cm365_imtm_members` | Imported Partners data; preserve AA names. |
| `imtm_profiles` | `cm365_imtm_profiles` | Imported Partners data; preserve AA names. |
| `influencer_accounts` | `cm365_influencer_accounts` | Canonical account link; do not restore retired local-password login. |
| `influencer_assignment_history` | `cm365_influencer_assignment_history` | Imported Partners data; preserve AA names. |
| `influencer_comm_log` | `cm365_influencer_comm_log` | Imported Partners data; preserve AA names. |
| `influencer_deal_drafts` | `cm365_influencer_deal_drafts` | Imported Partners data; preserve AA names. |
| `influencer_files` | `cm365_influencer_files` | Imported Partners data; preserve AA names. |
| `influencer_identities` | `cm365_influencer_identities` | Imported Partners data; preserve AA names. |
| `influencer_leads` | `cm365_influencer_leads` | Imported Partners data; preserve AA names. |
| `influencer_message_reads` | `cm365_influencer_message_reads` | Imported Partners data; preserve AA names. |
| `influencer_messages` | `cm365_influencer_messages` | Imported Partners data; preserve AA names. |
| `influencer_notes` | `cm365_influencer_notes` | Imported Partners data; preserve AA names. |
| `influencer_self_profiles` | `cm365_influencer_self_profiles` | Imported Partners data; preserve AA names. |
| `influencers` | `cm365_influencers` | Imported Partners data; preserve AA names. |
| `inventory_movements` | `cm365_inventory_movements` | Imported Partners data; preserve AA names. |
| `lead_team_accounts` | `cm365_lead_team_accounts` | Imported Partners data; preserve AA names. |
| `legacy_duplicate_reviews` | `cm365_legacy_duplicate_reviews` | Imported Partners data; preserve AA names. |
| `login_issuances` | `cm365_login_issuances` | Imported Partners data; preserve AA names. |
| `notifications` | `cm365_notifications` | Partner visibility/read state; keep distinct from AA notifications. |
| `outreach_log` | `cm365_outreach_log` | Imported Partners data; preserve AA names. |
| `partner_inquiries` | `cm365_partner_inquiries` | Imported Partners data; preserve AA names. |
| `product_allocations` | `cm365_product_allocations` | Imported Partners data; preserve AA names. |
| `products` | `cm365_products` | Operational/stock catalog; do not merge into AA commercial products. |
| `profiles` | `cm365_profiles` | Partner-specific profile; shared Auth id, separate AA profile. |
| `project_participants` | `cm365_project_participants` | Imported Partners data; preserve AA names. |
| `projects` | `cm365_projects` | Imported Partners data; preserve AA names. |
| `shipment_events` | `cm365_shipment_events` | Imported Partners data; preserve AA names. |
| `shipment_items` | `cm365_shipment_items` | Imported Partners data; preserve AA names. |
| `shipments` | `cm365_shipments` | Imported Partners data; preserve AA names. |
| `staff_permissions` | `cm365_staff_permissions` | Imported Partners data; preserve AA names. |
| `submissions` | `cm365_submissions` | Imported Partners data; preserve AA names. |
| `team_accounts` | `cm365_team_accounts` | Canonical account link; do not restore retired local-password login. |
| `user_roles` | `cm365_legacy_user_roles` | Historical provenance only; active role comes from memberships. |
| `workspace_settings` | `cm365_workspace_settings` | Imported Partners data; preserve AA names. |

All foreign keys, dynamic table selectors, database functions, policy predicates, triggers, search paths, generated types and file-path references must use the reviewed map. Naive text replacement is insufficient. Keep the source-to-target identity map for historical references and rollback/reconciliation.

## Appendix C — Complete observed registered backend operations

**173 registered operation declarations across 25 modules.** Special health/cron/AI entry points and internal dependencies are additional obligations. This inventory describes source code; it does not certify that every endpoint currently succeeds in the live source.

Access legend:

| Source class | Required target meaning |
| --- | --- |
| `authenticated` | Verified master identity; only own access-state/request behavior. No membership grant. No new public signup UI. |
| `any` | Verified, approved Partners membership plus account/ownership checks. This never means any AA user. |
| `staff` | Partners admin or IMTM, plus source page restrictions and per-record ownership. |
| `admin` | Approved Partners admin with applicable function-level restrictions. |
| `influencer` | Linked active creator; only their own allowed data. |
| `lead_team` | Influencer Lead Team scope; gamer callers excluded. |
| `gamer` | Partners admin or Gamer Lead Team specialization, plus own-row restrictions. |

The exact source operation names below may remain internal implementation names even if the UI uses clearer labels. Every row needs a target handler, authorization mapping, caller and verification entry in the parity ledger.

### C.0 — accounts (15)

Source: `supabase/external/edge/_shared/ops/accounts.ts`.

| Operation | Source access class |
| --- | --- |
| `getMe` | `any` |
| `listInfluencerAccounts` | `staff` |
| `createInfluencerAccount` | `staff` |
| `updateInfluencerAccount` | `staff` |
| `setInfluencerAccountStatus` | `admin` |
| `deleteInfluencerAccount` | `admin` |
| `getMyInfluencerAccount` | `influencer` |
| `saveMyInfluencerAccount` | `influencer` |
| `listAdmins` | `admin` |
| `listMemberships` | `admin` |
| `setMembership` | `admin` |
| `getAccessState` | `authenticated` |
| `requestAccess` | `authenticated` |
| `listAccessRequests` | `admin` |
| `decideAccessRequest` | `admin` |

### C.0 — ai (1)

Source: `supabase/external/edge/_shared/ops/ai.ts`.

| Operation | Source access class |
| --- | --- |
| `reserveAiMatch` | `staff` |

### C.0 — approvals (6)

Source: `supabase/external/edge/_shared/ops/approvals.ts`.

| Operation | Source access class |
| --- | --- |
| `submitDealForApproval` | `staff` |
| `getDealApprovalHistory` | `staff` |
| `countPendingApprovals` | `staff` |
| `listDealApprovals` | `admin` |
| `decideDealApproval` | `admin` |
| `reopenDealApproval` | `admin` |

### C.0 — bulk-revert (2)

Source: `supabase/external/edge/_shared/ops/bulk-revert.ts`.

| Operation | Source access class |
| --- | --- |
| `previewBulkRevert` | `admin` |
| `runBulkRevert` | `admin` |

### C.0 — creator (6)

Source: `supabase/external/edge/_shared/ops/creator.ts`.

| Operation | Source access class |
| --- | --- |
| `getCreatorHome` | `influencer` |
| `listMyCollaborations` | `influencer` |
| `listMyShipments` | `influencer` |
| `listMyNotifications` | `influencer` |
| `markMyNotificationRead` | `influencer` |
| `markAllMyNotificationsRead` | `influencer` |

### C.0 — credentials (3)

Source: `supabase/external/edge/_shared/ops/credentials.ts`.

| Operation | Source access class |
| --- | --- |
| `getInfluencerLoginState` | `staff` |
| `listLoginCandidates` | `admin` |
| `issueInfluencerLogin` | `admin` |

### C.0 — crm (22)

Source: `supabase/external/edge/_shared/ops/crm.ts`.

| Operation | Source access class |
| --- | --- |
| `listOwnershipOverview` | `admin` |
| `reassignInfluencer` | `admin` |
| `resetAssignmentWindow` | `admin` |
| `listAssignmentHistory` | `staff` |
| `listTeamAccounts` | `admin` |
| `saveTeamAccount` | `admin` |
| `setTeamAccountActive` | `admin` |
| `deleteTeamAccount` | `admin` |
| `listCrmInfluencers` | `staff` |
| `saveCrmInfluencer` | `staff` |
| `deleteCrmInfluencer` | `admin` |
| `reserveImtmIdentity` | `staff` |
| `releaseImtmIdentity` | `staff` |
| `logContactAttempt` | `staff` |
| `setDealStatus` | `staff` |
| `getCrmInfluencer` | `staff` |
| `listFollowUps` | `admin` |
| `resolveFollowUp` | `admin` |
| `createFollowUpTask` | `admin` |
| `listMyTasks` | `staff` |
| `updateTaskStatus` | `staff` |
| `sweepFollowUps` | `admin` |

### C.0 — deal-workspace (17)

Source: `supabase/external/edge/_shared/ops/deal-workspace.ts`.

| Operation | Source access class |
| --- | --- |
| `getDealWorkspace` | `staff` |
| `logCommunication` | `staff` |
| `listCommunications` | `staff` |
| `saveDealDraft` | `staff` |
| `submitDealWorkspace` | `staff` |
| `updateDeliverableProgress` | `staff` |
| `setFileShared` | `staff` |
| `getDealDeskSummary` | `staff` |
| `requestFileUpload` | `any` |
| `confirmFileUpload` | `any` |
| `getFileUrl` | `any` |
| `listMessages` | `any` |
| `sendMessage` | `any` |
| `markMessagesRead` | `any` |
| `getMessageInbox` | `any` |
| `getMyDealPortal` | `influencer` |
| `submitMyDeliverableLink` | `influencer` |

### C.0 — duplicates (4)

Source: `supabase/external/edge/_shared/ops/duplicates.ts`.

| Operation | Source access class |
| --- | --- |
| `listDuplicateAttempts` | `admin` |
| `getDuplicateAttempt` | `admin` |
| `reviewDuplicateAttempt` | `admin` |
| `deleteDuplicateAttempts` | `admin` |

### C.0 — gamer-leads (10)

Source: `supabase/external/edge/_shared/ops/gamer-leads.ts`.

| Operation | Source access class |
| --- | --- |
| `readGamerSheet` | `gamer` |
| `listGamerLeads` | `gamer` |
| `gamerLeadSummary` | `gamer` |
| `createGamerLead` | `gamer` |
| `previewGamerRows` | `gamer` |
| `importGamerRows` | `gamer` |
| `updateGamerLead` | `gamer` |
| `deleteGamerLead` | `admin` |
| `exportGamerLeads` | `admin` |
| `listGamerContributors` | `admin` |

### C.0 — import (3)

Source: `supabase/external/edge/_shared/ops/import.ts`.

| Operation | Source access class |
| --- | --- |
| `previewImportRows` | `staff` |
| `importInfluencerRows` | `staff` |
| `announceImport` | `staff` |

### C.0 — imtm-logins (5)

Source: `supabase/external/edge/_shared/ops/imtm-logins.ts`.

| Operation | Source access class |
| --- | --- |
| `listImtmLogins` | `admin` |
| `createImtmLogin` | `admin` |
| `updateImtmLogin` | `admin` |
| `setImtmLoginPassword` | `admin` |
| `setImtmLoginActive` | `admin` |

### C.0 — imtm (11)

Source: `supabase/external/edge/_shared/ops/imtm.ts`.

| Operation | Source access class |
| --- | --- |
| `listImtm` | `staff` |
| `listImtmMembers` | `staff` |
| `countImtmProfiles` | `staff` |
| `saveImtmProfile` | `staff` |
| `updateImtmOutreach` | `staff` |
| `deleteImtmProfile` | `admin` |
| `saveImtmDeal` | `staff` |
| `decideImtmDeal` | `admin` |
| `signImtmAgreement` | `staff` |
| `saveImtmMember` | `staff` |
| `decideImtmMember` | `admin` |

### C.0 — lead-team (20)

Source: `supabase/external/edge/_shared/ops/lead-team.ts`.

| Operation | Source access class |
| --- | --- |
| `listLeadTeamAccounts` | `admin` |
| `createLeadTeamAccount` | `admin` |
| `updateLeadTeamAccount` | `admin` |
| `setLeadTeamPassword` | `admin` |
| `setLeadTeamActive` | `admin` |
| `listAllLeads` | `admin` |
| `getLeadOverview` | `admin` |
| `getLeadDetail` | `admin` |
| `deleteLead` | `admin` |
| `reviewLead` | `admin` |
| `adminUpdateLead` | `admin` |
| `convertLead` | `admin` |
| `createLead` | `lead_team` |
| `listMyLeads` | `lead_team` |
| `updateMyLead` | `lead_team` |
| `myLeadStats` | `lead_team` |
| `previewLeadRows` | `lead_team` |
| `importLeadRows` | `lead_team` |
| `listMySubmittedLeads` | `staff` |
| `readLeadSheet` | `lead_team` |

### C.0 — notifications (3)

Source: `supabase/external/edge/_shared/ops/notifications.ts`.

| Operation | Source access class |
| --- | --- |
| `listNotifications` | `staff` |
| `markNotificationRead` | `staff` |
| `markAllNotificationsRead` | `staff` |

### C.0 — ops (17)

Source: `supabase/external/edge/_shared/ops/ops.ts`.

| Operation | Source access class |
| --- | --- |
| `getOpsDashboard` | `admin` |
| `getOpsLookups` | `admin` |
| `listProducts` | `admin` |
| `saveProduct` | `admin` |
| `adjustStock` | `admin` |
| `listProjects` | `admin` |
| `saveProject` | `admin` |
| `setParticipantStatus` | `admin` |
| `listAllocations` | `admin` |
| `createAllocation` | `admin` |
| `updateAllocation` | `admin` |
| `listOpsInfluencers` | `admin` |
| `assignInfluencer` | `admin` |
| `listActivity` | `admin` |
| `getInfluencerDetail` | `staff` |
| `listStaffPermissions` | `admin` |
| `saveStaffPermissions` | `admin` |

### C.0 — profile (2)

Source: `supabase/external/edge/_shared/ops/profile.ts`.

| Operation | Source access class |
| --- | --- |
| `getMyProfile` | `any` |
| `saveMyProfile` | `any` |

### C.0 — removals (3)

Source: `supabase/external/edge/_shared/ops/removals.ts`.

| Operation | Source access class |
| --- | --- |
| `removeImtmAccount` | `admin` |
| `removeLeadTeamAccount` | `admin` |
| `removeInfluencer` | `admin` |

### C.0 — reports (1)

Source: `supabase/external/edge/_shared/ops/reports.ts`.

| Operation | Source access class |
| --- | --- |
| `getReports` | `admin` |

### C.0 — revert (1)

Source: `supabase/external/edge/_shared/ops/revert.ts`.

| Operation | Source access class |
| --- | --- |
| `revertInfluencerToLead` | `admin` |

### C.0 — roles (2)

Source: `supabase/external/edge/_shared/ops/roles.ts`.

| Operation | Source access class |
| --- | --- |
| `listRoleAccounts` | `admin` |
| `changeUserRole` | `admin` |

### C.0 — settings (2)

Source: `supabase/external/edge/_shared/ops/settings.ts`.

| Operation | Source access class |
| --- | --- |
| `getWorkspaceSettings` | `staff` |
| `saveWorkspaceSettings` | `admin` |

### C.0 — sheets (1)

Source: `supabase/external/edge/_shared/ops/sheets.ts`.

| Operation | Source access class |
| --- | --- |
| `readGoogleSheet` | `staff` |

### C.0 — shipments (4)

Source: `supabase/external/edge/_shared/ops/shipments.ts`.

| Operation | Source access class |
| --- | --- |
| `listShipments` | `staff` |
| `getShipment` | `staff` |
| `saveShipment` | `staff` |
| `updateShipmentStatus` | `staff` |

### C.0 — workspace (12)

Source: `supabase/external/edge/_shared/ops/workspace.ts`.

| Operation | Source access class |
| --- | --- |
| `getImtmDashboard` | `staff` |
| `listMyRoster` | `staff` |
| `addMyInfluencer` | `staff` |
| `getInfluencerWorkspace` | `staff` |
| `addInfluencerNote` | `staff` |
| `editInfluencerNote` | `staff` |
| `scheduleFollowUp` | `staff` |
| `completeFollowUp` | `staff` |
| `logContact` | `staff` |
| `getTeamWorkload` | `admin` |
| `getAdminDashboard` | `admin` |
| `sweepFollowUpReminders` | `admin` |

### Compatibility behaviors that require special care

- Account/access-request operations must retain own-state restrictions and remain separate from the public AA signup purpose; no automatic staff approval.
- Source `requestAccess` existing backend behavior does not authorize adding a self-service staff enrollment UI.
- Creator account creation helpers must keep the approved-submission/issuance gate. A generic membership endpoint cannot bypass it.
- Source account removals and password/ban helpers need shared-identity adaptation. Removing a product membership must not break unrelated AA access.
- A legacy `staff` operation does not permit widening its page access or removing assignment checks.
- File/message `any` operations still require explicit creator/assignee relationships; Lead Team membership alone is insufficient.
- Preserve source read/request inputs and errors where callers depend on them; record intentional transport adaptations.

## Appendix D — Existing AA100XTech page module baseline

These 71 page modules existed in the audited target tree. Preserve their behavior and the current redirect registry. Some modules are shadowed by redirects, so this is a code baseline rather than a claim of 71 independently reachable live pages. Preserve API handlers, route handlers, loaders, metadata and redirects in addition to these pages.

| Existing route pattern | Existing page file |
| --- | --- |
| `/` | `src/app/page.tsx` |
| `/about` | `src/app/about/page.tsx` |
| `/admin` | `src/app/(authenticated)/admin/page.tsx` |
| `/admin-guide` | `src/app/admin-guide/page.tsx` |
| `/admin/admins` | `src/app/(authenticated)/admin/admins/page.tsx` |
| `/admin/brand-inquiries` | `src/app/(authenticated)/admin/brand-inquiries/page.tsx` |
| `/admin/business` | `src/app/(authenticated)/admin/business/page.tsx` |
| `/admin/company` | `src/app/(authenticated)/admin/company/page.tsx` |
| `/admin/influencers` | `src/app/(authenticated)/admin/influencers/page.tsx` |
| `/admin/interview` | `src/app/(authenticated)/admin/interview/page.tsx` |
| `/admin/marketing` | `src/app/(authenticated)/admin/marketing/page.tsx` |
| `/admin/requests` | `src/app/(authenticated)/admin/requests/page.tsx` |
| `/admin/security` | `src/app/(authenticated)/admin/security/page.tsx` |
| `/admin/select` | `src/app/admin/select/page.tsx` |
| `/admin/settings/email` | `src/app/(authenticated)/admin/settings/email/page.tsx` |
| `/admin/settings/general` | `src/app/(authenticated)/admin/settings/general/page.tsx` |
| `/admin/settings/website` | `src/app/(authenticated)/admin/settings/website/page.tsx` |
| `/admin/super` | `src/app/(authenticated)/admin/super/page.tsx` |
| `/affiliate` | `src/app/(authenticated)/affiliate/page.tsx` |
| `/affiliate-admin` | `src/app/(authenticated)/affiliate-admin/page.tsx` |
| `/affiliates` | `src/app/affiliates/page.tsx` |
| `/auth` | `src/app/auth/page.tsx` |
| `/be-the-one` | `src/app/be-the-one/page.tsx` |
| `/blog` | `src/app/blog/page.tsx` |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` |
| `/business-plans` | `src/app/business-plans/page.tsx` |
| `/careers` | `src/app/careers/page.tsx` |
| `/careers/apply` | `src/app/careers/apply/page.tsx` |
| `/careers/london` | `src/app/careers/london/page.tsx` |
| `/catalog` | `src/app/catalog/page.tsx` |
| `/catalog/[id]` | `src/app/catalog/[id]/page.tsx` |
| `/clients` | `src/app/clients/page.tsx` |
| `/consultation` | `src/app/consultation/page.tsx` |
| `/contact` | `src/app/contact/page.tsx` |
| `/cookie-policy` | `src/app/cookie-policy/page.tsx` |
| `/creator-moves-365` | `src/app/creator-moves-365/page.tsx` |
| `/dashboard` | `src/app/(authenticated)/dashboard/page.tsx` |
| `/disclaimer` | `src/app/disclaimer/page.tsx` |
| `/founders` | `src/app/founders/page.tsx` |
| `/home` | `src/app/home/page.tsx` |
| `/influencer-marketing` | `src/app/influencer-marketing/page.tsx` |
| `/influencer-marketing/for-brands` | `src/app/influencer-marketing/for-brands/page.tsx` |
| `/influencer-marketing/for-influencers` | `src/app/influencer-marketing/for-influencers/page.tsx` |
| `/influencer-partners` | `src/app/influencer-partners/page.tsx` |
| `/influencer-programs` | `src/app/influencer-programs/page.tsx` |
| `/influencer-success-program` | `src/app/influencer-success-program/page.tsx` |
| `/influencers` | `src/app/influencers/page.tsx` |
| `/influencers/[slug]` | `src/app/influencers/[slug]/page.tsx` |
| `/join-us/influencer` | `src/app/join-us/influencer/page.tsx` |
| `/marketing/[slug]` | `src/app/marketing/[slug]/page.tsx` |
| `/notifications` | `src/app/notifications/page.tsx` |
| `/partners` | `src/app/partners/page.tsx` |
| `/partners/apply` | `src/app/partners/apply/page.tsx` |
| `/partners/plans` | `src/app/partners/plans/page.tsx` |
| `/partnership-for-influencers` | `src/app/partnership-for-influencers/page.tsx` |
| `/portfolio` | `src/app/portfolio/page.tsx` |
| `/privacy-policy` | `src/app/privacy-policy/page.tsx` |
| `/profile` | `src/app/profile/page.tsx` |
| `/proposal` | `src/app/proposal/page.tsx` |
| `/real-estate` | `src/app/real-estate/page.tsx` |
| `/refund-policy` | `src/app/refund-policy/page.tsx` |
| `/request-access` | `src/app/request-access/page.tsx` |
| `/services` | `src/app/services/page.tsx` |
| `/services/[slug]` | `src/app/services/[slug]/page.tsx` |
| `/services/explore` | `src/app/services/explore/page.tsx` |
| `/services/explore/[slug]` | `src/app/services/explore/[slug]/page.tsx` |
| `/settings` | `src/app/settings/page.tsx` |
| `/shipping-policy` | `src/app/shipping-policy/page.tsx` |
| `/social-media-ads-marketing` | `src/app/social-media-ads-marketing/page.tsx` |
| `/team` | `src/app/(authenticated)/team/page.tsx` |
| `/terms-and-conditions` | `src/app/terms-and-conditions/page.tsx` |

## Appendix E — Final “done” checklist

- [ ] All existing AA features/data/roles/redirects remain available.
- [ ] All 46 source authenticated route modules have native target disposition.
- [ ] All public source capabilities have native AA pages/forms or safe equivalent legacy behavior.
- [ ] All 173 observed registered operations and required dependencies are implemented and authorized.
- [ ] All 56 source table names have a reviewed disposition and live-schema reconciliation.
- [ ] All actual source users, account links, business records and referenced files are reconciled.
- [ ] One verified master Supabase project handles production Auth/data/Storage/jobs.
- [ ] Source role and identity collisions do not change existing AA access.
- [ ] Creator/public approval and publication-consent gates remain distinct.
- [ ] Transactional approval, issuance and message/file behavior pass concurrency/failure tests.
- [ ] No production page, form or backend depends on the old Partners deployment/project.
- [ ] Native brand/influencer forms produce real saved AA receipts and reliable CRM links.
- [ ] Existing payment, affiliate, booking, careers and admin regressions pass or have precisely documented pre-existing failures.
- [ ] Migration rehearsal, reconciliation, cutover and safe rollback procedures are complete.
- [ ] Final report distinguishes implementation from staging verification and actual production release.

**Success means the user can perform the complete Partners business process inside AA100XTech while continuing to use everything that was already in AA100XTech.**



