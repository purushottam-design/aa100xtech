import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { getRequestHeader, setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { panelsForRoles } from "@/lib/admin-panels";
import {
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  SUPER_ONLY_PERMISSIONS,
} from "@/lib/permissions";

type Ctx = { supabase: any; userId: string };

const ADMIN_ROLES = [
  "company_admin",
  "interview_admin",
  "marketing_admin",
  "business_admin",
  "manager",
] as const;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function deny(message: string): never {
  setResponseStatus(403);
  throw new Error(message);
}

/** Full access snapshot for the caller (roles + custom roles + permissions). */
async function accessFor(userId: string) {
  const { resolveAccess } = await import("@/lib/rbac.server");
  const access = await resolveAccess(userId);
  return { ...access, panels: panelsForRoles(access.roles) };
}

/** Server-side authorization: the security boundary for every admin action. */
async function requirePermission(context: Ctx, permission: string) {
  const { authorize, AccessError } = await import("@/lib/rbac.server");
  try {
    const access = await authorize(context.userId, permission);
    return { ...access, panels: panelsForRoles(access.roles) };
  } catch (error) {
    if (error instanceof AccessError) setResponseStatus(error.status);
    throw error;
  }
}

async function requireSuper(context: Ctx) {
  const access = await accessFor(context.userId);
  if (!access.isSuper) deny("Super admin access only.");
  return access;
}

function clientIp(): string | null {
  return (
    (getRequestHeader("cf-connecting-ip") ??
      (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
      null) ||
    null
  );
}

/** Rough device/browser parsing — enough for a login history table. */
import { describeAgent } from "@/lib/backend/describe-agent";

async function logActivity(actorId: string, action: string, module: string, description: string) {
  const client = await admin();
  const { data: profile } = await client
    .from("profiles")
    .select("email")
    .eq("id", actorId)
    .maybeSingle();
  await client.from("admin_activity_log").insert({
    actor_id: actorId,
    actor_email: profile?.email ?? null,
    action,
    module,
    description,
    ip_address: clientIp(),
  });
}

/* ------------------------------------------------------------------ access */

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => accessFor((context as Ctx).userId));

/** Records an admin sign-in and blocks inactive / suspended accounts. */
export const recordAdminLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = (context as Ctx).userId;
    const client = await admin();
    const access = await accessFor(userId);
    const { data: profile } = await client
      .from("profiles")
      .select("email, status")
      .eq("id", userId)
      .maybeSingle();

    const status = (profile?.status as string) ?? "active";
    const blocked = !access.isSuper && status !== "active";
    const ua = getRequestHeader("user-agent") ?? null;
    const { browser, device } = describeAgent(ua);
    const ip = clientIp();
    const location = getRequestHeader("cf-ipcountry") ?? null;

    await client.from("admin_login_history").insert({
      user_id: userId,
      email: profile?.email ?? null,
      status: blocked ? `blocked_${status}` : "success",
      ip_address: ip,
      user_agent: ua,
      device,
      browser,
      location,
      suspicious: blocked,
    });

    if (!blocked) {
      const now = new Date().toISOString();
      await client
        .from("profiles")
        .update({ last_login_at: now, last_activity_at: now })
        .eq("id", userId);
      if (access.panels.length > 0 || access.isSuper) {
        await client.from("admin_sessions").insert({
          user_id: userId,
          email: profile?.email ?? null,
          device,
          browser,
          platform: device,
          ip_address: ip,
          location,
          user_agent: ua,
        });
        await logActivity(userId, "login", "auth", "Admin signed in");
      }
    }
    return { ...access, blocked, status };
  });

/* ------------------------------------------------------------- admin list */

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(["all", "active", "inactive", "suspended", "pending", "locked"]).default("all"),
  role: z.string().trim().max(60).default("all"),
  department: z.string().trim().max(60).default("all"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(10),
});

