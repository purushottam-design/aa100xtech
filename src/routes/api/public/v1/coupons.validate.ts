import "server-only";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().trim().min(3).max(60),
  product_id: z.string().trim().max(120).optional(),
  order_value: z.number().min(0).max(100000000).optional(),
});

export const handlers = {
  OPTIONS: async () => {
    const { jsonResponse } = await import("@/lib/affiliate.server");
    return jsonResponse(null, 204);
  },
  POST: async ({ request }: { request: Request }) => {
    const { jsonResponse } = await import("@/lib/affiliate.server");

    let parsed;
    try {
      parsed = bodySchema.parse(await request.json());
    } catch (error) {
      return jsonResponse({ valid: false, error: "Invalid payload", details: String(error) }, 400);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const coupon = (
      await supabaseAdmin
        .from("coupon_codes")
        .select("id, code, affiliate_id, catalog_item_id, discount_type, discount_value, active")
        .eq("code", parsed.code.toUpperCase())
        .maybeSingle()
    ).data;

    if (!coupon || !coupon.active)
      return jsonResponse({ valid: false, reason: "inactive_or_unknown" });

    const affiliate = (
      await supabaseAdmin
        .from("affiliates")
        .select("affiliate_code, status")
        .eq("id", coupon.affiliate_id)
        .maybeSingle()
    ).data;
    if (!affiliate || affiliate.status !== "approved") {
      return jsonResponse({ valid: false, reason: "affiliate_inactive" });
    }

    let item = null;
    if (parsed.product_id) {
      const isUuid = /^[0-9a-f-]{36}$/i.test(parsed.product_id);
      item = (
        await supabaseAdmin
          .from("catalog_items")
          .select("id, slug, name")
          .eq(isUuid ? "id" : "slug", parsed.product_id)
          .maybeSingle()
      ).data;

      if (coupon.catalog_item_id && item && coupon.catalog_item_id !== item.id) {
        return jsonResponse({ valid: false, reason: "not_valid_for_product" });
      }
    }

    const orderValue = parsed.order_value ?? 0;
    const discountAmount =
      coupon.discount_type === "flat"
        ? Math.min(Number(coupon.discount_value), orderValue)
        : Math.round(((orderValue * Number(coupon.discount_value)) / 100) * 100) / 100;

    return jsonResponse({
      valid: true,
      code: coupon.code,
      affiliate_id: affiliate.affiliate_code,
      scope: coupon.catalog_item_id ? "product" : "sitewide",
      product: item ? { id: item.id, slug: item.slug, name: item.name } : null,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      discount_amount: discountAmount,
      final_value: Math.max(0, orderValue - discountAmount),
    });
  },
};
