import Page from "@/routes/founders";
import { metadata as fallback } from "@/lib/page-metadata/founders";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return cmsPageMetadata("founders", fallback);
}

export default Page;
