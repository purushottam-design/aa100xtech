"use client";

import { Link } from "@/lib/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatGrid } from "@/components/admin-panel-shell";
import { ADMIN_ROLE_LABELS, PANEL_LABEL, PANEL_PATH, ADMIN_PANELS } from "@/lib/admin-panels";
import { assignRole, getPanelDashboard, removeRole } from "@/lib/admin-panels.functions";
import { listMembers } from "@/lib/accounts.functions";

const assignableRoles = [
  "company_admin",
  "interview_admin",
  "marketing_admin",
  "business_admin",
  "supreme_admin",
  "employee",
  "customer",
  "job_seeker",
  "partner",
] as const;

/** Super-admin overview: real statistics, panel switcher and role management. */
export function SuperAdminOverview() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("company_admin");

  const stats = useQuery({
    queryKey: ["admin-panel", "super"],
    queryFn: () => getPanelDashboard({ data: { panel: "super" } }),
    retry: false,
    throwOnError: false,
  });

  const members = useQuery({
    queryKey: ["members"],
    queryFn: () => listMembers(),
    retry: false,
    throwOnError: false,
  });

  const grant = useMutation({
    mutationFn: () => assignRole({ data: { email: email.trim().toLowerCase(), role: role as any } }),
    onSuccess: () => {
      toast.success("Role assigned to the existing account");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["my-admin-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (v: { userId: string; role: string }) => removeRole({ data: v }),
    onSuccess: () => {
      toast.success("Role removed");
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-10 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">Overall statistics</h2>
        <div className="mt-4">
          <StatGrid stats={stats.data?.stats ?? []} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold">Admin panels</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {ADMIN_PANELS.filter((p) => p !== "super").map((p) => (
            <Button key={p} asChild variant="outline">
              <Link to={PANEL_PATH[p] as any}>{PANEL_LABEL[p]}</Link>
            </Button>
          ))}
          <Button asChild>
            <Link to="/admin/admins">Manage admins</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/security">Security & activity</Link>
          </Button>
        </div>
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Role management</CardTitle>
          <CardDescription>
            Assign an extra role to an existing account. No duplicate account is created — the same
            email can hold several roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              grant.mutate();
            }}
          >
            <div className="min-w-60 flex-1 space-y-2">
              <Label htmlFor="role-email">Account email</Label>
              <Input
                id="role-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="min-w-48 space-y-2">
              <Label htmlFor="role-select">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ADMIN_ROLE_LABELS[r] ?? r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={grant.isPending}>
              {grant.isPending ? "Assigning…" : "Assign role"}
            </Button>
          </form>

          <div className="space-y-2">
            {(members.data ?? []).map((m: any) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{m.full_name || m.username}</p>
                  <p className="text-muted-foreground">{m.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(m.roles ?? []).length === 0 ? (
                    <span className="text-muted-foreground">No roles</span>
                  ) : null}
                  {(m.roles ?? []).map((r: string) => (
                    <Badge key={r} variant="secondary" className="gap-2">
                      {ADMIN_ROLE_LABELS[r] ?? r}
                      <button
                        type="button"
                        aria-label={`Remove ${r}`}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => revoke.mutate({ userId: m.id, role: r })}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
