import "server-only";
import { z } from "zod";
import {
  creatorIntakeSchema,
  brandIntakeSchema,
  phone,
  type CreatorIntake,
} from "./marketing-intake";
import { influencerApplicationSchema } from "./influencers";
import { websiteRequestSchema } from "./website-requests";
import { InfluencerRequestError } from "./influencer-upload.server";
import { getPublishedInfluencer } from "./influencers.server";

type PreparedIntake = {
  token: string;
  startedAt: number;
  email: string;
  details: Record<string, unknown>;
  creator: CreatorIntake | null;
};
function readJson(form: FormData, name: string): unknown {
  try {
    return JSON.parse(String(form.get(name)));
  } catch {
    throw new InfluencerRequestError("Invalid form data");
  }
}
function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new InfluencerRequestError(
      result.error.issues[0]?.message ?? "Please check your form details",
    );
  return result.data;
}
// Adapt the existing embedded forms without inventing campaign preferences or
// discarding their original fields. All formats use the same persistence RPC.
export async function prepareMarketingForm(
  form: FormData,
  kind: "creator" | "brand",
): Promise<PreparedIntake> {
  const format = String(form.get("format") ?? "");
  if (format === "partner-application" && kind === "creator") {
    const data = parse(influencerApplicationSchema, readJson(form, "application"));
    parse(phone, data.phone);
    const token = parse(z.string().uuid(), data.submission_id);
    const { submission_id: _id, website: _trap, ...details } = data;
    const socials = data.socials;
    return {
      token,
      startedAt: Number(form.get("startedAt")),
      email: data.email,
      creator: null,
      details: {
        ...details,
        source: "partner-application",
        consent_version: "2026-11-05",
        platforms: [
          socials.instagram && "Instagram",
          socials.youtube && "YouTube",
          socials.facebook && "Facebook",
          socials.other.length && "Other",
        ]
          .filter(Boolean)
          .join(", "),
        handle: socials.instagram || socials.youtube || socials.facebook || socials.other[0],
        media_kit: null,
        profile_image: null,
        cover_image: null,
        gallery: [],
      },
    };
  }
  if (format === "campaign-enquiry" && kind === "brand") {
    const data = parse(websiteRequestSchema, readJson(form, "data"));
    parse(phone, data.phone);
    if (data.kind !== "influencer" || !data.campaign)
      throw new InfluencerRequestError("A valid campaign brief is required");
    if (form.get("privacy") !== "true")
      throw new InfluencerRequestError("Please agree to the Privacy Policy");
    const campaign = data.campaign;
    if (campaign.creator) {
      const profile = await getPublishedInfluencer(campaign.creator.slug);
      if (
        !profile ||
        profile.id !== campaign.creator.id ||
        !profile.consent_confirmed ||
        profile.publication_status !== "published"
      )
        throw new InfluencerRequestError(
          "This creator is no longer available. Please select another creator.",
        );
      campaign.creator.name = profile.display_name;
    }
    return {
      token: data.id,
      startedAt: data.startedAt,
      email: data.email,
      creator: null,
      details: {
        source: "campaign-enquiry",
        company: data.company,
        contact_name: data.name,
        email: data.email,
        phone: data.phone,
        privacy: true,
        consent_version: "2026-11-05",
        company_website: "",
        industry: "",
        location: "",
        objective: "",
        category: campaign.category,
        budget: campaign.budget,
        platforms:
          campaign.platform === "Multiple platforms" ? ["Multiple platforms"] : [campaign.platform],
        audience_location: campaign.location,
        follower_range: "",
        influencer_count: null,
        start_date: "",
        promotions: [],
        description: data.requirements,
        legacy_campaign: campaign,
      },
    };
  }
  if (format) throw new InfluencerRequestError("Unsupported form format");
  if (kind === "creator") {
    const data = parse(creatorIntakeSchema, readJson(form, "data"));
    const { token, startedAt, website_trap: _trap, ...details } = data;
    return { token, startedAt, email: data.email, creator: data, details };
  }
  const data = parse(brandIntakeSchema, readJson(form, "data"));
  if (data.creator) {
    const profile = await getPublishedInfluencer(data.creator.slug);
    if (
      !profile ||
      profile.id !== data.creator.id ||
      !profile.consent_confirmed ||
      profile.publication_status !== "published"
    )
      throw new InfluencerRequestError(
        "This creator is no longer available. Please select another creator.",
      );
    data.creator.name = profile.display_name;
  }
  const { token, startedAt, website_trap: _trap, ...details } = data;
  return { token, startedAt, email: data.email, creator: null, details };
}
