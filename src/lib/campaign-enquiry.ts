import { z } from "zod";
import { campaignServices, creatorCategories, campaignPackages } from "@/data/influencer-marketing";

export const campaignPlatforms = [
  "Instagram",
  "YouTube",
  "Facebook",
  "Snapchat",
  "Other",
  "Multiple platforms",
] as const;
export const campaignDetailsSchema = z
  .object({
    type: z
      .string()
      .refine(
        (value) => campaignServices.some((service) => service.name === value),
        "Choose a campaign type.",
      ),
    category: z
      .string()
      .refine(
        (value) =>
          value === "Any category" || creatorCategories.some((category) => category.name === value),
        "Choose a creator category.",
      ),
    platform: z.enum(campaignPlatforms),
    location: z.string().trim().min(2, "Enter your target location.").max(200),
    budget: z.string().trim().min(1, "Enter your estimated budget.").max(100),
    timeline: z.string().trim().min(2, "Enter your preferred timeline.").max(200),
    targetAudience: z.string().trim().min(2, "Describe your target audience.").max(500).optional(),
    package: z
      .string()
      .default("")
      .refine(
        (value) => value === "" || campaignPackages.some((plan) => plan.name === value),
        "Choose an available campaign package.",
      ),
    creator: z
      .object({
        id: z.string().uuid(),
        slug: z
          .string()
          .max(100)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        name: z.string().trim().min(1).max(100),
      })
      .optional(),
  })
  .strict();
export type CampaignDetails = z.infer<typeof campaignDetailsSchema>;
