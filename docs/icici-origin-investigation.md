# ICICI origin investigation — 2026-11-04

The reproduced `ICICI_WRONG_ORIGIN` response comes from an HTTP localhost
request while `ICICI_RETURN_URL` requires the configured ngrok HTTPS origin.
The existing pinned proxy resolver accepts that origin when supplied as one
valid HTTPS forwarding pair. No origin-validation relaxation was necessary.

## Actual application headers

For `http://127.0.0.1:3000/api/payments/icici/availability`:

```text
Host: 127.0.0.1:3000
X-Forwarded-Host: 127.0.0.1:3000
X-Forwarded-Proto: http
request.url origin: http://localhost:3000
```

For `http://localhost:3000`, both host headers are `localhost:3000` and the
protocol is still `http`. These headers are not missing or duplicated.
Next.js 16.4.3 `base-server.js` fills absent forwarded host/protocol headers
using Host and the connection protocol. It preserves existing forwarded
values. Its internal request URL uses the server hostname, so that URL alone
does not establish an external TLS origin.

`next.config.ts` already allows only the explicit tunnel hostname for dev
assets. `src/proxy.ts` matches `/consultation` only and handles the optional
local bank POST return. Neither changes availability forwarding headers.
Both files were inspected and left unchanged.

## Changes

- `src/lib/icici-origin.server.ts`: distinguish absent headers, duplicate or
  chained headers, non-HTTPS protocol, and invalid/unexpected forwarded host
  in error messages. Origin resolution and rejection rules remain intact.
- `src/app/api/payments/icici/availability/route.ts`: optional development-only
  `ICICI_ORIGIN_DEBUG=true` diagnostics show only Host, X-Forwarded-Host and
  X-Forwarded-Proto, capped at 256 characters each. The flag is off by default;
  production ignores it. No credentials or arbitrary headers are included.
- `tests/icici-availability.test.cjs`: test duplicate identical header values,
  HTTP localhost diagnosis, credential exclusion and production isolation.
- Git-ignored `.env.development.local`: change the pre-existing
  `ICICI_UAT_GUEST_CHECKOUT=true` override to `false` so controlled local UAT
  requires the existing verified Super Admin authorization. `.env`,
  `.env.local`, production settings and Razorpay were not changed.

## Actual API results

All availability results below use HTTP 200, with readiness in the JSON body.
Requests use the running application and do not initiate bank transactions.

| Request                                            | available | code                           |
| -------------------------------------------------- | --------- | ------------------------------ |
| Direct HTTP localhost                              | false     | ICICI_WRONG_ORIGIN             |
| Local simulated valid pinned proxy pair, anonymous | false     | ICICI_UAT_TEST_ACCESS_REQUIRED |
| Same simulated pair with a forged bearer token     | false     | ICICI_UAT_TEST_ACCESS_REQUIRED |
| Duplicate identical forwarded protocols            | false     | ICICI_WRONG_ORIGIN             |
| Duplicate identical forwarded hosts                | false     | ICICI_WRONG_ORIGIN             |
| Unexpected forwarded host                          | false     | ICICI_WRONG_ORIGIN             |

The actual valid-pair anonymous response after disabling the guest override:

```json
{
  "icici": false,
  "environment": "uat",
  "available": false,
  "code": "ICICI_UAT_TEST_ACCESS_REQUIRED",
  "reason": "Controlled ICICI UAT testing requires a signed-in super administrator.",
  "origins": {
    "configured": "https://tractor-nautical-snowbird.ngrok-free.dev",
    "request": "https://tractor-nautical-snowbird.ngrok-free.dev",
    "transport": "https://localhost:3000",
    "source": "trusted-proxy"
  }
}
```

This simulated forwarding check proves the application passes the pinned
origin to authorization; it is not a successful request through ngrok.
Proxy trust remains an infrastructure opt-in: the backend must stay on
loopback behind an agent that supplies forwarding metadata. Forwarding
headers alone cannot authenticate a network peer in a Route Handler.

## Live tunnel verification after upstream update

The later recheck confirmed an active ngrok tunnel forwarding to
`http://127.0.0.1:3000`. Its first request returned HTTP 502
`ERR_NGROK_8012`: the Next.js port refused connections. Starting the existing
development command on `127.0.0.1:3000` restored application responses.

The real public HTTPS availability request then returned HTTP 200 with
`available:false` and `code:ICICI_UAT_TEST_ACCESS_REQUIRED`. Its configured
and resolved request origins both equal
`https://tractor-nautical-snowbird.ngrok-free.dev`. The application received
exactly the same headers as Traffic Inspector:

```text
Host: tractor-nautical-snowbird.ngrok-free.dev
X-Forwarded-Host: tractor-nautical-snowbird.ngrok-free.dev
X-Forwarded-Proto: https
```

The internal transport origin remains `https://localhost:3000`. This is
Next.js URL reconstruction, not a corrupted public forwarding pair.
The pinned resolver already handles this correctly; no further application
code or proxy configuration change was needed.

Actual requests through the HTTPS tunnel also verified:

| Request                            | Result code                    |
| ---------------------------------- | ------------------------------ |
| Anonymous caller                   | ICICI_UAT_TEST_ACCESS_REQUIRED |
| Forged bearer token                | ICICI_UAT_TEST_ACCESS_REQUIRED |
| Unexpected forwarded host          | ICICI_WRONG_ORIGIN             |
| Duplicate identical forwarded host | ICICI_WRONG_ORIGIN             |
| Injected HTTP forwarded protocol   | ICICI_WRONG_ORIGIN             |
| Injected HTTPS forwarded protocol  | ICICI_WRONG_ORIGIN             |

Traffic Inspector records two protocol values for injection probes. The
application receives `http, https` or `https, https` and rejects both.
Normal forwarding values are not missing, duplicated or overwritten by
Next.js. Evidence without credentials is saved locally in
`.migration/icici-ngrok-live-evidence.json`.

TLS verification remained enabled. The existing user ngrok agent and
production configuration were not changed. The new dev server was launched
with `ICICI_ORIGIN_DEBUG=true` in that process only; this exposes only the
three diagnostic headers above and has no production effect.

## Automated verification and remaining authentication evidence

55 targeted tests passed across backend RPC, ICICI availability, ICICI
authorization, UAT access, ICICI payment processing and payment/Razorpay
regressions. TypeScript and targeted ESLint checks passed. The authorization
tests exercise verified Super Admin database roles with fixture identities;
they reject anonymous, forged-token and other-role callers. A real signed-in
Super Admin session was not available for a live authenticated probe.

The remaining check requires the user's real Super Admin session on the
HTTPS domain. After signing in there, open `/consultation` and capture the
JSON response for `/api/payments/icici/availability` in DevTools Network.
Opening the endpoint directly in a new tab does not send the application's
bearer header. Do not share Authorization headers, cookies or tokens.
