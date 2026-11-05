import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { getRequestHeader, setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findModule } from "@/lib/super-admin-modules";

type Ctx = { supabase: any; userId: string };

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

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function deny(message: string): never {
  setResponseStatus(403);
  throw new Error(message);
}

async function isSuper(userId: string) {
  const { resolveAccess } = await import("@/lib/rbac.server");
  const access = await resolveAccess(userId);
  return access.isSuper && access.status === "active";
}

/** The security boundary: every function in this file goes through it. */
async function requireSuper(context: Ctx) {
  if (!(await isSuper(context.userId))) deny("Super admin access only.");
  return context.userId;
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

async function isSuperTarget(userId: string) {
  const client = await admin();
  const { data } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "supreme_admin");
  if ((data ?? []).length > 0) return true;
  const { isEnvAdminUser } = await import("@/lib/admin-env.server");
  return isEnvAdminUser(userId);
}

/* ------------------------------------------------------------------ status */

export const getSuperStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ isSuper: await isSuper((context as Ctx).userId) }));

/* ---------------------------------------------------------------- overview */

const OVERVIEW_TABLES = [
  "profiles",
  "user_roles",
  "admin_permissions",
  "access_requests",
  "consultation_bookings",
  "candidate_submissions",
  "partner_applications",
  "affiliates",
  "catalog_items",
  "conversions",
  "payouts",
  "coupon_codes",
  "referral_links",
  "affiliate_clicks",
  "admin_activity_log",
  "admin_login_history",
] as const;

export const getSuperOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuper(context as Ctx);
    const client = await admin();

    const counts: Record<string, number> = {};
    await Promise.all(
      OVERVIEW_TABLES.map(async (table) => {
        const { count, error } = await client
          .from(table)
          .select("id", { count: "exact", head: true });
        counts[table] = error ? 0 : (count ?? 0);
      }),
    );

    const { data: recent } = await client
      .from("admin_activity_log")
      .select("id, actor_email, action, module, description, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    const { data: revenueRows } = await client
      .from("consultation_bookings")
      .select("amount, currency, payment_status")
      .eq("payment_status", "paid");

    const paidTotal = (revenueRows ?? []).reduce(
      (sum: number, r: any) => sum + Number(r.amount ?? 0),
      0,
    );

    return { counts, recent: recent ?? [], paidTotal, paidCount: (revenueRows ?? []).length };
  });

/* ----------------------------------------------------------------- users */

const usersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.string().trim().max(40).default("all"),
  status: z.enum(["all", "active", "inactive", "suspended"]).default("all"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(10),
});

export const listAllUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => usersSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await requireSuper(context as Ctx);
    const client = await admin();

    const { data: profiles } = await client
      .from("profiles")
      .select("id, full_name, username, email, phone, status, is_active, created_at, last_login_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    const ids = (profiles ?? []).map((p: any) => p.id);
    const rolesByUser = new Map<string, string[]>();
    if (ids.length > 0) {
      const { data: roleRows } = await client
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      for (const r of roleRows ?? []) {
        const list = rolesByUser.get(r.user_id) ?? [];
        list.push(r.role);
        rolesByUser.set(r.user_id, list);
      }
    }

    type UserRow = {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      status: string;
      roles: string[];
      created_at: string;
      last_login_at: string | null;
      is_super: boolean;
    };
    let rows: UserRow[] = ((profiles ?? []) as any[]).map((p: any) => ({
      id: p.id as string,
      full_name: (p.full_name as string) || (p.username as string) || (p.email as string),
      email: p.email as string,
      phone: (p.phone as string) ?? null,
      status: (p.status as string) ?? "active",
      roles: rolesByUser.get(p.id) ?? [],
      created_at: p.created_at as string,
      last_login_at: (p.last_login_at as string) ?? null,
      is_super: (rolesByUser.get(p.id) ?? []).includes("supreme_admin"),
    }));

    if (data.role !== "all") rows = rows.filter((r) => r.roles.includes(data.role));
    if (data.status !== "all") rows = rows.filter((r) => r.status === data.status);
    if (data.search) {
      const q = data.search.toLowerCase();
      rows = rows.filter(
        (r) => r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
      );
    }

    const total = rows.length;
    const start = (data.page - 1) * data.pageSize;
    return {
      rows: rows.slice(start, start + data.pageSize),
      total,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const createUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().toLowerCase().email().max(255),
        phone: z.string().trim().max(30).optional(),
        password: z.string().min(10).max(128),
        role: z.enum(APP_ROLES),
        status: z.enum(["active", "inactive", "suspended"]).default("active"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    const client = await admin();

    const { data: created, error } = await client.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created?.user) throw new Error(error?.message ?? "Could not create the account.");

    const userId = created.user.id as string;
    await client.from("profiles").upsert(
      {
        id: userId,
        username: data.email.split("@")[0],
        full_name: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        status: data.status,
        is_active: data.status === "active",
      },
      { onConflict: "id" },
    );
    await client
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    await logActivity(actor, "user_created", "users", `Created user ${data.email} (${data.role})`);
    return { userId };
  });

