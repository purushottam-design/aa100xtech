import { z } from "zod";
import { runWithRequestContext } from "@/lib/backend/request-context.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { authorize, AccessError } from "@/lib/rbac.server";
import { influencerAdmin } from "@/lib/influencer-database.server";
import { programUpdateSchema } from "@/lib/influencer-program";
import {
  assertInfluencerOrigin,
  InfluencerRequestError,
  requestError,
} from "@/lib/influencer-upload.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request, write: boolean) {
  return runWithRequestContext(request, async (state) => {
    try {
      assertInfluencerOrigin(request);
      const { userId } = await requireSupabaseAuth();
      await authorize(userId, write ? "partners.review" : "partners.view");
      let input: z.infer<typeof programUpdateSchema> | undefined;
      let profileId: string;
      if (write) {
        if (!request.headers.get("content-type")?.startsWith("application/json"))
          throw new InfluencerRequestError("A JSON request is required", 415);
        const body = await request.text();
        if (body.length > 10000) throw new InfluencerRequestError("Request is too large", 413);
        try {
          input = programUpdateSchema.parse(JSON.parse(body));
        } catch {
          throw new InfluencerRequestError("Check the partner program details");
        }
        profileId = input.profileId;
      } else {
        const parsed = z
          .string()
          .uuid()
          .safeParse(new URL(request.url).searchParams.get("profileId"));
        if (!parsed.success) throw new InfluencerRequestError("Invalid profile ID");
        profileId = parsed.data;
      }
      const { data: profile, error: profileError } = await influencerAdmin
        .from("influencer_profiles")
        .select("id,application_id")
        .eq("id", profileId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile) throw new InfluencerRequestError("Partner profile not found", 404);
      if (!input) {
        const [referrals, testimonial] = await Promise.all([
          influencerAdmin
            .from("influencer_client_referrals")
            .select(
              "id,profile_id,client_reference,evidence_reference,status,confirmed_at,created_at",
            )
            .eq("profile_id", profileId)
            .order("created_at", { ascending: false })
            .limit(200),
          influencerAdmin
            .from("influencer_testimonials")
            .select("quote,publication_status,consent_confirmed")
            .eq("profile_id", profileId)
            .maybeSingle(),
        ]);
        if (referrals.error) throw referrals.error;
        if (testimonial.error) throw testimonial.error;
        return Response.json(
          { referrals: referrals.data ?? [], testimonial: testimonial.data },
          { headers: { "cache-control": "no-store" } },
        );
      }
      if (input.action === "referral") {
        if (
          input.status === "converted" &&
          (!input.confirmationReviewed || input.evidenceReference.length < 3)
        )
          throw new InfluencerRequestError(
            "Confirm the successful client conversion and add its private evidence reference",
          );
        const { data: existing, error: lookupError } = await influencerAdmin
          .from("influencer_client_referrals")
          .select("confirmed_at,confirmed_by")
          .eq("profile_id", profileId)
          .eq("client_reference", input.clientReference)
          .maybeSingle();
        if (lookupError) throw lookupError;
        const { error } = await influencerAdmin.from("influencer_client_referrals").upsert(
          {
            profile_id: profileId,
            client_reference: input.clientReference,
            evidence_reference: input.evidenceReference,
            status: input.status,
            confirmed_at:
              input.status === "converted"
                ? (existing?.confirmed_at ?? new Date().toISOString())
                : (existing?.confirmed_at ?? null),
            confirmed_by:
              input.status === "converted"
                ? (existing?.confirmed_by ?? userId)
                : (existing?.confirmed_by ?? null),
            updated_by: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id,client_reference" },
        );
        if (error?.code === "23505")
          throw new InfluencerRequestError(
            "This client is already credited to another partner. Review its attribution before confirming.",
            409,
          );
        if (error) throw error;
      } else {
        if (input.publicationStatus === "published" && !input.consentConfirmed)
          throw new InfluencerRequestError(
            "Publication requires the partner's permission for this exact quote",
          );
        const { data: application, error: applicationError } = await influencerAdmin
          .from("partner_applications")
          .select("email,phone")
          .eq("id", profile.application_id)
          .single();
        if (applicationError || !application)
          throw new InfluencerRequestError("Could not verify the partner's private details", 503);
        const phone = (application.phone ?? "").replace(/\D/g, "");
        if (
          input.quote.toLowerCase().includes(application.email.toLowerCase()) ||
          (phone.length >= 6 && input.quote.replace(/\D/g, "").includes(phone))
        )
          throw new InfluencerRequestError(
            "Remove private email and phone details from the public quote",
          );
        const { error } = await influencerAdmin.from("influencer_testimonials").upsert(
          {
            profile_id: profileId,
            quote: input.quote,
            publication_status: input.publicationStatus,
            consent_confirmed: input.consentConfirmed,
            approved_by: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" },
        );
        if (error) throw error;
      }
      return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      if (error instanceof AccessError || state.status === 401)
        return Response.json(
          { error: "Partner program administration requires permission." },
          { status: state.status === 401 ? 401 : 403 },
        );
      return requestError(error);
    }
  });
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
