import "server-only";
import { z } from "zod";

const bodySchema = z
  .object({
    affiliate_id: z.string().trim().max(60).optional(),
    coupon_code: z.string().trim().max(60).optional(),
    product_id: z.string().trim().min(1).max(120),
    order_id: z.string().trim().min(1).max(120),
    order_value: z.number().min(0).max(100000000),
    currency: z.string().trim().length(3).optional(),
    event_type: z.enum(["sale", "signup", "renewal"]).optional(),
    is_recurring: z.boolean().optional(),
    customer_user_id: z.string().trim().max(80).optional(),
  })
  .refine((v) => Boolean(v.affiliate_id || v.coupon_code), {
    message: "affiliate_id or coupon_code is required",
  });

export const handlers = {
  OPTIONS: async () => {
    const { jsonResponse } = await import("@/lib/affiliate.server");
    return jsonResponse(null, 204);
  },
  POST: async ({ request }: { request: Request }) => {
    const { jsonResponse, isValidApiKey, calculateCommission } =
      await import("@/lib/affiliate.server");

    if (!isValidApiKey(request)) {
      return jsonResponse({ error: "Invalid or missing x-api-key" }, 401);
    }

    let parsed;
    try {
      parsed = bodySchema.parse(await request.json());
    } catch (error) {
      return jsonResponse({ error: "Invalid payload", details: String(error) }, 400);
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve catalog item by slug or uuid
    const isUuid = /^[0-9a-f-]{36}$/i.test(parsed.product_id);
    const item = (
      await supabaseAdmin
        .from("catalog_items")
        .select("*")
        [isUuid ? "eq" : "eq"](isUuid ? "id" : "slug", parsed.product_id)
        .maybeSingle()
    ).data;
    if (!item) return jsonResponse({ error: "Unknown product_id" }, 404);

    // Resolve affiliate: coupon code takes priority (cookie-less attribution)
    let affiliateId: string | null = null;
    let couponId: string | null = null;
    let attribution = "link";

    if (parsed.coupon_code) {
      const coupon = (
        await supabaseAdmin
          .from("coupon_codes")
          .select("*")
          .eq("code", parsed.coupon_code.toUpperCase())
          .eq("active", true)
          .maybeSingle()
      ).data;
      if (coupon) {
        affiliateId = coupon.affiliate_id;
        couponId = coupon.id;
        attribution = "coupon";
      }
    }

    if (!affiliateId && parsed.affiliate_id) {
      const affiliate = (
        await supabaseAdmin
          .from("affiliates")
          .select("id")
          .eq("affiliate_code", parsed.affiliate_id)
          .maybeSingle()
      ).data;
      affiliateId = affiliate?.id ?? null;
    }

    if (!affiliateId) return jsonResponse({ error: "Affiliate could not be attributed" }, 404);

    const affiliate = (
      await supabaseAdmin
        .from("affiliates")
        .select("id, user_id, status, custom_commission_type, custom_commission_value")
        .eq("id", affiliateId)
        .maybeSingle()
    ).data;
    if (!affiliate || affiliate.status !== "approved") {
      return jsonResponse({ error: "Affiliate is not active" }, 403);
    }

    // Self-referral block
    if (parsed.customer_user_id && affiliate.user_id === parsed.customer_user_id) {
      return jsonResponse({ error: "Self-referral is not allowed" }, 409);
    }

    const isRecurring = parsed.is_recurring ?? parsed.event_type === "renewal";
    if (isRecurring && !item.recurring) {
      return jsonResponse({ error: "This product does not pay recurring commission" }, 409);
    }

    // Duplicate order guard (same order + item + recurrence)
    const existing = (
      await supabaseAdmin
        .from("conversions")
        .select("id")
        .eq("order_id", parsed.order_id)
        .eq("catalog_item_id", item.id)
        .eq("is_recurring", isRecurring)
        .limit(1)
    ).data;
    if ((existing ?? []).length) {
      return jsonResponse({ status: "duplicate", message: "Conversion already recorded" }, 200);
    }

    const commission = calculateCommission({
      orderValue: parsed.order_value,
      item,
      affiliate,
    });

    const insert = await supabaseAdmin
      .from("conversions")
      .insert({
        affiliate_id: affiliate.id,
        catalog_item_id: item.id,
        coupon_code_id: couponId,
        event_type: parsed.event_type ?? "sale",
        order_id: parsed.order_id,
        order_value: parsed.order_value,
        currency: parsed.currency ?? "INR",
        commission_earned: commission,
        is_recurring: isRecurring,
        attribution,
        status: "pending",
      })
      .select("id, commission_earned, status")
      .single();

    if (insert.error) return jsonResponse({ error: insert.error.message }, 500);

    return jsonResponse({
      status: "recorded",
      conversion_id: insert.data.id,
      commission_earned: insert.data.commission_earned,
      commission_status: insert.data.status,
    });
  },
};
