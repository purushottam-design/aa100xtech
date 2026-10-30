import { z } from "zod";
import { mediaUrl, type InfluencerProfile } from "./influencers";

export const partnerLevels = [
  {
    name: "Starter Partner",
    min: 0,
    max: 2,
    range: "0–2",
    description: "Make your first meaningful introductions.",
  },
  {
    name: "Growth Partner",
    min: 3,
    max: 5,
    range: "3–5",
    description: "Build momentum through trusted connections.",
  },
  {
    name: "Pro Partner",
    min: 6,
    max: 10,
    range: "6–10",
    description: "Turn consistent collaboration into lasting impact.",
  },
  {
    name: "Elite Partner",
    min: 11,
    max: Infinity,
    range: "11+",
    description: "Lead the way. Set the standard for what comes next.",
  },
] as const;

export type PartnerLevel = (typeof partnerLevels)[number]["name"];
export function partnerLevel(convertedClients: number): PartnerLevel {
  return (
    partnerLevels.find((level) => convertedClients >= level.min && convertedClients <= level.max)
      ?.name ?? "Starter Partner"
  );
}

export function primaryPlatform(profile: InfluencerProfile) {
  const platforms = [
    ["instagram", "Instagram", profile.socials.instagram],
    ["youtube", "YouTube", profile.socials.youtube],
    ["facebook", "Facebook", profile.socials.facebook],
    ["other", "Creator", profile.socials.other?.[0]],
  ] as const;
  return (
    platforms.find(([key, , url]) => key === profile.socials.primary && url) ??
    platforms.find(([, , url]) => url) ??
    (["other", "Creator", ""] as const)
  );
}

export type PartnerStats = {
  profile_id: string;
  converted_clients: number;
  total_leads: number;
  created_at: string;
};
export type RankedInfluencer = {
  id: string;
  name: string;
  profileImage: string | null;
  platform: string;
  profileUrl: string;
  totalLeads: number;
  convertedClients: number;
  partnerLevel: PartnerLevel;
  featured: boolean;
  createdAt: string;
  rank: number;
  profile: InfluencerProfile;
};
export type PartnerTestimonial = {
  id: string;
  profile_id: string;
  quote: string;
  created_at: string;
};

/** Rank verified clients only. No manual featured flag, audience count or lead count participates. */
export function rankInfluencers(
  profiles: InfluencerProfile[],
  statistics: PartnerStats[],
): RankedInfluencer[] {
  const stats = new Map(statistics.map((row) => [row.profile_id, row]));
  return profiles
    .flatMap((profile) => {
      const row = stats.get(profile.id);
      if (
        !row ||
        !Number.isSafeInteger(row.converted_clients) ||
        row.converted_clients < 0 ||
        !Number.isSafeInteger(row.total_leads) ||
        row.total_leads < row.converted_clients ||
        !Number.isFinite(Date.parse(row.created_at))
      )
        return [];
      return [{ profile, row }];
    })
    .sort(
      (a, b) =>
        b.row.converted_clients - a.row.converted_clients ||
        Date.parse(a.row.created_at) - Date.parse(b.row.created_at) ||
        a.profile.id.localeCompare(b.profile.id),
    )
    .map(({ profile, row }, index) => ({
      id: profile.id,
      name: profile.display_name,
      profileImage: mediaUrl(profile.profile_image) ?? null,
      platform: primaryPlatform(profile)[1],
      profileUrl: `/influencers/${profile.slug}`,
      totalLeads: row.total_leads,
      convertedClients: row.converted_clients,
      partnerLevel: partnerLevel(row.converted_clients),
      featured: index === 0,
      createdAt: row.created_at,
      rank: index + 1,
      profile,
    }));
}

export const referralStatuses = ["pending", "converted", "rejected", "reversed"] as const;
export type PartnerReferral = {
  id: string;
  profile_id: string;
  client_reference: string;
  evidence_reference: string;
  status: (typeof referralStatuses)[number];
  confirmed_at: string | null;
  created_at: string;
};
export const programUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("referral"),
    profileId: z.string().uuid(),
    clientReference: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9][a-z0-9._:-]{2,99}$/,
        "Use a stable CRM client ID, without personal contact details",
      ),
    evidenceReference: z.string().trim().max(250).default(""),
    status: z.enum(referralStatuses),
    confirmationReviewed: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("testimonial"),
    profileId: z.string().uuid(),
    quote: z.string().trim().min(20).max(600),
    publicationStatus: z.enum(["draft", "published", "unpublished"]),
    consentConfirmed: z.boolean(),
  }),
]);
