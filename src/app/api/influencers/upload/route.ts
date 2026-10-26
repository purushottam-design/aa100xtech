import { runWithRequestContext } from "@/lib/backend/request-context.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { authorize, AccessError } from "@/lib/rbac.server";
import {
  assertInfluencerOrigin,
  boundedFormData,
  InfluencerRequestError,
  requestError,
  storeInfluencerImage,
} from "@/lib/influencer-upload.server";
import { influencerAdmin } from "@/lib/influencer-database.server";
import { z } from "zod";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return runWithRequestContext(request, async (state) => {
    try {
      assertInfluencerOrigin(request);
      const { userId } = await requireSupabaseAuth();
      await authorize(userId, "partners.review");
      const fd = await boundedFormData(request);
      const parsedId = z.string().uuid().safeParse(fd.get("applicationId"));
      if (!parsedId.success) throw new InfluencerRequestError("Invalid application ID");
      const id = parsedId.data;
      const { data: application, error } = await influencerAdmin
        .from("partner_applications")
        .select("id")
        .eq("id", id)
        .eq("is_influencer", true)
        .single();
      if (error || !application) throw new InfluencerRequestError("Application not found", 404);
      const file = fd.get("file");
      if (!file || typeof file === "string") throw new InfluencerRequestError("Choose an image");
      return Response.json(
        { path: await storeInfluencerImage(file, id) },
        { headers: { "cache-control": "no-store" } },
      );
    } catch (error) {
      if (error instanceof AccessError || state.status === 401)
        return Response.json(
          { error: "You do not have permission to upload influencer images." },
          { status: state.status === 401 ? 401 : 403 },
        );
      return requestError(error);
    }
  });
}
