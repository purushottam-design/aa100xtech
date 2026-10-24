import "server-only";
/**
 * Phase 1 of the extended Super Admin system:
 * analytics, support tickets, notifications & templates, content blocks (CMS)
 * and two-factor authentication for admin accounts.
 *
 * Every function enforces access on the server; the UI only hides things.
 */
import { createServerFn } from "@/lib/backend/server";
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: any; userId: string };

const ADMIN_ROLES = [
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

function deny(message: string): never {
  setResponseStatus(403);
  throw new Error(message);
}

async function accountAccess(userId: string) {
  const client = await admin();
  const [{ data: roleRows }, { data: permRows }] = await Promise.all([
    client.from("user_roles").select("role").eq("user_id", userId),
    client.from("admin_permissions").select("permission").eq("user_id", userId),
  ]);
  const roles: string[] = (roleRows ?? []).map((r: any) => r.role);
  let isSuper = roles.includes("supreme_admin");
  if (!isSuper) {
    const { isEnvAdminUser } = await import("@/lib/admin-env.server");
    isSuper = await isEnvAdminUser(userId);
  }
  return {
    roles,
    isSuper,
    permissions: (permRows ?? []).map((p: any) => p.permission as string),
  };
}

/** Admin-level gate: super admin, or an admin/manager holding the permission. */
async function requireAdmin(context: Ctx, permission?: string) {
  const access = await accountAccess(context.userId);
  if (access.isSuper) return { userId: context.userId, ...access };
  if (!access.roles.some((r) => ADMIN_ROLES.includes(r))) deny("Admin access only.");
  if (permission && !access.permissions.includes(permission))
    deny("You do not have this permission.");
  return { userId: context.userId, ...access };
}

async function requireSuperOnly(context: Ctx) {
  const access = await accountAccess(context.userId);
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

const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

/* --------------------------------------------------------------- analytics */

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export const getAdminAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        days: z.number().int().min(1).max(730).default(30),
        from: z.string().trim().max(20).optional(),
        to: z.string().trim().max(20).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const client = await admin();

    // Resolve the window: explicit from/to wins, otherwise the last N days.
    const endDay =
      data.to && !Number.isNaN(Date.parse(data.to))
        ? new Date(`${data.to}T23:59:59.999Z`)
        : new Date();
    const startDay =
      data.from && !Number.isNaN(Date.parse(data.from))
        ? new Date(`${data.from}T00:00:00.000Z`)
        : new Date(endDay.getTime() - (data.days - 1) * 86400000);
    const spanDays = Math.max(
      1,
      Math.min(730, Math.round((endDay.getTime() - startDay.getTime()) / 86400000) + 1),
    );
    const since = startDay.toISOString();
    const until = endDay.toISOString();
    const prevStart = new Date(startDay.getTime() - spanDays * 86400000).toISOString();

    const [profiles, bookings, tickets, sessions, logins, prevBookings, prevProfiles] =
      await Promise.all([
        client
          .from("profiles")
          .select("id, created_at, status, last_login_at")
          .gte("created_at", since)
          .lte("created_at", until),
        client
          .from("consultation_bookings")
          .select("amount, currency, payment_status, service, created_at")
          .gte("created_at", since)
          .lte("created_at", until),
        client.from("support_tickets").select("status").limit(5000),
        client
          .from("profiles")
          .select("id, last_login_at")
          .gte("last_login_at", new Date(Date.now() - 3600000).toISOString()),
        client
          .from("admin_login_history")
          .select("email, status, ip_address, user_agent, logged_in_at")
          .order("logged_in_at", { ascending: false })
          .limit(8),
        client
          .from("consultation_bookings")
          .select("amount, payment_status, created_at")
          .gte("created_at", prevStart)
          .lt("created_at", since),
        client.from("profiles").select("id").gte("created_at", prevStart).lt("created_at", since),
      ]);

    const buckets = new Map<
      string,
      { day: string; signups: number; revenue: number; orders: number }
    >();
    for (let i = 0; i < spanDays; i++) {
      const day = isoDay(new Date(startDay.getTime() + i * 86400000));
      buckets.set(day, { day, signups: 0, revenue: 0, orders: 0 });
    }
    for (const p of profiles.data ?? []) {
      const b = buckets.get(dayKey(p.created_at));
      if (b) b.signups += 1;
    }
    let revenue = 0;
    let paidOrders = 0;
    const byService = new Map<string, number>();
    for (const bk of bookings.data ?? []) {
      const b = buckets.get(dayKey(bk.created_at));
      const paid = bk.payment_status === "paid";
      if (b) {
        b.orders += 1;
        if (paid) b.revenue += Number(bk.amount ?? 0);
      }
      if (paid) {
        revenue += Number(bk.amount ?? 0);
        paidOrders += 1;
        byService.set(bk.service ?? "Other", (byService.get(bk.service ?? "Other") ?? 0) + 1);
      }
    }

    let prevRevenue = 0;
    let prevPaidOrders = 0;
    for (const bk of prevBookings.data ?? []) {
      if (bk.payment_status === "paid") {
        prevRevenue += Number(bk.amount ?? 0);
        prevPaidOrders += 1;
      }
    }
    const prevSignups = (prevProfiles.data ?? []).length;
    const growth = (now: number, before: number) =>
      before === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - before) / before) * 1000) / 10;

    const ticketStatus = new Map<string, number>();
    for (const t of tickets.data ?? [])
      ticketStatus.set(t.status, (ticketStatus.get(t.status) ?? 0) + 1);

    const [{ count: totalUsers }, { count: openTickets }] = await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }),
      client
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .neq("status", "resolved"),
    ]);

    const series = [...buckets.values()];
    let running = 0;
    const cumulative = series.map((s) => {
      running += s.revenue;
      return {
        day: s.day,
        revenue: s.revenue,
        cumulative: running,
        orders: s.orders,
        signups: s.signups,
      };
    });

    return {
      range: { from: isoDay(startDay), to: isoDay(endDay), days: spanDays },
      series,
      cumulative,
      totals: {
        totalUsers: totalUsers ?? 0,
        newUsers: (profiles.data ?? []).length,
        activeSessions: (sessions.data ?? []).length,
        revenue,
        paidOrders,
        openTickets: openTickets ?? 0,
        avgOrderValue: paidOrders ? Math.round((revenue / paidOrders) * 100) / 100 : 0,
      },
      previous: { revenue: prevRevenue, paidOrders: prevPaidOrders, newUsers: prevSignups },
      growth: {
        revenue: growth(revenue, prevRevenue),
        paidOrders: growth(paidOrders, prevPaidOrders),
        newUsers: growth((profiles.data ?? []).length, prevSignups),
      },
      topServices: [...byService.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
      ticketStatus: [...ticketStatus.entries()].map(([name, value]) => ({ name, value })),
      recentLogins: logins.data ?? [],
      health: { database: "ok", api: "ok", checkedAt: new Date().toISOString() },
    };
  });

