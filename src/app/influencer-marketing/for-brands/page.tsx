import type { Metadata } from "next";
import { MarketingIntakePage } from "@/components/marketing-intake-page";
import { getPartnerCampaignPackage } from "@/data/partner-campaign-packages";
export const metadata: Metadata = {
  title: "Influencer Campaigns for Brands | AA100XTECH",
  description:
    "Plan meaningful influencer campaigns with AA100XTECH. Share your brief, audience and budget to discuss the right creator collaborations.",
  alternates: { canonical: "/influencer-marketing/for-brands" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ campaignPackage?: string | string[] }>;
}) {
  const selected = getPartnerCampaignPackage((await searchParams).campaignPackage);
  return <MarketingIntakePage kind="brand" campaignOffers campaignPackageId={selected?.id} />;
}
