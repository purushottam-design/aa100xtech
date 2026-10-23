import { createFileRoute } from "@tanstack/react-router";

import { AdminNav } from "@/components/admin-nav";
import { SettingsForm } from "@/components/settings-form";

const title = "Email settings — AA100XTech admin";
const description =
  "Set the sender identity for AA100XTech emails and choose which events trigger an internal notification.";

export const Route = createFileRoute("/_authenticated/admin/settings/email")({
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
      <h1 className="font-display text-3xl font-bold tracking-tight">Email settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sender identity and notification rules for transactional email.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <SettingsForm group="email" />
      </div>
    </div>
  ),
});
