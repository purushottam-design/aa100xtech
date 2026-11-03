# HTTPS development tunnel

Use the existing tunnel and the isolated development command:

```powershell
npm.cmd run dev:ngrok
# In the existing ngrok terminal, if the agent needs restarting:
ngrok http http://127.0.0.1:3000 --url https://tractor-nautical-snowbird.ngrok-free.dev
```

The existing agent was confirmed to forward this HTTPS hostname to
`http://localhost:3000`; it also works with the loopback-bound development
server. Do not run two Next.js servers on port 3000. Visit the HTTPS homepage
and accept ngrok's Visit Site prompt when shown. This is ngrok consent, not
application authentication. Normal localhost access remains available.

If using regular `npm.cmd run dev` with a separately running ngrok agent,
set this in the git-ignored `.env.development.local` file:

```dotenv
DEV_TUNNEL_ORIGIN=https://tractor-nautical-snowbird.ngrok-free.dev
ICICI_TRUST_PROXY=true
```

Next.js loads this file before `.env.local` and `.env` during development.
Without the setting, booking RPC POSTs from ngrok receive `403 Cross-site
request rejected` because the internal request URL uses localhost. The setting
accepts only the exact configured HTTPS forwarding pair and still checks the
browser Origin, custom RPC header and Fetch Metadata. Production ignores it.
Keep the development backend private. Restart the dev server if it does not
reload the environment change. `npm run dev` binds to `127.0.0.1` so the trusted
proxy backend is private. ICICI forwarding must match the HTTPS origin of the
existing `ICICI_RETURN_URL`; neither request.url nor nextUrl.origin reliably
represents the external origin in Next.js 16.

## Findings and fixes (2026-11-02)

- **HMR:** the Next.js log explicitly blocked `/_next/hmr` from
  `tractor-nautical-snowbird.ngrok-free.dev`. ngrok surfaced a failed upgrade
  as HTTP 503. Adding that exact hostname to `allowedDevOrigins` restores
  WebSocket frames. All previous Next.js settings remain intact; no wildcard
  or global host-header trust was added.
- **Font:** `/__nextjs_font/geist-latin.woff2` was blocked by the same Next.js
  development-origin guard (403). It is the Next.js development UI font;
  website typography is Inter. The origin fix returns `font/woff2` with a
  `wOF2` signature. An unrelated Origin still receives 403. No font or site
  styling was replaced.
- **Manifest:** the public manifest was already valid JSON. A browser-like,
  credentialless request through ngrok returned HTTP 200 **HTML** with
  `ERR_NGROK_6024`, causing the JSON syntax error. The layout now emits one
  manifest link with `crossorigin="use-credentials"` so ngrok's consent cookie
  accompanies the request. The manifest's content, scope, icons and install
  behavior remain unchanged. Do not put warning-bypass headers or credentials
  into application bundles.
- **Counters and consultation link:** counters initialized to zero during SSR;
  the floating consultation link returned null until a mount effect ran. Slow
  development-script loading over the tunnel exposed that initial HTML.
  Counters now server-render `200+`, `98%`, `24/7`, then run the same 1,400 ms
  cubic count-up on intersection. The consultation link server-renders its
  existing markup. No classes, animations, breakpoints or layout were changed.
- **Authentication:** the header intentionally waits for the browser session.
  After hydration, fresh anonymous contexts on both origins render the same
  Sign in / Sign up control. Supabase uses origin-scoped storage outside
  Lovable previews, so signing in on localhost does not sign in on ngrok.
  Currency preferences are also origin-scoped. Authentication and session
  storage have not been weakened or shared across domains.
- **RPC requests:** browser POSTs from the tunnel were rejected because
  `request.url` described an internal HTTPS localhost upstream. The explicit
  development-only `DEV_TUNNEL_ORIGIN` setting accepts the agent's single,
  matching HTTPS forwarding pair before comparing browser Origin. This
  restores normal authenticated routing: an anonymous protected call now
  reaches authentication and returns **401**, while an attacker Origin,
  malformed forwarding, or missing custom RPC header remains **403**.
- **Middleware/proxy/cache:** there is no application `middleware.ts` or
  `proxy.ts`, no rewrite or `assetPrefix` causing these failures. The Supabase
  `auth-middleware.ts` file is an RPC authentication helper. The service worker
  already excludes API, RSC and nonstatic Next.js endpoints; it was not the HMR
  origin blocker. No service-worker or authentication middleware change was
  needed.

The installed Next.js 16.4.3 guides under `node_modules/next/dist/docs/` were
checked, along with the official [allowedDevOrigins documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins),
[ngrok interstitial documentation](https://ngrok.com/docs/pricing-limits/free-plan-limits#removing-the-interstitial-page)
and [credentialed manifest requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest#deploying_a_manifest).

## Separate local ICICI UAT settings

`npm run dev:ngrok` sets these values in its child process:

```dotenv
NODE_ENV=development
DEV_TUNNEL_ORIGIN=https://tractor-nautical-snowbird.ngrok-free.dev
ICICI_RETURN_URL=https://tractor-nautical-snowbird.ngrok-free.dev/api/payments/icici/callback
ICICI_TRUST_PROXY=true
```

The launcher binds Next.js to `127.0.0.1:3000`. Keep that backend private and
expose it through the trusted ngrok agent. Forwarded headers do not identify
an authenticated socket peer; loopback binding is the trust boundary. Spoofed
or appended forwarding chains were probed through the real tunnel and remained
unavailable. The RPC tunnel setting is ignored in production.

For ordinary `npm run dev`, the git-ignored `.env.development.local` enables
`ICICI_TRUST_PROXY=true` and the existing local callback URL remains
`https://tractor-nautical-snowbird.ngrok-free.dev/api/payments/icici/callback`.
This development-only override is ignored by build and start. The default
`ICICI_TRUST_PROXY=false` in `.env` and deployment settings are unchanged.
The production domain, canonical
URLs, Razorpay handlers and payment verification remain unchanged. Only the
UAT bank adapter is supported; this does not activate live ICICI payments.

```powershell
curl.exe -sS https://tractor-nautical-snowbird.ngrok-free.dev/api/payments/icici/availability
```

The verified development response reports equal configured/request HTTPS
origins and `source: "trusted-proxy"`. Anonymous callers currently receive
`ICICI_UAT_TEST_ACCESS_REQUIRED`, because controlled test mode and its verified
super-admin requirement remain enabled. `available:false` is expected for an
anonymous tester, even with correct origins. A super admin's browser sends its
existing session automatically. Register the new callback with ICICI before
attempting bank testing. No charge or bank transaction was attempted.

## Reproduce checks

```powershell
npm.cmd test
npm.cmd run typecheck
$env:VERIFY_DEV_TUNNEL = 'true'
$env:PLAYWRIGHT_BASE_URL = 'https://tractor-nautical-snowbird.ngrok-free.dev'
# On a network using an installed corporate root CA, retain TLS verification:
$env:NODE_OPTIONS = '--use-system-ca'
npx.cmd playwright test tests/e2e/development-tunnel.spec.ts
```

Run the browser suite again with `PLAYWRIGHT_BASE_URL=http://localhost:3000`
to compare the same desktop/mobile flows. It checks HMR frames, font bytes,
credentialed manifest JSON, counters, hydration errors, sign-in visibility,
consultation navigation, responsive overflow, unauthorized versus cross-site
rejection, and HTML rendering without JavaScript. No test creates a booking,
signs in a real user, or starts a payment.
