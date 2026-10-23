import { createFileRoute } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { toast } from "sonner";

import { AppEmpty, AppLoading, AppShell, RequireAppAuth } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const title = "Notifications — AA100XTech App";
const description =
  "Turn on push alerts and read every AA100XTech announcement, booking update and admin message inside the mobile app.";

export const Route = createFileRoute("/app/notifications")({
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
    <RequireAppAuth>
      <AppNotifications />
    </RequireAppAuth>
  ),
});

function AppNotifications() {
  const push = usePushNotifications();

  const onToggle = async (next: boolean) => {
    if (next) {
      const ok = await push.enable();
      toast[ok ? "success" : "error"](
        ok ? "Push notifications are on for this device." : "Notifications were blocked in your browser settings.",
      );
    } else {
      await push.disable();
      toast.success("This device will no longer receive push alerts.");
    }
  };

  return (
    <AppShell title="Notifications">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Announcements sent by the AA100XTech team arrive here and on your device.
      </p>

      <Card className="surface-card mt-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="size-4" aria-hidden /> Push alerts
              </CardTitle>
              <CardDescription>
                {push.supported ? "Allow alerts on this device" : "This browser does not support alerts"}
              </CardDescription>
            </div>
            <Switch
              checked={push.enabled}
              disabled={!push.supported || push.busy}
              onCheckedChange={onToggle}
              aria-label="Enable push notifications"
            />
          </div>
        </CardHeader>
        {push.permission === "denied" ? (
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Alerts are blocked. Allow notifications for this site in your browser settings, then try again.
            </p>
          </CardContent>
        ) : null}
      </Card>

      <div className="mt-4 space-y-3">
        {push.isLoading ? <AppLoading label="Loading announcements…" /> : null}
        {!push.isLoading && push.notifications.length === 0 ? (
          <AppEmpty title="No announcements yet" hint="New updates from the team will appear here." />
        ) : null}
        {push.notifications.map((n) => (
          <Card key={n.id} className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{n.title}</CardTitle>
              <CardDescription>
                {n.sent_at ? new Date(n.sent_at).toLocaleString() : "Just now"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{n.body}</p>
              {n.link_url ? (
                <Button asChild size="sm" variant="outline">
                  <a href={n.link_url}>Open</a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