/* ----------------------------------------------------------------- tickets */

export const listTickets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: z.string().trim().max(20).default("all"),
        priority: z.string().trim().max(20).default("all"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(100).default(10),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const client = await admin();
    let q = client.from("support_tickets").select("*", { count: "exact" });
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.priority !== "all") q = q.eq("priority", data.priority);
    if (data.search) {
      const term = data.search.replace(/[%,()]/g, "");
      q = q.or(
        ["ticket_no", "subject", "requester_name", "requester_email"]
          .map((c) => `${c}.ilike.%${term}%`)
          .join(","),
      );
    }
    const from = (data.page - 1) * data.pageSize;
    const {
      data: rows,
      count,
      error,
    } = await q.order("created_at", { ascending: false }).range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const getTicketThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ ticketId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const client = await admin();
    const [{ data: ticket }, { data: messages }] = await Promise.all([
      client.from("support_tickets").select("*").eq("id", data.ticketId).maybeSingle(),
      client
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", data.ticketId)
        .order("created_at", { ascending: true }),
    ]);
    if (!ticket) throw new Error("Ticket not found.");
    return { ticket, messages: messages ?? [] };
  });

export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        ticketId: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
        isInternal: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { data: profile } = await client
      .from("profiles")
      .select("full_name, email")
      .eq("id", me.userId)
      .maybeSingle();
    const { error } = await client.from("ticket_messages").insert({
      ticket_id: data.ticketId,
      author_id: me.userId,
      author_name: profile?.full_name ?? "Admin",
      author_email: profile?.email ?? null,
      body: data.body,
      is_internal: data.isInternal,
    });
    if (error) throw new Error(error.message);
    await client
      .from("support_tickets")
      .update({ last_reply_at: new Date().toISOString() })
      .eq("id", data.ticketId);
    await logActivity(me.userId, "ticket_reply", "support", `Replied to ticket ${data.ticketId}`);
    return { ok: true };
  });

