"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { ArrowRight, CalendarClock, LayoutGrid, User } from "lucide-react";

import {
  AppEmpty,
  AppError,
  AppLoading,
  AppShell,
  RequireAppAuth,
  SignOutButton,
} from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyAccount } from "@/lib/accounts.functions";
import { listCatalogItems } from "@/lib/affiliate.functions";

const title = "App home — AA100XTech";
const description =
  "Your AA100XTech mobile dashboard: services, consultations and your account, powered by your existing AA100XTech login.";

export default () => (
    <RequireAppAuth>
      <AppHome />
    </RequireAppAuth>
  );

function AppHome() {
  const account = useQuery({ queryKey: ["app", "account"], queryFn: () => getMyAccount() });
  const catalog = useQuery({ queryKey: ["app", "catalog"], queryFn: () => listCatalogItems() });

  const profile = account.data?.profile ?? null;
  const roles = account.data?.roles ?? [];
  const firstName = (profile?.full_name || profile?.username || "").split(" ")[0];

  return (
    <AppShell title="Home">
      <section className="rounded-2xl border border-border/60 bg-card p-5">
        {account.isLoading ? (
          <div className="h-12 animate-pulse rounded-lg bg-secondary" />
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Welcome back</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {firstName ? `Hi, ${firstName}` : "Hi there"}
            </h1>
            {profile?.email ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{profile.email}</p>
            ) : null}
            {roles.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <Badge key={r} variant="secondary">
                    {r.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <QuickAction to="/app/services" icon={LayoutGrid} label="Services" />
        <QuickAction to="/app/book-consultation" icon={CalendarClock} label="Book" />
        <QuickAction to="/app/profile" icon={User} label="Profile" />
      </section>

      <section className="mt-5 rounded-2xl border border-primary/40 bg-primary/5 p-5">
        <p className="text-sm font-semibold text-foreground">Need expert guidance?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Book a paid consultation with the AA100XTech team.
        </p>
        <Button asChild className="mt-3 w-full">
          <Link to="/app/book-consultation">Book a consultation</Link>
        </Button>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Services</h2>
          <Link
            to="/app/services"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-3 space-y-3">
          {catalog.isLoading ? <AppLoading label="Loading services…" /> : null}
          {catalog.error ? <AppError message={(catalog.error as Error).message} /> : null}
          {!catalog.isLoading && !catalog.error && (catalog.data?.length ?? 0) === 0 ? (
            <AppEmpty title="No services published yet" />
          ) : null}
          {(catalog.data ?? []).slice(0, 4).map((item) => (
            <Link
              key={item.id}
              to="/app/service/$id"
              params={{ id: item.id }}
              className="block rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/50"
            >
              <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
              {item.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <SignOutButton className="w-full" />
      </div>
    </AppShell>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/app/services" | "/app/book-consultation" | "/app/profile";
  icon: typeof LayoutGrid;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card p-3 text-xs font-medium text-foreground transition-colors hover:border-primary/50"
    >
      <Icon className="h-5 w-5 text-primary" />
      {label}
    </Link>
  );
}
