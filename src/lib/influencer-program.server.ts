import "server-only";
import { listPublishedInfluencers, publicInfluencerClient } from "./influencers.server";
import { rankInfluencers, type PartnerStats, type PartnerTestimonial } from "./influencer-program";

export async function getInfluencerProgram() {
  const directory = await listPublishedInfluencers();
  if (directory.unavailable || !directory.profiles.length)
    return {
      ...directory,
      partners: [],
      testimonials: [],
      rankingsUnavailable: directory.unavailable,
      testimonialsUnavailable: directory.unavailable,
    };
  const client = publicInfluencerClient();
  let statistics: PartnerStats[] = [];
  let testimonials: PartnerTestimonial[] = [];
  let rankingsUnavailable = false;
  let testimonialsUnavailable = false;
  try {
    for (let offset = 0; ; offset += 200) {
      const { data, error } = await client
        .rpc("get_influencer_partner_stats", {})
        .order("profile_id")
        .range(offset, offset + 199)
        .abortSignal(AbortSignal.timeout(8000));
      if (error) throw error;
      statistics.push(...(data ?? []));
      if (!data || data.length < 200) break;
    }
  } catch {
    rankingsUnavailable = true;
    statistics = [];
    console.warn(
      "[Influencer program] Verified rankings unavailable; check program schema and server access.",
    );
  }
  try {
    const { data, error } = await client
      .from("influencer_testimonials")
      .select("id,profile_id,quote,created_at")
      .eq("publication_status", "published")
      .eq("consent_confirmed", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .abortSignal(AbortSignal.timeout(8000));
    if (error) throw error;
    const visible = new Set(directory.profiles.map((profile) => profile.id));
    testimonials = (data ?? []).filter((row) => visible.has(row.profile_id));
  } catch {
    testimonialsUnavailable = true;
    console.warn(
      "[Influencer program] Approved stories unavailable; check program schema and server access.",
    );
  }
  const partners = rankInfluencers(directory.profiles, statistics);
  if (partners.length !== directory.profiles.length) rankingsUnavailable = true;
  return {
    ...directory,
    partners: rankingsUnavailable ? [] : partners,
    testimonials,
    rankingsUnavailable,
    testimonialsUnavailable,
  };
}
