import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead(
  {
    meta: [
      {
        title: "Explore Every Service Type — Websites, Apps, Design, AI & Content | AA100XTech",
      },
      {
        name: "description",
        content:
          "Browse every type of website, mobile app, graphic design, music, AI automation and social media service we deliver — open any type to see the full working, modules, process, timeline and pricing.",
      },
      {
        property: "og:title",
        content: "Explore Every Service Type — Websites, Apps, Design, AI & Content | AA100XTech",
      },
      {
        property: "og:description",
        content:
          "Browse every type of website, mobile app, graphic design, music, AI automation and social media service we deliver — open any type to see the full working, modules, process, timeline and pricing.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  },
  "https://aa100xtech.com/services/explore",
);
