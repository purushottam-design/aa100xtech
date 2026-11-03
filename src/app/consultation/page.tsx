import Page from "@/routes/consultation";
import { metadata as fallback } from "@/lib/page-metadata/consultation";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return cmsPageMetadata("consultation", fallback);
}

export default Page;
