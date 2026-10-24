import "server-only";
import { createServerFn } from "@/lib/backend/server";
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

export const getBootstrapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "supreme_admin");
  if (error) throw new Error(error.message);
  return { needsBootstrap: (count ?? 0) === 0 };
});

export const bootstrapSupremeAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bootstrapSchema.parse(data))
  .handler(async ({ data }) => {
    const { matchesEnvAdmin } = await import("@/lib/admin-env.server");
    if (!matchesEnvAdmin(data.email, data.password)) {
      throw new Error(
        "The supreme user must use the administrator credentials configured in the environment.",
      );
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "supreme_admin");
    if ((count ?? 0) > 0) {
      throw new Error("A supreme user already exists for this company.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,

      email_confirm: true,
      user_metadata: { full_name: data.fullName, username: data.username },
    });

    let userId = created?.user?.id ?? null;

    if (!userId) {
      const alreadyExists = /already been registered|already exists/i.test(error?.message ?? "");
      if (!alreadyExists) throw new Error(error?.message ?? "Could not create account");

      // The auth user exists (e.g. created from ADMIN_EMAIL) but has no
      // supreme_admin role yet — adopt it and reset the password.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find(
        (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
      );
      if (!existing) throw new Error("Could not create account");
      userId = existing.id;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName, username: data.username },
      });
    }

    const profilePayload = {
      id: userId,
      username: data.username,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      must_change_password: false,
    };
    let { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    // Some connected projects still use the original profile shape
    // (id, name, email, phone, avatar_url). Keep bootstrap compatible until
    // the full account-system migration is applied there.
    if (profileError && /schema cache|column/i.test(profileError.message)) {
      const legacyProfile = {
        id: userId,
        name: data.fullName,
        email: data.email,
        phone: data.phone,
      };
      const legacyResult = await (supabaseAdmin.from("profiles") as any).upsert(legacyProfile, {
        onConflict: "id",
      });
      profileError = legacyResult.error;
    }
    if (profileError) throw new Error(profileError.message);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "supreme_admin" }, { onConflict: "user_id,role" });
    if (roleError) {
      if (
        /user_roles/.test(roleError.message) &&
        /schema cache|does not exist/i.test(roleError.message)
      ) {
        throw new Error(
          "The connected Supabase project is missing the account tables (user_roles, access_requests, ...). Run the aa100x-full-schema.sql migration in that project's SQL editor, then retry the bootstrap.",
        );
      }
      throw new Error(roleError.message);
    }

    return { ok: true as const, code: "created" as const };
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
  // Authorization must not depend on a user-facing SELECT policy. Read the
  // verified caller's role with the server-only client, then authorize from
  // that exact user id. This avoids false denials when an otherwise valid
  // supreme user cannot see user_roles because of a stale/changed RLS policy.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) {
    if (isRoleTableMissing(error)) {
      const { isEnvAdminUser } = await import("@/lib/admin-env.server");
      return (await isEnvAdminUser(context.userId)) ? ["supreme_admin"] : [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((r: { role: string }) => r.role);
}

async function assertSupremeAdmin(context: { supabase: any; userId: string }) {
  const roles = await callerRoles(context);
  if (roles.includes("supreme_admin")) return;

  // Keep the environment-configured administrator usable when the role table
  // exists but its supreme_admin row has not been provisioned yet. The userId
  // comes from verified auth middleware and the email comparison happens only
  // on the server, so regular users cannot use this compatibility path.
  const { isEnvAdminUser } = await import("@/lib/admin-env.server");
  if (await isEnvAdminUser(context.userId)) return;

  throw new Error("Forbidden: supreme user access only");
}

export const getSupremeAdminAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await callerRoles(context);
    if (roles.includes("supreme_admin")) return { allowed: true as const };

    const { isEnvAdminUser } = await import("@/lib/admin-env.server");
    return { allowed: (await isEnvAdminUser(context.userId)) as boolean };
  });

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select(
        "id, username, full_name, email, phone, is_active, must_change_password, created_at, job_title, department, joined_at, target_label, target_percent, employee_of_month_for, bio",
      )
      .eq("id", context.userId)
      .maybeSingle();

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    return {
      profile: profile ?? null,
      roles: (roles ?? []).map((r: { role: string }) => r.role),
    };
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

/**
 * Validates a submitted email/password against ADMIN_EMAIL / ADMIN_PASSWORD.
 * Returns only a boolean — credentials never leave the server.
 */
export const verifyEnvAdminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    // Never throw on malformed input — an empty or invalid form must simply
    // report "not the env admin" instead of surfacing a validation error.
    const parsed = z
      .object({
        email: z.string().trim().max(255).optional(),
        password: z.string().max(128).optional(),
      })
      .safeParse(data);
    return { email: parsed.data?.email ?? "", password: parsed.data?.password ?? "" };
  })
  .handler(async ({ data }) => {
    if (!data.email || !data.password) return { isAdmin: false as const };
    const { matchesEnvAdmin, syncEnvAdminAccount } = await import("@/lib/admin-env.server");
    if (!matchesEnvAdmin(data.email, data.password)) {
      return { isAdmin: false as const };
    }
    await syncEnvAdminAccount();
    return { isAdmin: true as const };
  });

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

export const signUpAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, role: data.role },
    });

    if (error || !created?.user) {
      if (/already been registered|already exists/i.test(error?.message ?? "")) {
        // Not an exceptional case: let the client try signing in with these credentials.
        return { ok: false as const, code: "email_exists" as const };
      }
      throw new Error(error?.message ?? "Could not create your account");
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
      throw new Error(profileError.message);
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
      throw new Error(roleError.message);
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
