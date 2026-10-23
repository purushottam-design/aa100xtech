import { createFileRoute } from "@tanstack/react-router";

import { AdminNav } from "@/components/admin-nav";
import { SettingsForm } from "@/components/settings-form";

const title = "General settings — AA100XTech admin";
const description =
  "Control how AA100XTech behaves: default currency, timezone, sign-ups, bookings, careers and the affiliate program.";

export const Route = createFileRoute("/_authenticated/admin/settings/general")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">General settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Application behaviour: currency, timezone and which modules are open to the public.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <SettingsForm group="general" />
      </div>
    </div>
  ),
});
