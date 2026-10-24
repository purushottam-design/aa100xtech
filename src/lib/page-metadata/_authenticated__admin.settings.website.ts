import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead({
  "meta": [
    {
      "title": "Website settings — AA100XTech admin"
    },
    {
      "name": "description",
      "content": "Manage the public identity of AA100XTech: site name, contact details, business hours and site-wide announcements."
    },
    {
      "property": "og:title",
      "content": "Website settings — AA100XTech admin"
    },
    {
      "property": "og:description",
      "content": "Manage the public identity of AA100XTech: site name, contact details, business hours and site-wide announcements."
    },
    {
      "property": "og:type",
      "content": "website"
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
