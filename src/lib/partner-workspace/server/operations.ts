import "server-only";
import { z } from "zod";
import { canOpen, leadSchema, listSchema, type AccessState, type DashboardData } from "../domain";
import { ApiError, databaseError } from "./access";
import type { SupabaseClient } from "@supabase/supabase-js";

const idSchema = z.string().uuid();
export const tables: Record<string, { table: string; select: string }> = {
  creators: {
    table: "cm365_influencers",
    select:
      "id,name,email,phone,city,country,category,socials,max_followers,stage,assigned_to,assigned_at,paused_seconds,review_started_at,created_at",
  },
  "my-influencers": {
    table: "cm365_influencers",
    select:
      "id,name,city,category,socials,stage,assigned_at,paused_seconds,review_started_at,created_at",
  },
  "lead-dashboard": {
    table: "cm365_influencer_leads",
    select:
      "id,name,email,phone,city,country,category,socials,max_followers,status,source,created_at",
  },
  "my-leads": {
    table: "cm365_influencer_leads",
    select: "id,name,city,category,socials,status,source,created_at",
  },
  "gamer-leads": {
    table: "cm365_gamer_leads",
    select:
      "id,name,email,phone,city,country,category,socials,max_followers,status,source,created_at",
  },
  campaigns: { table: "cm365_campaigns", select: "id,name,brand,status,created_at" },
  projects: { table: "cm365_projects", select: "id,name,status,created_at" },
  inventory: { table: "cm365_products", select: "id,name,sku,stock,created_at" },
  products: { table: "cm365_products", select: "id,name,sku,stock,created_at" },
  shipments: {
    table: "cm365_shipments",
    select: "id,tracking_number,carrier,status,created_at,influencer:cm365_influencers(id,name)",
  },
  "deal-approvals": {
    table: "cm365_deal_approvals",
    select:
      "id,influencer_id,revision,snapshot,status,review_note,created_at,influencer:cm365_influencers(id,name,socials)",
  },
  "follow-ups": {
    table: "cm365_follow_up_tasks",
    select:
      "id,next_action,due_at,completed_at,created_at,influencer:cm365_influencers(id,name),assignee:cm365_team_accounts(name)",
  },
  imtm: { table: "cm365_team_accounts", select: "id,name,active,created_at,user_id" },
  "team-accounts": { table: "cm365_team_accounts", select: "id,name,active,created_at,user_id" },
  "lead-team": {
    table: "cm365_lead_team_accounts",
    select: "id,name,active,lead_domain,created_at",
  },
  permissions: { table: "cm365_memberships", select: "user_id,role,status,created_at" },
  activity: { table: "cm365_activity_logs", select: "id,action,entity,entity_id,created_at" },
};
function permit(access: AccessState, module: string) {
  if (!canOpen(access, module))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Your approved Partners role does not allow this feature.",
    );
}
async function rpc(db: SupabaseClient, name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args);
  databaseError(error);
  return data;
}
export async function operate(
  operation: string,
  input: unknown,
  db: SupabaseClient,
  access: AccessState,
) {
  if (access.state !== "approved")
    throw new ApiError(
      403,
      "ACCESS_RESTRICTED",
      `Workspace access is ${access.state}. Contact an authorized Partners Admin.`,
    );
  if (operation === "dashboard") {
    permit(access, "overview");
    const { range } = z
      .object({ range: z.enum(["7", "30", "90", "year"]).default("30") })
      .parse(input);
    const now = new Date(),
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (range === "year") start.setUTCMonth(0, 1);
    else start.setUTCDate(start.getUTCDate() - Number(range) + 1);
    const result = await rpc(db, "cm365_dashboard", { p_start: start.toISOString().slice(0, 10) });
    const [approvals, followUps] = await Promise.all([
      db
        .from("cm365_deal_approvals")
        .select(tables["deal-approvals"]!.select)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(3),
      db
        .from("cm365_follow_up_tasks")
        .select(tables["follow-ups"]!.select)
        .is("completed_at", null)
        .order("due_at", { ascending: true })
        .limit(4),
    ]);
    databaseError(approvals.error);
    databaseError(followUps.error);
    return {
      ...result,
      approvals: approvals.data ?? [],
      followUps: followUps.data ?? [],
    } as DashboardData;
  }
  if (operation === "list") {
    const filter = listSchema.parse(input);
    permit(access, filter.module);
    const config = tables[filter.module];
    if (!config)
      throw new ApiError(
        501,
        "SOURCE_INTEGRATION_REQUIRED",
        "This workflow requires the original Partners source and schema reconciliation. It is not yet integrated.",
      );
    let query = db.from(config.table).select(config.select, { count: "exact" });
    const hasIdentity = [
      "creators",
      "my-influencers",
      "lead-dashboard",
      "my-leads",
      "gamer-leads",
    ].includes(filter.module);
    if (filter.search) {
      if (
        !hasIdentity &&
        ![
          "campaigns",
          "projects",
          "inventory",
          "products",
          "imtm",
          "lead-team",
          "team-accounts",
        ].includes(filter.module)
      )
        throw new ApiError(400, "FILTER_UNSUPPORTED", "Search is unavailable for this module.");
      query = query.ilike("name", `%${filter.search.replace(/[%_\\]/g, "\\$&")}%`);
    }
    if (hasIdentity) {
      for (const field of ["city", "country", "category"] as const)
        if (filter[field]) query = query.ilike(field, filter[field].replace(/[%_\\]/g, "\\$&"));
      // All profiles are tested together, so a secondary social profile can match.
      if (filter.platform || filter.minFollowers || filter.maxFollowers !== 10_000_000_000) {
        // Aggregates provide any-platform follower matching; compound same-profile semantics await source reconciliation.
        if (filter.platform) query = query.contains("platforms", [filter.platform]);
        query = query
          .gte("max_followers", filter.minFollowers)
          .lte("max_followers", filter.maxFollowers);
      }
    }
    if (filter.module === "follow-ups") query = query.is("completed_at", null);
    const result = await query
      .order("created_at", { ascending: false })
      .range((filter.page - 1) * 20, filter.page * 20 - 1);
    databaseError(result.error);
    return { rows: result.data ?? [], count: result.count ?? 0, page: filter.page };
  }
  if (operation === "add-lead" || operation === "import-leads") {
    const payload = z
      .object({
        domain: z.enum(["influencer", "gamer"]),
        rows: z
          .array(leadSchema)
          .min(1)
          .max(operation === "add-lead" ? 1 : 100),
      })
      .strict()
      .parse(input);
    permit(access, payload.domain === "gamer" ? "gamer-leads" : "lead-add");
    if (operation === "import-leads")
      permit(
        access,
        payload.domain === "gamer"
          ? "gamer-leads"
          : access.role === "admin"
            ? "import"
            : "lead-import",
      );
    const outcomes: { row: number; status: string; id?: string }[] = [];
    for (const [index, row] of payload.rows.entries()) {
      try {
        const id = await rpc(db, "cm365_add_lead", {
          p_domain: payload.domain,
          p_lead: row,
          p_source: operation === "add-lead" ? "manual" : "csv",
        });
        outcomes.push({ row: index + 1, status: "inserted", id });
      } catch (error) {
        if (error instanceof ApiError && error.code === "CONFLICT")
          outcomes.push({ row: index + 1, status: "duplicate" });
        else throw error;
      }
    }
    return { outcomes };
  }
  if (operation === "detail") {
    const { id, kind } = z
      .object({ id: idSchema, kind: z.enum(["influencer", "lead", "approval"]) })
      .parse(input);
    permit(
      access,
      kind === "influencer" ? "influencers" : kind === "lead" ? "leads" : "deal-approvals",
    );
    const table =
      kind === "influencer"
        ? "cm365_influencers"
        : kind === "lead"
          ? "cm365_influencer_leads"
          : "cm365_deal_approvals";
    const result = await db.from(table).select("*").eq("id", id).maybeSingle();
    databaseError(result.error);
    if (!result.data)
      throw new ApiError(404, "NOT_FOUND", "Record not found or no longer assigned to you.");
    if (kind !== "influencer") return { record: result.data };
    const [draft, communications] = await Promise.all([
      db
        .from("cm365_influencer_deal_drafts")
        .select("revision,terms")
        .eq("influencer_id", id)
        .maybeSingle(),
      db
        .from("cm365_influencer_comm_log")
        .select("id,channel,notes,created_at")
        .eq("influencer_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);
    databaseError(draft.error);
    databaseError(communications.error);
    return { record: result.data, draft: draft.data, communications: communications.data ?? [] };
  }
  if (operation === "convert-lead") {
    permit(access, "creators");
    return rpc(db, "cm365_convert_lead", { p_id: z.object({ id: idSchema }).parse(input).id });
  }
  if (operation === "assign") {
    permit(access, "ownership");
    const p = z.object({ id: idSchema, accountId: idSchema }).parse(input);
    return rpc(db, "cm365_assign", { p_id: p.id, p_account: p.accountId });
  }
  if (operation === "log-contact") {
    permit(access, "influencers");
    const p = z
      .object({
        id: idSchema,
        channel: z.enum(["call", "whatsapp", "instagram", "email", "meeting", "other"]),
        notes: z.string().trim().min(1).max(4000),
        due: z.string().datetime().nullable(),
        action: z.string().trim().max(500),
      })
      .parse(input);
    return rpc(db, "cm365_log_contact", {
      p_id: p.id,
      p_channel: p.channel,
      p_notes: p.notes,
      p_due: p.due,
      p_action: p.action,
    });
  }
  if (operation === "complete-task") {
    permit(access, "follow-ups");
    return rpc(db, "cm365_complete_task", { p_id: z.object({ id: idSchema }).parse(input).id });
  }
  if (operation === "save-draft") {
    permit(access, "influencers");
    const termsSchema = z
      .object({
        brand: z.string().trim().max(200),
        collaboration: z.enum(["paid", "barter", "affiliate", "hybrid"]),
        currency: z.string().regex(/^[A-Z]{3}$/),
        amount: z.number().nonnegative().max(1e12),
        advance: z.number().nonnegative().max(1e12),
        summary: z.string().trim().max(4000),
        agreementStatus: z.enum(["draft", "agreed"]),
        paymentTerms: z.string().trim().max(2000),
        deliverables: z
          .array(
            z
              .object({
                platform: z.string().min(1).max(40),
                type: z.string().min(1).max(40),
                quantity: z.number().int().min(1).max(10000),
                dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
              })
              .strict(),
          )
          .min(1)
          .max(50),
      })
      .strict()
      .refine((v) => v.advance <= v.amount, "Advance cannot exceed the final amount.");
    const p = z
      .object({ id: idSchema, revision: z.number().int().nonnegative(), terms: termsSchema })
      .strict()
      .parse(input);
    return rpc(db, "cm365_save_draft", { p_id: p.id, p_revision: p.revision, p_terms: p.terms });
  }
  if (operation === "submit-deal") {
    permit(access, "influencers");
    const p = z.object({ id: idSchema, revision: z.number().int().positive() }).parse(input);
    return rpc(db, "cm365_submit_deal", { p_id: p.id, p_revision: p.revision });
  }
  if (operation === "decide-deal") {
    permit(access, "deal-approvals");
    const p = z
      .object({
        id: idSchema,
        decision: z.enum(["approved", "rejected", "changes_requested"]),
        note: z.string().trim().min(3).max(1000),
      })
      .parse(input);
    return rpc(db, "cm365_decide_deal", { p_id: p.id, p_decision: p.decision, p_note: p.note });
  }
  if (operation === "create-operation") {
    const p = z
      .object({
        kind: z.enum(["campaigns", "projects", "products"]),
        name: z.string().trim().min(2).max(200),
        brand: z.string().trim().max(200).default(""),
        sku: z.string().trim().max(100).default(""),
        status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
      })
      .strict()
      .parse(input);
    permit(access, p.kind);
    if (p.kind === "products" && !p.sku)
      throw new ApiError(400, "INVALID_DATA", "SKU is required.");
    return rpc(db, "cm365_create_operation", { p_kind: p.kind, p_data: p });
  }
  if (operation === "adjust-stock") {
    permit(access, "inventory");
    const p = z
      .object({
        id: idSchema,
        quantity: z
          .number()
          .int()
          .min(-1000000)
          .max(1000000)
          .refine((v) => v !== 0),
        reason: z.string().trim().min(3).max(500),
        requestId: idSchema,
      })
      .parse(input);
    return rpc(db, "cm365_adjust_stock", {
      p_id: p.id,
      p_quantity: p.quantity,
      p_reason: p.reason,
      p_request: p.requestId,
    });
  }
  if (operation === "match-creators") {
    permit(access, "matchmaker");
    throw new ApiError(
      503,
      "AI_CONFIGURATION_REQUIRED",
      "The authorized source AI integration, quota policy and provider credentials must be reconciled before matching can be enabled.",
    );
  }
  throw new ApiError(404, "UNKNOWN_OPERATION", "Unknown workspace operation.");
}
