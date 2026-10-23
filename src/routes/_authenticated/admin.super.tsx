import { createFileRoute } from "@tanstack/react-router";

import { AdminNav } from "@/components/admin-nav";
import { SuperAdminConsole } from "@/components/super-admin-console";

export const Route = createFileRoute("/_authenticated/admin/super")({
  validateSearch: (search: Record<string, unknown>) => ({
    section: typeof search["section"] === "string" ? (search["section"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Super admin console — AA100XTech" },
      {
        name: "description",
        content:
          "Complete control centre for AA100XTech: users, admins, permissions, bookings, partners, affiliates and security.",
      },
      { property: "og:title", content: "Super admin console — AA100XTech" },
      { property: "og:description", content: "One console for every module of the website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuperAdminPage,
});

function SuperAdminPage() {
  const { section } = Route.useSearch();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Super admin console
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Full control of every module: users, admins, permissions, business records and security.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <SuperAdminConsole initialSection={section} />
      </div>
    </div>
  );
}
