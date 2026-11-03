import Page from "@/routes/influencer-marketing";
import { metadata as fallback } from "@/lib/page-metadata/influencer-marketing";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return cmsPageMetadata("influencer-marketing", fallback);
}

export default Page;
