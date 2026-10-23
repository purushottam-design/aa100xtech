import { createFileRoute } from "@tanstack/react-router";

import { AdminPanelPage } from "@/components/admin-panel-page";

export const Route = createFileRoute("/_authenticated/admin/interview")({
  head: () => ({
    meta: [
      { title: "Interview Admin dashboard — AA100XTech" },
      { name: "description", content: "Interview admin dashboard: candidates, submissions and interview requests." },
      { property: "og:title", content: "Interview Admin dashboard — AA100XTech" },
      { property: "og:description", content: "Interview scope administration for AA100XTech." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminPanelPage panel="interview" description="Candidates, trial-task submissions and job-seeker access requests." />
  ),
});
