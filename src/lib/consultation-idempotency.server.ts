import "server-only";
import { createHash } from "node:crypto";

/** Existing UNIQUE booking_id is the cross-process reservation; no new table. */
export function consultationRequestBookingId(key: string) {
  return `CONS-${createHash("sha256").update(key).digest("hex").slice(0, 24).toUpperCase()}`;
}

export function matchesConsultationRequest(
  stored: Record<string, unknown>,
  requested: Record<string, unknown>,
) {
  return Object.entries(requested).every(([name, value]) => stored[name] === value);
}
