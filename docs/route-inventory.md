# Route migration inventory

The original TanStack Start application had 58 page route modules, 3 layout modules, the `/app` redirect, the affiliate redirect handler, four public API routes, and the XML sitemap. All URL paths are preserved.

| URL | Original view | Next.js page | Access |
| --- | --- | --- | --- |
| `/about` | `src/routes/about.tsx` | `src/app/about/page.tsx` | Public / existing in-page guard |
| `/admin-guide` | `src/routes/admin-guide.tsx` | `src/app/admin-guide/page.tsx` | Public / existing in-page guard |
| `/admin/select` | `src/routes/admin.select.tsx` | `src/app/admin/select/page.tsx` | Public / existing in-page guard |
| `/affiliates` | `src/routes/affiliates.tsx` | `src/app/affiliates/page.tsx` | Public / existing in-page guard |
| `/app/admin` | `src/routes/app.admin.tsx` | `src/app/app/admin/page.tsx` | Public / existing in-page guard |
| `/app/book-consultation` | `src/routes/app.book-consultation.tsx` | `src/app/app/book-consultation/page.tsx` | Public / existing in-page guard |
| `/app/home` | `src/routes/app.home.tsx` | `src/app/app/home/page.tsx` | Public / existing in-page guard |
| `/app/install` | `src/routes/app.install.tsx` | `src/app/app/install/page.tsx` | Public / existing in-page guard |
| `/app/login` | `src/routes/app.login.tsx` | `src/app/app/login/page.tsx` | Public / existing in-page guard |
| `/app/notifications` | `src/routes/app.notifications.tsx` | `src/app/app/notifications/page.tsx` | Public / existing in-page guard |
| `/app/profile` | `src/routes/app.profile.tsx` | `src/app/app/profile/page.tsx` | Public / existing in-page guard |
| `/app/service/[id]` | `src/routes/app.service.$id.tsx` | `src/app/app/service/[id]/page.tsx` | Public / existing in-page guard |
| `/app/services` | `src/routes/app.services.tsx` | `src/app/app/services/page.tsx` | Public / existing in-page guard |
| `/app/settings` | `src/routes/app.settings.tsx` | `src/app/app/settings/page.tsx` | Public / existing in-page guard |
| `/auth` | `src/routes/auth.tsx` | `src/app/auth/page.tsx` | Public / existing in-page guard |
| `/be-the-one` | `src/routes/be-the-one.tsx` | `src/app/be-the-one/page.tsx` | Public / existing in-page guard |
| `/careers/apply` | `src/routes/careers.apply.tsx` | `src/app/careers/apply/page.tsx` | Public / existing in-page guard |
| `/careers` | `src/routes/careers.index.tsx` | `src/app/careers/page.tsx` | Public / existing in-page guard |
| `/careers/london` | `src/routes/careers.london.tsx` | `src/app/careers/london/page.tsx` | Public / existing in-page guard |
| `/clients` | `src/routes/clients.tsx` | `src/app/clients/page.tsx` | Public / existing in-page guard |
| `/consultation` | `src/routes/consultation.tsx` | `src/app/consultation/page.tsx` | Public / existing in-page guard |
| `/contact` | `src/routes/contact.tsx` | `src/app/contact/page.tsx` | Public / existing in-page guard |
| `/cookie-policy` | `src/routes/cookie-policy.tsx` | `src/app/cookie-policy/page.tsx` | Public / existing in-page guard |
| `/creator-moves-365` | `src/routes/creator-moves-365.tsx` | `src/app/creator-moves-365/page.tsx` | Public / existing in-page guard |
| `/disclaimer` | `src/routes/disclaimer.tsx` | `src/app/disclaimer/page.tsx` | Public / existing in-page guard |
| `/founders` | `src/routes/founders.tsx` | `src/app/founders/page.tsx` | Public / existing in-page guard |
| `/` | `src/routes/index.tsx` | `src/app/page.tsx` | Public / existing in-page guard |
| `/influencer-marketing` | `src/routes/influencer-marketing.tsx` | `src/app/influencer-marketing/page.tsx` | Public / existing in-page guard |
| `/influencer-success-program` | `src/routes/influencer-success-program.tsx` | `src/app/influencer-success-program/page.tsx` | Public / existing in-page guard |
| `/partners/apply` | `src/routes/partners.apply.tsx` | `src/app/partners/apply/page.tsx` | Public / existing in-page guard |
| `/partners` | `src/routes/partners.index.tsx` | `src/app/partners/page.tsx` | Public / existing in-page guard |
| `/partners/plans` | `src/routes/partners.plans.tsx` | `src/app/partners/plans/page.tsx` | Public / existing in-page guard |
| `/portfolio` | `src/routes/portfolio.tsx` | `src/app/portfolio/page.tsx` | Public / existing in-page guard |
| `/privacy-policy` | `src/routes/privacy-policy.tsx` | `src/app/privacy-policy/page.tsx` | Public / existing in-page guard |
| `/real-estate` | `src/routes/real-estate.tsx` | `src/app/real-estate/page.tsx` | Public / existing in-page guard |
| `/refund-policy` | `src/routes/refund-policy.tsx` | `src/app/refund-policy/page.tsx` | Public / existing in-page guard |
| `/request-access` | `src/routes/request-access.tsx` | `src/app/request-access/page.tsx` | Public / existing in-page guard |
| `/services/[slug]` | `src/routes/services.$slug.tsx` | `src/app/services/[slug]/page.tsx` | Public / existing in-page guard |
| `/services/explore/[slug]` | `src/routes/services.explore.$slug.tsx` | `src/app/services/explore/[slug]/page.tsx` | Public / existing in-page guard |
| `/services/explore` | `src/routes/services.explore.index.tsx` | `src/app/services/explore/page.tsx` | Public / existing in-page guard |
| `/services` | `src/routes/services.index.tsx` | `src/app/services/page.tsx` | Public / existing in-page guard |
| `/shipping-policy` | `src/routes/shipping-policy.tsx` | `src/app/shipping-policy/page.tsx` | Public / existing in-page guard |
| `/terms-and-conditions` | `src/routes/terms-and-conditions.tsx` | `src/app/terms-and-conditions/page.tsx` | Public / existing in-page guard |
| `/admin/admins` | `src/routes/_authenticated/admin.admins.tsx` | `src/app/(authenticated)/admin/admins/page.tsx` | Authenticated |
| `/admin/business` | `src/routes/_authenticated/admin.business.tsx` | `src/app/(authenticated)/admin/business/page.tsx` | Authenticated |
| `/admin/company` | `src/routes/_authenticated/admin.company.tsx` | `src/app/(authenticated)/admin/company/page.tsx` | Authenticated |
| `/admin` | `src/routes/_authenticated/admin.index.tsx` | `src/app/(authenticated)/admin/page.tsx` | Authenticated |
| `/admin/interview` | `src/routes/_authenticated/admin.interview.tsx` | `src/app/(authenticated)/admin/interview/page.tsx` | Authenticated |
| `/admin/marketing` | `src/routes/_authenticated/admin.marketing.tsx` | `src/app/(authenticated)/admin/marketing/page.tsx` | Authenticated |
| `/admin/security` | `src/routes/_authenticated/admin.security.tsx` | `src/app/(authenticated)/admin/security/page.tsx` | Authenticated |
| `/admin/settings/email` | `src/routes/_authenticated/admin.settings.email.tsx` | `src/app/(authenticated)/admin/settings/email/page.tsx` | Authenticated |
| `/admin/settings/general` | `src/routes/_authenticated/admin.settings.general.tsx` | `src/app/(authenticated)/admin/settings/general/page.tsx` | Authenticated |
| `/admin/settings/website` | `src/routes/_authenticated/admin.settings.website.tsx` | `src/app/(authenticated)/admin/settings/website/page.tsx` | Authenticated |
| `/admin/super` | `src/routes/_authenticated/admin.super.tsx` | `src/app/(authenticated)/admin/super/page.tsx` | Authenticated |
| `/affiliate-admin` | `src/routes/_authenticated/affiliate-admin.tsx` | `src/app/(authenticated)/affiliate-admin/page.tsx` | Authenticated |
| `/affiliate` | `src/routes/_authenticated/affiliate.tsx` | `src/app/(authenticated)/affiliate/page.tsx` | Authenticated |
| `/dashboard` | `src/routes/_authenticated/dashboard.tsx` | `src/app/(authenticated)/dashboard/page.tsx` | Authenticated |
| `/team` | `src/routes/_authenticated/team.tsx` | `src/app/(authenticated)/team/page.tsx` | Authenticated |

