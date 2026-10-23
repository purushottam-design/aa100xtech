import { createFileRoute } from "@tanstack/react-router";

import { AdminNav } from "@/components/admin-nav";
import { AdminSecurity } from "@/components/admin-security";

export const Route = createFileRoute("/_authenticated/admin/security")({
  head: () => ({
    meta: [
      { title: "Admin security — AA100XTech" },
      {
        name: "description",
        content: "Admin activity log and login history for the AA100XTech administration system.",
      },
      { property: "og:title", content: "Admin security — AA100XTech" },
      { property: "og:description", content: "Activity log and sign-in history for admins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Security</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Who did what, and who signed in — recorded server-side.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <AdminSecurity />
      </div>
    </div>
  ),
});
