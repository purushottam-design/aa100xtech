import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMyAccess } from "@/components/admin-management";
import { PERMISSION_GROUPS, SUPER_ONLY_PERMISSIONS } from "@/lib/permissions";
import {
  createRole,
  deleteRole,
  duplicateRole,
  listRoles,
  updateRole,
} from "@/lib/roles.functions";

type RoleRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string;
  is_system: boolean;
  permissions: string[];
  adminCount: number;
};

const assignable = PERMISSION_GROUPS.map((group) => ({
  label: group.label,
  items: group.permissions.filter((item) => !SUPER_ONLY_PERMISSIONS.includes(item.key)) as {
    key: string;
    label: string;
  }[],
})).filter((group) => group.items.length > 0);

/** Create, edit, duplicate and delete roles with their own permission set. */
export function AdminRoles() {
  const queryClient = useQueryClient();
  const access = useMyAccess();
  const isSuper = access.data?.isSuper ?? false;

  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<RoleRow | null>(null);

  const query = useQuery({
    queryKey: ["roles"],
    queryFn: () => listRoles(),
    enabled: access.isSuccess,
    retry: false,
    throwOnError: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    queryClient.invalidateQueries({ queryKey: ["admins"] });
  };

  const dupMutation = useMutation({
    mutationFn: (roleId: string) => duplicateRole({ data: { roleId } }),
    onSuccess: () => {
      toast.success("Role duplicated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (roleId: string) => deleteRole({ data: { roleId } }),
    onSuccess: () => {
      toast.success("Role deleted");
      setRemoving(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isError) {
    return (
      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="font-display text-xl">Access denied</CardTitle>
          <CardDescription>You cannot view roles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const rows = (query.data ?? []) as RoleRow[];

  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display text-xl">Roles</CardTitle>
            <CardDescription>
              Build any role you need and choose exactly what it can do. Roles work the same on the
              website and in the phone app.
            </CardDescription>
          </div>
          {isSuper ? <Button onClick={() => setCreating(true)}>+ Create role</Button> : null}
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-175">
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Admins</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {r.name}
                          {r.is_system ? <Badge variant="secondary">Built-in</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.description ?? "—"}</TableCell>
                      <TableCell>{r.key === "supreme_admin" ? "All" : r.permissions.length}</TableCell>
                      <TableCell>{r.adminCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {isSuper && r.key !== "supreme_admin" ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={dupMutation.isPending}
                                onClick={() => dupMutation.mutate(r.id)}
                              >
                                Duplicate
                              </Button>
                            </>
                          ) : null}
                          {isSuper && !r.is_system ? (
                            <Button size="sm" variant="destructive" onClick={() => setRemoving(r)}>
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
        </CardContent>
      </Card>

      <RoleDialog
        open={creating}
        onOpenChange={setCreating}
        role={null}
        onDone={() => {
          setCreating(false);
          refresh();
        }}
      />
      <RoleDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        role={editing}
        onDone={() => {
          setEditing(null);
          refresh();
        }}
      />

      <AlertDialog open={Boolean(removing)} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.adminCount
                ? `${removing.adminCount} admin(s) will lose the access this role gives them.`
                : "This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removing && removeMutation.mutate(removing.id)}
              disabled={removeMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RoleDialog({
  open,
  onOpenChange,
  role,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  role: RoleRow | null;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [seeded, setSeeded] = useState<string | null>(null);

  const seedKey = role?.id ?? (open ? "new" : null);
  if (open && seedKey !== seeded) {
    setSeeded(seedKey);
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setSelected(role?.permissions ?? []);
  }
  if (!open && seeded !== null) setSeeded(null);

  const allKeys = useMemo(
    () => assignable.flatMap((g) => g.items.map((i) => i.key)),
    [],
  );

  const toggle = (key: string, on: boolean) =>
    setSelected((prev) => (on ? [...new Set([...prev, key])] : prev.filter((p) => p !== key)));

  const mutation = useMutation({
    mutationFn: () =>
      role
        ? updateRole({
            data: { roleId: role.id, name, description, color: role.color, permissions: selected },
          })
        : createRole({ data: { name, description, color: "slate", permissions: selected } }),
    onSuccess: () => {
      toast.success(role ? "Role updated" : "Role created");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{role ? `Edit ${role.name}` : "Create a role"}</DialogTitle>
          <DialogDescription>Tick everything this role is allowed to do.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role name</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Description</Label>
            <Input
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this role is for"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setSelected(allKeys)}>
            Select all
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setSelected([])}>
            Remove all
          </Button>
          <span className="self-center text-sm text-muted-foreground">{selected.length} selected</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {assignable.map((group) => (
            <div key={group.label} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold">{group.label}</p>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <label key={item.key} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selected.includes(item.key)}
                      onCheckedChange={(v) => toggle(item.key, v === true)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || name.trim().length < 2}
          >
            {role ? "Save role" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
