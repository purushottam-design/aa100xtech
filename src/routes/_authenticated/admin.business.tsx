import { createFileRoute } from "@tanstack/react-router";

import { AdminPanelPage } from "@/components/admin-panel-page";

export const Route = createFileRoute("/_authenticated/admin/business")({
  head: () => ({
    meta: [
      { title: "Business Admin dashboard — AA100XTech" },
      { name: "description", content: "Business admin dashboard: consultation bookings, customers and booking revenue." },
      { property: "og:title", content: "Business Admin dashboard — AA100XTech" },
      { property: "og:description", content: "Business scope administration for AA100XTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPanelPage panel="business" description="Business enquiries, consultation bookings, customers and booking value." />
  ),
});
