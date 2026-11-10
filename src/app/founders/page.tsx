import Page from "@/routes/founders";
import { metadata as fallback } from "@/lib/page-metadata/founders";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const revalidate = 60;
export async function generateMetadata() {
  return cmsPageMetadata("founders", fallback);
}

export default Page;
