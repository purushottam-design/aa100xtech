# Navbar update — 4 November 2026

The existing shared header is updated in place. No page, footer, backend,
authentication implementation, currency provider or service catalog was changed
for this request. Earlier website enhancements already in the working tree are
retained.

## Implementation

- Primary order: Home, Services, Our Top Clients, Be The One, Founder, Join Us,
  Marketing, More, Currency · INR, Sign in / Sign up.
- Founder opens `https://theamanlife.com/` in a new tab on desktop and mobile,
  using `noopener noreferrer`. The existing `/founders` page remains available.
- Preserved logo asset, image dimensions/responsive sizing, white background,
  typography, 80px content height plus 1px border, sticky behavior and hover
  treatment. Sign-in uses the existing orange gradient button variant.
- Services retains the existing mega menu, category data, links and keyboard
  behavior. Its active state now shares the orange navigation underline.
- Join Us and Marketing reuse all their existing configured links. Join Us also
  includes the existing Success Program, careers application/London pages and
  account-request page.
- More contains About Us, Portfolio, Consultation, Contact Us, Creator Moves 365,
  Partners, Affiliates, Business Plans, Proposal, Insights, Real Estate,
  Explore Service Types, partner plans/application and the existing mobile app.
- Remaining legal pages stay in the footer. Protected/admin workflows and
  dynamic content/detail URLs retain their existing contextual entry points.
- Desktop secondary menus reuse Radix dropdown components: white surfaces,
  rounded corners, soft shadows, orange hover/active highlights, animations,
  keyboard navigation, Escape and outside-click dismissal.
- Below 1280px the existing scrolling drawer exposes the same primary order,
  expandable Services/Join Us/Marketing/More menus, currency and authentication.
  This keeps the longer desktop menu from wrapping or overlapping controls.
- No new dependency or second navbar was introduced. No deployment was made.

## Files changed for this request

| File | Purpose |
| --- | --- |
| `src/components/site-header.tsx` | Requested order and desktop/mobile menus using existing primitives. |
| `src/data/header-navigation.ts` | Header-only destinations, menu grouping, parameter resolution and active-state helpers; footer configuration remains intact. |
| `src/components/services-mega-menu.tsx` | Active-state attributes/classes only; menu contents and behavior retained. |
| `src/styles.css` | Scoped orange active underline for header dropdown triggers. |
| `tests/navbar.test.cjs`, `tests/e2e/navbar.spec.ts` | Order, routes, duplicate prevention, dropdown behavior, active state, spacing, overflow, currency persistence and sign-in navigation checks. |
| Existing navigation browser suites | Updated expectations for the restored Join Us menu, expandable More and 1280px breakpoint. |
| `tests/fixtures/migration-parity.json` | Refreshed only this request's header markup and stylesheet baseline; previous task's approved fixture changes remain. |

## Verification

- Final production build: passed (69 generated static pages).
- TypeScript: passed.
- Unit/integration tests: 133 passed, zero failed/skipped/cancelled.
- Targeted ESLint on implementation and navigation tests: passed.
- `git diff --check`: passed.
- Final full Playwright run: 57 passed, zero failed; three development-tunnel
  checks skipped because their separate development environment was not enabled.
  Includes all eight new navbar checks, original page rendering and console
  checks, responsive navigation, currency persistence, authentication navigation,
  existing forms and simulated payment regressions.
- Screenshots reviewed at 1280px desktop and 375px mobile. Dedicated navbar
  checks cover 375, 768, 1024, 1279, 1280, 1440 and 1920px.

The first focused browser run passed seven of eight checks; one outside-click
check at 1920px fired immediately after keyboard opening. The check now waits for
finite animations to settle before clicking outside, as the screenshot checks do.
The corrected 1920px check passed independently and in the final full run.

No reference screenshot was attached in this conversation, so pixel-for-pixel
matching against it cannot be certified. Implementation follows the supplied
order and visual requirements while retaining the existing brand styles.

Local preview: `http://127.0.0.1:3100` while the production test server is running.
Use `npm.cmd run dev` for normal development on this Windows machine; PowerShell
blocks the `npm.ps1` shim. Run `npm.cmd run typecheck`, `npm.cmd test`,
`npm.cmd run build` and `npm.cmd run test:e2e` for verification. Browser tests
expect a running server at port 3100 unless `PLAYWRIGHT_BASE_URL` overrides it.
Development-tunnel checks require their explicitly enabled development server.
