"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { Bell, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/dashboard", label: "My account", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

export function WebPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <nav
        aria-label="Account navigation"
        className="mb-8 flex flex-wrap gap-2 border-b border-border/60 pb-5"
      >
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      toast.error("Logout could not be completed. Please try again.");
      return;
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <Button variant="outline" className={className} onClick={handleSignOut}>
      <LogOut className="mr-2 h-4 w-4" /> Log out
    </Button>
  );
}

export function RequireWebAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading)
    return (
      <WebPageShell>
        <PageLoading />
      </WebPageShell>
    );
  if (!session) return null;
  return <>{children}</>;
}

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 py-10" role="status">
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      <p className="text-center text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function PageEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-foreground">Something went wrong</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
