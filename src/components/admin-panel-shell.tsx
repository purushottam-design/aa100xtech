"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { PANEL_LABEL, PANEL_PATH, type AdminPanel } from "@/lib/admin-panels";
import { getMyAdminRoles } from "@/lib/admin-panels.functions";
import { AdminNav } from "@/components/admin-nav";

export function useMyAdminRoles() {
  return useQuery({
    queryKey: ["my-admin-roles"],
    queryFn: () => getMyAdminRoles(),
    retry: false,
    throwOnError: false,
  });
}

export function AdminPanelShell({
  panel,
  description,
  children,
}: {
  panel: AdminPanel;
  description: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useMyAdminRoles();
  const panels = access.data?.panels ?? [];

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

  if (access.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (access.isError || !panels.includes(panel)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Access denied</h1>
        <p className="mt-3 text-muted-foreground">
          You are not authorized to access this dashboard. This role is not assigned to your
          account.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {panels.length > 0 ? (
            <Button asChild>
              <Link to="/admin/select">My dashboards</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to my account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Admin panel</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {PANEL_LABEL[panel]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Current role: {PANEL_LABEL[panel]}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">My account</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch role</DropdownMenuLabel>
              {panels.map((p) => (
                <DropdownMenuItem key={p} asChild disabled={p === panel}>
                  <Link to={PANEL_PATH[p] as any}>{PANEL_LABEL[p]}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard">Account settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleSignOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AdminNav className="mt-6" />
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function StatGrid({ stats }: { stats: { label: string; value: number }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="surface-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-3xl">{s.value.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function DataTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: (string | number | null)[][];
}) {
  return (
    <Card className="surface-card mt-6">
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        ) : (
          <table className="w-full min-w-125 text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                {columns.map((c) => (
                  <th key={c} className="py-2 pr-4 font-medium">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  {r.map((cell, j) => (
                    <td key={j} className="py-2 pr-4">
                      {cell ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
