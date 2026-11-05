import "server-only";
import { IciciPaymentError } from "./icici.server";

export type IciciOriginDiagnostics = {
  configured: string;
  request: string | null;
  transport: string;
  source: "request-url" | "trusted-proxy";
};

function forwardedOrigin(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto");
  // Only a single, proxy-overwritten pair is supported. Never pick an entry
  // from a client-controlled chain or infer HTTPS when the protocol is absent.
  if (!host || protocol !== "https" || /[\s,/@\\?#%]/.test(host)) return null;
  try {
    const url = new URL(`https://${host}`);
    const callback = new URL(process.env["ICICI_RETURN_URL"]?.trim() ?? "");
    // Resolve only the pinned public origin, including the port. Even with
    // proxy trust enabled, unrelated forwarding must never become a CSRF origin.
    if (
      callback.protocol !== "https:" ||
      callback.username ||
      callback.password ||
      url.origin !== callback.origin ||
      ![url.host, `${url.hostname}:443`].includes(host.toLowerCase())
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function forwardingFailure(request: Request): string {
  const host = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto");
  if (!host || !protocol)
    return "Trusted proxy forwarding headers are missing. A single HTTPS x-forwarded-host and x-forwarded-proto pair must match ICICI_RETURN_URL.";
  if (host.includes(",") || protocol.includes(","))
    return "Duplicate or chained proxy forwarding headers are rejected. The trusted proxy must supply one host and one HTTPS protocol matching ICICI_RETURN_URL.";
  if (protocol !== "https")
    return "Request forwarding protocol is not HTTPS. Open the configured HTTPS ICICI_RETURN_URL origin through the trusted proxy; direct HTTP localhost access cannot enable this HTTPS configuration.";
  return "Trusted proxy forwarded host is invalid or does not match the HTTPS origin of ICICI_RETURN_URL.";
}

export function iciciRequestOrigin(request: Request): string | null {
  // This opt-in is an infrastructure trust boundary: the app must be reachable
  // only through a proxy that strips/overwrites incoming forwarding headers.
  // A Route Handler's Request has no authenticated socket peer information.
  const trustedProxy = process.env["ICICI_TRUST_PROXY"]?.trim() === "true";
  // Next.js 16 constructs request.url (and nextUrl) using the internal server
  // hostname. Neither URL is evidence of the external TLS origin behind ngrok.
  return trustedProxy ? forwardedOrigin(request) : new URL(request.url).origin;
}

export function assertIciciOrigin(request: Request, configured: string) {
  const transport = new URL(request.url).origin;
  const origin = iciciRequestOrigin(request);
  const origins: IciciOriginDiagnostics = {
    configured,
    request: origin,
    transport,
    source: process.env["ICICI_TRUST_PROXY"]?.trim() === "true" ? "trusted-proxy" : "request-url",
  };
  const localDevelopment =
    process.env["NODE_ENV"] === "development" &&
    process.env["ICICI_RETURN_URL"]?.trim() === "http://localhost:3000/consultation" &&
    configured === "http://localhost:3000";
  if (!origin || (!localDevelopment && !origin.startsWith("https://")) || origin !== configured)
    throw new IciciPaymentError(
      "ICICI_WRONG_ORIGIN",
      !origin
        ? forwardingFailure(request)
        : "Request origin must match the HTTPS origin of ICICI_RETURN_URL. Browse the configured HTTPS website or UAT tunnel.",
      403,
      { origins },
    );
  return origins;
}