Additional preserved handlers: `/app` redirects to `/app/home`; `/go/[affiliateId]/[slug]`; `/api/public/v1/track/click`; `/api/public/v1/health`; `/api/public/v1/coupons/validate`; `/api/public/v1/conversions`; `/sitemap.xml`.

The two service detail routes resolve the original static service data on the server and return the existing 404 page for unknown slugs. The partner form retains `plan` and `opportunity=paid-promotion` search parameters; the super admin console retains its `section` search parameter. Authenticated pages keep their existing browser Supabase session and require a verified user before their views mount; each backend function independently enforces its existing authorization.

Page metadata was extracted without editing titles, descriptions, Open Graph fields, Twitter cards, canonical links, or robots directives. Existing canonical URLs pointing to `aa100xtech.lovable.app` are deliberately preserved. The sitemap keeps the original URL list and XML response.

## Existing feature inventory

- Public site: home, about, clients, portfolio, founder profile, all services and service-type detail pages, product demonstrations, pricing, real-estate AI offerings, creator/influencer programs, partnership plans, careers cohorts, consultation, contact, and legal policies.
- Lead and application flows: contact submissions, career applications and task/file submissions, partner applications (including paid-promotion mode), portal access requests, sign-up/sign-in, issued member accounts, account profile updates, and logout.
- Consultation flow: original booking provider/dialog, plan and service selection, Razorpay Checkout, server order creation/payment verification, and stored booking records.
- Account and administration: authenticated dashboard, team directory, super-admin console, role dashboards (company, business, interview, marketing), user/admin management, roles/permissions, security activity and sessions, two-factor settings, support tickets, reporting/export, notifications, CMS and website/general/email settings.
- Affiliate program: catalog, referral links and redirect tracking, coupon validation, conversion endpoint, commissions, affiliate dashboard/admin, and payout requests.
- Mobile web app: original app shell/bottom tabs, service catalog and details, booking, profile/settings, login, admin entry, installation prompts, notifications, and service-worker offline support.
- Shared behavior: currency selection/conversion, theme toggle, responsive navigation/dropdowns, consultation modal, carousels/accordions, counters, existing CSS animations, Supabase browser sessions, and server authorization.

