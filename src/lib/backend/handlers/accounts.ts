import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleEnum = z.enum(["supreme_admin", "employee", "customer", "job_seeker", "partner"]);

const bootstrapSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Username may use letters, numbers, dot, dash, underscore"),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  password: z.string().min(10).max(128),
});

const approveSchema = z.object({
  requestId: z.string().uuid(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9._-]+$/),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  password: z.string().min(10).max(128),
  role: roleEnum,
  reviewNote: z.string().trim().max(500).optional(),
});

// Administrator provisioning is an operator-only command, never a public API.
export const getBootstrapStatus = createServerFn({ method: "GET" }).handler(async () => ({
  needsBootstrap: false,
}));
export const bootstrapSupremeAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bootstrapSchema.parse(data))
  .handler(async () => {
    setResponseStatus(403);
    throw new Error(
      "Administrator provisioning must be run by an operator with npm run admin:provision.",
    );
  });

function isRoleTableMissing(error: { code?: string; message: string }): boolean {
  return (
    error.code === "PGRST205" ||
    (/user_roles/i.test(error.message) &&
      /schema cache|does not exist|relation/i.test(error.message))
  );
}

function isMissingDatabaseObject(error: { code?: string; message: string }): boolean {
  return (
    error.code === "PGRST205" ||
    /schema cache|does not exist|relation .* does not exist|column .* does not exist/i.test(
      error.message,
    )
  );
}

async function callerRoles(context: { supabase: any; userId: string }): Promise<string[]> {
  const { resolveAccess } = await import("@/lib/rbac.server");
  const access = await resolveAccess(context.userId);
  return access.status === "active" ? access.roles : [];
}

async function assertSupremeAdmin(context: { supabase: any; userId: string }) {
  const { authorizeSuper, AccessError } = await import("@/lib/rbac.server");
  try {
    await authorizeSuper(context.userId);
  } catch (error) {
    if (error instanceof AccessError) setResponseStatus(error.status);
    throw error;
  }
}

export const getSupremeAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({
    allowed: (await callerRoles(context)).includes("supreme_admin"),
  }));

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Your account profile could not be loaded. Please try again.");
    // Whitelist the account response while supporting both legacy name and
    // modern profile columns. No missing-column query or elevated read needed.
    const profile = row
      ? {
          id: row.id,
          username: row.username ?? row.email?.split("@")[0] ?? "member",
          full_name: row.full_name ?? (row as unknown as { name?: string }).name ?? "",
          email: row.email,
          phone: row.phone,
          is_active: row.is_active !== false,
          must_change_password: row.must_change_password ?? false,
          created_at: row.created_at,
          job_title: row.job_title ?? null,
          department: row.department ?? null,
          joined_at: row.joined_at ?? null,
          target_label: row.target_label ?? null,
          target_percent: row.target_percent ?? null,
          employee_of_month_for: row.employee_of_month_for ?? null,
          bio: row.bio ?? null,
        }
      : null;
    return { profile, roles: await callerRoles(context) };
  });

export const listAccessRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSupremeAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error && isMissingDatabaseObject(error)) return [];
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSupremeAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, full_name, email, phone, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error && /column .* does not exist|schema cache/i.test(error.message)) {
      const legacy = await (supabaseAdmin.from("profiles") as any)
        .select("id, name, email, phone, created_at")
        .order("created_at", { ascending: false });
      profiles = (legacy.data ?? []).map((profile: any) => ({
        ...profile,
        username: profile.email?.split("@")[0] ?? "member",
        full_name: profile.name,
        is_active: true,
      })) as any;
      error = legacy.error;
    }
    if (error) throw new Error(error.message);

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesError && !isRoleTableMissing(rolesError)) throw new Error(rolesError.message);
    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    }
    return (profiles ?? []).map((p: { id: string }) => ({
      ...p,
      roles: byUser.get(p.id) ?? [],
    }));
  });

export const approveAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => approveSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertSupremeAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: request, error: reqError } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("id", data.requestId)
      .maybeSingle();
    if (reqError) throw new Error(reqError.message);
    if (!request) throw new Error("Request not found");
    if (request.status === "approved") throw new Error("This request is already approved");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: request.full_name, username: data.username },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create account");

    const userId = created.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      username: data.username,
      full_name: request.full_name,
      email: data.email,
      phone: data.phone,
      must_change_password: true,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleError) throw new Error(roleError.message);

    await supabaseAdmin
      .from("access_requests")
      .update({
        status: "approved",
        review_note: data.reviewNote ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        created_user_id: userId,
      })
      .eq("id", data.requestId);

    return { ok: true as const, userId };
  });

export const rejectAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ requestId: z.string().uuid(), reviewNote: z.string().trim().max(500).optional() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertSupremeAdmin(context);
    const { error } = await context.supabase
      .from("access_requests")
      .update({
        status: "rejected",
        review_note: data.reviewNote ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);
    return { ok: true as const, code: "created" as const };
  });

