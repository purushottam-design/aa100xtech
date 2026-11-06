import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PANEL_ROLE, panelsForRoles, type AdminPanel } from "@/lib/admin-panels";

type Ctx = { supabase: any; userId: string };

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Reads the caller's roles with the server-only client (never client input). */
async function rolesFor(context: Ctx): Promise<string[]> {
  const { resolveAccess } = await import("@/lib/rbac.server");
  const access = await resolveAccess(context.userId);
  return access.status === "active" ? access.roles : [];
}

function forbidden(message: string): never {
  setResponseStatus(403);
  throw new Error(message);
}

/** Returns the caller's roles when the panel is allowed, otherwise null. */
async function checkPanel(context: Ctx, panel: AdminPanel): Promise<string[] | null> {
  const roles = await rolesFor(context);
  const allowed = roles.includes("supreme_admin") || roles.includes(PANEL_ROLE[panel]);
  return allowed ? roles : null;
}

/** Server-side authorization gate for mutations. Super admin may open all. */
async function authorizePanel(context: Ctx, panel: AdminPanel) {
  const roles = await checkPanel(context, panel);
  if (!roles) forbidden("You are not authorized to access this dashboard.");
  return roles;
}

async function count(table: string, apply?: (q: any) => any) {
  const client = await admin();
  let q = (client.from(table as any) as any).select("id", { count: "exact", head: true });
  if (apply) q = apply(q);
  const { count: n, error } = await q;
  if (error) return 0;
  return n ?? 0;
}

async function rows(table: string, select: string, apply?: (q: any) => any) {
  const client = await admin();
  let q = (client.from(table as any) as any)
    .select(select)
    .order("created_at", { ascending: false })
    .limit(25);
  if (apply) q = apply(q);
  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export const getMyAdminRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await rolesFor(context as Ctx);
    return { roles, panels: panelsForRoles(roles) };
  });

const panelSchema = z.object({
  panel: z.enum(["super", "company", "interview", "marketing", "business"]),
});

