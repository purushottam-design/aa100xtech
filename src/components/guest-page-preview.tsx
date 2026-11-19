"use client";

import { Link } from "@/lib/navigation";
import { loginHref } from "@/lib/auth-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pages = [
  ["/dashboard", "Account dashboard", ["Account details", "Your workspace", "Support"]],
  ["/admin", "Admin overview", ["Access requests", "Members", "Partner applications"]],
  ["/admin/super", "Super Admin", ["Company overview", "Administration", "Activity"]],
  ["/admin/company", "Company Admin", ["Team", "Projects", "Company operations"]],
  ["/admin/interview", "Interview Admin", ["Candidates", "Applications", "Interviews"]],
  ["/admin/marketing", "Marketing Admin", ["Campaigns", "Leads", "Marketing activity"]],
  ["/admin/business", "Business Admin", ["Business overview", "Partners", "Proposals"]],
  ["/admin/admins", "Admin management", ["Administrators", "Roles", "Permissions"]],
  ["/admin/security", "Security", ["Security activity", "Sessions", "Account protection"]],
  [
    "/admin/brand-inquiries",
    "Brand campaign inquiries",
    ["Inquiries", "Campaign details", "Review"],
  ],
  ["/admin/requests", "Website requests", ["Requests", "Request details", "Review"]],
  [
    "/admin/influencers",
    "Influencer management",
    ["Applications", "Profiles", "Publication review"],
  ],
  ["/admin/settings/website", "Website settings", ["Website content", "Social links", "Settings"]],
  ["/admin/settings/general", "General settings", ["Company details", "Preferences", "Settings"]],
  [
    "/admin/settings/email",
    "Email settings",
    ["Sender settings", "Email configuration", "Delivery"],
  ],
  ["/admin/select", "My dashboards", ["Admin panels", "Account", "Workspace"]],
  ["/team", "Team", ["Team members", "Roles", "Assignments"]],
  ["/affiliate", "Affiliate dashboard", ["Referrals", "Conversions", "Payouts"]],
  ["/affiliate-admin", "Affiliate administration", ["Applications", "Affiliates", "Payout review"]],
  ["/profile", "Your profile", ["Personal details", "Account", "Roles"]],
  ["/settings", "Settings", ["Account settings", "Password", "Preferences"]],
  ["/notifications", "Notifications", ["Updates", "Unread notifications", "History"]],
] as const;

/** Guest-only presentation. Never mounts the authenticated page or loads its records. */
export function GuestPagePreview({ pathname }: { pathname: string }) {
  const page = pages.find(([path]) => path === pathname.replace(/\/$/, ""));
  const title = page?.[1] ?? "Private page";
  const sections = page?.[2] ?? ["Overview", "Details", "Activity"];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div>
          <p className="font-semibold">Read-only page preview</p>
          <p className="text-sm text-muted-foreground">
            Explore the page sections. Sign in to view your records and use permitted actions.
          </p>
        </div>
        <Button asChild>
          <Link to={loginHref(pathname)}>Log in</Link>
        </Button>
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      <nav aria-label="Preview pages" className="flex flex-wrap gap-2">
        {pages.map(([path, label]) => (
          <Button
            key={path}
            asChild
            size="sm"
            variant={path === pathname ? "secondary" : "outline"}
          >
            <Link to={path} aria-current={path === pathname ? "page" : undefined}>
              {label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-lg">{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Available after login with the appropriate access.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title} records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Private records are hidden in this preview.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