export const listAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.view");
    const client = await admin();

    const [{ data: roleRows }, { data: customRows }] = await Promise.all([
      client
        .from("user_roles")
        .select("user_id, role")
        .in("role", [...ADMIN_ROLES, "supreme_admin"]),
      client.from("admin_roles").select("user_id, role_id, roles(key, name)"),
    ]);

    const byUser = new Map<string, string[]>();
    const labelByUser = new Map<string, string[]>();
    for (const r of roleRows ?? []) {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role);
      byUser.set(r.user_id, list);
    }
    for (const r of customRows ?? []) {
      const key = r.roles?.key as string | undefined;
      if (!key) continue;
      const list = byUser.get(r.user_id) ?? [];
      if (!list.includes(key)) list.push(key);
      byUser.set(r.user_id, list);
      const labels = labelByUser.get(r.user_id) ?? [];
      labels.push(r.roles?.name ?? key);
      labelByUser.set(r.user_id, labels);
    }

    let ids = [...byUser.keys()];
    if (data.role !== "all") ids = ids.filter((id) => (byUser.get(id) ?? []).includes(data.role));
    if (ids.length === 0) return { rows: [], total: 0, page: data.page, pageSize: data.pageSize };

    const [{ data: profiles }, { data: perms }, { data: rolePerms }] = await Promise.all([
      client
        .from("profiles")
        .select(
          "id, full_name, username, email, phone, status, is_active, created_at, last_login_at, last_activity_at, avatar_url, employee_id, department_id",
        )
        .in("id", ids),
      client.from("admin_permissions").select("user_id, permission").in("user_id", ids),
      client.from("role_permissions").select("role_id, permission"),
    ]);

    const permsByRole = new Map<string, string[]>();
    for (const p of rolePerms ?? []) {
      const list = permsByRole.get(p.role_id) ?? [];
      list.push(p.permission);
      permsByRole.set(p.role_id, list);
    }
    const permsByUser = new Map<string, Set<string>>();
    for (const p of perms ?? []) {
      const set = permsByUser.get(p.user_id) ?? new Set<string>();
      set.add(p.permission);
      permsByUser.set(p.user_id, set);
    }
    for (const r of customRows ?? []) {
      const set = permsByUser.get(r.user_id) ?? new Set<string>();
      for (const p of permsByRole.get(r.role_id) ?? []) set.add(p);
      permsByUser.set(r.user_id, set);
    }

    const { data: departments } = await client.from("departments").select("id, name");
    const deptName = new Map<string, string>(
      ((departments ?? []) as any[]).map((d: any) => [d.id as string, d.name as string]),
    );

    type AdminRow = {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      status: string;
      roles: string[];
      role_labels: string[];
      permissions: string[];
      last_login_at: string | null;
      last_activity_at: string | null;
      created_at: string;
      avatar_url: string | null;
      employee_id: string | null;
      department: string | null;
      department_id: string | null;
      is_super: boolean;
    };
    let rows: AdminRow[] = ((profiles ?? []) as any[]).map((p: any) => ({
      id: p.id as string,
      full_name: (p.full_name as string) || (p.username as string) || p.email,
      email: p.email as string,
      phone: (p.phone as string) ?? null,
      status: (p.status as string) ?? "active",
      roles: byUser.get(p.id) ?? [],
      role_labels: labelByUser.get(p.id) ?? [],
      permissions: [...(permsByUser.get(p.id) ?? new Set<string>())],
      last_login_at: p.last_login_at ?? null,
      last_activity_at: p.last_activity_at ?? null,
      created_at: p.created_at,
      avatar_url: p.avatar_url ?? null,
      employee_id: p.employee_id ?? null,
      department_id: p.department_id ?? null,
      department: p.department_id ? (deptName.get(p.department_id) ?? null) : null,
      is_super: (byUser.get(p.id) ?? []).includes("supreme_admin"),
    }));

    if (data.status !== "all") rows = rows.filter((r) => r.status === data.status);
    if (data.department !== "all") rows = rows.filter((r) => r.department_id === data.department);
    if (data.search) {
      const q = data.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone ?? "").toLowerCase().includes(q) ||
          (r.employee_id ?? "").toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    const total = rows.length;
    const start = (data.page - 1) * data.pageSize;
    return {
      rows: rows.slice(start, start + data.pageSize),
      total,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

/* -------------------------------------------------------- admin hierarchy */

export const getAdminHierarchy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context as Ctx, "admins.view");
    const client = await admin();
    const { modulesForAccess } = await import("@/lib/permissions");

    const [{ data: roleRows }, { data: customRows }, { data: rolePerms }, { data: perms }] =
      await Promise.all([
        client
          .from("user_roles")
          .select("user_id, role")
          .in("role", [...ADMIN_ROLES, "supreme_admin"]),
        client.from("admin_roles").select("user_id, role_id, roles(key, name)"),
        client.from("role_permissions").select("role_id, permission"),
        client.from("admin_permissions").select("user_id, permission"),
      ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of [...(roleRows ?? [])]) {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role);
      rolesByUser.set(r.user_id, list);
    }
    const permsByRole = new Map<string, string[]>();
    for (const p of rolePerms ?? []) {
      const list = permsByRole.get(p.role_id) ?? [];
      list.push(p.permission);
      permsByRole.set(p.role_id, list);
    }
    const permsByUser = new Map<string, Set<string>>();
    for (const p of perms ?? []) {
      const set = permsByUser.get(p.user_id) ?? new Set<string>();
      set.add(p.permission);
      permsByUser.set(p.user_id, set);
    }
    for (const r of customRows ?? []) {
      const key = r.roles?.key as string | undefined;
      if (key) {
        const list = rolesByUser.get(r.user_id) ?? [];
        if (!list.includes(key)) list.push(key);
        rolesByUser.set(r.user_id, list);
      }
      const set = permsByUser.get(r.user_id) ?? new Set<string>();
      for (const p of permsByRole.get(r.role_id) ?? []) set.add(p);
      permsByUser.set(r.user_id, set);
    }

    const ids = [...rolesByUser.keys()];
    if (!ids.length) return { nodes: [] };
    const { data: profiles } = await client
      .from("profiles")
      .select("id, full_name, email, status")
      .in("id", ids);

    const nodes = ((profiles ?? []) as any[]).map((p: any) => {
      const roles = rolesByUser.get(p.id) ?? [];
      const isSuper = roles.includes("supreme_admin");
      const permissions = [...(permsByUser.get(p.id) ?? new Set<string>())];
      return {
        id: p.id as string,
        name: (p.full_name as string) || (p.email as string),
        email: p.email as string,
        status: (p.status as string) ?? "active",
        isSuper,
        roles,
        modules: modulesForAccess(roles, permissions, isSuper).map((m) => m.label),
      };
    });
    nodes.sort((a, b) => Number(b.isSuper) - Number(a.isSuper) || a.name.localeCompare(b.name));
    return { nodes };
  });

