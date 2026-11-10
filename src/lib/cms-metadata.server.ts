import "server-only";
import type { Metadata } from "next";
import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { safePublicUrl } from "./public-links";

const PUBLIC_METADATA_TAG = "public-page-metadata";

// Only published SEO fields are shared. Session/account data is never cached.
// A slow optional CMS lookup must not hold up an otherwise complete public page.
const publishedPageSeo = unstable_cache(
  async (placement: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("content_blocks")
        .select("title,subtitle,image_url")
        .eq("placement", `seo-${placement}`)
        .eq("active", true)
        .not("published_at", "is", null)
        .order("position")
        .limit(1)
        .abortSignal(AbortSignal.timeout(1500))
        .maybeSingle();
      return error ? null : data;
    } catch {
      return null;
    }
  },
  ["published-page-seo-v1"],
  { revalidate: 60, tags: [PUBLIC_METADATA_TAG] },
);

export function invalidateCmsPageMetadata() {
  revalidateTag(PUBLIC_METADATA_TAG, { expire: 0 });
}

export async function cmsPageMetadata(placement: string, fallback: Metadata): Promise<Metadata> {
  try {
    const data = await publishedPageSeo(placement);
    if (!data) return fallback;
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
      twitter: {
        ...fallback.twitter,
        card: "summary_large_image",
        title: data.title,
        description: description ?? undefined,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return fallback;
  }
}
