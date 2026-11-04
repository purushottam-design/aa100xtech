import { withSocialMetadata } from "@/lib/page-metadata";

const title = "Influencer Marketing Services in India | AA100XTech";
const description =
  "Grow your brand with influencer marketing services from AA100XTech. Discover creators, plan campaigns, manage collaborations and track performance.";
const url = "https://aa100xtech.com/influencer-marketing";
const image = {
  url: "https://aa100xtech.com/influencer-marketing/creator-portrait.webp",
  width: 900,
  height: 600,
  alt: "Editorial photography illustrating creative collaboration",
};
export const metadata = withSocialMetadata({
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image.url] },
});