/* ----------------------------------------------------------- create admin */

const createSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().max(30).optional(),
  employeeId: z.string().trim().max(40).optional(),
  departmentId: z.string().uuid().optional(),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  password: z.string().min(10).max(128),
  role: z.string().trim().max(60),
  status: z.enum(["active", "inactive", "suspended", "pending"]).default("active"),
  permissions: z.array(z.string().max(60)).default([]),
});

const isBuiltinAdminRole = (role: string): role is (typeof ADMIN_ROLES)[number] =>
  (ADMIN_ROLES as readonly string[]).includes(role);

/** Assigns a built-in enum role or a custom role row to an account. */
async function applyRole(client: any, userId: string, role: string, actorId: string) {
  await client
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .in("role", [...ADMIN_ROLES]);
  await client.from("admin_roles").delete().eq("user_id", userId);
  if (isBuiltinAdminRole(role)) {
    await client
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    return;
  }
  const { data: roleRow } = await client
    .from("roles")
    .select("id, key")
    .eq("key", role)
    .maybeSingle();
  if (!roleRow) throw new Error("That role no longer exists.");
  if (roleRow.key === "supreme_admin") throw new Error("The Super Admin role cannot be assigned.");
  await client
    .from("admin_roles")
    .upsert(
      { user_id: userId, role_id: roleRow.id, assigned_by: actorId },
      { onConflict: "user_id,role_id" },
    );
}

