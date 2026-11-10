import Page from "@/routes/contact";
import { metadata as fallback } from "@/lib/page-metadata/contact";
import { cmsPageMetadata } from "@/lib/cms-metadata.server";
export const revalidate = 60;
export async function generateMetadata() {
  return cmsPageMetadata("contact", fallback);
}

export default Page;
