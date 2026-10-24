"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAdminSessions, revokeAdminSession } from "@/lib/admin-security.functions";
import { getAdminHierarchy } from "@/lib/admin-management.functions";

function fmt(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/** Live admin sessions with the ability to end any of them. */
export function AdminSessions() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: () => listAdminSessions({ data: {} }),
    retry: false,
    throwOnError: false,
  });

  const revoke = useMutation({
    mutationFn: (sessionId: string) => revokeAdminSession({ data: { sessionId } }),
    onSuccess: () => {
      toast.success("Session ended");
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isError) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Access denied</CardTitle>
          <CardDescription>You cannot manage sessions.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const rows = (query.data?.rows ?? []) as any[];

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="font-display text-xl">Active sessions</CardTitle>
        <CardDescription>
          Every device an admin is currently signed in on. Ending a session signs that person out
          straight away.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading sessions…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active admin sessions.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-175">
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.email ?? r.user_id}</TableCell>
                    <TableCell>{r.device ?? "—"}</TableCell>
                    <TableCell>{r.browser ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.ip_address ?? "—"}</TableCell>
                    <TableCell>{r.location ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{fmt(r.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(r.id)}
                      >
                        End session
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Who reports to whom, and what each admin can open. */
export function AdminHierarchy() {
  const query = useQuery({
    queryKey: ["admin-hierarchy"],
    queryFn: () => getAdminHierarchy(),
    retry: false,
    throwOnError: false,
  });

  if (query.isError) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Access denied</CardTitle>
          <CardDescription>You cannot view the admin hierarchy.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const nodes = (query.data?.nodes ?? []) as any[];

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="font-display text-xl">Admin hierarchy</CardTitle>
        <CardDescription>Super admin at the top, then every admin and what they can open.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admins yet.</p>
        ) : (
          nodes.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-3 ${n.isSuper ? "" : "ml-0 sm:ml-8"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{n.name}</span>
                <span className="text-sm text-muted-foreground">{n.email}</span>
                {n.isSuper ? <Badge>Super Admin</Badge> : <Badge variant="secondary">{n.status}</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(n.isSuper ? ["Everything"] : n.modules).map((m: string) => (
                  <Badge key={m} variant="outline">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
