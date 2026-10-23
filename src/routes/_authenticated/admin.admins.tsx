import { createFileRoute } from "@tanstack/react-router";

import { AdminManagement } from "@/components/admin-management";
import { AdminNav } from "@/components/admin-nav";

export const Route = createFileRoute("/_authenticated/admin/admins")({
  head: () => ({
    meta: [
      { title: "Admin management — AA100XTech" },
      {
        name: "description",
        content: "Create admins, set status and grant granular module permissions.",
      },
      { property: "og:title", content: "Admin management — AA100XTech" },
      { property: "og:description", content: "Super admin control over every admin account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Admins</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        One super admin, unlimited admins — each with only the permissions you grant.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <AdminManagement />
      </div>
    </div>
  ),
});
