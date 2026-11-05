import type { Metadata } from "next";
import { MarketingIntakePage } from "@/components/marketing-intake-page";
export const metadata: Metadata = {
  title: "Influencer Campaigns for Brands | AA100XTECH",
  description:
    "Plan meaningful influencer campaigns with AA100XTECH. Share your brief, audience and budget to discuss the right creator collaborations.",
  alternates: { canonical: "/influencer-marketing/for-brands" },
};
export default function Page() {
  return <MarketingIntakePage kind="brand" />;
}
