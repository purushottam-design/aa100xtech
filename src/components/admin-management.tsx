"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import {
  createAdmin,
  deleteAdmin,
  getMyAccess,
  listAdmins,
  resetAdminPassword,
  setAdminPermissions,
  setAdminStatus,
  updateAdmin,
} from "@/lib/admin-management.functions";
import {
  PERMISSION_GROUPS,
  ROLE_DEFAULT_PERMISSIONS,
  ALL_PERMISSIONS,
  ADMIN_ROLE_MODULES,
  PERMISSION_ROUTES,
  SUPER_ONLY_PERMISSIONS,
} from "@/lib/permissions";
import { seedStarterAdmins } from "@/lib/admin-seed.functions";

const adminRoles = ["company_admin", "interview_admin", "marketing_admin", "business_admin"] as const;
type AdminRole = (typeof adminRoles)[number];

type AdminRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
  is_super: boolean;
};

function fmt(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function statusVariant(status: string) {
  if (status === "active") return "default" as const;
  if (status === "suspended") return "destructive" as const;
  return "secondary" as const;
}

export function useMyAccess() {
  return useQuery({
    queryKey: ["my-access"],
    queryFn: async () => {
      // Signed-out visitors (public dashboard chooser) must not call the
      // protected endpoint — it would fail with an authorization error.
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (!data.session) return null;
      return getMyAccess();
    },
    retry: false,
    throwOnError: false,
  });
}

/** Complete admin management surface: list, create, edit, permissions, security. */
export function AdminManagement() {
  const queryClient = useQueryClient();
  const access = useMyAccess();
  const isSuper = access.data?.isSuper ?? false;
  const permissions = access.data?.permissions ?? [];
  const can = (p: string) => isSuper || permissions.includes(p);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");
  const [role, setRole] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<AdminRow | null>(null);
  const [permRow, setPermRow] = useState<AdminRow | null>(null);
  const [pwdRow, setPwdRow] = useState<AdminRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<AdminRow | null>(null);

  const query = useQuery({
    queryKey: ["admins", search, status, role, page],
    queryFn: () => listAdmins({ data: { search, status, role, page, pageSize } }),
    enabled: access.isSuccess && can("admins.view"),
    retry: false,
    throwOnError: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admins"] });
    queryClient.invalidateQueries({ queryKey: ["my-access"] });
  };

  const statusMutation = useMutation({
    mutationFn: (v: { userId: string; status: "active" | "inactive" | "suspended" }) =>
      setAdminStatus({ data: v }),
    onSuccess: () => {
      toast.success("Admin status updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => deleteAdmin({ data: { userId } }),
    onSuccess: () => {
      toast.success("Admin deleted");
      setDeleteRow(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (access.isLoading) {
    return <p className="text-muted-foreground">Checking your access…</p>;
  }
  if (!can("admins.view")) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Access denied</CardTitle>
          <CardDescription>
            Your account does not have the “Admins: view” permission.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const rows = (query.data?.rows ?? []) as AdminRow[];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <RoleModuleMap />
      <Card className="surface-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">Admin management</CardTitle>
            <CardDescription>
              Create admins, set their status and grant only the modules they may use.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSuper ? <SeedAdminsButton onDone={refresh} /> : null}
            {can("admins.create") ? (
              <Button onClick={() => setCreateOpen(true)}>+ Create admin</Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              className="min-w-52 flex-1"
              placeholder="Search name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {adminRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
                <SelectItem value="supreme_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading admins…</p>
          ) : query.isError ? (
            <p className="text-sm text-muted-foreground">
              You do not have permission to perform this action.
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin accounts match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-200">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {r.roles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {ADMIN_ROLE_LABELS[role] ?? role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>{r.is_super ? "All" : r.permissions.length}</TableCell>
                      <TableCell className="text-muted-foreground">{fmt(r.last_login_at)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {can("admins.edit") && !r.is_super ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditRow(r)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  statusMutation.mutate({
                                    userId: r.id,
                                    status: r.status === "active" ? "inactive" : "active",
                                  })
                                }
                                disabled={statusMutation.isPending}
                              >
                                {r.status === "active" ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  statusMutation.mutate({ userId: r.id, status: "suspended" })
                                }
                                disabled={r.status === "suspended" || statusMutation.isPending}
                              >
                                Suspend
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setPwdRow(r)}>
                                Reset password
                              </Button>
                            </>
                          ) : null}
                          {isSuper && !r.is_super ? (
                            <Button size="sm" variant="outline" onClick={() => setPermRow(r)}>
                              Permissions
                            </Button>
                          ) : null}
                          {can("admins.delete") && !r.is_super ? (
                            <Button size="sm" variant="destructive" onClick={() => setDeleteRow(r)}>
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {total} admin{total === 1 ? "" : "s"} · page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} onDone={refresh} />
      <EditAdminDialog row={editRow} onClose={() => setEditRow(null)} onDone={refresh} />
      <PermissionsDialog row={permRow} onClose={() => setPermRow(null)} onDone={refresh} />
      <ResetPasswordDialog row={pwdRow} onClose={() => setPwdRow(null)} />

      <AlertDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow?.email} will lose access immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteRow) removeMutation.mutate(deleteRow.id);
              }}
            >
              {removeMutation.isPending ? "Deleting…" : "Delete admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PermissionPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (key: string, on: boolean) =>
    onChange(on ? [...new Set([...value, key])] : value.filter((v) => v !== key));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(ALL_PERMISSIONS.filter((p) => !SUPER_ONLY_PERMISSIONS.includes(p)))}>
          Select all
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([])}>
          Clear all
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.module} className="rounded-xl border border-border/60 p-3">
            <p className="text-sm font-medium">{group.label}</p>
            <div className="mt-2 space-y-2">
              {group.permissions.map((p) => (
                <label key={p.key} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    className="mt-0.5"
                    checked={value.includes(p.key)}
                    disabled={SUPER_ONLY_PERMISSIONS.includes(p.key)}
                    onCheckedChange={(c) => toggle(p.key, c === true)}
                  />
                  <span>
                    {p.label}
                    <span className="block text-xs text-muted-foreground">
                      {SUPER_ONLY_PERMISSIONS.includes(p.key)
                        ? "Super admin only"
                        : (PERMISSION_ROUTES[p.key] ?? "—")}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateAdminDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<AdminRole>("company_admin");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [permissions, setPermissions] = useState<string[]>(
    ROLE_DEFAULT_PERMISSIONS["company_admin"] ?? [],
  );

  const mutation = useMutation({
    mutationFn: () =>
      createAdmin({
        data: { fullName, email, phone: phone || undefined, password, role, status, permissions },
      }),
    onSuccess: () => {
      toast.success("Admin created");
      setFullName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirm("");
      onOpenChange(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create admin</DialogTitle>
          <DialogDescription>
            The account is created instantly and can sign in with this email and password.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password !== confirm) {
              toast.error("Passwords do not match");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ca-name">Full name</Label>
              <Input id="ca-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-email">Email</Label>
              <Input id="ca-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-phone">Phone</Label>
              <Input id="ca-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-role">Role</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v as AdminRole);
                  setPermissions(ROLE_DEFAULT_PERMISSIONS[v] ?? []);
                }}
              >
                <SelectTrigger id="ca-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {adminRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ADMIN_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-password">Password</Label>
              <Input
                id="ca-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-confirm">Confirm password</Label>
              <Input
                id="ca-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="ca-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Permissions</p>
            <PermissionPicker value={permissions} onChange={setPermissions} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAdminDialog({
  row,
  onClose,
  onDone,
}: {
  row: AdminRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">("active");
  const [role, setRole] = useState<AdminRole>("company_admin");
  const key = row?.id ?? "none";

  useEffect(() => {
    if (!row) return;
    setFullName(row.full_name);
    setPhone(row.phone ?? "");
    setStatus((row.status as typeof status) ?? "active");
    const current = row.roles.find((r) => (adminRoles as readonly string[]).includes(r));
    setRole((current as AdminRole) ?? "company_admin");
  }, [key]);

  const mutation = useMutation({
    mutationFn: () =>
      updateAdmin({ data: { userId: row!.id, fullName, phone: phone || undefined, status, role } }),
    onSuccess: () => {
      toast.success("Admin updated");
      onClose();
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit admin</DialogTitle>
          <DialogDescription>{row?.email}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="ea-name">Full name</Label>
            <Input id="ea-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ea-phone">Phone</Label>
            <Input id="ea-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ea-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger id="ea-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adminRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ADMIN_ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ea-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="ea-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsDialog({
  row,
  onClose,
  onDone,
}: {
  row: AdminRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState<string[]>([]);
  const key = row?.id ?? "none";
  useEffect(() => {
    setValue(row?.permissions ?? []);
  }, [key]);

  const mutation = useMutation({
    mutationFn: () => setAdminPermissions({ data: { userId: row!.id, permissions: value } }),
    onSuccess: () => {
      toast.success("Permissions saved");
      onClose();
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Admin permissions</DialogTitle>
          <DialogDescription>
            {row?.email} — only these modules and actions will be available.
          </DialogDescription>
        </DialogHeader>
        <PermissionPicker value={value} onChange={setValue} />
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save permissions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ row, onClose }: { row: AdminRow | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => resetAdminPassword({ data: { userId: row!.id, password } }),
    onSuccess: () => {
      toast.success("Password reset — share it securely with the admin");
      setPassword("");
      setConfirm("");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>{row?.email}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password !== confirm) {
              toast.error("Passwords do not match");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="rp-password">New password</Label>
            <Input
              id="rp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={10}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rp-confirm">Confirm password</Label>
            <Input
              id="rp-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={10}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Reset password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


/** Real admin roles of the business and the modules each one owns. */
function RoleModuleMap() {
  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="font-display text-xl">Roles & modules</CardTitle>
        <CardDescription>
          Each admin role owns the modules below. Permissions map to the real pages they unlock and
          are re-checked on the server for every request.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(ADMIN_ROLE_MODULES).map(([role, modules]) => (
          <div key={role} className="rounded-xl border border-border/60 p-3">
            <p className="text-sm font-medium">{ADMIN_ROLE_LABELS[role] ?? role}</p>
            <ul className="mt-2 space-y-1.5">
              {modules.map((m) => (
                <li key={`${role}-${m.label}`} className="text-sm">
                  <span>{m.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {m.route} · {m.permission}
                    {m.superOnly ? " · super only" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** One-click creation of the four role admins with their default modules. */
function SeedAdminsButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<
    { created: { email: string; role: string; password: string }[]; skipped: { email: string }[] } | null
  >(null);

  const run = async () => {
    setBusy(true);
    try {
      const res = await seedStarterAdmins();
      setResult(res as any);
      toast.success(`${res.created.length} admin account(s) created`);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={run} disabled={busy}>
        {busy ? "Seeding…" : "Seed role admins"}
      </Button>
      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role admins ready</DialogTitle>
            <DialogDescription>
              Copy these temporary passwords now — they are shown only once. Each admin must change
              the password after signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {(result?.created ?? []).length === 0 ? (
              <p className="text-muted-foreground">
                All role admins already exist; their module permissions were refreshed.
              </p>
            ) : (
              (result?.created ?? []).map((c) => (
                <div key={c.email} className="rounded-lg border border-border/60 p-2">
                  <p className="font-medium">{ADMIN_ROLE_LABELS[c.role] ?? c.role}</p>
                  <p className="text-muted-foreground">{c.email}</p>
                  <p className="font-mono text-xs">{c.password}</p>
                </div>
              ))
            )}
            {(result?.skipped ?? []).length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Existing accounts refreshed: {(result?.skipped ?? []).map((s) => s.email).join(", ")}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button onClick={() => setResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
