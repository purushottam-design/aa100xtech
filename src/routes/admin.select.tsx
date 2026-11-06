"use client";

import { Link } from "@/lib/navigation";
import { useState } from "react";

import { DashboardLoginDialog } from "@/components/dashboard-login-dialog";

import { PageLoading } from "@/components/web-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyAccess } from "@/components/admin-management";
import { ADMIN_PANELS, PANEL_LABEL, type AdminPanel } from "@/lib/admin-panels";
import { SETTING_GROUPS } from "@/lib/app-settings";
import { modulesForAccess } from "@/lib/permissions";

export default SelectRolePage;

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

function SelectRolePage() {
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
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
        Continue as
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Open your assigned admin dashboards and manage your workspace.
      </p>
      <Button asChild variant="secondary" size="sm" className="mt-4">
        <Link to="/admin-guide">How to open Super Admin / Admin — picture guide</Link>
      </Button>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {access.isLoading ? <PageLoading label="Checking your roles…" /> : null}
        {panels.map((p) => (
          <Card key={p} className="surface-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{PANEL_LABEL[p]}</CardTitle>
              <CardDescription>Open this dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setLoginPanel(p as AdminPanel)}>
                Open dashboard
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
                <Button key={`${m.label}-${m.route}`} asChild variant="outline" className="w-full">
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
                <Link to="/admin/super" search={{ section: "overview" }}>
                  Super admin console
                </Link>
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
              <CardDescription>Open any section of your admin console</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {CONSOLE_SECTIONS.map((s) => (
                <Button key={s.section} asChild variant="outline" className="w-full">
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
    </div>
  );
}
