import "server-only";

export const handlers = {
  GET: async ({
    request,
    params,
  }: {
    request: Request;
    params: { affiliateId: string; slug: string };
  }) => {
    const { hashIp, deviceFromUserAgent } = await import("@/lib/affiliate.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const affiliateCode = params.affiliateId;
    const itemSlug = params.slug;

    const [affiliateRes, itemRes] = await Promise.all([
      supabaseAdmin
        .from("affiliates")
        .select("id, status, affiliate_code")
        .eq("affiliate_code", affiliateCode)
        .maybeSingle(),
      supabaseAdmin
        .from("catalog_items")
        .select("id, slug, landing_url, cookie_duration_days, active")
        .eq("slug", itemSlug)
        .maybeSingle(),
    ]);

    const item = itemRes.data;
    const affiliate = affiliateRes.data;
    const fallback = new URL(request.url).origin;

    if (!item || !item.active) {
      return Response.redirect(fallback, 302);
    }
    if (!affiliate || affiliate.status !== "approved") {
      return Response.redirect(item.landing_url, 302);
    }

    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const ipHash = hashIp(ip);
    const device = deviceFromUserAgent(request.headers.get("user-agent"));
    const source =
      new URL(request.url).searchParams.get("utm_source") ?? request.headers.get("referer");

    const link = (
      await supabaseAdmin
        .from("referral_links")
        .select("id")
        .eq("affiliate_id", affiliate.id)
        .eq("catalog_item_id", item.id)
        .maybeSingle()
    ).data;

    // Fraud guard: same affiliate + item + ip within 60s counts as duplicate
    let isDuplicate = false;
    if (ipHash) {
      const since = new Date(Date.now() - 60_000).toISOString();
      const dupe = await supabaseAdmin
        .from("affiliate_clicks")
        .select("id")
        .eq("affiliate_id", affiliate.id)
        .eq("catalog_item_id", item.id)
        .eq("ip_hash", ipHash)
        .gte("created_at", since)
        .limit(1);
      isDuplicate = (dupe.data ?? []).length > 0;
    }

    await supabaseAdmin.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      catalog_item_id: item.id,
      referral_link_id: link?.id ?? null,
      ip_hash: ipHash,
      device,
      source: source ?? null,
      is_duplicate: isDuplicate,
    });

    const maxAge = item.cookie_duration_days * 24 * 60 * 60;
    const cookieValue = encodeURIComponent(
      JSON.stringify({ a: affiliate.affiliate_code, i: item.slug, t: Date.now() }),
    );

    const target = new URL(item.landing_url);
    target.searchParams.set("aa_ref", affiliate.affiliate_code);
    target.searchParams.set("aa_item", item.slug);

    return new Response(null, {
      status: 302,
      headers: {
        location: target.toString(),
        "set-cookie": `aa_ref=${cookieValue}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`,
        "cache-control": "no-store",
      },
    });
  },
};
