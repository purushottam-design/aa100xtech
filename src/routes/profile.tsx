"use client";

import { useQuery } from "@tanstack/react-query";

import { Link } from "@/lib/navigation";

import {
  PageEmpty,
  PageError,
  PageLoading,
  WebPageShell,
  RequireWebAuth,
  SignOutButton,
} from "@/components/web-page-shell";
import { Button } from "@/components/ui/button";
import { useMyAdminRoles } from "@/components/admin-panel-shell";
import { Badge } from "@/components/ui/badge";
import { getMyAccount } from "@/lib/accounts.functions";

export default () => (
  <RequireWebAuth>
    <ProfilePage />
  </RequireWebAuth>
);

function ProfilePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", "account"],
    queryFn: () => getMyAccount(),
  });

  const profile = data?.profile ?? null;
  const roles = data?.roles ?? [];
  const adminAccess = useMyAdminRoles();
  const hasPanels = (adminAccess.data?.panels ?? []).length > 0;

  return (
    <WebPageShell>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
        Your profile
      </h1>

      {hasPanels ? (
        <Button asChild className="mt-4 w-full">
          <Link to="/admin/select">Open admin panels</Link>
        </Button>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <PageLoading label="Loading profile…" /> : null}
        {error ? <PageError message={(error as Error).message} /> : null}
        {!isLoading && !error && !profile ? (
          <PageEmpty
            title="No profile record yet"
            hint="Your company admin will finish setting up your account."
          />
        ) : null}

        {profile ? (
          <>
            <Row label="Full name" value={profile.full_name || "—"} />
            <Row label="Username" value={profile.username} />
            <Row label="Email" value={profile.email} />
            <Row label="Phone" value={profile.phone || "—"} />
            {profile.job_title ? <Row label="Job title" value={profile.job_title} /> : null}
            {profile.department ? <Row label="Department" value={profile.department} /> : null}
            {profile.joined_at ? <Row label="Joined" value={profile.joined_at} /> : null}
            {profile.target_label ? (
              <Row label={profile.target_label} value={`${profile.target_percent}% achieved`} />
            ) : null}
            {profile.bio ? <Row label="About" value={profile.bio} /> : null}

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Roles</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {roles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                ) : (
                  roles.map((r) => (
                    <Badge key={r} variant="secondary">
                      {r.replace("_", " ")}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}

        <SignOutButton className="w-full" />
      </div>
    </WebPageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
