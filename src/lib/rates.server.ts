export type RatesPayload = {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
  stale: boolean;
};

let cache: { payload: RatesPayload; fetchedAt: number } | null = null;
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/** Live INR-based exchange rates. No API key required; falls back to last good data. */
export async function loadRates(): Promise<RatesPayload> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.payload;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/INR", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`rates http ${res.status}`);
    const json = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (json.result !== "success" || !json.rates) throw new Error("rates payload invalid");

    const payload: RatesPayload = {
      base: "INR",
      rates: json.rates,
      updatedAt: json.time_last_update_utc ?? new Date().toISOString(),
      stale: false,
    };
    cache = { payload, fetchedAt: now };
    return payload;
  } catch (error) {
    console.error("exchange rate fetch failed", error);
    if (cache) return { ...cache.payload, stale: true };
    // No rates available: consumers keep showing base-currency prices.
    return { base: "INR", rates: { INR: 1 }, updatedAt: new Date().toISOString(), stale: true };
  }
}
