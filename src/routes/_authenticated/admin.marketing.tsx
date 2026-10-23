import { createFileRoute } from "@tanstack/react-router";

import { AdminPanelPage } from "@/components/admin-panel-page";

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing Admin dashboard — AA100XTech" },
      { name: "description", content: "Marketing admin dashboard: leads, partner applications, affiliates and conversions." },
      { property: "og:title", content: "Marketing Admin dashboard — AA100XTech" },
      { property: "og:description", content: "Marketing scope administration for AA100XTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPanelPage panel="marketing" description="Leads, partner applications, affiliates, clicks and conversions." />
  ),
});
