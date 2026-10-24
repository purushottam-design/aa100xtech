# Components, navigation, assets, and PWA migration

The existing component markup, text, CSS classes, icons, layouts, form handlers,
and animations remain in place. No design system or page content was replaced.

- Component navigation now imports `src/lib/navigation.tsx`. Its links render
  Next.js `Link` and its navigation hooks use `next/navigation`; there is no
  second router or client-side route registry. Existing `to`, dynamic `params`,
  `search`, active classes, and replace navigation retain their destinations.
  Anchor props and refs still reach the underlying link for Radix `asChild`.
- Interactive components and hooks have client boundaries where they use React
  hooks or contexts. Browser APIs remain in existing effects and event handlers.
- The currency provider calls the migrated exchange-rate client directly. The
  query key, retries, cache lifetime, persisted currency selection, conversion,
  and price formatting are unchanged.
- Consultation payment debug checks use `process.env.NODE_ENV` in place of
  Vite's `import.meta.env.DEV`. Razorpay loading and payment logic are unchanged.
- All four existing image assets referenced by Lovable asset manifests were
  copied from the public live website to `public/__l5e/assets-v1/` at the exact
  existing URL paths. Downloaded byte counts match each original manifest:
  transparent logo 100,061; full logo 103,890; logo 38,688; founder image 564,294.
  Existing image imports, dimensions, classes, and URLs are preserved.
- The service worker uses a new cache version so an old Vite shell is discarded.
  It caches immutable Next.js static JavaScript and CSS for offline reloads while
  bypassing other framework endpoints, RSC/prefetch traffic, and API requests,
  preventing HTML offline fallbacks from corrupting Next.js navigation data or
  private RPC responses. Normal HTML caching, installation, notification
  messages, push events, and notification-click navigation remain available.

## Verification

`node --test tests/next-navigation.test.cjs` passes seven focused checks for dynamic
and query URL encoding, replace/push behavior, active link classes and forwarded
refs, path-segment matching, service-worker RSC/API bypass, offline JS/CSS cache
fallback, and ordinary HTML caching. These tests use the real migration adapter and worker without network
requests or database writes.

`tsc --noEmit --pretty false` passed after the migration's backend type fixes.
Payment checkout, notifications, file upload, and full browser interactions still
require integration/browser verification; these focused tests do not claim to
exercise external services.
