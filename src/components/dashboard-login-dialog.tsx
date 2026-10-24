"use client";

/**
 * Shared dashboard login popup — identical behaviour on the website and in
 * the phone app. It only collects the credentials; every check (dashboard,
 * role, permissions) happens on the server in `dashboardLogin`.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/lib/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { PANEL_LABEL, PANEL_PATH, type AdminPanel } from "@/lib/admin-panels";
import { dashboardLogin } from "@/lib/dashboard-auth.functions";

export function DashboardLoginDialog({
  panel,
  onOpenChange,
}: {
  panel: AdminPanel | null;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (panel) {
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError(null);
      setBusy(false);
    }
  }, [panel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!panel) return;
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await dashboardLogin({
        data: { email: trimmed, password, dashboard: panel },
      });
      if (!result.ok) {
        setError(result.message ?? "Invalid email or password.");
        setBusy(false);
        return;
      }
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
      // Drop any access data cached for the previous (or signed-out) visitor so
      // the destination dashboard reads the freshly signed-in roles.
      queryClient.clear();
      await queryClient.invalidateQueries();
      toast.success(`Signed in to ${PANEL_LABEL[panel]}`);
      onOpenChange(false);
      navigate({ to: PANEL_PATH[panel] as never, replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!panel} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {panel ? `${PANEL_LABEL[panel]} Login` : "Login"}
          </DialogTitle>
          <DialogDescription>Sign in to your dashboard.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dash-email">Email</Label>
            <Input
              id="dash-email"
              type="email"
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dash-password">Password</Label>
            <div className="relative">
              <Input
                id="dash-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
