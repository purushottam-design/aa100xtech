import { z } from "zod";

export type WorkspaceRole = "admin" | "imtm" | "lead_team" | "influencer";
export type AccessState = {
  state: "approved" | "pending" | "disabled" | "missing";
  user: { id: string; name: string; email: string };
  role: WorkspaceRole | null;
  domain: "influencer" | "gamer" | null;
  accountId: string | null;
};
export const base = "/partner-workspace";
export const moduleTitles: Record<string, string> = {
  overview: "Overview",
  creators: "Influencer CRM",
  "lead-dashboard": "Lead Team",
  "gamer-leads": "Gamer Leads",
  imtm: "IMTM Team",
  "deal-approvals": "Deal Approvals",
  campaigns: "Campaigns",
  projects: "Projects",
  inventory: "Inventory",
  shipments: "Shipments",
  matchmaker: "AI Matchmaker",
  reports: "Reports",
  settings: "Settings",
  admin: "Admin Hub",
  activity: "Activity Log",
  allocations: "Product Allocations",
  companies: "Companies",
  contact: "Contact Requests",
  creator: "Creator Portal",
  dashboard: "Dashboard",
  duplicates: "Duplicate Review",
  "follow-ups": "Follow-ups",
  import: "Import Leads",
  "imtm-create": "Create IMTM Account",
  "influencer-logins": "Creator Accounts",
  influencers: "Influencer Workspace",
  "lead-add": "Add Influencer Lead",
  "lead-import": "Import Leads",
  "lead-overview": "Lead Overview",
  "lead-team": "Lead Team Accounts",
  leads: "Lead Details",
  me: "My Profile",
  "my-collaborations": "My Collaborations",
  "my-influencers": "My Influencers",
  "my-leads": "My Leads",
  "my-notifications": "Notifications",
  "my-shipments": "My Shipments",
  "my-tasks": "Follow-ups",
  ownership: "Assignments",
  panel: "Admin Hub",
  permissions: "Memberships & Permissions",
  products: "Products",
  submissions: "Submissions",
  "team-accounts": "Team Accounts",
  team: "Team",
};
export function workspaceHome(access: AccessState) {
  if (access.role === "lead_team")
    return `${base}/${access.domain === "gamer" ? "gamer-leads" : "lead-dashboard"}`;
  return `${base}/${access.role === "influencer" ? "creator" : "overview"}`;
}
export function canOpen(access: AccessState, module: string): boolean {
  if (access.state !== "approved" || !access.role) return false;
  if (module === "me") return true;
  if (access.role === "admin") return Object.hasOwn(moduleTitles, module);
  if (access.role === "imtm")
    return [
      "overview",
      "my-influencers",
      "influencers",
      "lead-add",
      "my-leads",
      "follow-ups",
    ].includes(module);
  if (access.role === "influencer")
    return ["creator", "my-collaborations", "my-notifications", "my-shipments"].includes(module);
  return access.domain === "gamer"
    ? module === "gamer-leads"
    : ["lead-dashboard", "lead-add", "lead-import", "my-leads"].includes(module);
}
const text = (max = 200) => z.string().trim().max(max);
export const socialSchema = z
  .object({
    platform: z.enum(["instagram", "youtube", "facebook", "x", "tiktok", "twitch", "other"]),
    handle: text(120)
      .min(1)
      .transform((v) => v.replace(/^@/, "").toLowerCase()),
    url: z
      .string()
      .url()
      .max(500)
      .refine((v) => v.startsWith("https://"), "Use an HTTPS social profile URL."),
    followers: z.number().int().min(0).max(10_000_000_000).default(0),
  })
  .strict();
export const leadSchema = z
  .object({
    name: text().min(2),
    email: z.union([z.literal(""), z.string().email().max(254)]).default(""),
    phone: text(40).default(""),
    city: text(100).default(""),
    country: text(100).default(""),
    category: text(100).default(""),
    notes: text(4000).default(""),
    socials: z.array(socialSchema).min(1).max(10),
  })
  .strict();
export const listSchema = z
  .object({
    module: z.string().max(50),
    page: z.number().int().min(1).max(100000).default(1),
    search: text(100).default(""),
    platform: text(30).default(""),
    city: text(100).default(""),
    country: text(100).default(""),
    category: text(100).default(""),
    minFollowers: z.number().int().nonnegative().default(0),
    maxFollowers: z.number().int().nonnegative().max(10_000_000_000).default(10_000_000_000),
  })
  .strict();
export type LeadInput = z.infer<typeof leadSchema>;
export type WorkspaceRow = Record<string, unknown>;
export type DashboardData = {
  influencers: number;
  campaigns: number;
  pending: number;
  due: number;
  leads: number;
  inProgress: number;
  closed: number;
  conversion: number;
  activity: { date: string; leads: number; campaigns: number }[];
  approvals: WorkspaceRow[];
  followUps: WorkspaceRow[];
};
export function assignmentDeadline(
  assignedAt: string,
  pausedSeconds: number,
  reviewStartedAt: string | null,
  now = Date.now(),
) {
  const banked = Math.max(0, pausedSeconds) * 1000;
  const activePause = reviewStartedAt ? Math.max(0, now - Date.parse(reviewStartedAt)) : 0;
  return new Date(Date.parse(assignedAt) + 7 * 86400000 + banked + activePause);
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}
