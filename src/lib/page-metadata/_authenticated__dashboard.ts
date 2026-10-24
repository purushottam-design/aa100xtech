import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead({
  "meta": [
    {
      "title": "My account — AA100XTech portal"
    },
    {
      "name": "description",
      "content": "Your AA100XTech portal account: profile details, role and password settings."
    },
    {
      "property": "og:title",
      "content": "My account — AA100XTech portal"
    },
    {
      "property": "og:description",
      "content": "Your AA100XTech portal account overview."
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
