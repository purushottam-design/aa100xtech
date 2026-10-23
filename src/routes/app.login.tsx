import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordAdminLogin } from "@/lib/admin-management.functions";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { getMyAdminRoles } from "@/lib/admin-panels.functions";

const title = "Sign in — AA100XTech App";
const description =
  "Sign in to the AA100XTech mobile app with your existing AA100XTech account to view services, your profile and consultations.";

export const Route = createFileRoute("/app/login")({
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
  component: AppLogin,
});

function AppLogin() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app/home", replace: true });
  }, [loading, session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    try {
      const login = await recordAdminLogin();
      if (login.blocked) {
        await supabase.auth.signOut();
        setBusy(false);
        toast.error(
          login.status === "suspended"
            ? "This account is suspended. Contact the super admin."
            : "This account is deactivated. Contact the super admin.",
        );
        return;
      }
    } catch {
      // never block sign-in on a logging failure
    }

    // Same backend and roles as the website: admins land on their panels.
    let hasPanels = false;
    try {
      const access = await getMyAdminRoles();
      hasPanels = (access.panels ?? []).length > 0;
    } catch {
      hasPanels = false;
    }
    setBusy(false);
    navigate({ to: hasPanels ? "/app/admin" : "/app/home", replace: true });
  }

  return (
    <AppShell showNav={false}>
      <div className="pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your existing AA100XTech account. Accounts are issued by the company.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-email">Email</Label>
            <Input
              id="app-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-password">Password</Label>
            <Input
              id="app-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need an account?{" "}
          <Link to="/request-access" className="text-primary underline-offset-4 hover:underline">
            Request access
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
