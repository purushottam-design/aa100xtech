import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead({
  meta: [
    {
      title: "Creator Moves 365 — Learn How to Grow on Social Media | AA100XTech",
    },
    {
      name: "description",
      content:
        "Creator Moves 365 is a daily learning program for social media creators: content strategy, hooks, editing, analytics and monetisation — one actionable move every day for 365 days.",
    },
    {
      property: "og:title",
      content: "Creator Moves 365 — Learn How to Grow on Social Media | AA100XTech",
    },
    {
      property: "og:description",
      content:
        "Creator Moves 365 is a daily learning program for social media creators: content strategy, hooks, editing, analytics and monetisation — one actionable move every day for 365 days.",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: "https://aa100xtech.com/creator-moves-365",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
  ],
  links: [
    {
      rel: "canonical",
      href: "https://aa100xtech.com/creator-moves-365",
    },
  ],
});
