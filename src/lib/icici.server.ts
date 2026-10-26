import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Supplied reference algorithm, not a verified bank protocol adapter.
 * Sort top-level keys only, retain nested JSON order, omit null/undefined,
 * exclude secureHash and emit lowercase hex from UTF-8 HMAC-SHA256.
 * Do not use for real requests/callbacks until the merchant's ICICI kit and
 * bank-issued request/response vectors confirm these exact rules.
 */
export function generateSecureHash(requestObj: Record<string, unknown>, secretKey: string): string {
  if (!secretKey) throw new Error("An ICICI signing secret is required");
  const sorted: Record<string, unknown> = Object.create(null);
  Object.keys(requestObj)
    .sort()
    .forEach((key) => {
      sorted[key] = requestObj[key];
    });
  let hashText = "";
  Object.keys(sorted).forEach((key) => {
    if (key === "secureHash") return;
    const value = sorted[key];
    if (value !== null && typeof value === "object") hashText += JSON.stringify(value);
    else if (value !== undefined && value !== null) hashText += String(value);
  });
  return createHmac("sha256", secretKey).update(hashText, "utf8").digest("hex");
}

/** Reference comparison helper only. This does not authenticate a bank callback. */
export function verifyReferenceSecureHash(
  requestObj: Record<string, unknown>,
  hash: string,
  secretKey: string,
): boolean {
  if (!/^[a-f0-9]{64}$/.test(hash) || !secretKey) return false;
  const expected = Buffer.from(generateSecureHash(requestObj, secretKey), "hex");
  const provided = Buffer.from(hash, "hex");
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

// An environment variable must not turn an unverified integration into a live
// payment option. Replace this gate only with a reviewed, sandbox-tested adapter.
export function iciciUnavailableResponse(): Response {
  return Response.json(
    {
      ok: false,
      code: "ICICI_INTEGRATION_NOT_VERIFIED",
      message: "ICICI Bank payments are currently unavailable. Please choose Razorpay.",
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}
export function assertPaymentOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("x-aa-rpc") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  )
    return Response.json(
      { ok: false, error: "Cross-site request rejected." },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  return null;
}
