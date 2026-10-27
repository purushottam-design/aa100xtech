import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type IciciSigningMode = "sorted-fields" | "json-v2";
export type BankPayload = Record<string, unknown>;

/** Secure_Hash_Functions_Reference, Node.js p3. Unknown fields participate. */
export function signSortedFields(payload: BankPayload, secret: string): string {
  if (!secret) throw new Error("An ICICI signing secret is required");
  let text = "";
  for (const name of Object.keys(payload).sort()) {
    if (name === "secureHash") continue;
    const value = payload[name];
    if (value === null || value === undefined) continue;
    text += typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  return createHmac("sha256", secret).update(text, "utf8").digest("hex");
}

/** Interface v0.5 p68. Sign exactly this minified JSON; no signature field. */
export function signMinifiedJson(payload: BankPayload, secret: string) {
  if (!secret) throw new Error("An ICICI signing secret is required");
  if (Object.hasOwn(payload, "secureHash"))
    throw new Error("JSON v2 payload must not contain a body signature");
  const body = JSON.stringify(payload);
  return { body, hash: createHmac("sha256", secret).update(body, "utf8").digest("hex") };
}

export function sameHash(expected: string, received: unknown): boolean {
  if (typeof received !== "string" || !/^[a-f0-9]{64}$/.test(received)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}

export function signedJson(payload: BankPayload, secret: string, mode: IciciSigningMode) {
  if (mode === "json-v2") {
    const { body, hash } = signMinifiedJson(payload, secret);
    return { body, headers: { "content-type": "application/json", securehash: hash } };
  }
  return {
    body: JSON.stringify({ ...payload, secureHash: signSortedFields(payload, secret) }),
    headers: { "content-type": "application/json" },
  };
}

export function verifyJsonResponse(
  payload: BankPayload,
  headers: Headers,
  secret: string,
  mode: IciciSigningMode,
): boolean {
  if (mode === "json-v2") {
    if (Object.hasOwn(payload, "secureHash")) return false;
    return sameHash(signMinifiedJson(payload, secret).hash, headers.get("securehash"));
  }
  return sameHash(signSortedFields(payload, secret), payload["secureHash"]);
}
