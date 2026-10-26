import { mediaBucket, mediaPathSchema } from "@/lib/influencers";
import { publicInfluencerClient } from "@/lib/influencers.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runWithRequestContext } from "@/lib/backend/request-context.server";
import { authorize } from "@/lib/rbac.server";

export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!mediaPathSchema.safeParse(path).success) return new Response(null, { status: 404 });
  try {
    let admin = false;
    if (request.headers.has("authorization"))
      admin = await runWithRequestContext(request, async () => {
        try {
          const { userId } = await requireSupabaseAuth();
          await authorize(userId, "partners.view");
          return true;
        } catch {
          return false;
        }
      });
    if (!admin) {
      const { data, error } = await publicInfluencerClient()
        .from("influencer_profiles")
        .select("profile_image,cover_image,gallery")
        .eq("application_id", path.split("/")[0])
        .maybeSingle();
      if (
        error ||
        !data ||
        ![data.profile_image, data.cover_image, ...(data.gallery ?? [])].includes(path)
      )
        return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
    }
    const { data, error } = await supabaseAdmin.storage.from(mediaBucket).download(path);
    if (error || !data) return new Response(null, { status: 404 });
    return new Response(data, {
      headers: {
        "content-type": "image/webp",
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
