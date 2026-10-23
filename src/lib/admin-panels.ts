/**
 * Shared, client-safe role model for the role-based admin panels.
 * `supreme_admin` is the project's existing super-admin role.
 */
export const ADMIN_PANELS = ["super", "company", "interview", "marketing", "business"] as const;

export type AdminPanel = (typeof ADMIN_PANELS)[number];

export const PANEL_ROLE: Record<AdminPanel, string> = {
  super: "supreme_admin",
  company: "company_admin",
  interview: "interview_admin",
  marketing: "marketing_admin",
  business: "business_admin",
};

export const ROLE_PANEL: Record<string, AdminPanel> = {
  supreme_admin: "super",
  company_admin: "company",
  interview_admin: "interview",
  marketing_admin: "marketing",
  business_admin: "business",
};

export const PANEL_LABEL: Record<AdminPanel, string> = {
  super: "Super Admin",
  company: "Company Admin",
  interview: "Interview Admin",
  marketing: "Marketing Admin",
  business: "Business Admin",
};

export const PANEL_PATH: Record<AdminPanel, string> = {
  super: "/admin",
  company: "/admin/company",
  interview: "/admin/interview",
  marketing: "/admin/marketing",
  business: "/admin/business",
};

export const ADMIN_ROLE_LABELS: Record<string, string> = {
  supreme_admin: "Super Admin",
  company_admin: "Company Admin",
  interview_admin: "Interview Admin",
  marketing_admin: "Marketing Admin",
  business_admin: "Business Admin",
  manager: "Manager / Sub-admin",

  employee: "Employee",
  customer: "Customer",
  job_seeker: "Job seeker",
  partner: "Partner",
};

/** Admin panels a set of roles may open. Super admin may open every panel. */
export function panelsForRoles(roles: string[]): AdminPanel[] {
  if (roles.includes("supreme_admin")) return [...ADMIN_PANELS];
  return ADMIN_PANELS.filter((p) => p !== "super" && roles.includes(PANEL_ROLE[p]));
}
