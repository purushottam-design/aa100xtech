import "server-only";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
export async function publishedBlog(slug?: string) {
  let query = supabaseAdmin
    .from("content_blocks")
    .select("id,slug,title,subtitle,body,image_url,published_at")
    .eq("active", true)
    .eq("block_type", "blog")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .abortSignal(AbortSignal.timeout(5000))
    .limit(100);
  if (slug) query = query.eq("slug", slug);
  const { data, error } = await query;
  return { rows: data ?? [], unavailable: !!error };
}
