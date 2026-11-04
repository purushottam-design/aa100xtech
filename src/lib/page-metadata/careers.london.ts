import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead(
  {
    meta: [
      {
        title: "London cohort — AA100XTech Careers | 12 UK seats",
      },
      {
        name: "description",
        content:
          "AA100XTech is opening a London studio with 12 remote UK seats. No interview rounds — one real client brief, 10 days to ship it, decision on day 10.",
      },
      {
        property: "og:title",
        content: "London cohort — AA100XTech Careers | 12 UK seats",
      },
      {
        property: "og:description",
        content:
          "AA100XTech is opening a London studio with 12 remote UK seats. No interview rounds — one real client brief, 10 days to ship it, decision on day 10.",
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
  "https://aa100xtech.com/careers/london",
);
