import "server-only";
/**
 * Custom role management. The super admin can build any role (e.g. "Regional
 * Manager") and it works across the website and the app immediately, because
 * every permission check resolves roles through src/lib/rbac.server.ts.
 */
import { createServerFn } from "@/lib/backend/server";
import { getRequestHeader, setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  SUPER_ONLY_PERMISSIONS,
} from "@/lib/permissions";

type Ctx = { supabase: any; userId: string };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function guard(context: Ctx, permission?: string, superOnly = false) {
  const { authorize, authorizeSuper, AccessError } = await import("@/lib/rbac.server");
  try {
    return superOnly
      ? await authorizeSuper(context.userId)
      : await authorize(context.userId, permission);
  } catch (error) {
    if (error instanceof AccessError) setResponseStatus(error.status);
    throw error;
  }
}

function clientIp(): string | null {
  return (
    (getRequestHeader("cf-connecting-ip") ??
      (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
      null) ||
    null
  );
}

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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || `role_${Date.now().toString(36)}`;

/** Makes sure the built-in roles carry their default permission bundle. */
async function seedSystemRolePermissions() {
  const client = await admin();
  const { data: roles } = await client.from("roles").select("id, key").eq("is_system", true);
  for (const role of roles ?? []) {
    const defaults = ROLE_DEFAULT_PERMISSIONS[role.key as string];
    if (!defaults?.length) continue;
    const { count } = await client
      .from("role_permissions")
      .select("id", { count: "exact", head: true })
      .eq("role_id", role.id);
    if ((count ?? 0) > 0) continue;
    await client.from("role_permissions").upsert(
      defaults.map((permission) => ({ role_id: role.id, permission })),
      { onConflict: "role_id,permission" },
    );
  }
}

export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await guard(context as Ctx, "roles.view");
    await seedSystemRolePermissions();
    const client = await admin();
    const [{ data: roles }, { data: perms }, { data: assignments }] = await Promise.all([
      client.from("roles").select("*").order("is_system", { ascending: false }).order("name"),
      client.from("role_permissions").select("role_id, permission"),
      client.from("admin_roles").select("role_id, user_id"),
    ]);
    const permByRole = new Map<string, string[]>();
    for (const p of perms ?? []) {
      const list = permByRole.get(p.role_id) ?? [];
      list.push(p.permission);
      permByRole.set(p.role_id, list);
    }
    const countByRole = new Map<string, number>();
    for (const a of assignments ?? []) {
      countByRole.set(a.role_id, (countByRole.get(a.role_id) ?? 0) + 1);
    }
    return (roles ?? []).map((r: any) => ({
      ...r,
      permissions: permByRole.get(r.id) ?? [],
      adminCount: countByRole.get(r.id) ?? 0,
    }));
  });

const roleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(240).optional(),
  color: z.string().trim().max(20).default("slate"),
  permissions: z.array(z.string().max(60)).max(200).default([]),
});

function cleanPermissions(list: string[]) {
  return [...new Set(list)].filter(
    (p) => ALL_PERMISSIONS.includes(p) && !SUPER_ONLY_PERMISSIONS.includes(p),
  );
}

export const createRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => roleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, undefined, true);
    const client = await admin();
    const key = slugify(data.name);
    const { data: existing } = await client.from("roles").select("id").eq("key", key).maybeSingle();
    if (existing) throw new Error("A role with this name already exists.");

    const { data: created, error } = await client
      .from("roles")
      .insert({
        key,
        name: data.name,
        description: data.description ?? null,
        color: data.color,
        is_system: false,
        created_by: me.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const permissions = cleanPermissions(data.permissions);
    if (permissions.length) {
      await client
        .from("role_permissions")
        .insert(permissions.map((permission) => ({ role_id: created.id, permission })));
    }
    await logActivity(me.userId, "role.create", "roles", `Created role ${data.name}`);
    return { ok: true as const, roleId: created.id as string };
  });

export const updateRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => roleSchema.extend({ roleId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, undefined, true);
    const client = await admin();
    const { data: role } = await client
      .from("roles")
      .select("key, is_system")
      .eq("id", data.roleId)
      .maybeSingle();
    if (!role) throw new Error("Role not found.");
    if (role.key === "supreme_admin") throw new Error("The Super Admin role cannot be edited.");

    await client
      .from("roles")
      .update({
        name: data.name,
        description: data.description ?? null,
        color: data.color,
      })
      .eq("id", data.roleId);

    const permissions = cleanPermissions(data.permissions);
    await client.from("role_permissions").delete().eq("role_id", data.roleId);
    if (permissions.length) {
      await client
        .from("role_permissions")
        .insert(permissions.map((permission) => ({ role_id: data.roleId, permission })));
    }
    await logActivity(me.userId, "role.update", "roles", `Updated role ${data.name}`);
    return { ok: true as const };
  });

export const duplicateRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ roleId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, undefined, true);
    const client = await admin();
    const { data: role } = await client
      .from("roles")
      .select("*")
      .eq("id", data.roleId)
      .maybeSingle();
    if (!role) throw new Error("Role not found.");
    const { data: perms } = await client
      .from("role_permissions")
      .select("permission")
      .eq("role_id", data.roleId);

    const name = `${role.name} copy`;
    const key = slugify(`${name} ${Date.now().toString(36).slice(-4)}`);
    const { data: created, error } = await client
      .from("roles")
      .insert({
        key,
        name,
        description: role.description,
        color: role.color,
        is_system: false,
        created_by: me.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if ((perms ?? []).length) {
      await client
        .from("role_permissions")
        .insert((perms ?? []).map((p: any) => ({ role_id: created.id, permission: p.permission })));
    }
    await logActivity(me.userId, "role.duplicate", "roles", `Duplicated role ${role.name}`);
    return { ok: true as const, roleId: created.id as string };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ roleId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, undefined, true);
    const client = await admin();
    const { data: role } = await client
      .from("roles")
      .select("name, is_system")
      .eq("id", data.roleId)
      .maybeSingle();
    if (!role) throw new Error("Role not found.");
    if (role.is_system) throw new Error("Built-in roles cannot be deleted.");
    await client.from("roles").delete().eq("id", data.roleId);
    await logActivity(me.userId, "role.delete", "roles", `Deleted role ${role.name}`);
    return { ok: true as const };
  });

export const setRoleAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ roleId: z.string().uuid(), userIds: z.array(z.string().uuid()).max(500) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, undefined, true);
    const client = await admin();
    await client.from("admin_roles").delete().eq("role_id", data.roleId);
    if (data.userIds.length) {
      await client.from("admin_roles").insert(
        data.userIds.map((user_id) => ({
          role_id: data.roleId,
          user_id,
          assigned_by: me.userId,
        })),
      );
    }
    await logActivity(
      me.userId,
      "role.assign",
      "roles",
      `Assigned ${data.userIds.length} admin(s) to a role`,
    );
    return { ok: true as const };
  });

export const listDepartments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await guard(context as Ctx);
    const client = await admin();
    const { data } = await client.from("departments").select("id, name").order("name");
    return data ?? [];
  });
