// Operator-only account provisioning. Preview by default; never print secrets.
const { loadEnvConfig } = require("@next/env");
const { createClient } = require("@supabase/supabase-js");
const roles = {
  super: "supreme_admin",
  company: "company_admin",
  interview: "interview_admin",
  marketing: "marketing_admin",
  business: "business_admin",
};
const prefixes = {
  super: "SUPER_ADMIN",
  company: "COMPANY_ADMIN",
  interview: "INTERVIEW_ADMIN",
  marketing: "MARKETING_ADMIN",
  business: "BUSINESS_ADMIN",
};
function strongPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 128 &&
    !/^(change[- ]?me|password|a-strong-unique-password|replace.*|your.*password)/i.test(value)
  );
}
function client(env, key, factory) {
  if (!env.SUPABASE_URL || !key)
    throw new Error("Supabase server URL, service-role key and publishable key are required.");
  return factory(env.SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(15000) });
      },
    },
  });
}
async function findUser(admin, email) {
  for (let page = 1; ;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users)
      throw new Error(
        "The operator credential could not look up Auth users. Verify its service-role access.",
      );
    const user = data.users.find((item) => (item.email ?? "").trim().toLowerCase() === email);
    if (user || !data.nextPage) return user ?? null;
    page = data.nextPage;
  }
}
async function provisionAdmin({
  env = process.env,
  apply = false,
  resetPassword = false,
  roleOnly = false,
  legacy = false,
  panel = "super",
  expectedProject,
  environmentInfo,
  factory = createClient,
  log = console.log,
} = {}) {
  if (!roles[panel]) throw new Error("Choose a supported dashboard panel.");
  if (roleOnly && resetPassword)
    throw new Error("--role-only cannot be combined with --reset-password.");
  const prefix =
    legacy || (panel === "super" && !env.SUPER_ADMIN_EMAIL) ? "ADMIN" : prefixes[panel];
  if (legacy && panel !== "super")
    throw new Error("--legacy is only supported for the existing Super Admin bootstrap account.");
  const projectUrl = new URL(env.SUPABASE_URL ?? "https://unconfigured.invalid");
  const projectHost = projectUrl.hostname;
  if (
    projectUrl.protocol !== "https:" ||
    projectUrl.username ||
    projectUrl.password ||
    projectUrl.port ||
    projectUrl.pathname !== "/" ||
    projectUrl.search ||
    projectUrl.hash
  )
    throw new Error("Use the canonical HTTPS Supabase project URL; no account changes were made.");
  if (expectedProject && projectHost !== `${expectedProject}.supabase.co`)
    throw new Error(
      "The configured Supabase URL does not match --expected-project. No account changes were made.",
    );
  if (apply && (!expectedProject || env.NODE_ENV === "production"))
    throw new Error(
      "Apply requires --expected-project for the confirmed development project and refuses NODE_ENV=production. No account changes were made.",
    );
  const email = env[`${prefix}_EMAIL`]?.trim().toLowerCase();
  const password = env[`${prefix}_PASSWORD`];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error(`Configure ${prefix}_EMAIL before provisioning.`);
  const passwordReady = strongPassword(password) && password.toLowerCase() !== email;
  const passwordIssue = !password
    ? "missing"
    : password.length < 16
      ? "too-short"
      : password.length > 128
        ? "too-long"
        : password.toLowerCase() === email
          ? "matches-email"
          : !strongPassword(password)
            ? "placeholder"
            : null;
  if (apply && !roleOnly && !passwordReady)
    throw new Error(
      `Set ${prefix}_PASSWORD to a unique password of at least 16 characters. Placeholder passwords are refused; no account changes were made.`,
    );
  if (apply && !roleOnly && !env.SUPABASE_PUBLISHABLE_KEY)
    throw new Error(
      "Configure SUPABASE_PUBLISHABLE_KEY before applying; no account changes were made.",
    );
  const admin = client(env, env.SUPABASE_SERVICE_ROLE_KEY, factory);
  let user = await findUser(admin, email);
  let roleAvailable = false,
    hasDatabaseRole = false;
  let databaseRoleLookupCode = null;
  {
    const result = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id ?? "00000000-0000-0000-0000-000000000000")
      .eq("role", roles[panel])
      .maybeSingle();
    if (result.error && result.error.code !== "PGRST205" && result.error.code !== "42P01")
      throw new Error("The role lookup failed. Check database permissions before provisioning.");
    roleAvailable = !result.error;
    databaseRoleLookupCode = result.error?.code ?? null;
    hasDatabaseRole = !!result.data;
  }
  const assigned = Array.isArray(user?.app_metadata?.aa_dashboard_roles)
    ? user.app_metadata.aa_dashboard_roles
    : [];
  const plan = {
    panel,
    credentialSource: prefix,
    accountExists: !!user,
    passwordReady,
    passwordIssue,
    projectHost,
    ...(environmentInfo ? { environment: environmentInfo } : {}),
    databaseRoleTableAvailable: roleAvailable,
    hasDatabaseRole,
    databaseRoleLookupCode,
    hasProvisionedRole: assigned.includes(roles[panel]),
    resetsExistingPassword: apply && resetPassword && !!user,
    ...(roleOnly ? { roleOnly: true } : {}),
  };
  log(JSON.stringify(plan));
  if (!apply) return { ...plan, applied: false };
  if (roleOnly && !user)
    throw new Error("Role repair requires an existing account. No account was created.");
  if (
    user &&
    (user.email_confirmed_at === null ||
      (user.banned_until && Date.parse(user.banned_until) > Date.now()))
  )
    throw new Error(
      "Confirm or explicitly unban this account in Supabase before provisioning. This script does not silently activate blocked accounts.",
    );
  let created = false,
    passwordChanged = false;
  if (!user) {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: panel === "super" ? "Super Admin" : "Dashboard Admin" },
    });
    if (result.error || !result.data.user)
      throw new Error(
        "The administrator account could not be created. No existing password was changed.",
      );
    user = result.data.user;
    created = true;
  } else if (resetPassword) {
    const result = await admin.auth.admin.updateUserById(user.id, { password });
    if (result.error) throw new Error("The explicitly requested password reset failed.");
    passwordChanged = true;
  }
  // Operator-only role repair uses the service credential's authority over an
  // existing confirmed account. It never changes or needs the user's password.
  const auth = roleOnly ? undefined : client(env, env.SUPABASE_PUBLISHABLE_KEY, factory);
  const verified = auth ? await auth.auth.signInWithPassword({ email, password }) : undefined;
  try {
    if (
      !roleOnly &&
      (verified.error || verified.data.user?.id !== user.id || !verified.data.session)
    )
      throw new Error(
        "The configured password did not authenticate this existing account. Its password was not silently replaced. To explicitly reset it, use --apply --reset-password after choosing a strong environment password.",
      );
    if (roleAvailable && !hasDatabaseRole) {
      const result = await admin
        .from("user_roles")
        .insert({ user_id: user.id, role: roles[panel] });
      if (result.error)
        throw new Error("The database role assignment failed; no Auth role marker was added.");
    }
    const current = Array.isArray(user.app_metadata?.aa_dashboard_roles)
      ? user.app_metadata.aa_dashboard_roles.filter((role) => typeof role === "string")
      : [];
    if (!current.includes(roles[panel])) {
      const result = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, aa_dashboard_roles: [...current, roles[panel]] },
      });
      if (result.error)
        throw new Error(
          "The server-managed dashboard role could not be recorded. Rerun the preview before retrying.",
        );
    }
    const check = await admin.auth.admin.getUserById(user.id);
    if (check.error || !check.data.user?.app_metadata?.aa_dashboard_roles?.includes(roles[panel]))
      throw new Error("The dashboard role could not be independently verified.");
    const result = {
      applied: true,
      passwordVerified: !roleOnly,
      roleVerified: true,
      created,
      passwordChanged,
      ...(roleOnly ? { roleOnly: true } : {}),
      roleSource: roleAvailable
        ? "database-and-server-managed-auth"
        : "server-managed-auth-with-configured-email",
    };
    log(JSON.stringify(result));
    return result;
  } finally {
    if (verified?.data.session) await auth.auth.signOut({ scope: "local" });
  }
}
module.exports = { provisionAdmin, strongPassword };
if (require.main === module) {
  const inheritedPassword = Object.hasOwn(process.env, "SUPER_ADMIN_PASSWORD");
  const loaded = loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  const panelIndex = process.argv.indexOf("--panel");
  const projectIndex = process.argv.indexOf("--expected-project");
  provisionAdmin({
    apply: process.argv.includes("--apply"),
    resetPassword: process.argv.includes("--reset-password"),
    roleOnly: process.argv.includes("--role-only"),
    legacy: process.argv.includes("--legacy"),
    panel: panelIndex < 0 ? "super" : process.argv[panelIndex + 1],
    expectedProject: projectIndex < 0 ? undefined : process.argv[projectIndex + 1],
    environmentInfo: {
      loadedFiles: loaded.loadedEnvFiles.map((file) => file.path),
      superAdminPasswordSource: inheritedPassword
        ? "process.env"
        : (loaded.loadedEnvFiles.find((file) =>
            Object.hasOwn(file.env ?? {}, "SUPER_ADMIN_PASSWORD"),
          )?.path ?? "missing"),
    },
  })
    .then((result) => {
      if (process.argv.includes("--require-password-ready") && result.passwordReady === false)
        throw new Error("The password is not ready; no account changes were made.");
    })
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