export const updateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        ticketId: z.string().uuid(),
        status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        assignedTo: z.string().uuid().nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const patch: Record<string, unknown> = {};
    if (data.status) patch["status"] = data.status;
    if (data.priority) patch["priority"] = data.priority;
    if (data.assignedTo !== undefined) patch["assigned_to"] = data.assignedTo;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await client.from("support_tickets").update(patch).eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    await logActivity(me.userId, "ticket_updated", "support", `Ticket ${data.ticketId} updated`);
    return { ok: true };
  });

/** Any signed-in person can raise a ticket for themselves. */
export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        subject: z.string().trim().min(3).max(160),
        message: z.string().trim().min(5).max(4000),
        category: z.string().trim().max(40).default("general"),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as Ctx).userId;
    const client = await admin();
    const { data: profile } = await client
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();
    const { data: ticket, error } = await client
      .from("support_tickets")
      .insert({
        requester_id: userId,
        requester_name: profile?.full_name ?? "User",
        requester_email: profile?.email ?? "unknown@local",
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        last_reply_at: new Date().toISOString(),
      })
      .select("id, ticket_no")
      .single();
    if (error) throw new Error(error.message);
    await client.from("ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: userId,
      author_name: profile?.full_name ?? "User",
      author_email: profile?.email ?? null,
      body: data.message,
    });
    return { ticketNo: ticket.ticket_no as string };
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const client = await admin();
    const { data } = await client
      .from("support_tickets")
      .select("id, ticket_no, subject, status, priority, created_at")
      .eq("requester_id", (context as Ctx).userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { rows: data ?? [] };
  });

/* ----------------------------------------------------------- notifications */

export const listNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        status: z.string().trim().max(20).default("all"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(5).max(100).default(10),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const client = await admin();
    let q = client.from("notifications").select("*", { count: "exact" });
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.search) q = q.ilike("title", `%${data.search.replace(/[%,()]/g, "")}%`);
    const from = (data.page - 1) * data.pageSize;
    const {
      data: rows,
      count,
      error,
    } = await q.order("created_at", { ascending: false }).range(from, from + data.pageSize - 1);
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const saveNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        title: z.string().trim().min(2).max(160),
        body: z.string().trim().min(2).max(4000),
        audience: z.enum(["all", "customers", "employees", "partners", "admins"]).default("all"),
        channel: z.enum(["in_app", "email", "push"]).default("in_app"),
        linkUrl: z.string().trim().max(400).optional(),
        scheduledFor: z.string().trim().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const payload: Record<string, unknown> = {
      title: data.title,
      body: data.body,
      audience: data.audience,
      channel: data.channel,
      link_url: data.linkUrl || null,
      scheduled_for: data.scheduledFor ? new Date(data.scheduledFor).toISOString() : null,
      created_by: me.userId,
    };
    if (data.id) {
      const { error } = await client.from("notifications").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await client
        .from("notifications")
        .insert({ ...payload, status: data.scheduledFor ? "scheduled" : "draft" });
      if (error) throw new Error(error.message);
    }
    await logActivity(
      me.userId,
      data.id ? "notification_updated" : "notification_created",
      "notifications",
      data.title,
    );
    return { ok: true };
  });

export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { error } = await client
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(
      me.userId,
      "notification_sent",
      "notifications",
      `Sent notification ${data.id}`,
    );
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { error } = await client.from("notifications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(me.userId, "notification_deleted", "notifications", data.id);
    return { ok: true };
  });

