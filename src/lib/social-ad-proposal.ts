import { z } from "zod";

export const adPlatforms = [
  "Facebook Ads",
  "Instagram Ads",
  "YouTube Ads",
  "LinkedIn Ads",
  "X Ads",
  "Need Expert Recommendation",
] as const;
export const adServices = [
  "Advertising Strategy",
  "Audience Research and Targeting",
  "Ad Creatives and Copywriting",
  "Lead Generation Campaigns",
  "Conversion Tracking and Analytics",
  "Campaign Optimization and Scaling",
] as const;
export const adBudgets = [
  "Below ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "Above ₹1,00,000",
  "Need Budget Guidance",
] as const;
export const adObjectives = [
  "Brand Awareness",
  "Lead Generation",
  "Website Traffic",
  "Product Sales",
  "Customer Enquiries",
  "App Promotion",
  "Other",
] as const;
export const enquiryStatuses = [
  "New",
  "Contacted",
  "Proposal Sent",
  "In Progress",
  "Closed",
] as const;

export const socialAdProposalSchema = z
  .object({
    companyWebsite: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .url()
          .max(600)
          .refine(
            (value) => ["http:", "https:"].includes(new URL(value).protocol),
            "Use an HTTP or HTTPS website URL.",
          ),
      ])
      .default(""),
    services: z
      .array(z.enum(adServices))
      .min(1, "Select at least one service.")
      .max(adServices.length),
    platforms: z
      .array(z.enum(adPlatforms))
      .min(1, "Select at least one advertising platform.")
      .max(adPlatforms.length),
    budget: z.enum(adBudgets),
    location: z.string().trim().min(2, "Enter your target location.").max(200),
    objective: z.enum(adObjectives),
    startDate: z.string().date("Choose a valid campaign start date."),
    privacy: z.literal(true, {
      errorMap: () => ({ message: "Please agree to the Privacy Policy." }),
    }),
  })
  .strict();

export type SocialAdProposal = z.infer<typeof socialAdProposalSchema>;
