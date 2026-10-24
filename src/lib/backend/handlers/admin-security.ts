import "server-only";
/**
 * Sessions, emergency controls, "view as admin" and the admin notification
 * centre. Everything here re-checks permissions on the server.
 */
import { createServerFn } from "@/lib/backend/server";
import { getRequestHeader, setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

/* ---------------------------------------------------------------- sessions */

export const listAdminSessions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid().optional(),
        includeRevoked: z.boolean().default(false),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await guard(context as Ctx, "security.sessions");
    const client = await admin();
    let q = client
      .from("admin_sessions")
      .select(
        "id, user_id, email, device, browser, platform, ip_address, location, created_at, last_seen_at, revoked_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.userId) q = q.eq("user_id", data.userId);
    if (!data.includeRevoked) q = q.is("revoked_at", null);
    const { data: rows, error } = await q;
    if (error) return { rows: [] };
    return { rows: rows ?? [] };
  });

export const revokeAdminSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ sessionId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, "security.sessions");
    const client = await admin();
    const { data: session } = await client
      .from("admin_sessions")
      .select("user_id, email")
      .eq("id", data.sessionId)
      .maybeSingle();
    if (!session) throw new Error("Session not found.");
    await client
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: me.userId })
      .eq("id", data.sessionId);
    await client.auth.admin.signOut(session.user_id).catch(() => undefined);
    await logActivity(
      me.userId,
      "session.revoke",
      "security",
      `Ended a session for ${session.email ?? session.user_id}`,
    );
    return { ok: true as const };
  });

/** Emergency control: sign an admin out of every device at once. */
export const forceLogoutAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, "security.sessions");
    const { resolveAccess } = await import("@/lib/rbac.server");
    const target = await resolveAccess(data.userId);
    if (target.isSuper && !me.isSuper) throw new Error("Only the super admin can do that.");
    const client = await admin();
    await client
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_by: me.userId })
      .eq("user_id", data.userId)
      .is("revoked_at", null);
    await client.auth.admin.signOut(data.userId).catch(() => undefined);
    await logActivity(
      me.userId,
      "admin.force_logout",
      "security",
      `Forced logout for ${data.userId}`,
    );
    return { ok: true as const };
  });

/** Strips every individually granted permission from an admin. */
export const revokeAllPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, undefined, true);
    const { resolveAccess } = await import("@/lib/rbac.server");
    if ((await resolveAccess(data.userId)).isSuper)
      throw new Error("Super admin access cannot be removed.");
    const client = await admin();
    await client.from("admin_permissions").delete().eq("user_id", data.userId);
    await client.from("admin_roles").delete().eq("user_id", data.userId);
    await logActivity(
      me.userId,
      "admin.revoke_all",
      "security",
      `Removed all permissions for ${data.userId}`,
    );
    return { ok: true as const };
  });

/* ----------------------------------------------------------- impersonation */

export const startImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, "admins.impersonate", true);
    const client = await admin();
    const { data: profile } = await client
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("That admin no longer exists.");
    const { resolveAccess } = await import("@/lib/rbac.server");
    const access = await resolveAccess(data.userId);
    await logActivity(
      me.userId,
      "admin.impersonate",
      "security",
      `Started viewing as ${profile.email}`,
    );
    return {
      target: { id: profile.id, name: profile.full_name ?? profile.email, email: profile.email },
      roles: access.roles,
      permissions: access.permissions,
    };
  });

export const stopImpersonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx, "admins.impersonate", true);
    await logActivity(
      me.userId,
      "admin.impersonate_end",
      "security",
      `Stopped viewing as ${data.userId}`,
    );
    return { ok: true as const };
  });

/* --------------------------------------------------------- notifications */

export const listAdminNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ limit: z.number().int().min(1).max(100).default(30) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx);
    const client = await admin();
    const { data: rows } = await client
      .from("admin_notifications")
      .select("id, type, title, body, link_url, severity, permission, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    // Permission-aware: an admin only sees alerts for modules they can open.
    const visible = (rows ?? []).filter(
      (r: any) => me.isSuper || !r.permission || me.permissions.includes(r.permission),
    );
    const ids = visible.map((r: any) => r.id);
    let readIds = new Set<string>();
    if (ids.length) {
      const { data: reads } = await client
        .from("admin_notification_reads")
        .select("notification_id")
        .eq("user_id", me.userId)
        .in("notification_id", ids);
      readIds = new Set((reads ?? []).map((r: any) => r.notification_id as string));
    }
    return {
      rows: visible.map((r: any) => ({ ...r, read: readIds.has(r.id) })),
      unread: visible.filter((r: any) => !readIds.has(r.id)).length,
    };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ notificationIds: z.array(z.string().uuid()).max(200) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await guard(context as Ctx);
    if (!data.notificationIds.length) return { ok: true as const };
    const client = await admin();
    await client.from("admin_notification_reads").upsert(
      data.notificationIds.map((notification_id) => ({ notification_id, user_id: me.userId })),
      { onConflict: "notification_id,user_id" },
    );
    return { ok: true as const };
  });
