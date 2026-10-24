import "server-only";
import { createHash, randomBytes } from "crypto";

export type CommissionRule = {
  default_commission_type: string;
  default_commission_value: number;
  tiers: Array<{ min_order_value?: number; type?: string; value?: number }> | unknown;
};

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const salt = process.env["AFFILIATE_IP_SALT"] ?? "aa100x-static-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 48);
}

export function deviceFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const value = ua.toLowerCase();
  if (/ipad|tablet/.test(value)) return "tablet";
  if (/mobi|android|iphone/.test(value)) return "mobile";
  return "desktop";
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomToken(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

/** Affiliate ID used in links: AA100X-<8 chars> */
export function buildAffiliateCode(): string {
  return `AA100X-${randomToken(8)}`;
}

/** Coupon code: AA100-<NAME><random> e.g. AA100-JOHN25 */
export function buildCouponCode(fullName: string): string {
  const name =
    (fullName || "PARTNER")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 6) || "PARTNER";
  return `AA100-${name}${randomToken(3)}`;
}

export function buildLinkSlug(): string {
  return randomToken(10).toLowerCase();
}

export function calculateCommission(input: {
  orderValue: number;
  item: CommissionRule | null;
  affiliate: { custom_commission_type: string | null; custom_commission_value: number | null };
}): number {
  const { orderValue, item, affiliate } = input;

  let type = item?.default_commission_type ?? "percent";
  let value = Number(item?.default_commission_value ?? 0);

  // Tiered rules on the catalog item (highest matching min_order_value wins)
  const tiers = Array.isArray(item?.tiers) ? (item!.tiers as Array<Record<string, unknown>>) : [];
  const matched = tiers
    .filter((t) => orderValue >= Number(t["min_order_value"] ?? 0))
    .sort((a, b) => Number(a["min_order_value"] ?? 0) - Number(b["min_order_value"] ?? 0))
    .pop();
  if (matched) {
    type = String(matched["type"] ?? type);
    value = Number(matched["value"] ?? value);
  }

  // Affiliate-level override always wins
  if (affiliate.custom_commission_value != null) {
    type = affiliate.custom_commission_type ?? "percent";
    value = Number(affiliate.custom_commission_value);
  }

  const amount = type === "flat" ? value : (orderValue * value) / 100;
  return Math.max(0, Math.round(amount * 100) / 100);
}

export function jsonResponse(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, x-api-key",
      "access-control-allow-methods": "POST, OPTIONS",
      ...extraHeaders,
    },
  });
}

export function isValidApiKey(request: Request): boolean {
  const expected = process.env["AFFILIATE_API_KEY"];
  if (!expected) return false;
  const provided = request.headers.get("x-api-key") ?? "";
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1)
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
