import Page from "@/routes/index";
import { metadata as fallback } from "@/lib/page-metadata/index";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return cmsPageMetadata("home", fallback);
}

export default Page;
