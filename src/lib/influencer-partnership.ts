import { z } from "zod";
import { partnershipInterestGroups, partnershipPackages } from "@/data/influencer-partnership";

const services: readonly string[] = partnershipInterestGroups.flatMap((group) => [
  ...group.services,
]);
export const partnershipProposalSchema = z.object({
  package: z
    .string()
    .refine(
      (id) => partnershipPackages.some((item) => item.id === id),
      "Choose a partnership package",
    ),
  services: z
    .array(
      z
        .string()
        .refine((service) => services.includes(service), "Choose an available partnership service"),
    )
    .max(services.length)
    .default([]),
  budget: z.string().trim().max(200).default(""),
  timeline: z.string().trim().max(200).default(""),
  privacy: z.literal(true, { errorMap: () => ({ message: "Please agree to the Privacy Policy" }) }),
});
