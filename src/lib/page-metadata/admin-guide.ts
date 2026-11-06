import { fromLegacyHead } from "@/lib/page-metadata";

// Original page metadata, preserved during the App Router migration.
export const metadata = fromLegacyHead({
  meta: [
    {
      title: "Admin guide — how to open Super Admin & Admin | AA100XTech",
    },
    {
      name: "description",
      content:
        "Step-by-step picture guide: sign in, open the Super Admin console, open a role admin panel, create a new admin and set permissions — on desktop and mobile browsers.",
    },
    {
      property: "og:title",
      content: "Admin guide — how to open Super Admin & Admin | AA100XTech",
    },
    {
      property: "og:description",
      content:
        "Step-by-step picture guide: sign in, open the Super Admin console, open a role admin panel, create a new admin and set permissions — on desktop and mobile browsers.",
    },
    {
      property: "og:type",
      content: "article",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "robots",
      content: "noindex",
    },
  ],
});
