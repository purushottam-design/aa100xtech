/**
 * Server-only helpers for the environment-configured admin account.
 * ADMIN_EMAIL / ADMIN_PASSWORD are read from process.env at call time and are
 * never returned to the client, logged, or stored anywhere.
 */

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function matchesEnvAdmin(email: string, password: string): boolean {
  const adminEmail = process.env['ADMIN_EMAIL'];
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!adminEmail || !adminPassword) return false;
  return (
    timingSafeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) &&
    timingSafeEqual(password, adminPassword)
  );
}

/**
 * Authorizes an already authenticated account against the server-only admin
 * email. This is used only as a compatibility path while the user_roles table
 * has not yet been provisioned; callers must supply a server-validated user ID.
 */
export async function isEnvAdminUser(userId: string): Promise<boolean> {
  const configuredEmail = process.env['ADMIN_EMAIL'];
  if (!configuredEmail) return false;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return false;

  return timingSafeEqual(
    data.user.email.trim().toLowerCase(),
    configuredEmail.trim().toLowerCase(),
  );
}

/**
 * Makes sure the env-configured admin can sign in through the existing
 * Supabase session flow: creates the auth user only when it does not exist yet
 * (never a duplicate), otherwise syncs the password, and guarantees the
 * supreme_admin role + profile row.
 */
export async function syncEnvAdminAccount(): Promise<void> {
  const configuredEmail = process.env['ADMIN_EMAIL'];
  const adminPassword = process.env['ADMIN_PASSWORD'];
  if (!configuredEmail || !adminPassword) {
    throw new Error("Administrator credentials are not configured.");
  }
  const adminEmail = configuredEmail.trim().toLowerCase();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Auth is the identity source of truth. A legacy profile can contain an
  // outdated or duplicated email and must never decide which account receives
  // administrator credentials.
  let userId: string | null = null;
  let page = 1;
  while (!userId) {
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (listError) throw new Error("Could not look up the administrator account");
    userId =
      list?.users.find((u) => (u.email ?? "").trim().toLowerCase() === adminEmail)?.id ?? null;
    if (!list?.nextPage) break;
    page = list.nextPage;
  }

  if (userId) {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: adminPassword,
      email_confirm: true,
    });
  } else {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Supreme Admin" },
    });
    if (error || !created.user) throw new Error("Could not prepare the admin account");
    userId = created.user.id;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    const usernameBase = adminEmail.split("@")[0]?.replace(/[^a-z0-9._-]/g, "") || "admin";
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      username: `${usernameBase}-${userId.slice(0, 8)}`,
      full_name: "Supreme Admin",
      email: adminEmail,
      phone: "",
      must_change_password: false,
    });
    if (profileError) throw new Error(profileError.message);
  }

  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "supreme_admin")
    .maybeSingle();

  if (!role) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "supreme_admin" });
    if (roleError) throw new Error(roleError.message);
  }
}
