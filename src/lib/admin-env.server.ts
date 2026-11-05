import "server-only";
import { PANEL_ROLE, type AdminPanel } from "./admin-panels";

const configuredEmails: Record<AdminPanel, string> = {
  super: "SUPER_ADMIN_EMAIL",
  company: "COMPANY_ADMIN_EMAIL",
  interview: "INTERVIEW_ADMIN_EMAIL",
  marketing: "MARKETING_ADMIN_EMAIL",
  business: "BUSINESS_ADMIN_EMAIL",
};
const normalized = (value: string | undefined) => value?.trim().toLowerCase() ?? "";
export function isReservedAdminEmail(email: string) {
  const target = normalized(email);
  return (
    !!target &&
    ["ADMIN_EMAIL", ...Object.values(configuredEmails)].some(
      (key) => normalized(process.env[key]) === target,
    )
  );
}

/**
 * The existing ADMIN_EMAIL bootstrap is an explicit server-owned allowlist.
 * Dedicated dashboard accounts additionally require an operator-provisioned
 * role in Auth app_metadata. User-editable user_metadata never grants roles.
 * Always resolve the current Auth user from a server-validated identity.
 */
export async function configuredDashboardRoles(userId: string): Promise<string[]> {
  if (
    !process.env["ADMIN_EMAIL"] &&
    !Object.values(configuredEmails).some((key) => process.env[key])
  )
    return [];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = data.user;
  if (
    error ||
    !user?.email ||
    (user.id && user.id !== userId) ||
    user.email_confirmed_at === null ||
    (user.banned_until && Date.parse(user.banned_until) > Date.now())
  )
    return [];
  const email = normalized(user.email);
  const roles = new Set<string>();
  if (email === normalized(process.env["ADMIN_EMAIL"])) roles.add("supreme_admin");
  const assigned = Array.isArray(user.app_metadata?.["aa_dashboard_roles"])
    ? user.app_metadata["aa_dashboard_roles"]
    : [];
  for (const [panel, key] of Object.entries(configuredEmails)) {
    const role = PANEL_ROLE[panel as AdminPanel];
    if (email === normalized(process.env[key]) && assigned.includes(role)) roles.add(role);
  }
  return [...roles];
}
export async function isEnvAdminUser(userId: string): Promise<boolean> {
  return (await configuredDashboardRoles(userId)).includes("supreme_admin");
}
