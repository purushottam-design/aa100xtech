import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AccessState, WorkspaceRole } from "../domain";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function databaseError(error: { code?: string; message?: string } | null) {
  if (!error) return;
  if (["PGRST205", "42P01", "PGRST202", "42703"].includes(error.code ?? ""))
    throw new ApiError(
      503,
      "SCHEMA_REQUIRED",
      "Partner Workspace database setup is incomplete. An authorized operator must review and install the workspace schema.",
    );
  if (error.code === "42501")
    throw new ApiError(403, "FORBIDDEN", "Your membership does not allow this operation.");
  if (["23505", "P0001", "40001"].includes(error.code ?? ""))
    throw new ApiError(
      409,
      "CONFLICT",
      error.code === "23505"
        ? "This social identity already exists. Review the existing record."
        : "The record changed or is not eligible for this action. Refresh and review its current state.",
    );
  if (["23514", "22023"].includes(error.code ?? ""))
    throw new ApiError(
      400,
      "INVALID_DATA",
      "The submitted data does not meet the workspace validation rules.",
    );
  throw new ApiError(
    503,
    "DATABASE_UNAVAILABLE",
    "Workspace database is unavailable. Check the configured master Supabase project and retry.",
  );
}
export async function authenticate(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!token) throw new ApiError(401, "SIGN_IN_REQUIRED", "Sign in to AA100XTech to continue.");
  const url = process.env["SUPABASE_URL"],
    key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const expected = process.env["CM365_EXPECTED_MASTER_REF"];
  if (
    !url ||
    !key ||
    url.replace(/\/$/, "") !== process.env["NEXT_PUBLIC_SUPABASE_URL"]?.replace(/\/$/, "") ||
    (expected && url.replace(/\/$/, "") !== `https://${expected}.supabase.co`)
  )
    throw new ApiError(
      503,
      "CONFIGURATION_REQUIRED",
      "Workspace authentication configuration is missing or inconsistent. Contact your operator.",
    );
  const db = createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }),
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  let verified;
  try {
    verified = await db.auth.getUser(token);
  } catch {
    throw new ApiError(
      503,
      "AUTH_UNAVAILABLE",
      "Unable to reach AA100XTech authentication. Please retry; your workspace membership has not been changed.",
    );
  }
  const { data, error } = verified;
  if (error) {
    if (error.status === 401 || error.status === 403 || error.name === "AuthSessionMissingError")
      throw new ApiError(401, "SESSION_EXPIRED", "Your session expired. Sign in again.");
    throw new ApiError(
      503,
      "AUTH_UNAVAILABLE",
      "Unable to reach AA100XTech authentication. Please retry; your workspace membership has not been changed.",
    );
  }
  if (!data.user) throw new ApiError(401, "SIGN_IN_REQUIRED", "Sign in to continue.");
  return { db, user: data.user };
}
export async function resolveAccess(
  db: SupabaseClient,
  user: { id: string; email?: string; user_metadata: Record<string, unknown> },
): Promise<AccessState> {
  const name = String(
    user.user_metadata["full_name"] ||
      user.user_metadata["name"] ||
      user.email?.split("@")[0] ||
      "Partner",
  );
  const identity = { id: user.id, name, email: user.email ?? "" };
  const { data: membership, error } = await db
    .from("cm365_memberships")
    .select("role,status")
    .eq("user_id", user.id)
    .maybeSingle();
  databaseError(error);
  const denied: AccessState = {
    state: "missing",
    user: identity,
    role: null,
    domain: null,
    accountId: null,
  };
  if (!membership) return denied;
  if (membership.status === "pending") return { ...denied, state: "pending" };
  if (membership.status !== "approved") return { ...denied, state: "disabled" };
  if (!["admin", "imtm", "lead_team", "influencer"].includes(membership.role)) return denied;
  const role = membership.role as WorkspaceRole;
  const table =
    role === "lead_team"
      ? "cm365_lead_team_accounts"
      : role === "influencer"
        ? "cm365_influencer_accounts"
        : "cm365_team_accounts";
  const { data: account, error: accountError } = await db
    .from(table)
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  databaseError(accountError);
  if (
    !account ||
    account.active !== true ||
    typeof account.id !== "string" ||
    !account.id ||
    (role === "influencer" && !account.influencer_id)
  )
    return { ...denied, state: "disabled" };
  const domain = role === "lead_team" ? account.lead_domain : null;
  if (role === "lead_team" && !["influencer", "gamer"].includes(domain)) return denied;
  return { state: "approved", user: identity, role, domain, accountId: account.id };
}
