"use client";


import { Download, Share, Smartphone } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const title = "Install the AA100XTech App";
const description =
  "Install the AA100XTech App on your phone for one-tap access to services, consultations and your account.";

export default AppInstall;

function AppInstall() {
  const { canInstall, installed, install } = usePwaInstall();

  return (
    <AppShell title="Install">
      <div className="flex flex-col items-center pt-4 text-center">
        <img
          src="/app-icon-512.png"
          alt="AA100XTech App icon"
          width={96}
          height={96}
          className="h-24 w-24 rounded-2xl border border-border/60"
        />
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          AA100XTech App
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Same account, same data as aa100xtech.com — in an app on your home screen.
        </p>

        {installed ? (
          <p className="mt-6 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground">
            App is installed. You can open it from your home screen.
          </p>
        ) : (
          <Button className="mt-6 w-full" disabled={!canInstall} onClick={() => install()}>
            <Download className="mr-2 h-4 w-4" />
            {canInstall ? "Install app" : "Use the steps below"}
          </Button>
        )}
      </div>

      <div className="mt-8 space-y-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-primary" /> Android (Chrome)
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tap the three-dot menu → “Add to Home screen” / “Install app”.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Share className="h-4 w-4 text-primary" /> iPhone (Safari)
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tap the Share button → “Add to Home Screen” → Add.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