export const updateUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        fullName: z.string().trim().min(2).max(120).optional(),
        phone: z.string().trim().max(30).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    const client = await admin();
    const patch: Record<string, unknown> = {};
    if (data.fullName !== undefined) patch["full_name"] = data.fullName;
    if (data.phone !== undefined) patch["phone"] = data.phone;
    if (data.status !== undefined) {
      patch["status"] = data.status;
      patch["is_active"] = data.status === "active";
    }
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await client.from("profiles").update(patch).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logActivity(actor, "user_updated", "users", `Updated user ${data.userId}`);
    return { ok: true };
  });

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), roles: z.array(z.enum(APP_ROLES)).max(8) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    if (await isSuperTarget(data.userId)) deny("The super admin account cannot be modified.");
    const client = await admin();
    await client
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .neq("role", "supreme_admin");
    if (data.roles.length > 0) {
      await client.from("user_roles").upsert(
        data.roles.map((role) => ({ user_id: data.userId, role })),
        { onConflict: "user_id,role" },
      );
    }
    await logActivity(
      actor,
      "roles_changed",
      "users",
      `Roles for ${data.userId}: ${data.roles.join(", ") || "none"}`,
    );
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(10).max(128) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    if (await isSuperTarget(data.userId))
      deny("The super admin password is managed in the environment.");
    const client = await admin();
    const { error } = await client.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await logActivity(actor, "password_reset", "users", `Password reset for ${data.userId}`);
    return { ok: true };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    if (await isSuperTarget(data.userId)) deny("The super admin account cannot be deleted.");
    const client = await admin();
    await client.from("admin_permissions").delete().eq("user_id", data.userId);
    await client.from("user_roles").delete().eq("user_id", data.userId);
    await client.from("profiles").delete().eq("id", data.userId);
    const { error } = await client.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logActivity(actor, "user_deleted", "users", `Deleted user ${data.userId}`);
    return { ok: true };
  });

/* --------------------------------------------------------- generic modules */

const recordsSchema = z.object({
  module: z.string().trim().max(60),
  search: z.string().trim().max(120).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(200).default(10),
});

export const listModuleRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => recordsSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await requireSuper(context as Ctx);
    const mod = findModule(data.module);
    if (!mod) throw new Error("Unknown module.");
    const client = await admin();

    const select = ["id", ...mod.columns.map((c) => c.key)].join(", ");
    let query = client.from(mod.table).select(select, { count: "exact" });
    if (data.search && mod.searchColumns.length > 0) {
      const term = data.search.replace(/[%,()]/g, "");
      query = query.or(mod.searchColumns.map((c) => `${c}.ilike.%${term}%`).join(","));
    }
    const from = (data.page - 1) * data.pageSize;
    const {
      data: rows,
      count,
      error,
    } = await query.order(mod.orderBy, { ascending: false }).range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

export const updateModuleRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        module: z.string().trim().max(60),
        id: z.string().uuid(),
        column: z.string().trim().max(60),
        value: z.union([z.string().max(120), z.boolean()]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    const mod = findModule(data.module);
    if (!mod) throw new Error("Unknown module.");

    const allowed =
      data.column === mod.statusColumn ||
      data.column === mod.extraStatus?.column ||
      (data.column === "active" && mod.columns.some((c) => c.key === "active"));
    if (!allowed) deny("This field cannot be edited here.");

    const client = await admin();
    const { error } = await client
      .from(mod.table)
      .update({ [data.column]: data.value })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(
      actor,
      "record_updated",
      mod.key,
      `${mod.label}: ${data.column} → ${String(data.value)} (${data.id})`,
    );
    return { ok: true };
  });

export const deleteModuleRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ module: z.string().trim().max(60), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    const mod = findModule(data.module);
    if (!mod) throw new Error("Unknown module.");
    if (!mod.deletable) deny("Records in this module cannot be deleted.");
    const client = await admin();
    const { error } = await client.from(mod.table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(actor, "record_deleted", mod.key, `${mod.label}: deleted ${data.id}`);
    return { ok: true };
  });

export const exportModuleRecords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ module: z.string().trim().max(60) }).parse(data))
  .handler(async ({ data, context }) => {
    const actor = await requireSuper(context as Ctx);
    const mod = findModule(data.module);
    if (!mod) throw new Error("Unknown module.");
    const client = await admin();
    const select = ["id", ...mod.columns.map((c) => c.key)].join(", ");
    const { data: rows, error } = await client
      .from(mod.table)
      .select(select)
      .order(mod.orderBy, { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);
    await logActivity(
      actor,
      "export",
      mod.key,
      `Exported ${mod.label} (${(rows ?? []).length} rows)`,
    );
    return { rows: rows ?? [] };
  });
