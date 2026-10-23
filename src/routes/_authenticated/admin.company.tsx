import { createFileRoute } from "@tanstack/react-router";

import { AdminPanelPage } from "@/components/admin-panel-page";

export const Route = createFileRoute("/_authenticated/admin/company")({
  head: () => ({
    meta: [
      { title: "Company Admin dashboard — AA100XTech" },
      { name: "description", content: "Company admin dashboard: member accounts, access requests and company bookings." },
      { property: "og:title", content: "Company Admin dashboard — AA100XTech" },
      { property: "og:description", content: "Company scope administration for AA100XTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPanelPage panel="company" description="Company information, member accounts, access requests and company bookings." />
  ),
});