## Source and SEO preservation checks

Baseline Git commit: `1be2be529d782c19896503d2091f19d0acbb9c5a`. The original project remains available in Git; the migration uses the separate `nextjs-migration` branch. No production deployment, DNS change, database migration, or data write was performed.

`node --test tests/migration-parity.test.cjs` passes four preservation checks:

1. All **58 page JSX trees** match their original source after compiler normalization; text, classes, attributes, conditions, component order, and event bindings are retained.
2. All **79 shared component JSX trees** match the original source.
3. **26 existing files** remain unchanged: the global stylesheet, 14 business-data modules, and 11 public assets/scripts/robots/manifest files. Text comparison ignores operating-system line endings; image comparison uses exact bytes.
4. SEO fields on **58 pages** and **both dynamic service 404 variants** retain their original title, description, Open Graph properties, Twitter card, canonical URL, and robots values. The inherited Open Graph type remains `website` unless a page previously specified another type.

The original page head configurations contain no JSON-LD or other structured-data scripts to migrate. Font stylesheets, icons, manifest, and root SEO are retained in the native root layout. The original XML sitemap list, production base URL, response content type, and cache header are preserved.

Intentional compatibility exceptions: client/server directives and routing imports; native App Router wrappers and metadata exports; service-detail props resolved on the server; native search-parameter access; Supabase public environment-variable naming; local copies of the original hosted images; and a service-worker cache-version/Next-data exclusion update. These do not alter page designs.

These checks prove source fidelity; they do not replace browser verification or real external-service testing. Existing form tests exercise success, database errors, and network errors using mocks, without writing applications to production.
