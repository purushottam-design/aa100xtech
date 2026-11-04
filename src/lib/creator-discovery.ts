import type { InfluencerProfile } from "./influencers";
import { creatorCategories } from "@/data/influencer-marketing";

export type CreatorListing = Pick<
  InfluencerProfile,
  | "id"
  | "slug"
  | "display_name"
  | "city"
  | "state"
  | "category"
  | "biography"
  | "specialization"
  | "socials"
  | "profile_image"
  | "featured"
>;
export type CreatorFilters = {
  search?: string;
  platform?: string;
  location?: string;
  category?: string;
  followers?: string;
};
export const followerRanges = [
  { id: "under-10k", label: "Under 10K", min: 0, max: 10_000 },
  { id: "10k-50k", label: "10K–50K", min: 10_000, max: 50_000 },
  { id: "50k-100k", label: "50K–100K", min: 50_000, max: 100_000 },
  { id: "100k-500k", label: "100K–500K", min: 100_000, max: 500_000 },
  { id: "500k-1m", label: "500K–1M", min: 500_000, max: 1_000_000 },
  { id: "1m-plus", label: "1M+", min: 1_000_000, max: Infinity },
] as const;

export function creatorListing(profile: InfluencerProfile): CreatorListing {
  const {
    id,
    slug,
    display_name,
    city,
    state,
    category,
    biography,
    specialization,
    socials,
    profile_image,
    featured,
  } = profile;
  return {
    id,
    slug,
    display_name,
    city,
    state,
    category,
    biography,
    specialization,
    socials,
    profile_image,
    featured,
  };
}

export function filterCreators<T extends CreatorListing>(profiles: T[], filters: CreatorFilters) {
  const search = filters.search?.trim().toLowerCase() ?? "";
  const location = filters.location?.trim().toLowerCase() ?? "";
  const group = creatorCategories.find((category) => category.id === filters.category);
  const range = followerRanges.find((item) => item.id === filters.followers);
  return profiles.filter((profile) => {
    const niche = `${profile.category} ${profile.specialization}`.toLowerCase();
    const publicText =
      `${profile.display_name} ${niche} ${profile.city}, ${profile.state} ${profile.biography}`.toLowerCase();
    if (search && !publicText.includes(search)) return false;
    if (
      location &&
      !`${profile.city}, ${profile.state} ${profile.biography}`.toLowerCase().includes(location)
    )
      return false;
    if (
      group
        ? !group.keywords.some((keyword) => niche.includes(keyword))
        : filters.category && profile.category !== filters.category
    )
      return false;
    const platform = filters.platform;
    if (
      platform === "snapchat" &&
      !profile.socials.other.some((value) => {
        try {
          return /(^|\.)(snapchat\.com|snap\.com)$/.test(new URL(value).hostname);
        } catch {
          return false;
        }
      })
    )
      return false;
    if (platform === "other" && !profile.socials.other.length) return false;
    if (
      platform &&
      !["other", "snapchat"].includes(platform) &&
      !profile.socials[platform as "instagram" | "youtube" | "facebook"]
    )
      return false;
    if (range) {
      const counts =
        platform && ["instagram", "youtube", "facebook"].includes(platform)
          ? [
              profile.socials[
                `${platform}_followers` as
                  "instagram_followers" | "youtube_followers" | "facebook_followers"
              ],
            ]
          : platform
            ? []
            : [
                profile.socials.instagram_followers,
                profile.socials.youtube_followers,
                profile.socials.facebook_followers,
              ];
      const known = counts.filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      );
      if (!known.length) return false;
      const count = Math.max(...known);
      if (count < range.min || count >= range.max) return false;
    }
    return true;
  });
}
