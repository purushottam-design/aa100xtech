import { z } from "zod";
import { publicUrl } from "./influencers";
import { campaignDetailsSchema } from "./campaign-enquiry";

export const platforms = [
  "Instagram",
  "YouTube",
  "Facebook",
  "Snapchat",
  "ShareChat",
  "Moj",
  "Josh",
  "X (Twitter)",
  "Pinterest",
  "Other",
] as const;
export const categories = [
  "Lifestyle",
  "Fashion & Beauty",
  "Technology",
  "Education",
  "Travel",
  "Food",
  "Gaming",
  "News & Media",
  "Comedy",
  "Fitness",
  "Other",
] as const;
export const objectives = [
  "Brand Awareness",
  "Product Promotion",
  "Lead Generation",
  "Website Traffic",
  "App Promotion",
  "Event Promotion",
  "Product Launch",
  "Other",
] as const;
export const budgets = [
  "Below ₹10,000",
  "₹10,000–₹50,000",
  "₹50,000–₹1,00,000",
  "₹1,00,000–₹5,00,000",
  "Above ₹5,00,000",
  "Not Decided",
] as const;
export const promotions = [
  "Instagram Reels",
  "Instagram Stories",
  "YouTube Videos",
  "YouTube Shorts",
  "Facebook Promotion",
  "Product Reviews",
  "Event Promotion",
  "Custom Campaign",
] as const;
export const campaignStatuses = [
  "New",
  "Contacted",
  "Proposal Sent",
  "In Negotiation",
  "Confirmed",
  "Closed",
] as const;
const required = (max = 120) =>
  z.string().trim().min(2, "Please enter at least 2 characters").max(max);
const optional = (max = 1500) => z.string().trim().max(max).default("");
const count = z.number().int().min(0).max(10_000_000_000).nullable();
export const phone = z
  .string()
  .trim()
  .max(30)
  .refine(
    (v) =>
      /^[+\d\s().-]+$/.test(v) &&
      v.replace(/\D/g, "").length >= 7 &&
      v.replace(/\D/g, "").length <= 15,
    "Enter a valid phone number (7–15 digits)",
  );
const base = {
  email: z.string().trim().email().max(255),
  phone,
  privacy: z.literal(true, { errorMap: () => ({ message: "Please agree to the Privacy Policy" }) }),
  website_trap: z.string().max(0).default(""),
  startedAt: z.number(),
  token: z.string().uuid(),
};
const hosts: Record<string, string[]> = {
  Instagram: ["instagram.com"],
  YouTube: ["youtube.com", "youtu.be"],
  Facebook: ["facebook.com", "fb.com"],
  Snapchat: ["snapchat.com"],
  ShareChat: ["sharechat.com"],
  Moj: ["mojapp.in"],
  Josh: ["myjosh.in"],
  "X (Twitter)": ["x.com", "twitter.com"],
  Pinterest: ["pinterest.com", "pin.it"],
};
export const socialProfile = z
  .object({ platform: z.enum(platforms), url: publicUrl, followers: count })
  .refine(
    (v) =>
      !hosts[v.platform] ||
      hosts[v.platform]!.some((h) => {
        const host = new URL(v.url).hostname;
        return host === h || host.endsWith(`.${h}`);
      }),
    { path: ["url"], message: "Use a URL for the selected platform" },
  );
export const creatorIntakeSchema = z.object({
  ...base,
  full_name: required(),
  city: optional(80),
  state: optional(80),
  country: optional(80),
  profiles: z
    .array(socialProfile)
    .min(1, "Select at least one platform")
    .max(10)
    .refine(
      (v) => new Set(v.map((p) => p.platform)).size === v.length,
      "Select each platform once",
    ),
  category: z.enum(categories),
  audience_location: optional(250),
  language: optional(120),
  average_views: count,
  engagement: z.number().min(0).max(100).nullable(),
  collaboration: z.enum(["Paid", "Barter", "Affiliate", "Open to All"]),
  previous_collaborations: optional(),
  biography: optional(1200),
  publication_consent: z.boolean().default(false),
});
export const brandIntakeSchema = z.object({
  ...base,
  company: required(),
  contact_name: required(),
  company_website: z.union([publicUrl, z.literal("")]).default(""),
  industry: optional(120),
  location: optional(160),
  objective: z.enum(objectives),
  platforms: z.array(z.enum(["Instagram", "YouTube", "Facebook", "Snapchat", "Other"])).min(1),
  category: z.enum(categories),
  audience_location: optional(250),
  follower_range: optional(100),
  influencer_count: z.number().int().min(1).max(100000).nullable(),
  start_date: z.union([z.string().date(), z.literal("")]).default(""),
  budget: z.enum(budgets),
  promotions: z.array(z.enum(promotions)).min(1),
  description: optional(4000),
  creator: campaignDetailsSchema.shape.creator,
});
export type CreatorIntake = z.infer<typeof creatorIntakeSchema>;
export type BrandIntake = z.infer<typeof brandIntakeSchema>;
export type StoredBrandIntake = Omit<
  BrandIntake,
  "token" | "startedAt" | "website_trap" | "category" | "budget" | "objective" | "platforms"
> & {
  category: string;
  budget: string;
  objective: string;
  platforms: string[];
  legacy_campaign?: import("./campaign-enquiry").CampaignDetails;
};
export type CampaignInquiry = {
  id: string;
  created_at: string;
  status: (typeof campaignStatuses)[number];
  notes: string;
  data: StoredBrandIntake;
  notification_status: string;
};
export const creatorSuccess =
  "Thank you for applying! Your influencer partnership application has been submitted successfully. Our team will review your profile and contact you regarding suitable opportunities.";
export const brandSuccess =
  "Thank you for your interest in partnering with AA100XTECH! Your campaign inquiry has been received. Our team will review your requirements and contact you to discuss suitable influencer collaborations.";
