import "server-only";
import { z } from "zod";
import { createServerFn } from "@/lib/backend/server";
import { setResponseStatus } from "@/lib/backend/request-context.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { influencerAdmin } from "@/lib/influencer-database.server";
import { authorize, AccessError } from "@/lib/rbac.server";
import {
  profileSchema,
  reviewStatuses,
  type InfluencerApplication,
  type InfluencerProfile,
} from "@/lib/influencers";

async function permission(userId: string, action: string) {
  try {
    return await authorize(userId, action);
  } catch (error) {
    if (error instanceof AccessError) setResponseStatus(error.status);
    throw error;
  }
}
const client = () => influencerAdmin;
export const listInfluencerApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await permission(context.userId, "partners.view");
    const rows: InfluencerApplication[] = [];
    for (let offset = 0; ; offset += 200) {
      const { data, error } = await client()
        .from("partner_applications")
        .select("*,influencer_profiles(*)")
        .or("is_influencer.eq.true,target_level.eq.Paid promotion collaboration")
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 199);
      if (error)
        throw new Error(
          "Could not load influencer applications. Check the database migration and server configuration.",
        );
      rows.push(
        ...((data ?? []).map((row) => ({
          ...row,
          profile: row.influencer_profiles ?? null,
          influencer_profiles: undefined,
        })) as InfluencerApplication[]),
      );
      if (!data || data.length < 200) break;
    }
    return rows;
  });
export const saveInfluencer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        applicationId: z.string().uuid(),
        status: z.enum(reviewStatuses),
        profile: profileSchema.nullable(),
        review_note: z.string().trim().max(2000),
        information_request: z.string().trim().max(2000),
        partnership_type: z.string().trim().max(250),
        collaboration_progress: z.string().trim().max(2000),
        revokeConsent: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await permission(context.userId, "partners.review");
    const { data: application, error } = await client()
      .from("partner_applications")
      .select("*")
      .eq("id", data.applicationId)
      .single();
    if (error || !application) throw new Error("Application not found");
    if (data.profile) {
      if (
        data.profile.publication_status === "published" &&
        data.status === "approved" &&
        !data.revokeConsent
      ) {
        const publicText = [
          data.profile.display_name,
          data.profile.city,
          data.profile.state,
          data.profile.biography,
          data.profile.specialization,
          data.profile.journey,
          data.profile.achievements,
          data.profile.collaboration_intro,
          data.profile.partnership_description,
        ];
        const privatePhone = (application.phone ?? "").replace(/\D/g, "");
        if (
          publicText.some(
            (text) =>
              text.toLowerCase().includes(application.email.toLowerCase()) ||
              (privatePhone.length >= 6 && text.replace(/\D/g, "").includes(privatePhone)),
          )
        )
          throw new Error(
            "Remove the applicant’s private email or phone from public profile text before publishing.",
          );
      }
      const media = [
        data.profile.profile_image,
        data.profile.cover_image,
        ...data.profile.gallery,
      ].filter((path): path is string => !!path);
      if (media.some((path) => !path.startsWith(`${data.applicationId}/`)))
        throw new Error("Images must belong to this application");
      if (
        data.profile.publication_status === "published" &&
        data.status === "approved" &&
        !data.revokeConsent &&
        (!application.publication_consent ||
          !application.processing_consent ||
          !data.profile.consent_confirmed ||
          !application.is_influencer)
      )
        throw new Error(
          "Publication requires approval, recorded applicant consent and admin consent confirmation.",
        );
    }
    const { error: updateError } = await client()
      .from("partner_applications")
      .update({
        status: data.status === "under_review" ? "pending" : data.status,
        influencer_review_status: data.status,
        review_note: data.review_note,
        information_request: data.information_request,
        partnership_type: data.partnership_type,
        collaboration_progress: data.collaboration_progress,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
        ...(data.revokeConsent ? { publication_consent: false } : {}),
      })
      .eq("id", data.applicationId);
    if (updateError) throw new Error("Could not save the application");
    let profile = data.profile;
    // Approval creates a draft from the existing submission; never publish on approval.
    if (!profile && data.status === "approved" && application.is_influencer) {
      const d = application.influencer_data;
      const { data: existing } = await client()
        .from("influencer_profiles")
        .select("id")
        .eq("application_id", application.id)
        .maybeSingle();
      if (!existing)
        profile = profileSchema.parse({
          ...d,
          slug: `${
            d.display_name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 60)
              .replace(/-$/, "") || "creator"
          }-${application.id}`,
          publication_status: "draft",
          consent_confirmed: false,
          featured: false,
        });
    }
    if (profile) {
      if (data.status !== "approved" || data.revokeConsent || !application.publication_consent)
        profile = { ...profile, publication_status: "unpublished", consent_confirmed: false };
      const { error: profileError } = await client()
        .from("influencer_profiles")
        .upsert(
          { ...profile, application_id: data.applicationId, updated_at: new Date().toISOString() },
          { onConflict: "application_id" },
        );
      if (profileError)
        throw new Error(
          profileError.code === "23505"
            ? "This profile slug is already in use. Choose another slug."
            : "Application saved, but the public profile could not be saved. Please retry.",
        );
    } else if (data.status !== "approved" || data.revokeConsent) {
      const { error: unpublishError } = await client()
        .from("influencer_profiles")
        .update({ publication_status: "unpublished", consent_confirmed: false })
        .eq("application_id", data.applicationId);
      if (unpublishError) throw new Error("Could not update the profile. Please retry.");
    }
    return { ok: true as const };
  });
