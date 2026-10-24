"use client";

import { Link } from "@/lib/navigation";
import { useState } from "react";

import { DashboardLoginDialog } from "@/components/dashboard-login-dialog";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyAdminRoles } from "@/components/admin-panel-shell";
import { ADMIN_PANELS, PANEL_LABEL, type AdminPanel } from "@/lib/admin-panels";

export default SelectRolePage;

const panelBlurb: Record<string, string> = {
  super: "Full control: users, roles and all scopes.",
  company: "Company data, members and access requests.",
  interview: "Candidates, submissions and interviews.",
  marketing: "Leads, partners, affiliates and conversions.",
  business: "Bookings, customers and business data.",
};

function SelectRolePage() {
  const access = useMyAdminRoles();
  const [loginPanel, setLoginPanel] = useState<AdminPanel | null>(null);
  // Signed-out visitors see every dashboard; the login popup is the real gate.
  const assigned = access.data?.panels ?? [];
  const panels = assigned.length > 0 ? assigned : [...ADMIN_PANELS];

  if (access.isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Checking your roles…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Continue as</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        These are the admin dashboards assigned to your account.
      </p>

      {panels.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border/60 p-6">
          <p className="text-muted-foreground">
            No admin role is assigned to your account. Ask the super admin to assign one.
          </p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to my account</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {panels.map((p) => (
            <Card key={p} className="surface-card">
              <CardHeader>
                <CardTitle className="font-display text-xl">{PANEL_LABEL[p]}</CardTitle>
                <CardDescription>{panelBlurb[p]}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => setLoginPanel(p)}>
                  Open dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DashboardLoginDialog panel={loginPanel} onOpenChange={(o) => !o && setLoginPanel(null)} />
    </div>
  );
}
