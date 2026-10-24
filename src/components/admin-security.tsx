"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAdminActivity, listLoginHistory } from "@/lib/admin-management.functions";
import { useMyAccess } from "@/components/admin-management";

function fmt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function Pager({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} record{total === 1 ? "" : "s"} · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

/** Admin activity log and login history, both permission-gated on the server. */
export function AdminSecurity() {
  const access = useMyAccess();
  const isSuper = access.data?.isSuper ?? false;
  const perms = access.data?.permissions ?? [];
  const can = (p: string) => isSuper || perms.includes(p);

  const [activityPage, setActivityPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const [activitySearch, setActivitySearch] = useState("");
  const [loginSearch, setLoginSearch] = useState("");
  const pageSize = 20;

  const activity = useQuery({
    queryKey: ["admin-activity", activityPage, activitySearch],
    queryFn: () =>
      listAdminActivity({ data: { page: activityPage, pageSize, search: activitySearch || undefined } }),
    enabled: access.isSuccess && can("security.activity"),
    retry: false,
    throwOnError: false,
  });

  const logins = useQuery({
    queryKey: ["admin-logins", loginPage, loginSearch],
    queryFn: () =>
      listLoginHistory({ data: { page: loginPage, pageSize, search: loginSearch || undefined } }),
    enabled: access.isSuccess && can("security.logins"),
    retry: false,
    throwOnError: false,
  });

  if (access.isLoading) return <p className="text-muted-foreground">Checking your access…</p>;

  if (!can("security.activity") && !can("security.logins")) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Access denied</CardTitle>
          <CardDescription>Your account has no security permissions.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Tabs defaultValue={can("security.activity") ? "activity" : "logins"}>
      <TabsList>
        {can("security.activity") ? <TabsTrigger value="activity">Admin activity</TabsTrigger> : null}
        {can("security.logins") ? <TabsTrigger value="logins">Login history</TabsTrigger> : null}
      </TabsList>

      <TabsContent value="activity">
        <Card className="surface-card mt-4">
          <CardHeader>
            <CardTitle className="font-display text-xl">Admin activity</CardTitle>
            <CardDescription>Every administrative action recorded by the server.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              className="mb-4 max-w-sm"
              placeholder="Filter by admin email"
              value={activitySearch}
              onChange={(e) => {
                setActivitySearch(e.target.value);
                setActivityPage(1);
              }}
            />
            {activity.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading activity…</p>
            ) : (activity.data?.rows ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-175">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activity.data?.rows ?? []).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.actor_email ?? "—"}</TableCell>
                        <TableCell>{r.action}</TableCell>
                        <TableCell>{r.module}</TableCell>
                        <TableCell className="text-muted-foreground">{r.description ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{fmt(r.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pager
              page={activityPage}
              total={activity.data?.total ?? 0}
              pageSize={pageSize}
              onPage={setActivityPage}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logins">
        <Card className="surface-card mt-4">
          <CardHeader>
            <CardTitle className="font-display text-xl">Login history</CardTitle>
            <CardDescription>Admin sign-ins, including blocked attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              className="mb-4 max-w-sm"
              placeholder="Filter by email"
              value={loginSearch}
              onChange={(e) => {
                setLoginSearch(e.target.value);
                setLoginPage(1);
              }}
            />
            {logins.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading login history…</p>
            ) : (logins.data?.rows ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-175">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Login time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logins.data?.rows ?? []).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.email ?? "—"}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell className="text-muted-foreground">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="max-w-75 truncate text-muted-foreground">
                          {r.user_agent ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{fmt(r.logged_in_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <Pager
              page={loginPage}
              total={logins.data?.total ?? 0}
              pageSize={pageSize}
              onPage={setLoginPage}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