async function defaultPermissionsFor(client: any, role: string): Promise<string[]> {
  if (ROLE_DEFAULT_PERMISSIONS[role]) return ROLE_DEFAULT_PERMISSIONS[role]!;
  const { data: roleRow } = await client.from("roles").select("id").eq("key", role).maybeSingle();
  if (!roleRow) return [];
  const { data } = await client
    .from("role_permissions")
    .select("permission")
    .eq("role_id", roleRow.id);
  return (data ?? []).map((p: any) => p.permission as string);
}

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.create");
    const client = await admin();

    const { data: existingProfile } = await client
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (existingProfile) throw new Error("An account with this email already exists.");

    const { data: created, error } = await client.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created?.user)
      throw new Error(error?.message ?? "Could not create the admin account.");
    const userId = created.user.id;

    const username = data.email
      .split("@")[0]!
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 40);
    const { error: profileError } = await client.from("profiles").upsert(
      {
        id: userId,
        username: `${username}`.length >= 3 ? username : `admin${userId.slice(0, 6)}`,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        employee_id: data.employeeId ?? null,
        department_id: data.departmentId ?? null,
        avatar_url: data.avatarUrl ? data.avatarUrl : null,
        status: data.status,
        is_active: data.status === "active",
        must_change_password: true,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      await client.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    try {
      await applyRole(client, userId, data.role, (context as Ctx).userId);
    } catch (roleError) {
      await client.auth.admin.deleteUser(userId);
      throw roleError;
    }

    const fallback = await defaultPermissionsFor(client, data.role);
    const permissions = (data.permissions.length ? data.permissions : fallback).filter(
      (p) => ALL_PERMISSIONS.includes(p) && !SUPER_ONLY_PERMISSIONS.includes(p),
    );
    if (permissions.length) {
      await client.from("admin_permissions").upsert(
        permissions.map((permission) => ({
          user_id: userId,
          permission,
          granted_by: (context as Ctx).userId,
        })),
        { onConflict: "user_id,permission" },
      );
    }

    await client.from("admin_notifications").insert({
      type: "admin.created",
      title: "New admin created",
      body: `${data.fullName} (${data.email}) was added as an admin.`,
      permission: "admins.view",
      severity: "info",
    });

    await logActivity(
      (context as Ctx).userId,
      "admin.create",
      "admins",
      `Created admin ${data.email}`,
    );
    return { ok: true as const, userId };
  });

/* ----------------------------------------------------------- update admin */

async function assertNotSuper(userId: string, message: string) {
  const { resolveAccess } = await import("@/lib/rbac.server");
  const access = await resolveAccess(userId);
  if (access.isSuper) deny(message);
}

const updateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  employeeId: z.string().trim().max(40).optional(),
  departmentId: z.string().uuid().optional(),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "suspended", "pending", "locked"]),
  role: z.string().trim().max(60).optional(),
});

export const updateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.edit");
    await assertNotSuper(data.userId, "The super admin account cannot be modified.");
    const client = await admin();
    const { error } = await client
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone ?? null,
        employee_id: data.employeeId ?? null,
        department_id: data.departmentId ?? null,
        avatar_url: data.avatarUrl ? data.avatarUrl : null,
        status: data.status,
        is_active: data.status === "active",
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    if (data.role) await applyRole(client, data.userId, data.role, (context as Ctx).userId);

    await logActivity(
      (context as Ctx).userId,
      "admin.update",
      "admins",
      `Updated admin ${data.userId}`,
    );
    return { ok: true as const };
  });

