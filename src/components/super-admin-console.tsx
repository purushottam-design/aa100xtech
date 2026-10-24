"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminCms } from "@/components/admin-cms";
import { AdminDashboardAnalytics } from "@/components/admin-dashboard-analytics";
import { AdminReports } from "@/components/admin-reports";
import { AdminManagement } from "@/components/admin-management";
import { AdminNotifications } from "@/components/admin-notifications";
import { AdminRoles } from "@/components/admin-roles";
import { AdminHierarchy, AdminSessions } from "@/components/admin-sessions";
import { AdminSecurity } from "@/components/admin-security";
import { AdminSupport } from "@/components/admin-support";
import { AdminTwoFactor } from "@/components/admin-two-factor";
import { SettingsForm } from "@/components/settings-form";
import { ThemeToggle } from "@/components/theme-toggle";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-panels";
import { SETTING_GROUPS } from "@/lib/app-settings";
import { MODULE_GROUPS, type ModuleDef } from "@/lib/super-admin-modules";
import {
  createUserAccount,
  deleteModuleRecord,
  deleteUserAccount,
  exportModuleRecords,
  getSuperOverview,
  getSuperStatus,
  listAllUsers,
  listModuleRecords,
  resetUserPassword,
  setUserRoles,
  updateModuleRecord,
  updateUserAccount,
} from "@/lib/super-admin.functions";
import { cn } from "@/lib/utils";

const APP_ROLES = [
  "employee",
  "customer",
  "job_seeker",
  "partner",
  "company_admin",
  "interview_admin",
  "marketing_admin",
  "business_admin",
  "manager",
] as const;

type Section = { key: string; label: string };

const NAV: { label: string; items: Section[] }[] = [
  {
    label: "Overview",
    items: [
      { key: "overview", label: "Dashboard" },
      { key: "reports", label: "Reports & exports" },
      { key: "legacy-overview", label: "Record counts" },
    ],
  },
  {
    label: "People",
    items: [
      { key: "users", label: "Users" },
      { key: "admins", label: "Admins & permissions" },
      { key: "roles", label: "Roles" },
      { key: "hierarchy", label: "Admin hierarchy" },
    ],
  },
  {
    label: "Engagement",
    items: [
      { key: "support", label: "Support tickets" },
      { key: "notifications", label: "Notifications" },
      { key: "cms", label: "Content & banners" },
    ],
  },
  ...MODULE_GROUPS.filter((g) => g.label !== "Security").map((g) => ({
    label: g.label,
    items: g.modules.map((m) => ({ key: `mod:${m.key}`, label: m.label })),
  })),
  {
    label: "Settings",
    items: SETTING_GROUPS.map((g) => ({ key: `set:${g.key}`, label: g.label })),
  },
  {
    label: "Security",
    items: [
      { key: "security", label: "Activity & logins" },
      { key: "sessions", label: "Active sessions" },
      { key: "2fa", label: "Two-factor login" },
      ...(MODULE_GROUPS.find((g) => g.label === "Security")?.modules ?? []).map((m) => ({
        key: `mod:${m.key}`,
        label: m.label,
      })),
    ],
  },
];


const MODULES: ModuleDef[] = MODULE_GROUPS.flatMap((g) => g.modules);

function fmt(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  return s.length > 60 ? `${s.slice(0, 60)}…` : s;
}

function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    toast.info("Nothing to export yet.");
    return;
  }
  const keys = Object.keys(rows[0] as object);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* --------------------------------------------------------------- overview */

