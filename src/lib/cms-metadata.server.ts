import "server-only";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { safePublicUrl } from "./public-links";
export async function cmsPageMetadata(placement: string, fallback: Metadata): Promise<Metadata> {
  try {
    const { data, error } = await supabaseAdmin
      .from("content_blocks")
      .select("title,subtitle,image_url")
      .eq("placement", `seo-${placement}`)
      .eq("active", true)
      .not("published_at", "is", null)
      .order("position")
      .limit(1)
      .abortSignal(AbortSignal.timeout(5000))
      .maybeSingle();
    if (error || !data) return fallback;
    const description = data.subtitle || fallback.description;
    const image = safePublicUrl(data.image_url);
    return {
      ...fallback,
      title: data.title,
      description,
      openGraph: {
        ...fallback.openGraph,
        title: data.title,
        description: description ?? undefined,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return fallback;
  }
}
