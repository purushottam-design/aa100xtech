import Page from "@/routes/portfolio";
import { metadata as fallback } from "@/lib/page-metadata/portfolio";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const revalidate = 60;
export async function generateMetadata() {
  return cmsPageMetadata("portfolio", fallback);
}

export default Page;
