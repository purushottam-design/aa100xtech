import type { Metadata } from "next";
import { MarketingIntakePage } from "@/components/marketing-intake-page";
export const metadata: Metadata = {
  title: "Become an Influencer Partner | AA100XTECH",
  description:
    "Join the AA100XTECH influencer network. Apply for creator collaborations and brand campaign opportunities.",
  alternates: { canonical: "/influencer-marketing/for-influencers" },
};
export default function Page() {
  return <MarketingIntakePage kind="creator" />;
}
