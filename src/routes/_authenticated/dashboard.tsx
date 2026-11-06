"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SupportWidget } from "@/components/support-widget";
import { supabase } from "@/integrations/supabase/client";

import { getMyAccount } from "@/lib/accounts.functions";
import { useMyAdminRoles } from "@/components/admin-panel-shell";
import { PANEL_LABEL, PANEL_PATH } from "@/lib/admin-panels";

export default DashboardPage;

const roleLabels: Record<string, string> = {
  supreme_admin: "Supreme user",
  employee: "Employee",
  customer: "Customer",
  job_seeker: "Job seeker",
  partner: "Partner",
};

const roleHome: Record<string, { title: string; points: string[] }> = {
  supreme_admin: {
    title: "Company control",
    points: [
      "Review and approve access requests",
      "Allot usernames, emails, phone numbers and passwords",
      "See every member account in one place",
    ],
  },
  employee: {
    title: "Employee workspace",
    points: [
      "Your assigned company identity and contact details",
      "Task briefs, timings and deliverables shared with you",
      "Keep your password private and change it regularly",
    ],
  },
  customer: {
    title: "Customer workspace",
    points: [
      "Your project and account details with AA100XTech",
      "Support contact for anything you need",
      "Updates from your delivery team",
    ],
  },
  job_seeker: {
    title: "Job seeker workspace",
    points: [
      "Your application and trial-task status",
      "Submit task plans, timings and costings",
      "Interview scheduling updates",
    ],
  },
  partner: {
    title: "Partner workspace",
    points: [
      "Your level on the 30-step partnership ladder",
      "Referral and commission updates from your manager",
      "Campaign briefs and creative assets shared with you",
    ],
  },
};

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const adminAccess = useMyAdminRoles();
  const panels = adminAccess.data?.panels ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["my-account"],
    queryFn: () => getMyAccount(),
  });

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 10) {
      toast.error("Use at least 10 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error && data?.profile) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", data.profile.id);
    }
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewPassword("");
    toast.success("Password updated");
    queryClient.invalidateQueries({ queryKey: ["my-account"] });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  const profile = data?.profile;
  const roles = data?.roles ?? [];
  const primaryRole = roles[0] ?? "customer";
  const home = roleHome[primaryRole] ?? roleHome["customer"]!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {profile?.full_name || "Your account"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.map((r) => (
              <Badge key={r} variant="secondary">
                {roleLabels[r] ?? r}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {roles.includes("supreme_admin") || roles.includes("employee") ? (
            <Button asChild variant="outline">
              <Link to="/team">Our team</Link>
            </Button>
          ) : null}
          {panels.map((p) => (
            <Button key={p} asChild variant="outline">
              <Link to={PANEL_PATH[p] as never}>{PANEL_LABEL[p]}</Link>
            </Button>
          ))}
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      {profile?.must_change_password ? (
        <p className="mt-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          You're using the password allotted by the company. Please set your own password below.
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="font-display">Account details</CardTitle>
            <CardDescription>Issued and verified by the company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Username" value={profile?.username} />
            <Row label="Email" value={profile?.email} />
            <Row label="Phone" value={profile?.phone} />
            <Row label="Status" value={profile?.is_active ? "Active" : "Suspended"} />
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="font-display">{home.title}</CardTitle>
            <CardDescription>What this account gives you access to.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {home.points.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="surface-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Change password</CardTitle>
            <CardDescription>Set a private password only you know.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="flex flex-wrap items-end gap-3">
              <div className="min-w-60 flex-1 space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <SupportWidget />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
