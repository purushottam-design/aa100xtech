"use client";

import { Link } from "@/lib/navigation";
import { useState } from "react";

import { DashboardLoginDialog } from "@/components/dashboard-login-dialog";

import { AppLoading, AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyAccess } from "@/components/admin-management";
import { ADMIN_PANELS, PANEL_LABEL, type AdminPanel } from "@/lib/admin-panels";
import { SETTING_GROUPS } from "@/lib/app-settings";
import { modulesForAccess } from "@/lib/permissions";


const title = "Admin panels — AA100XTech App";
const description =
  "Open the AA100XTech admin dashboards assigned to your account from the mobile app: company, interview, marketing, business or super admin.";

export default AppAdmin;

const CONSOLE_SECTIONS = [
  { section: "overview", label: "Dashboard" },
  { section: "reports", label: "Reports" },
  { section: "users", label: "Users" },
  { section: "admins", label: "Admins" },
  { section: "roles", label: "Roles" },
  { section: "hierarchy", label: "Hierarchy" },
  { section: "support", label: "Support" },
  { section: "notifications", label: "Notifications" },
  { section: "cms", label: "Content" },
  { section: "security", label: "Activity log" },
  { section: "sessions", label: "Sessions" },
  { section: "2fa", label: "Two-factor" },
] as const;

function AppAdmin() {
  const access = useMyAccess();
  const [loginPanel, setLoginPanel] = useState<AdminPanel | null>(null);
  // Signed-out visitors see every dashboard; the login popup is the real gate.
  const assigned = access.data?.panels ?? [];
  const panels = assigned.length > 0 ? assigned : [...ADMIN_PANELS];
  const isSuper = access.data?.isSuper ?? false;
  const roles = access.data?.roles ?? [];
  const permissions = access.data?.permissions ?? [];
  const modules = isSuper ? [] : modulesForAccess(roles, permissions, false);

  return (
    <AppShell title="Admin">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Continue as</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Same accounts, same database as the website. Only your assigned roles are shown.
      </p>
      <Button asChild variant="secondary" size="sm" className="mt-3 w-full">
        <Link to="/admin-guide">How to open Super Admin / Admin — picture guide</Link>
      </Button>


      <div className="mt-4 space-y-3">
        {access.isLoading ? <AppLoading label="Checking your roles…" /> : null}
        {panels.map((p) => (
          <Card key={p} className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{PANEL_LABEL[p]}</CardTitle>
              <CardDescription>Open this dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setLoginPanel(p as AdminPanel)}>
                Continue
              </Button>
            </CardContent>
          </Card>
        ))}

        {modules.length > 0 ? (
          <Card className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Your modules</CardTitle>
              <CardDescription>Only the modules your permissions allow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {modules.map((m) => (
                <Button
                  key={`${m.label}-${m.route}`}
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link to={m.route as never}>{m.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Administration</CardTitle>
            <CardDescription>Admins, permissions and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isSuper ? (
              <Button asChild className="w-full">
                <Link to="/admin/super" search={{ section: "overview" }}>Super admin console</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/admins">Manage admins</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/security">Activity & login history</Link>
            </Button>
          </CardContent>
        </Card>

        {isSuper ? (
          <Card className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Super admin console</CardTitle>
              <CardDescription>Open any section directly from the phone</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {CONSOLE_SECTIONS.map((s) => (
                <Button
                  key={s.section}
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link to="/admin/super" search={{ section: s.section }}>
                    {s.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {isSuper ? (
          <Card className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Settings</CardTitle>
              <CardDescription>Website, general and email settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SETTING_GROUPS.map((g) => (
                <Button key={g.key} asChild variant="outline" className="w-full">
                  <Link to={g.route as never}>{g.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <DashboardLoginDialog panel={loginPanel} onOpenChange={(o) => !o && setLoginPanel(null)} />
    </AppShell>
  );
}

