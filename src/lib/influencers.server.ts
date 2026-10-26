import "server-only";
import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import type { InfluencerProfile } from "./influencers";

export const publicProfileColumns =
  "id,application_id,slug,display_name,city,state,category,biography,specialization,journey,achievements,collaboration_intro,partnership_description,socials,portfolio_url,profile_image,cover_image,gallery,video_urls,publication_status,consent_confirmed,featured,updated_at";
export function publicInfluencerClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Influencer directory is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_publishable_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        return fetch(input, { ...init, headers, cache: "no-store" });
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
        .order("display_name")
        .order("id")
        .range(offset, offset + 199);
      if (error) throw error;
      profiles.push(...((data ?? []) as unknown as InfluencerProfile[]));
      if (!data || data.length < 200) break;
    }
    return { profiles, unavailable: false };
  } catch (error) {
    console.error(
      "[Influencers] Directory read failed",
      error instanceof Error ? error.message : "Database unavailable",
    );
    return { profiles: [], unavailable: true };
  }
}
export async function getPublishedInfluencer(slug: string): Promise<InfluencerProfile | null> {
  noStore();
  const { data, error } = await publicInfluencerClient()
    .from("influencer_profiles")
    .select(publicProfileColumns)
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  if (error)
    throw new Error(
      "The influencer directory is temporarily unavailable. Please try again shortly.",
    );
  return data as InfluencerProfile | null;
}
