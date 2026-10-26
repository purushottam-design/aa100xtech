import { z } from "zod";

export const influencerCategories = [
  "Technology",
  "Education",
  "Lifestyle",
  "Business",
  "Gaming",
  "Entertainment",
  "News",
  "Vlogging",
  "Fitness",
  "Fashion",
  "Travel",
  "Other",
] as const;
export const applicationPath = "/partners/apply?opportunity=paid-promotion";
export const mediaBucket = "influencer-media";
export const maxImageBytes = 3 * 1024 * 1024;
export const maxUploadBytes = 18 * 1024 * 1024;
export const reviewStatuses = ["pending", "under_review", "approved", "rejected"] as const;
export const publicationStatuses = ["draft", "published", "unpublished"] as const;

export const publicUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  }, "Use a full https:// URL without credentials");
const optionalUrl = z.union([publicUrl, z.literal("")]).default("");
const socialUrl = (hosts: string[]) =>
  optionalUrl.refine(
    (value) =>
      !value ||
      hosts.some(
        (host) => new URL(value).hostname === host || new URL(value).hostname === `www.${host}`,
      ),
    "Use the correct social platform URL",
  );
export const socialSchema = z.object({
  instagram: socialUrl(["instagram.com"]),
  instagram_followers: z.number().int().min(0).max(10_000_000_000).nullable().default(null),
  youtube: socialUrl(["youtube.com", "youtu.be"]),
  youtube_followers: z.number().int().min(0).max(10_000_000_000).nullable().default(null),
  facebook: socialUrl(["facebook.com", "fb.com"]),
  facebook_followers: z.number().int().min(0).max(10_000_000_000).nullable().default(null),
  other: z.array(publicUrl).max(5).default([]),
});
const text = (max: number) => z.string().trim().max(max).default("");
export const influencerApplicationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  display_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  biography: z.string().trim().min(20).max(1200),
  category: z.enum(influencerCategories),
  specialization: text(250),
  audience_location: z.string().trim().min(2).max(250),
  socials: socialSchema.refine(
    (s) => !!(s.instagram || s.youtube || s.facebook || s.other.length),
    "Add at least one social profile",
  ),
  interest: z.enum(["website", "app", "both"]),
  deliverables: z.string().trim().min(20).max(2000),
  expected_terms: z.string().trim().min(10).max(2000),
  previous_collaborations: text(1500),
  portfolio_url: optionalUrl,
  video_urls: z.array(publicUrl).max(5).default([]),
  processing_consent: z.literal(true),
  publication_consent: z.literal(true),
  website: z.string().max(0).optional(),
});
export type InfluencerApplicationInput = z.infer<typeof influencerApplicationSchema>;
export const mediaPathSchema = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/);
export const profileSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  display_name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  category: z.enum(influencerCategories),
  biography: z.string().trim().min(20).max(1200),
  specialization: text(250),
  journey: text(2000),
  achievements: text(1500),
  collaboration_intro: text(1000),
  partnership_description: text(2000),
  socials: socialSchema,
  portfolio_url: optionalUrl,
  profile_image: mediaPathSchema.nullable().default(null),
  cover_image: mediaPathSchema.nullable().default(null),
  gallery: z.array(mediaPathSchema).max(6).default([]),
  video_urls: z.array(publicUrl).max(5).default([]),
  publication_status: z.enum(publicationStatuses),
  consent_confirmed: z.boolean(),
  featured: z.boolean(),
});
export type InfluencerProfile = z.infer<typeof profileSchema> & {
  id: string;
  application_id: string;
  updated_at: string;
};
export type InfluencerApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  status: string;
  influencer_review_status: (typeof reviewStatuses)[number];
  publication_consent: boolean;
  processing_consent: boolean;
  review_note: string | null;
  partnership_type: string | null;
  collaboration_progress: string | null;
  information_request: string | null;
  influencer_data: InfluencerApplicationInput & {
    consent_version?: string;
    profile_image: string | null;
    cover_image: string | null;
    gallery: string[];
  };
  profile: InfluencerProfile | null;
};
export function isPublicInfluencer(
  application: { status: string; influencer_review_status: string; publication_consent: boolean },
  profile: { publication_status: string; consent_confirmed: boolean },
) {
  return (
    application.status === "approved" &&
    application.influencer_review_status === "approved" &&
    application.publication_consent &&
    profile.consent_confirmed &&
    profile.publication_status === "published"
  );
}
export function mediaUrl(path: string | null | undefined) {
  return path ? `/api/influencers/media/${path}` : undefined;
}
export function youtubeEmbed(value: string) {
  try {
    const u = new URL(value);
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : ["youtube.com", "www.youtube.com"].includes(u.hostname)
          ? (u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1])
          : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}
