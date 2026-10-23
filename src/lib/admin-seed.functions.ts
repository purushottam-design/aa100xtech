import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ROLE_DEFAULT_PERMISSIONS } from "@/lib/permissions";

type Ctx = { supabase: any; userId: string };

/** The real admin accounts of the business, one per admin role. */
const STARTER_ADMINS = [
  {
    role: "company_admin",
    fullName: "Company Admin",
    email: "company.admin@aa100xtech.com",
    jobTitle: "Company operations",
  },
  {
    role: "interview_admin",
    fullName: "Interview Admin",
    email: "interview.admin@aa100xtech.com",
    jobTitle: "Talent & interviews",
  },
  {
    role: "marketing_admin",
    fullName: "Marketing Admin",
    email: "marketing.admin@aa100xtech.com",
    jobTitle: "Marketing & partners",
  },
  {
    role: "business_admin",
    fullName: "Business Admin",
    email: "business.admin@aa100xtech.com",
    jobTitle: "Bookings & revenue",
  },
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

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return `Aa1${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

/**
 * Creates the four role admins with their real module permissions if they do
 * not exist yet. Existing accounts are never overwritten; their permissions
 * are only topped up to the role default. Super admin only.
 */
export const seedStarterAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const actorId = (context as Ctx).userId;
    if (!(await isSuper(actorId))) deny("Super admin access only.");
    const client = await admin();

    const created: { email: string; role: string; password: string }[] = [];
    const skipped: { email: string; role: string }[] = [];

    for (const entry of STARTER_ADMINS) {
      const { data: existing } = await client
        .from("profiles")
        .select("id")
        .eq("email", entry.email)
        .maybeSingle();

      let userId: string | null = existing?.id ?? null;
      let password: string | null = null;

      if (!userId) {
        password = generatePassword();
        const { data: createdUser, error } = await client.auth.admin.createUser({
          email: entry.email,
          password,
          email_confirm: true,
          user_metadata: { full_name: entry.fullName, role: entry.role },
        });
        if (error || !createdUser?.user) {
          skipped.push({ email: entry.email, role: entry.role });
          continue;
        }
        userId = createdUser.user.id as string;
        await client.from("profiles").upsert(
          {
            id: userId,
            username: entry.email.split("@")[0],
            full_name: entry.fullName,
            email: entry.email,
            job_title: entry.jobTitle,
            must_change_password: true,
            is_active: true,
            status: "active",
          },
          { onConflict: "id" },
        );
      } else {
        skipped.push({ email: entry.email, role: entry.role });
      }

      await client
        .from("user_roles")
        .upsert({ user_id: userId, role: entry.role }, { onConflict: "user_id,role" });

      const perms = ROLE_DEFAULT_PERMISSIONS[entry.role] ?? [];
      if (perms.length > 0) {
        await client.from("admin_permissions").delete().eq("user_id", userId);
        await client.from("admin_permissions").insert(
          perms.map((permission) => ({ user_id: userId, permission, granted_by: actorId })),
        );
      }

      if (password) created.push({ email: entry.email, role: entry.role, password });
    }

    const { data: profile } = await client
      .from("profiles")
      .select("email")
      .eq("id", actorId)
      .maybeSingle();
    await client.from("admin_activity_log").insert({
      actor_id: actorId,
      actor_email: profile?.email ?? null,
      action: "admins.seed",
      module: "admins",
      description: `Seeded role admins (created ${created.length}, refreshed ${skipped.length})`,
    });

    return { created, skipped };
  });
