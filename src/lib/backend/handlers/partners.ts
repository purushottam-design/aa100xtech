import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSupremeAdmin(context: { supabase: any; userId: string }) {
  // Check the role server-side against the authenticated user id. Admin-page
  // authorization must not fail merely because a client RLS policy hides the
  // caller's role row.
  const adminClient = await getAdminClient();
  const { data, error } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "supreme_admin")
    .maybeSingle();
  if (error) {
    const roleTableMissing =
      (error as { code?: string }).code === "PGRST205" ||
      (/user_roles/i.test(error.message) &&
        /schema cache|does not exist|relation/i.test(error.message));
    if (roleTableMissing) {
      const { isEnvAdminUser } = await import("@/lib/admin-env.server");
      if (await isEnvAdminUser(context.userId)) return;
      // Roles are not provisioned yet: deny instead of leaking a schema error.
      throw new Error("Forbidden: supreme user access only");
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("Forbidden: supreme user access only");
}

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const reviewSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().trim().max(500).optional(),
});

export const listPartnerApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSupremeAdmin(context);
    const adminClient = await getAdminClient();
    const { data, error } = await adminClient
      .from("partner_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reviewPartnerApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertSupremeAdmin(context);
    const adminClient = await getAdminClient();
    const { error } = await adminClient
      .from("partner_applications")
      .update({
        status: data.status,
        review_note: data.reviewNote ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.applicationId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