export const getPanelDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => panelSchema.parse(data))
  .handler(async ({ data, context }) => {
    const panel = data.panel as AdminPanel;
    const allowedRoles = await checkPanel(context as Ctx, panel);
    if (!allowedRoles) {
      return {
        panel,
        roles: [] as string[],
        denied: true,
        stats: [] as { label: string; value: number }[],
        tables: [] as { title: string; columns: string[]; rows: (string | number | null)[][] }[],
      };
    }
    const roles = allowedRoles;

    if (panel === "company") {
      const [members, requests, bookings, employees] = await Promise.all([
        count("profiles"),
        count("access_requests", (q) => q.eq("status", "pending")),
        count("consultation_bookings"),
        count("user_roles", (q) => q.eq("role", "employee")),
      ]);
      return {
        panel,
        roles,
        stats: [
          { label: "Member accounts", value: members },
          { label: "Pending access requests", value: requests },
          { label: "Employees", value: employees },
          { label: "Consultation bookings", value: bookings },
        ],
        tables: [
          {
            title: "Latest access requests",
            columns: ["Name", "Email", "Requested role", "Status"],
            rows: (
              await rows(
                "access_requests",
                "id, full_name, email, requested_role, status, created_at",
              )
            ).map((r: any) => [r.full_name, r.email, r.requested_role, r.status]),
          },
          {
            title: "Member accounts",
            columns: ["Name", "Username", "Email", "Active"],
            rows: (
              await rows("profiles", "id, full_name, username, email, is_active, created_at")
            ).map((r: any) => [r.full_name, r.username, r.email, r.is_active ? "Yes" : "No"]),
          },
        ],
      };
    }

    if (panel === "interview") {
      const [candidates, seekers] = await Promise.all([
        count("candidate_submissions"),
        count("access_requests", (q) => q.eq("requested_role", "job_seeker")),
      ]);
      return {
        panel,
        roles,
        stats: [
          { label: "Candidate submissions", value: candidates },
          { label: "Job-seeker requests", value: seekers },
        ],
        tables: [
          {
            title: "Candidate submissions",
            columns: ["Name", "Email", "Role applied", "Availability"],
            rows: (
              await rows(
                "candidate_submissions",
                "id, full_name, email, role_applied, availability, created_at",
              )
            ).map((r: any) => [r.full_name, r.email, r.role_applied ?? "—", r.availability ?? "—"]),
          },
          {
            title: "Interview access requests",
            columns: ["Name", "Email", "Status", "Note"],
            rows: (
              await rows(
                "access_requests",
                "id, full_name, email, status, message, created_at",
                (q) => q.eq("requested_role", "job_seeker"),
              )
            ).map((r: any) => [r.full_name, r.email, r.status, (r.message ?? "—").slice(0, 60)]),
          },
        ],
      };
    }

    if (panel === "marketing") {
      const [applications, affiliates, clicks, conversions] = await Promise.all([
        count("partner_applications"),
        count("affiliates"),
        count("affiliate_clicks"),
        count("conversions"),
      ]);
      return {
        panel,
        roles,
        stats: [
          { label: "Partner applications", value: applications },
          { label: "Affiliates", value: affiliates },
          { label: "Tracked clicks", value: clicks },
          { label: "Conversions", value: conversions },
        ],
        tables: [
          {
            title: "Partner applications (leads)",
            columns: ["Name", "Email", "Plan", "Status"],
            rows: (
              await rows(
                "partner_applications",
                "id, full_name, email, plan_name, status, created_at",
              )
            ).map((r: any) => [r.full_name, r.email, r.plan_name ?? "—", r.status]),
          },
          {
            title: "Affiliates",
            columns: ["Name", "Code", "Tier", "Status"],
            rows: (
              await rows("affiliates", "id, full_name, affiliate_code, tier, status, created_at")
            ).map((r: any) => [r.full_name, r.affiliate_code, r.tier, r.status]),
          },
        ],
      };
    }

    if (panel === "business") {
      const client = await admin();
      const [bookings, paid, customers] = await Promise.all([
        count("consultation_bookings"),
        count("consultation_bookings", (q) => q.eq("payment_status", "paid")),
        count("user_roles", (q) => q.eq("role", "customer")),
      ]);
      const { data: revenueRows } = await (client.from("consultation_bookings") as any)
        .select("amount, payment_status")
        .eq("payment_status", "paid");
      const revenue = (revenueRows ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);
      return {
        panel,
        roles,
        stats: [
          { label: "Bookings", value: bookings },
          { label: "Paid bookings", value: paid },
          { label: "Customers", value: customers },
          { label: "Paid booking value", value: revenue },
        ],
        tables: [
          {
            title: "Consultation bookings",
            columns: ["Booking", "Customer", "Service", "Payment"],
            rows: (
              await rows(
                "consultation_bookings",
                "id, booking_id, customer_name, service, payment_status, created_at",
              )
            ).map((r: any) => [r.booking_id, r.customer_name, r.service, r.payment_status]),
          },
        ],
      };
    }

    // Super admin: overall statistics across every scope.
    const [members, requests, candidates, applications, bookings, affiliates, adminRoles] =
      await Promise.all([
        count("profiles"),
        count("access_requests", (q) => q.eq("status", "pending")),
        count("candidate_submissions"),
        count("partner_applications"),
        count("consultation_bookings"),
        count("affiliates"),
        count("user_roles"),
      ]);
    return {
      panel,
      roles,
      stats: [
        { label: "Member accounts", value: members },
        { label: "Pending access requests", value: requests },
        { label: "Candidates", value: candidates },
        { label: "Partner applications", value: applications },
        { label: "Consultation bookings", value: bookings },
        { label: "Affiliates", value: affiliates },
        { label: "Role assignments", value: adminRoles },
      ],
      tables: [],
    };
  });

const assignSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  role: z.enum([
    "supreme_admin",
    "company_admin",
    "interview_admin",
    "marketing_admin",
    "business_admin",
    "employee",
    "customer",
    "job_seeker",
    "partner",
  ]),
});

/** Super-admin only: grants an extra role to an EXISTING account (no duplicates). */
export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assignSchema.parse(data))
  .handler(async ({ data, context }) => {
    await authorizePanel(context as Ctx, "super");
    const client = await admin();
    const { data: profile } = await (client.from("profiles") as any)
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    let userId: string | null = profile?.id ?? null;
    if (!userId) {
      const { data: list } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = list?.users?.find((u) => (u.email ?? "").toLowerCase() === data.email)?.id ?? null;
    }
    if (!userId)
      throw new Error("No account exists for this email. Ask the person to sign up first.");
    const { error } = await (client.from("user_roles") as any).upsert(
      { user_id: userId, role: data.role },
      { onConflict: "user_id,role" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const, userId };
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.string().min(2).max(40) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await authorizePanel(context as Ctx, "super");
    if (data.userId === (context as Ctx).userId && data.role === "supreme_admin") {
      throw new Error("You cannot remove your own super admin role.");
    }
    const client = await admin();
    const { error } = await (client.from("user_roles") as any)
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