async function assertCompanyMember(context: { supabase: any; userId: string }) {
  const roles = await callerRoles(context);
  const isSupreme = roles.includes("supreme_admin");
  if (!isSupreme && !roles.includes("employee")) {
    throw new Error("Forbidden: company team access only");
  }
  return { isSupreme };
}

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isSupreme } = await assertCompanyMember(context);

    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select(
        "id, username, full_name, email, phone, is_active, joined_at, job_title, department, target_label, target_percent, employee_of_month_for, bio",
      )
      .order("joined_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    }

    const team = (profiles ?? [])
      .map((p: { id: string }) => ({ ...p, roles: byUser.get(p.id) ?? [] }))
      .filter((p: { roles: string[] }) =>
        p.roles.some((r) => r === "employee" || r === "supreme_admin"),
      );

    return { team, canEdit: isSupreme };
  });

export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        jobTitle: z.string().trim().max(120).nullable().default(null),
        department: z.string().trim().max(120).nullable().default(null),
        joinedAt: z
          .string()
          .trim()
          .regex(/^\d{4}-\d{2}-\d{2}$/),
        targetLabel: z.string().trim().max(160).nullable().default(null),
        targetPercent: z.number().int().min(0).max(999),
        employeeOfMonthFor: z.string().trim().max(40).nullable().default(null),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertSupremeAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        job_title: data.jobTitle,
        department: data.department,
        joined_at: data.joinedAt,
        target_label: data.targetLabel,
        target_percent: data.targetPercent,
        employee_of_month_for: data.employeeOfMonthFor,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const, code: "created" as const };
  });

// Compatibility endpoint retained for older clients. Password verification now
// happens exclusively in Supabase Auth; this endpoint never mutates an account.
export const verifyEnvAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((_data: unknown) => undefined)
  .handler(async () => ({ isAdmin: false as const }));

/**
 * Public self-service sign-up. Creates a real account immediately so the
 * person can sign in with the same email + password on any login mode.
 * The admin role can never be requested here.
 */
const signUpSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().min(6).max(30),
  password: z.string().min(8).max(128),
  role: z.enum(["employee", "customer", "job_seeker", "partner"]),
  details: z.string().trim().max(1000).optional(),
});

function signupFailure(error: unknown): never {
  const failure = error as { status?: number; message?: string; name?: string } | null;
  const unavailable =
    !failure?.status ||
    failure.status >= 500 ||
    /fetch failed|network|timeout|connection/i.test(failure.message ?? "");
  setResponseStatus(unavailable ? 503 : failure.status === 429 ? 429 : 400);
  throw new Error(
    unavailable
      ? "Account creation is temporarily unavailable. Please try again later or contact support."
      : failure.status === 429
        ? "Too many account creation attempts. Please wait and try again."
        : "Could not create your account. Please check your details and try again.",
  );
}

export const signUpAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    const { isReservedAdminEmail } = await import("@/lib/admin-env.server");
    if (isReservedAdminEmail(data.email))
      throw new Error("This email address cannot be registered here.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin
      .createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName, role: data.role },
      })
      .catch(signupFailure);

    if (error || !created?.user) {
      if (/already been registered|already exists/i.test(error?.message ?? "")) {
        // Not an exceptional case: let the client try signing in with these credentials.
        return { ok: false as const, code: "email_exists" as const };
      }
      signupFailure(error);
    }

    const userId = created.user.id;
    const username = `${data.email.split("@")[0]!.replace(/[^a-z0-9._-]/g, "")}${userId.slice(0, 4)}`;

    // Current schema uses full_name; older deployments used `name`. Try the
    // current shape first, then fall back to the legacy columns.
    const profilePayload = {
      id: userId,
      username,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      must_change_password: false,
    };
    let { error: profileError } = await (supabaseAdmin.from("profiles") as any).upsert(
      profilePayload,
      { onConflict: "id" },
    );
    if (profileError && /schema cache|column/i.test(profileError.message)) {
      const legacy = { id: userId, name: data.fullName, email: data.email, phone: data.phone };
      profileError = (
        await (supabaseAdmin.from("profiles") as any).upsert(legacy, { onConflict: "id" })
      ).error;
    }
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      signupFailure(profileError);
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });
    // If the account tables are not provisioned yet, keep the account: the role
    // also lives in the auth user metadata, so sign-in still works.
    const roleTableMissing =
      !!roleError && /schema cache|does not exist|relation/i.test(roleError.message);
    if (roleError && !roleTableMissing) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      signupFailure(roleError);
    }

    // Keep the admin console in the loop (best effort — never blocks sign-up).
    try {
      await (supabaseAdmin.from("access_requests") as any).insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        personal_email: data.email,
        whatsapp_number: data.phone,
        requested_role: data.role,
        message: data.details ?? null,
        status: "approved",
        created_user_id: userId,
      });
    } catch {
      // ignore
    }

    return { ok: true as const, code: "created" as const };
  });
