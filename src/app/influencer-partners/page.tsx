import type { Metadata } from "next";
import { InfluencerPartnersPage } from "@/components/influencer-partners-page";
import { InfluencerCreativeServices } from "@/components/influencer-creative-services";
import { InfluencerProgramDetails } from "@/components/influencer-program-details";
import { getInfluencerProgram } from "@/lib/influencer-program.server";
import { withSocialMetadata } from "@/lib/page-metadata";
import "./influencer-partners.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = withSocialMetadata({
  title: "Influencer Partner Program | Creators & Brands | AA100XTECH",
  description:
    "A unified platform for creators and brands to collaborate, grow, and create high-impact campaigns. Explore influencer programs, apply as a creator or share your brand brief.",
  alternates: { canonical: "https://aa100xtech.com/influencer-partners" },
});

export default async function Page() {
  const program = await getInfluencerProgram();
  return (
    <InfluencerPartnersPage
      programDetails={<InfluencerProgramDetails program={program} />}
      creativeServices={<InfluencerCreativeServices />}
    />
  );
}
