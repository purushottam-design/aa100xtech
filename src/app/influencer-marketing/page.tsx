import Page from "@/routes/influencer-marketing";
import { metadata as fallback } from "@/lib/page-metadata/influencer-marketing";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
import { listPublishedInfluencers } from "@/lib/influencers.server";
import { creatorListing } from "@/lib/creator-discovery";
import "@/routes/influencer-marketing.css";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return cmsPageMetadata("influencer-marketing", fallback);
}

export default async function InfluencerMarketingRoute() {
  const { profiles, unavailable } = await listPublishedInfluencers();
  const publicProfiles = profiles
    .filter((profile) => profile.publication_status === "published" && profile.consent_confirmed)
    .map(creatorListing);
  return <Page profiles={publicProfiles} unavailable={unavailable} />;
}
