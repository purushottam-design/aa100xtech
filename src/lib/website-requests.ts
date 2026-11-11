import { z } from "zod";
import { inquiryOptions } from "@/data/business-plans";
import { campaignDetailsSchema } from "./campaign-enquiry";
import { socialAdProposalSchema } from "./social-ad-proposal";

export const websiteRequestSchema = z
  .object({
    id: z.string().uuid(),
    kind: z.enum(["proposal", "influencer", "contact", "career"]),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(30).default(""),
    company: z.string().trim().max(160).default(""),
    selectedPlan: z.string().trim().max(80).default("other"),
    requirements: z.string().trim().min(10).max(5000),
    message: z.string().trim().max(5000).default(""),
    role: z.string().trim().max(160).default(""),
    experience: z.string().trim().max(1000).default(""),
    hours: z.string().trim().max(200).default(""),
    availability: z.string().trim().max(2000).default(""),
    expectedCost: z.string().trim().max(200).default(""),
    portfolio: z.string().trim().max(600).default(""),
    website: z.string().max(0).default(""),
    startedAt: z.number().int().positive(),
    campaign: campaignDetailsSchema.optional(),
    socialAds: socialAdProposalSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.socialAds && (data.kind !== "proposal" || data.selectedPlan !== "social-media-ads"))
      ctx.addIssue({
        code: "custom",
        path: ["socialAds"],
        message: "Choose the social media ads proposal service.",
      });
    if (data.socialAds && data.company.length < 2)
      ctx.addIssue({ code: "custom", path: ["company"], message: "Enter your business name." });
    if (data.campaign && data.kind !== "influencer")
      ctx.addIssue({
        code: "custom",
        path: ["campaign"],
        message: "Campaign details require an influencer enquiry.",
      });
    if (data.campaign && data.company.length < 2)
      ctx.addIssue({ code: "custom", path: ["company"], message: "Enter your business name." });
    if (
      data.phone &&
      (!/^[+\d\s().-]+$/.test(data.phone) || data.phone.replace(/\D/g, "").length < 6)
    )
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number." });
    if (data.kind !== "contact" && data.phone.length < 6)
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter a phone number.",
      });
    if (
      data.kind !== "contact" &&
      data.kind !== "career" &&
      !inquiryOptions.some((p) => p.id === data.selectedPlan)
    )
      ctx.addIssue({
        code: "custom",
        path: ["selectedPlan"],
        message: "Choose an available package.",
      });
    if (data.kind === "career" && !data.role)
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: "Choose a role.",
      });
    if (data.portfolio) {
      try {
        if (!["http:", "https:"].includes(new URL(data.portfolio).protocol)) throw new Error();
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["portfolio"],
          message: "Use an HTTP or HTTPS portfolio URL.",
        });
      }
    }
  });
export type WebsiteRequestInput = z.input<typeof websiteRequestSchema>;
export async function submitWebsiteRequest(input: WebsiteRequestInput, file?: File) {
  const parsed = websiteRequestSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Please check the form.");
  const form = new FormData();
  form.set("data", JSON.stringify(parsed.data));
  if (file?.size) form.set("attachment", file);
  const response = await fetch(
    parsed.data.socialAds ? "/api/website/social-ads" : "/api/website/requests",
    {
      method: "POST",
      headers: { "x-aa-rpc": "1" },
      body: form,
      signal: AbortSignal.timeout(30_000),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.saved)
    throw new Error(result.message ?? "Your request could not be saved. Please try again.");
  return result as { saved: true; notification: string };
}
