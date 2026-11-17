// Distinct campaign offers from FR-23 of the Partners integration PRD.
// Existing AA campaign, training and partner-program offers retain their IDs.
export const partnerCampaignPackageIds = [
  "cm365-campaign-starter",
  "cm365-campaign-growth",
  "cm365-campaign-premium",
  "cm365-campaign-enterprise",
] as const;

export type PartnerCampaignPackageId = (typeof partnerCampaignPackageIds)[number];
export type PartnerCampaignOffer = {
  id: PartnerCampaignPackageId;
  name: string;
  priceLabel: string;
  summary: string;
  features: readonly string[];
};

export const partnerCampaignScopeVersion = "partners-prd-fr23-v1";
export const partnerCampaignQualification =
  "All quantities are totals for the whole campaign, not per creator. Scope, creator availability, deliverables and pricing are indicative and subject to written confirmation.";

export const partnerCampaignPackages: readonly PartnerCampaignOffer[] = [
  {
    id: "cm365-campaign-starter",
    name: "Starter",
    priceLabel: "Starting at ₹5,999",
    summary: "A focused starting point for your creator campaign.",
    features: [
      "Campaign brief review",
      "Creator discovery and shortlisting",
      "Basic campaign coordination",
      "Campaign summary",
      "Creator and content quantities confirmed in writing",
    ],
  },
  {
    id: "cm365-campaign-growth",
    name: "Growth",
    priceLabel: "₹15,999",
    summary: "Coordinated content across a wider creator mix.",
    features: [
      "Up to 10 creators",
      "4–6 total reels",
      "10 total stories",
      "3 total static posts",
      "Campaign coordination, support and reporting",
    ],
  },
  {
    id: "cm365-campaign-premium",
    name: "Premium",
    priceLabel: "₹49,999",
    summary: "A larger campaign with strategy and dedicated coordination.",
    features: [
      "Up to 20 creators",
      "8–12 total reels / shorts",
      "20+ total story promotions",
      "UGC support and campaign strategy",
      "Dedicated coordination and detailed reporting",
    ],
  },
  {
    id: "cm365-campaign-enterprise",
    name: "Enterprise",
    priceLabel: "Custom quote",
    summary: "Build a campaign around your brand’s specific requirements.",
    features: [
      "Custom creator selection",
      "National / international coordination",
      "UGC assets",
      "Campaign management and reporting",
      "Scope agreed to your brief",
    ],
  },
];

export function getPartnerCampaignPackage(value: unknown): PartnerCampaignOffer | undefined {
  return partnerCampaignPackages.find((offer) => offer.id === value);
}

export function partnerCampaignHref(id: PartnerCampaignPackageId): string {
  return `/influencer-marketing/for-brands?campaignPackage=${encodeURIComponent(id)}#apply`;
}

// Derive the stored scope on the server; never trust submitted price/scope fields.
export function partnerCampaignSnapshot(id: PartnerCampaignPackageId) {
  const offer = getPartnerCampaignPackage(id)!;
  return {
    ...offer,
    scopeVersion: partnerCampaignScopeVersion,
    qualification: partnerCampaignQualification,
  };
}

export type PartnerCampaignSnapshot = ReturnType<typeof partnerCampaignSnapshot>;
