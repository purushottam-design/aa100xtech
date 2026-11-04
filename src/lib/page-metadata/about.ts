import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead(
  {
    meta: [
      {
        title: "About AA100XTech — IT Services Company in Patna",
      },
      {
        name: "description",
        content:
          "Absolute Advancement 100X Tech is an Indian IT services company in Patna delivering websites, mobile apps, AI, cloud and digital marketing for 100x business growth.",
      },
      {
        property: "og:title",
        content: "About AA100XTech — IT Services Company in Patna",
      },
      {
        property: "og:description",
        content:
          "Absolute Advancement 100X Tech is an Indian IT services company in Patna delivering websites, mobile apps, AI, cloud and digital marketing for 100x business growth.",
      },
    ],
  },
  "https://aa100xtech.com/about",
);