function OverviewSection() {
  const q = useQuery({ queryKey: ["super-overview"], queryFn: () => getSuperOverview(), retry: false });
  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  const counts = q.data?.counts ?? {};
  const cards: { label: string; table: string }[] = [
    { label: "Users", table: "profiles" },
    { label: "Role grants", table: "user_roles" },
    { label: "Access requests", table: "access_requests" },
    { label: "Bookings", table: "consultation_bookings" },
    { label: "Candidates", table: "candidate_submissions" },
    { label: "Partner applications", table: "partner_applications" },
    { label: "Affiliates", table: "affiliates" },
    { label: "Conversions", table: "conversions" },
    { label: "Payouts", table: "payouts" },
    { label: "Catalog items", table: "catalog_items" },
    { label: "Activity entries", table: "admin_activity_log" },
    { label: "Login records", table: "admin_login_history" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.table} className="surface-card">
            <CardHeader className="pb-2">
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="font-display text-2xl">{counts[c.table] ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Paid consultations</CardTitle>
          <CardDescription>
            {q.data?.paidCount ?? 0} paid bookings · total value {q.data?.paidTotal ?? 0}
          </CardDescription>
        </CardHeader>
      </Card>
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">Latest admin activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(q.data?.recent ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            (q.data?.recent ?? []).map((r: any) => (
              <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{r.module}</Badge>
                <span className="font-medium">{r.action}</span>
                <span className="text-muted-foreground">{r.description}</span>
                <span className="ml-auto text-xs text-muted-foreground">{fmt(r.created_at)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ users */

function UsersSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [rolesRow, setRolesRow] = useState<any>(null);
  const [pwdRow, setPwdRow] = useState<any>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const q = useQuery({
    queryKey: ["super-users", search, role, status, page],
    queryFn: () => listAllUsers({ data: { search, role, status, page, pageSize } }),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["super-users"] });

  const statusMutation = useMutation({
    mutationFn: (v: { userId: string; status: "active" | "inactive" | "suspended" }) =>
      updateUserAccount({ data: v }),
    onSuccess: () => {
      toast.success("User updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = q.data?.rows ?? [];
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-52 flex-1"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select value={role} onValueChange={(v) => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {APP_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ADMIN_ROLE_LABELS[r] ?? r}</SelectItem>
            ))}
            <SelectItem value="supreme_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>+ Create user</Button>
        <Button
          variant="outline"
          onClick={() => downloadCsv("users", rows as Record<string, unknown>[])}
        >
          Export
        </Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users match these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.roles.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        r.roles.map((role: string) => (
                          <Badge key={role} variant="secondary">{ADMIN_ROLE_LABELS[role] ?? role}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === "active" ? "default" : r.status === "suspended" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmt(r.last_login_at)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditRow(r)}>Edit</Button>
                      {r.is_super ? (
                        <Badge variant="outline">Protected</Badge>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              statusMutation.mutate({
                                userId: r.id,
                                status: r.status === "active" ? "inactive" : "active",
                              })
                            }
                          >
                            {r.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={r.status === "suspended"}
                            onClick={() => statusMutation.mutate({ userId: r.id, status: "suspended" })}
                          >
                            Suspend
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setRolesRow(r)}>Roles</Button>
                          <Button size="sm" variant="outline" onClick={() => setPwdRow(r)}>Reset password</Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteRow(r)}>Delete</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} users</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="self-center">Page {page} / {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onDone={refresh} />
      <EditUserDialog row={editRow} onClose={() => setEditRow(null)} onDone={refresh} />
      <RolesDialog row={rolesRow} onClose={() => setRolesRow(null)} onDone={refresh} />
      <PasswordDialog row={pwdRow} onClose={() => setPwdRow(null)} />
      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteRow?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account, its roles and permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteUserAccount({ data: { userId: deleteRow.id } });
                  toast.success("User deleted");
                  setDeleteRow(null);
                  refresh();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer" as (typeof APP_ROLES)[number],
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await createUserAccount({ data: { ...form, phone: form.phone || undefined, status: "active" } });
      toast.success("User created");
      onOpenChange(false);
      setForm({ fullName: "", email: "", phone: "", password: "", role: "customer" });
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>The account is created immediately and can sign in.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Phone (optional)</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Temporary password (min 10 characters)</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ADMIN_ROLE_LABELS[r] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ row, onClose, onDone }: { row: any; onClose: () => void; onDone: () => void }) {
  if (!row) return null;
  return <EditUserDialogInner key={row.id} row={row} onClose={onClose} onDone={onDone} />;
}

function EditUserDialogInner({ row, onClose, onDone }: { row: any; onClose: () => void; onDone: () => void }) {
  const [fullName, setFullName] = useState<string>(row.full_name ?? "");
  const [phone, setPhone] = useState<string>(row.phone ?? "");

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>{row?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={async () => {
              try {
                await updateUserAccount({ data: { userId: row.id, fullName, phone } });
                toast.success("User updated");
                onClose();
                onDone();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RolesDialog({ row, onClose, onDone }: { row: any; onClose: () => void; onDone: () => void }) {
  if (!row) return null;
  return <RolesDialogInner key={row.id} row={row} onClose={onClose} onDone={onDone} />;
}

function RolesDialogInner({ row, onClose, onDone }: { row: any; onClose: () => void; onDone: () => void }) {
  const [selected, setSelected] = useState<string[]>(
    ((row.roles ?? []) as string[]).filter((r) => r !== "supreme_admin"),
  );

  const toggle = (r: string) =>
    setSelected((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roles</DialogTitle>
          <DialogDescription>{row?.email}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2">
          {APP_ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <Checkbox checked={selected.includes(r)} onCheckedChange={() => toggle(r)} />
              {ADMIN_ROLE_LABELS[r] ?? r}
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={async () => {
              try {
                await setUserRoles({ data: { userId: row.id, roles: selected as any } });
                toast.success("Roles updated");
                onClose();
                onDone();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({ row, onClose }: { row: any; onClose: () => void }) {
  const [password, setPassword] = useState("");
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>{row?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label>New password (min 10 characters)</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={async () => {
              try {
                await resetUserPassword({ data: { userId: row.id, password } });
                toast.success("Password reset");
                setPassword("");
                onClose();
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- modules */

function ModuleSection({ mod }: { mod: ModuleDef }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["super-module", mod.key, search, page],
    queryFn: () => listModuleRecords({ data: { module: mod.key, search, page, pageSize } }),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["super-module", mod.key] });

  const rows = (q.data?.rows ?? []) as any[];
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const setValue = async (id: string, column: string, value: string | boolean) => {
    try {
      await updateModuleRecord({ data: { module: mod.key, id, column, value } });
      toast.success("Updated");
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-52 flex-1"
          placeholder={`Search ${mod.label.toLowerCase()}`}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const res = await exportModuleRecords({ data: { module: mod.key } });
              downloadCsv(mod.key, res.rows as Record<string, unknown>[]);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          Export CSV
        </Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading {mod.label.toLowerCase()}…</p>
      ) : q.isError ? (
        <p className="text-sm text-muted-foreground">{(q.error as Error).message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                {mod.columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                {mod.statusColumn || mod.extraStatus || mod.deletable ? (
                  <TableHead className="text-right">Actions</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  {mod.columns.map((c) => (
                    <TableCell key={c.key} className={c.key === mod.columns[0]?.key ? "font-medium" : "text-muted-foreground"}>
                      {c.key === "active" ? (
                        <Badge variant={r[c.key] ? "default" : "secondary"}>{r[c.key] ? "Active" : "Off"}</Badge>
                      ) : (
                        fmt(r[c.key])
                      )}
                    </TableCell>
                  ))}
                  {mod.statusColumn || mod.extraStatus || mod.deletable ? (
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {mod.statusColumn ? (
                          <Select
                            value={String(r[mod.statusColumn] ?? "")}
                            onValueChange={(v) => setValue(r.id, mod.statusColumn as string, v)}
                          >
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(mod.statusOptions ?? []).map((o) => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                        {mod.extraStatus ? (
                          <Select
                            value={String(r[mod.extraStatus.column] ?? "")}
                            onValueChange={(v) => setValue(r.id, mod.extraStatus!.column, v)}
                          >
                            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {mod.extraStatus.options.map((o) => (
                                <SelectItem key={o} value={o}>{o}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                        {mod.columns.some((c) => c.key === "active") ? (
                          <Button size="sm" variant="outline" onClick={() => setValue(r.id, "active", !r['active'])}>
                            {r['active'] ? "Deactivate" : "Activate"}
                          </Button>
                        ) : null}
                        {mod.deletable ? (
                          <Button size="sm" variant="destructive" onClick={() => setDeleteId(r.id)}>Delete</Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} records</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="self-center">Page {page} / {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteModuleRecord({ data: { module: mod.key, id: deleteId as string } });
                  toast.success("Deleted");
                  setDeleteId(null);
                  refresh();
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------------------------------------------------------- console */

export function SuperAdminConsole({ initialSection }: { initialSection?: string | undefined }) {
  const status = useQuery({ queryKey: ["super-status"], queryFn: () => getSuperStatus(), retry: false, throwOnError: false });
  const [section, setSection] = useState(initialSection ?? "overview");
  const [navOpen, setNavOpen] = useState(false);

  if (status.isLoading) return <p className="text-muted-foreground">Checking your access…</p>;
  if (!status.data?.isSuper) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Super admin only</CardTitle>
          <CardDescription>This console is reserved for the super admin account.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const activeModule = section.startsWith("mod:")
    ? MODULES.find((m) => m.key === section.slice(4))
    : undefined;
  const activeLabel =
    activeModule?.label ??
    NAV.flatMap((g) => g.items).find((i) => i.key === section)?.label ??
    "Dashboard";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-64 lg:shrink-0">
        <Button variant="outline" className="w-full lg:hidden" onClick={() => setNavOpen((v) => !v)}>
          {navOpen ? "Hide menu" : `Menu — ${activeLabel}`}
        </Button>
        <nav
          className={cn(
            "mt-3 space-y-4 rounded-xl border border-border/60 p-3 lg:mt-0 lg:block",
            navOpen ? "block" : "hidden",
          )}
          aria-label="Super admin sections"
        >
          {NAV.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="mt-1 space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSection(item.key);
                      setNavOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      section === item.key
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{activeLabel}</h2>
          <ThemeToggle />
        </div>
        {section === "overview" ? <AdminDashboardAnalytics /> : null}
        {section === "reports" ? <AdminReports /> : null}
        {section === "legacy-overview" ? <OverviewSection /> : null}
        {section === "users" ? <UsersSection /> : null}
        {section === "admins" ? <AdminManagement /> : null}
        {section === "roles" ? <AdminRoles /> : null}
        {section === "hierarchy" ? <AdminHierarchy /> : null}
        {section === "sessions" ? <AdminSessions /> : null}
        {section === "support" ? <AdminSupport /> : null}
        {section === "notifications" ? <AdminNotifications /> : null}
        {section === "cms" ? <AdminCms /> : null}
        {section === "2fa" ? <AdminTwoFactor /> : null}
        {section === "security" ? <AdminSecurity /> : null}
        {section.startsWith("set:") ? (
          <SettingsForm key={section} group={section.slice(4) as "website" | "general" | "email"} />
        ) : null}
        {activeModule ? <ModuleSection key={activeModule.key} mod={activeModule} /> : null}

      </div>

    </div>
  );
}