export const setAdminStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        status: z.enum(["active", "inactive", "suspended", "pending", "locked"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.edit");
    await assertNotSuper(data.userId, "The super admin account cannot be deactivated.");
    const client = await admin();
    const { error } = await client
      .from("profiles")
      .update({ status: data.status, is_active: data.status === "active" })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    if (data.status !== "active") {
      // Invalidate live sessions so a blocked admin loses access immediately.
      await client.auth.admin.signOut(data.userId).catch(() => undefined);
      await client
        .from("admin_sessions")
        .update({ revoked_at: new Date().toISOString(), revoked_by: (context as Ctx).userId })
        .eq("user_id", data.userId)
        .is("revoked_at", null);
    }
    await logActivity(
      (context as Ctx).userId,
      "admin.status",
      "admins",
      `Set admin ${data.userId} to ${data.status}`,
    );
    return { ok: true as const };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.delete");
    if (data.userId === (context as Ctx).userId)
      throw new Error("You cannot delete your own account.");
    await assertNotSuper(data.userId, "The super admin account cannot be deleted.");
    const client = await admin();
    const { error } = await client.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await client.from("profiles").delete().eq("id", data.userId);
    await logActivity(
      (context as Ctx).userId,
      "admin.delete",
      "admins",
      `Deleted admin ${data.userId}`,
    );
    return { ok: true as const };
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(10).max(128) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.edit");
    await assertNotSuper(data.userId, "The super admin password is managed in the environment.");
    const client = await admin();
    const { error } = await client.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await client.from("profiles").update({ must_change_password: true }).eq("id", data.userId);
    await logActivity(
      (context as Ctx).userId,
      "admin.password_reset",
      "admins",
      `Reset password for admin ${data.userId}`,
    );
    return { ok: true as const };
  });

/* ------------------------------------------------------------ permissions */

export const getAdminPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "admins.view");
    const client = await admin();
    const { data: rows } = await client
      .from("admin_permissions")
      .select("permission")
      .eq("user_id", data.userId);
    return { permissions: (rows ?? []).map((r: any) => r.permission as string) };
  });

export const setAdminPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ userId: z.string().uuid(), permissions: z.array(z.string().max(60)).max(200) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await requireSuper(context as Ctx);
    await assertNotSuper(data.userId, "Super admin permissions cannot be changed.");
    const client = await admin();
    const permissions = [...new Set(data.permissions)].filter(
      (p) => ALL_PERMISSIONS.includes(p) && !SUPER_ONLY_PERMISSIONS.includes(p),
    );
    await client.from("admin_permissions").delete().eq("user_id", data.userId);
    if (permissions.length) {
      const { error } = await client.from("admin_permissions").insert(
        permissions.map((permission) => ({
          user_id: data.userId,
          permission,
          granted_by: (context as Ctx).userId,
        })),
      );
      if (error) throw new Error(error.message);
    }
    await client.from("admin_notifications").insert({
      type: "admin.permissions",
      title: "Permissions changed",
      body: `An admin's permissions were updated (${permissions.length} granted).`,
      permission: "admins.view",
      severity: "warning",
    });
    await logActivity(
      (context as Ctx).userId,
      "admin.permissions",
      "security",
      `Updated permissions for ${data.userId} (${permissions.length} granted)`,
    );
    return { ok: true as const, permissions };
  });

/* --------------------------------------------------- activity & login log */

const pageSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});

export const listAdminActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pageSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "security.activity");
    const client = await admin();
    const from = (data.page - 1) * data.pageSize;
    let q = client
      .from("admin_activity_log")
      .select("id, actor_email, action, module, description, ip_address, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, from + data.pageSize - 1);
    if (data.search) q = q.ilike("actor_email", `%${data.search}%`);
    const { data: rows, count, error } = await q;
    if (error) return { rows: [], total: 0 };
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const listLoginHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pageSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await requirePermission(context as Ctx, "security.logins");
    const client = await admin();
    const from = (data.page - 1) * data.pageSize;
    let q = client
      .from("admin_login_history")
      .select(
        "id, email, status, ip_address, user_agent, device, browser, location, suspicious, logged_in_at",
        { count: "exact" },
      )
      .order("logged_in_at", { ascending: false })
      .range(from, from + data.pageSize - 1);
    if (data.search) q = q.ilike("email", `%${data.search}%`);
    const { data: rows, count, error } = await q;
    if (error) return { rows: [], total: 0 };
    return { rows: rows ?? [], total: count ?? 0 };
  });
