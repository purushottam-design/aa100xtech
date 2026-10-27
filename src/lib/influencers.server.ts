import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import type { InfluencerProfile } from "./influencers";
import type { InfluencerDatabase } from "./influencer-database.server";

export class InfluencerDirectoryUnavailableError extends Error {
  constructor() {
    super("The influencer directory is temporarily unavailable. Please try again shortly.");
    this.name = "InfluencerDirectoryUnavailableError";
  }
}

const warningTimes = new Map<string, number>();
function reportReadFailure(error: unknown) {
  const failure = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    cause?: unknown;
  } | null;
  const code = typeof failure?.code === "string" ? failure.code : "";
  // Inspect SDK errors (which are often plain objects), but never log raw
  // messages, details, request URLs, headers or environment values.
  const description = [failure?.message, failure?.details, String(failure?.cause ?? "")].join(" ");
  let reason = "connection";
  let action = "Check Supabase availability and the server network connection.";
  if (code === "PGRST205" || code === "42P01" || code === "42703" || code === "PGRST204") {
    reason = "schema";
    action =
      "Apply supabase/migrations/20261026090000_influencer_partnership.sql to the configured project; verify its API schema cache.";
  } else if (code === "42501") {
    reason = "permissions";
    action = "Verify the migration's SELECT grants and publication/consent RLS policy.";
  } else if (/Invalid API key|Invalid JWT/i.test(description) || /^PGRST30[123]$/.test(code)) {
    reason = "credentials";
    action = "Verify SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY belong to the same active project.";
  } else if (/not configured/.test(description)) {
    reason = "configuration";
    action = "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the server environment.";
  } else if (
    /UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT|unable to verify|certificate/i.test(
      description,
    )
  ) {
    reason = "tls";
    action =
      "Configure Node to trust the system or organization CA; keep TLS verification enabled.";
  } else if (/TimeoutError|AbortError|timed out|aborted/i.test(description)) {
    reason = "timeout";
    action = "The Supabase request timed out; retry on the next page request.";
  }
  const now = Date.now();
  const lastWarning = warningTimes.get(reason);
  if (lastWarning === undefined || now - lastWarning >= 300_000) {
    warningTimes.set(reason, now);
    // Expected availability failures should not create Next.js error overlays.
    console.warn(`[Influencers] Public read unavailable (${reason}). ${action}`);
  }
}

export const publicProfileColumns =
  "id,application_id,slug,display_name,city,state,category,biography,specialization,journey,achievements,collaboration_intro,partnership_description,socials,portfolio_url,profile_image,cover_image,gallery,video_urls,publication_status,consent_confirmed,featured,updated_at";
export function publicInfluencerClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Influencer directory is not configured");
  return createClient<InfluencerDatabase>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith("sb_publishable_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
        return fetch(input, {
          ...init,
          headers,
          cache: "no-store",
          signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(8_000)])
            : AbortSignal.timeout(8_000),
        });
      },
    },
  });
}
export async function listPublishedInfluencers(): Promise<{
  profiles: InfluencerProfile[];
  unavailable: boolean;
}> {
  noStore();
  try {
    const client = publicInfluencerClient();
    const profiles: InfluencerProfile[] = [];
    for (let offset = 0; ; offset += 200) {
      const { data, error } = await client
        .from("influencer_profiles")
        .select(publicProfileColumns)
        .eq("publication_status", "published")
        .abortSignal(AbortSignal.timeout(8_000))
        .order("display_name")
        .order("id")
        .range(offset, offset + 199);
      if (error) throw error;
      profiles.push(...((data ?? []) as unknown as InfluencerProfile[]));
      if (!data || data.length < 200) break;
    }
    return { profiles, unavailable: false };
  } catch (error) {
    reportReadFailure(error);
    return { profiles: [], unavailable: true };
  }
}
export async function getPublishedInfluencer(slug: string): Promise<InfluencerProfile | null> {
  noStore();
  try {
    const { data, error } = await publicInfluencerClient()
      .from("influencer_profiles")
      .select(publicProfileColumns)
      .eq("slug", slug)
      .eq("publication_status", "published")
      .abortSignal(AbortSignal.timeout(8_000))
      .maybeSingle();
    if (error) throw error;
    return data as InfluencerProfile | null;
  } catch (error) {
    reportReadFailure(error);
    throw new InfluencerDirectoryUnavailableError();
  }
}
