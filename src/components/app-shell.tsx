import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, CalendarClock, Home, LayoutGrid, LogOut, Settings, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import logoAsset from "@/assets/aa100x-logo-full-alpha.png.asset.json";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { to: "/app/home", label: "Home", icon: Home },
  { to: "/app/services", label: "Services", icon: LayoutGrid },
  { to: "/app/book-consultation", label: "Book", icon: CalendarClock },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function AppShell({
  title,
  children,
  showNav = true,
}: {
  title?: string;
  children: ReactNode;
  showNav?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link to="/app/home" className="flex items-center" aria-label="AA100XTech app home">
          <img
            src={logoAsset.url}
            alt="Absolute Advancement 100X Tech"
            className="h-7 w-auto"
            width={1024}
            height={286}
          />
        </Link>
        <div className="flex items-center gap-3">
          {title ? (
            <span className="truncate text-sm font-medium text-muted-foreground">{title}</span>
          ) : null}
          {showNav ? (
            <>
              <Link
                to="/app/notifications"
                aria-label="Notifications"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <Link
                to="/app/settings"
                aria-label="App settings"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </>
          ) : null}
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      {showNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <ul className="grid grid-cols-4">
            {tabs.map((t) => {
              const active = pathname.startsWith(t.to);
              const Icon = t.icon;
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      className={className}
      onClick={async () => {
        await supabase.auth.signOut();
        navigate({ to: "/app/login", replace: true });
      }}
    >
      <LogOut className="mr-2 h-4 w-4" /> Log out
    </Button>
  );
}

export function RequireAppAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/app/login", replace: true });
  }, [loading, session, navigate]);

  if (loading) return <AppLoading />;
  if (!session) return null;
  return <>{children}</>;
}

export function AppLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3 py-10">
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      <p className="text-center text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function AppEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AppError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-center">
      <p className="text-sm font-medium text-foreground">Something went wrong</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
