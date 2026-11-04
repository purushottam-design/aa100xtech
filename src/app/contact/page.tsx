import Page from "@/routes/contact";
import { metadata as fallback } from "@/lib/page-metadata/contact";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return cmsPageMetadata("contact", fallback);
}

export default Page;
