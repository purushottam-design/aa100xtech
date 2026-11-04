# Website completion audit — 4 November 2026

Audit baseline: clean working tree; Next.js 16.4.3 / React 19 / Tailwind 4,
Supabase, existing RPC backend, Razorpay and ICICI, Radix UI and Playwright.
App Router pages wrap the retained `src/routes` components. See
`route-inventory.md` for the original route mapping.

| Requirement | Audit finding / implementation checklist |
| --- | --- |
| Preserve pages and data | Retain routes, catalog prices, projects, founder assets, programs, jobs, commission rules and all payment handlers. No migrations or production writes needed for this pass. |
| Header | Services already has catalog-driven desktop keyboard/touch navigation and mobile accordions. Restore missing company/program destinations; make these reachable on desktop as well as mobile. |
| Home | Existing hero, services, portfolio, plans, technology, animations and expert CTA present. Preserve layout and previously removed community section. Existing numerical claims require owner evidence; do not add claims. |
| Service catalog | All requested catalog services exist, including Android/iOS and AI/media services. Main detail pages lack technologies, workflow, benefits and FAQs. Reuse existing service-type content where applicable and add scoped guidance for remaining services. |
| Marketing | Existing SEO, social, advertising, influencer and viral pages cover offerings. Add campaign planning/reporting context and links to existing advertising/automation offerings instead of duplicate pages. Preserve prices; no new influencer prices. |
| Website plans | `pricing.ts` centralizes Essentials/Scaler/Corporate Custom; `business-plans.ts` keeps Business/Business+ separate. Mapping, CMS entitlement and missing support terms remain owner decisions. Preserve existing prices and email entitlements. |
| Portfolio / clients | Existing filters, cards, stack badges and live links present. Retain every record; actual screenshots and externally verified outcomes remain content dependencies. |
| About / founder | Existing mission, values, history, founder photo, technical expertise and global CTA present. No new qualifications or achievements. Verify existing counters/history with owner. |
| Consultation | Six packages, date/time validation, booking summary, reference, verification and gateway paths present. Preserve server-confirmed outcomes and UAT restrictions. Live acceptance depends on bank/configuration. |
| Contact / careers | Validated server intake, spam protection, idempotency, private resumes and protected admin inbox already present. Read-only readiness recheck required; do not return fake success if schema/provider is absent. |
| Programs / partners / affiliates | Existing program pages, applications, referral logic and dashboards present. Restore missing discovery links; preserve commission rules and approval requirements. |
| Footer | Add explicit Programs group, complete required service links and preserve existing valid destinations. |
| SEO | Main and explore service metadata lack canonicals; sitemap omits explore detail URLs. Complete canonicals, social metadata and sitemap; retain 404 behavior. |
| Accessibility / responsive | Preserve reduced-motion styles and existing mega menu. Add skip navigation and verify expanded header/footer and service layouts. |
| Security / schema | Existing auth/RBAC, CSRF, validation and payment signatures are preserved. No schema changes necessary. |
| QA | Baseline: 127/127 unit/integration tests pass. Full lint has 3,213 pre-existing problems (3,211 errors, 2 warnings). Run typecheck, build, regression tests, targeted lint and browser checks after changes. |
| Deployment | Local implementation only; production deployment is not authorized. |

Execution results and outstanding external dependencies are recorded in
`master-request-delivery.md` at completion.
