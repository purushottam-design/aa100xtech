import { z } from "zod";
import { runWithRequestContext } from "@/lib/backend/request-context.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { authorize, AccessError } from "@/lib/rbac.server";
import { influencerAdmin } from "@/lib/influencer-database.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { kitBucket } from "@/lib/marketing-intake.server";
import { InfluencerRequestError } from "@/lib/influencer-upload.server";
import { marketingRequestError } from "@/lib/marketing-errors.server";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return runWithRequestContext(request, async (state) => {
    try {
      const { userId } = await requireSupabaseAuth();
      await authorize(userId, "partners.view");
      const { id } = await context.params;
      if (!z.string().uuid().safeParse(id).success)
        throw new InfluencerRequestError("Invalid application", 400);
      const { data, error } = await influencerAdmin
        .from("partner_applications")
        .select("influencer_data")
        .eq("id", id)
        .eq("is_influencer", true)
        .single();
      const path = data?.influencer_data?.media_kit;
      if (error || !path || !/^[-a-f0-9]{36}\/[-a-f0-9]{36}\.(pdf|webp)$/.test(path))
        throw new InfluencerRequestError("Media kit not found", 404);
      const result = await supabaseAdmin.storage.from(kitBucket).download(path);
      if (result.error || !result.data) throw new Error("Unable to download media kit");
      const extension = path.endsWith(".pdf") ? "pdf" : "webp";
      return new Response(result.data, {
        headers: {
          "content-type": extension === "pdf" ? "application/pdf" : "image/webp",
          "content-disposition": `attachment; filename=media-kit-${id}.${extension}`,
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy": "sandbox",
        },
      });
    } catch (error) {
      if (error instanceof AccessError || state.status === 401)
        return Response.json(
          { error: "Access denied" },
          { status: state.status === 401 ? 401 : 403 },
        );
      return marketingRequestError(error);
    }
  });
}
