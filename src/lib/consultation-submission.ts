export const consultationAttemptStorageKey = "consultation-booking-attempt-v1";
export type ConsultationAttempt = { fingerprint: string; key: string };

/** Store only a request digest and random key, never the customer's form. */
export async function consultationAttempt(
  serialized: string,
  previous: ConsultationAttempt | null,
): Promise<ConsultationAttempt> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(serialized));
  const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (previous?.fingerprint === fingerprint) return previous;
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(consultationAttemptStorageKey) ?? "null",
    ) as ConsultationAttempt | null;
    if (
      stored?.fingerprint === fingerprint &&
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(stored.key)
    )
      return stored;
  } catch {
    /* In-memory retry protection still works when storage is unavailable. */
  }
  const attempt = { fingerprint, key: crypto.randomUUID() };
  try {
    sessionStorage.setItem(consultationAttemptStorageKey, JSON.stringify(attempt));
  } catch {
    /* use the ref */
  }
  return attempt;
}

export function clearConsultationAttempt() {
  try {
    sessionStorage.removeItem(consultationAttemptStorageKey);
  } catch {
    /* storage unavailable */
  }
}