/** In-app feed for the signed-in person. */
export const listMyNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const client = await admin();
    const { data } = await client
      .from("notifications")
      .select("id, title, body, link_url, sent_at")
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .limit(20);
    return { rows: data ?? [] };
  });

/* -------------------------------------------------------------- templates */

export const listTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context as Ctx);
    const client = await admin();
    const { data } = await client.from("notification_templates").select("*").order("name");
    return { rows: data ?? [] };
  });

export const saveTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        key: z
          .string()
          .trim()
          .min(2)
          .max(60)
          .regex(/^[a-z0-9_.-]+$/),
        name: z.string().trim().min(2).max(120),
        channel: z.enum(["email", "sms", "push"]).default("email"),
        subject: z.string().trim().max(200).optional(),
        body: z.string().trim().min(2).max(8000),
        active: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const payload = {
      key: data.key,
      name: data.name,
      channel: data.channel,
      subject: data.subject || null,
      body: data.body,
      active: data.active,
    };
    const { error } = data.id
      ? await client.from("notification_templates").update(payload).eq("id", data.id)
      : await client.from("notification_templates").insert(payload);
    if (error) throw new Error(error.message);
    await logActivity(me.userId, "template_saved", "notifications", data.name);
    return { ok: true };
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { error } = await client.from("notification_templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(me.userId, "template_deleted", "notifications", data.id);
    return { ok: true };
  });

/* ------------------------------------------------------------------- CMS */

export const listContentBlocks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        blockType: z.string().trim().max(20).default("all"),
        search: z.string().trim().max(120).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context as Ctx);
    const client = await admin();
    let q = client.from("content_blocks").select("*");
    if (data.blockType !== "all") q = q.eq("block_type", data.blockType);
    if (data.search) q = q.ilike("title", `%${data.search.replace(/[%,()]/g, "")}%`);
    const { data: rows, error } = await q
      .order("position")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const saveContentBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        blockType: z.enum(["banner", "notice", "section", "blog", "offer"]).default("banner"),
        slug: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9-]+$/),
        title: z.string().trim().min(2).max(200),
        subtitle: z.string().trim().max(300).optional(),
        body: z.string().trim().max(20000).optional(),
        imageUrl: z.string().trim().max(600).optional(),
        linkUrl: z.string().trim().max(600).optional(),
        linkLabel: z.string().trim().max(80).optional(),
        placement: z.string().trim().max(60).default("home"),
        position: z.number().int().min(0).max(999).default(0),
        active: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const payload = {
      block_type: data.blockType,
      slug: data.slug,
      title: data.title,
      subtitle: data.subtitle || null,
      body: data.body || null,
      image_url: data.imageUrl || null,
      link_url: data.linkUrl || null,
      link_label: data.linkLabel || null,
      placement: data.placement,
      position: data.position,
      active: data.active,
      published_at: data.active ? new Date().toISOString() : null,
      created_by: me.userId,
    };
    const { error } = data.id
      ? await client.from("content_blocks").update(payload).eq("id", data.id)
      : await client.from("content_blocks").insert(payload);
    if (error) throw new Error(error.message);
    await logActivity(me.userId, "content_saved", "cms", `${data.blockType}: ${data.title}`);
    return { ok: true };
  });

export const deleteContentBlock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { error } = await client.from("content_blocks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logActivity(me.userId, "content_deleted", "cms", data.id);
    return { ok: true };
  });

/** Public banners/notices for the website — no sign-in required. */
export const getPublicContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ placement: z.string().trim().max(60).default("home") }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const client = await admin();
    const { data: rows } = await client
      .from("content_blocks")
      .select(
        "id, block_type, slug, title, subtitle, body, image_url, link_url, link_label, position",
      )
      .eq("active", true)
      .eq("placement", data.placement)
      .order("position");
    return { rows: rows ?? [] };
  });

/* ------------------------------------------------------------------- 2FA */

export const getTwoFactorStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { data } = await client
      .from("admin_2fa")
      .select("enabled, confirmed_at")
      .eq("user_id", me.userId)
      .maybeSingle();
    const { verifyUnlockToken, readUnlockToken } = await import("@/lib/totp.server");
    const unlocked = verifyUnlockToken(readUnlockToken(getRequestHeader("cookie")), me.userId);
    return { enabled: Boolean(data?.enabled), confirmedAt: data?.confirmed_at ?? null, unlocked };
  });

