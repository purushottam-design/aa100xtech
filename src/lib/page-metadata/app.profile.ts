import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead({
  "meta": [
    {
      "title": "Your profile — AA100XTech App"
    },
    {
      "name": "description",
      "content": "View your AA100XTech account details: name, contact information, department and assigned roles."
    },
    {
      "property": "og:title",
      "content": "Your profile — AA100XTech App"
    },
    {
      "property": "og:description",
      "content": "View your AA100XTech account details: name, contact information, department and assigned roles."
    },
    {
      "property": "og:type",
      "content": "profile"
    },
    {
      "name": "twitter:card",
      "content": "summary_large_image"
    },
    {
      "name": "robots",
      "content": "noindex"
    }
  ]
});
