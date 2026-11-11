import type { Metadata } from "next";
import { JoinInfluencerPage } from "@/components/join-influencer-page";
import { withSocialMetadata } from "@/lib/page-metadata";
import "./join-influencer.css";

export const metadata: Metadata = withSocialMetadata({
  title: "Join AA100XTech as an Influencer Partner | Creator Benefits",
  description:
    "Explore influencer partnership opportunities with AA100XTech. Discover portfolio websites, creator tools, professional email setup, creative support, and digital branding solutions.",
  keywords: [
    "Influencer Partnership Program",
    "Join as Influencer",
    "Influencer Partnership",
    "Influencer Collaboration Opportunities",
    "Creator Portfolio Website",
    "Influencer Branding Support",
    "Creator Digital Tools",
    "Influencer Marketing Partnership",
    "Content Creator Support",
    "Microdrama Content Support",
  ],
  alternates: { canonical: "https://aa100xtech.com/join-us/influencer" },
  openGraph: {
    images: [
      {
        url: "/influencers/join-creator-hero.webp",
        width: 1536,
        height: 1024,
        alt: "Creator working at a laptop in a bright content studio",
      },
    ],
  },
  twitter: { images: ["/influencers/join-creator-hero.webp"] },
});

export default function Page() {
  return <JoinInfluencerPage />;
}