export const startTwoFactorSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { generateSecret, otpauthUrl } = await import("@/lib/totp.server");
    const secret = generateSecret();
    const { data: profile } = await client
      .from("profiles")
      .select("email")
      .eq("id", me.userId)
      .maybeSingle();
    const { error } = await client
      .from("admin_2fa")
      .upsert(
        { user_id: me.userId, secret, enabled: false, confirmed_at: null },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { secret, otpauth: otpauthUrl(secret, profile?.email ?? "admin") };
  });

export const confirmTwoFactor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(6).max(8) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { data: row } = await client
      .from("admin_2fa")
      .select("secret")
      .eq("user_id", me.userId)
      .maybeSingle();
    if (!row?.secret) throw new Error("Start the setup first.");
    const { verifyTotp, generateRecoveryCodes, signUnlockToken, unlockCookie } =
      await import("@/lib/totp.server");
    if (!verifyTotp(row.secret, data.code))
      throw new Error("That code is not valid. Try the next one.");
    const codes = generateRecoveryCodes();
    await client
      .from("admin_2fa")
      .update({ enabled: true, confirmed_at: new Date().toISOString(), recovery_codes: codes })
      .eq("user_id", me.userId);
    setResponseHeader("set-cookie", unlockCookie(signUnlockToken(me.userId)));
    await logActivity(me.userId, "2fa_enabled", "security", "Two-factor authentication enabled");
    return { recoveryCodes: codes };
  });

export const verifyTwoFactor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(6).max(20) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { data: row } = await client
      .from("admin_2fa")
      .select("secret, recovery_codes")
      .eq("user_id", me.userId)
      .maybeSingle();
    if (!row?.secret) throw new Error("Two-factor authentication is not set up.");
    const { verifyTotp, signUnlockToken, unlockCookie } = await import("@/lib/totp.server");
    const code = data.code.trim().toUpperCase();
    const isRecovery = (row.recovery_codes ?? []).includes(code);
    if (!isRecovery && !verifyTotp(row.secret, data.code)) {
      await logActivity(me.userId, "2fa_failed", "security", "Wrong two-factor code");
      throw new Error("That code is not valid.");
    }
    if (isRecovery) {
      await client
        .from("admin_2fa")
        .update({ recovery_codes: (row.recovery_codes ?? []).filter((c: string) => c !== code) })
        .eq("user_id", me.userId);
    }
    setResponseHeader("set-cookie", unlockCookie(signUnlockToken(me.userId)));
    await logActivity(me.userId, "2fa_verified", "security", "Two-factor code accepted");
    return { ok: true };
  });

export const disableTwoFactor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ code: z.string().trim().min(6).max(20) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const me = await requireAdmin(context as Ctx);
    const client = await admin();
    const { data: row } = await client
      .from("admin_2fa")
      .select("secret")
      .eq("user_id", me.userId)
      .maybeSingle();
    const { verifyTotp, clearUnlockCookie } = await import("@/lib/totp.server");
    if (!row?.secret || !verifyTotp(row.secret, data.code))
      throw new Error("That code is not valid.");
    await client.from("admin_2fa").delete().eq("user_id", me.userId);
    setResponseHeader("set-cookie", clearUnlockCookie());
    await logActivity(
      me.userId,
      "2fa_disabled",
      "security",
      "Two-factor authentication turned off",
    );
    return { ok: true };
  });

/* ------------------------------------------------------- manager accounts */

export const listAdminAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperOnly(context as Ctx);
    const client = await admin();
    const { data: roleRows } = await client
      .from("user_roles")
      .select("user_id, role")
      .in("role", ADMIN_ROLES);
    const ids = [...new Set((roleRows ?? []).map((r: any) => r.user_id))];
    if (ids.length === 0) return { rows: [] };
    const { data: profiles } = await client
      .from("profiles")
      .select("id, full_name, email, status")
      .in("id", ids);
    return {
      rows: (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roleRows ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      })),
    };
  });
