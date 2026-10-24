import "server-only";
/**
 * Single source of truth for "what may this account do?".
 *
 * Effective permissions = permissions of every role the account holds
 *                       + permissions granted individually
 * Super admin always bypasses every check.
 *
 * Server-only: never import this from a component. Server functions load it
 * with `await import("@/lib/rbac.server")` inside their handler.
 */
import { ALL_PERMISSIONS } from "@/lib/permissions";

export type AdminAccess = {
  userId: string;
  roles: string[];
  roleIds: string[];
  isSuper: boolean;
  permissions: string[];
  status: string;
};

export const BUILTIN_ADMIN_ROLES = [
  "supreme_admin",
  "company_admin",
  "interview_admin",
  "marketing_admin",
  "business_admin",
  "manager",
];

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Full, resolved access snapshot for one account. */
export async function resolveAccess(userId: string): Promise<AdminAccess> {
  const client = await admin();

  const [{ data: enumRoles }, { data: customRoleRows }, { data: directPerms }, { data: profile }] =
    await Promise.all([
      client.from("user_roles").select("role").eq("user_id", userId),
      client.from("admin_roles").select("role_id, roles(key)").eq("user_id", userId),
      client.from("admin_permissions").select("permission").eq("user_id", userId),
      client.from("profiles").select("status, is_active").eq("id", userId).maybeSingle(),
    ]);

  const roles = new Set<string>((enumRoles ?? []).map((r: any) => r.role as string));
  const roleIds: string[] = [];
  for (const r of customRoleRows ?? []) {
    roleIds.push(r.role_id as string);
    const key = r.roles?.key as string | undefined;
    if (key) roles.add(key);
  }

  let isSuper = roles.has("supreme_admin");
  if (!isSuper) {
    const { isEnvAdminUser } = await import("@/lib/admin-env.server");
    isSuper = await isEnvAdminUser(userId);
    if (isSuper) roles.add("supreme_admin");
  }

  if (isSuper) {
    return {
      userId,
      roles: [...roles],
      roleIds,
      isSuper: true,
      permissions: [...ALL_PERMISSIONS],
      status: "active",
    };
  }

  const permissions = new Set<string>((directPerms ?? []).map((p: any) => p.permission as string));
  if (roleIds.length) {
    const { data: rolePerms } = await client
      .from("role_permissions")
      .select("permission")
      .in("role_id", roleIds);
    for (const p of rolePerms ?? []) permissions.add(p.permission as string);
  }

  const status =
    (profile?.status as string) ?? (profile?.is_active === false ? "inactive" : "active");

  return {
    userId,
    roles: [...roles],
    roleIds,
    isSuper: false,
    permissions: [...permissions].filter((p) => ALL_PERMISSIONS.includes(p)),
    status,
  };
}

export class AccessError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

/**
 * The security boundary. Verifies: signed in, account active, role, permission.
 * Every protected server function must call this — hiding a button is never
 * the only check.
 */
export async function authorize(userId: string, permission?: string): Promise<AdminAccess> {
  const access = await resolveAccess(userId);
  if (access.isSuper) return access;
  if (access.status !== "active") {
    throw new AccessError("Your admin account is not active.");
  }
  const isAdmin =
    access.roles.some((r) => BUILTIN_ADMIN_ROLES.includes(r)) || access.roleIds.length > 0;
  if (!isAdmin) throw new AccessError("Admin access only.");
  if (permission && !access.permissions.includes(permission)) {
    throw new AccessError("You do not have permission to perform this action.");
  }
  return access;
}

export async function authorizeSuper(userId: string): Promise<AdminAccess> {
  const access = await resolveAccess(userId);
  if (!access.isSuper) throw new AccessError("Super admin access only.");
  return access;
}
