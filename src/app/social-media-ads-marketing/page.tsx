import type { Metadata } from "next";
import { SocialAdsPage } from "@/components/social-ads-page";
import { withSocialMetadata } from "@/lib/page-metadata";
import { site } from "@/data/site";

export const metadata: Metadata = withSocialMetadata({
  title: "Social Media Ads Marketing Services | AA100XTech",
  description:
    "Grow your business with social media ads marketing services from AA100XTech. Explore Facebook, Instagram, YouTube and LinkedIn ads, lead generation and campaign optimization.",
  alternates: { canonical: `${site.origin}/social-media-ads-marketing` },
  keywords: [
    "social media ads marketing services",
    "social media advertising agency",
    "paid social media marketing services",
    "social media ads management",
    "Facebook ads management",
    "Instagram ads marketing",
    "Meta ads management services",
    "YouTube advertising services",
    "LinkedIn advertising agency",
    "social media lead generation",
    "social media advertising strategy",
    "paid social advertising services",
    "social media conversion tracking",
    "social media campaign optimization",
  ],
  openGraph: {
    images: [
      {
        url: `${site.origin}/marketing/social-media-ads.webp`,
        width: 1200,
        height: 900,
        alt: "Social advertising campaign analytics workspace",
      },
    ],
  },
});

export default function Page() {
  return <SocialAdsPage />;
}
