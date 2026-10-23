import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Link } from "@tanstack/react-router";

import { AppEmpty, AppError, AppLoading, AppShell, RequireAppAuth, SignOutButton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useMyAdminRoles } from "@/components/admin-panel-shell";
import { Badge } from "@/components/ui/badge";
import { getMyAccount } from "@/lib/accounts.functions";

const title = "Your profile — AA100XTech App";
const description =
  "View your AA100XTech account details: name, contact information, department and assigned roles.";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <RequireAppAuth>
      <AppProfile />
    </RequireAppAuth>
  ),
});

function AppProfile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", "account"],
    queryFn: () => getMyAccount(),
  });

  const profile = data?.profile ?? null;
  const roles = data?.roles ?? [];
  const adminAccess = useMyAdminRoles();
  const hasPanels = (adminAccess.data?.panels ?? []).length > 0;

  return (
    <AppShell title="Profile">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Your profile</h1>

      {hasPanels ? (
        <Button asChild className="mt-4 w-full">
          <Link to="/app/admin">Open admin panels</Link>
        </Button>
      ) : null}

      <div className="mt-4 space-y-3">
        {isLoading ? <AppLoading label="Loading profile…" /> : null}
        {error ? <AppError message={(error as Error).message} /> : null}
        {!isLoading && !error && !profile ? (
          <AppEmpty
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
              <Row
                label={profile.target_label}
                value={`${profile.target_percent}% achieved`}
              />
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
    </AppShell>
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
