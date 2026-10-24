import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead({
  "meta": [
    {
      "title": "Company team — AA100XTech portal"
    },
    {
      "name": "description",
      "content": "Internal AA100XTech team directory: each person's profile, time in the company, target achieved and employee of the month."
    },
    {
      "property": "og:title",
      "content": "Company team — AA100XTech portal"
    },
    {
      "property": "og:description",
      "content": "Internal team directory for AA100XTech members."
    },
    {
      "property": "og:type",
      "content": "website"
    },
    {
      "name": "twitter:card",
      "content": "summary_large_image"
    }
  ]
});
