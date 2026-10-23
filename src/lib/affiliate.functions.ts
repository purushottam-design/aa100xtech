import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const registerSchema = z.object({
  entityType: z.enum(["individual", "company"]),
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  country: z.string().trim().max(80).optional(),
  audienceNote: z.string().trim().max(1000).optional(),
  payoutMethod: z.enum(["upi", "bank", "paypal", "stripe", "razorpay"]),
  payoutAccount: z.string().trim().min(3).max(200),
  payoutName: z.string().trim().max(120).optional(),
  payoutIfsc: z.string().trim().max(30).optional(),
  panOrTaxId: z.string().trim().max(60).optional(),
});

export const listCatalogItems = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("catalog_items")
    .select("*")
    .eq("active", true)
    .order("category", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getMyAffiliate = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const registerAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { buildAffiliateCode, buildCouponCode } = await import("@/lib/affiliate.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const existing = await supabaseAdmin
      .from("affiliates")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing.data) throw new Error("You already have an affiliate account.");

    const insert = await supabaseAdmin
      .from("affiliates")
      .insert({
        user_id: context.userId,
        affiliate_code: buildAffiliateCode(),
        entity_type: data.entityType,
        full_name: data.fullName,
        company_name: data.companyName ?? null,
        email: data.email,
        phone: data.phone ?? null,
        country: data.country ?? null,
        audience_note: data.audienceNote ?? null,
        payout_method: data.payoutMethod,
        payout_details: {
          account: data.payoutAccount,
          holder: data.payoutName ?? data.fullName,
          ifsc: data.payoutIfsc ?? null,
        },
        kyc_info: { pan_or_tax_id: data.panOrTaxId ?? null, submitted_at: new Date().toISOString() },
        status: "pending",
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);

    await supabaseAdmin.from("coupon_codes").insert({
      affiliate_id: insert.data.id,
      catalog_item_id: null,
      code: buildCouponCode(data.fullName),
      discount_type: "percent",
      discount_value: 10,
    });

    return insert.data;
  });

/** Returns (creating if needed) the referral link + coupon for one catalog item. */
export const getOrCreateAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ catalogItemId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { buildLinkSlug, buildCouponCode } = await import("@/lib/affiliate.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const affiliate = await supabaseAdmin
      .from("affiliates")
      .select("id, full_name, status, affiliate_code")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!affiliate.data) throw new Error("No affiliate account found.");
    if (affiliate.data.status !== "approved") throw new Error("Your affiliate account is not approved yet.");

    const item = await supabaseAdmin
      .from("catalog_items")
      .select("id, slug, name")
      .eq("id", data.catalogItemId)
      .maybeSingle();
    if (!item.data) throw new Error("Catalog item not found.");

    let link = (
      await supabaseAdmin
        .from("referral_links")
        .select("*")
        .eq("affiliate_id", affiliate.data.id)
        .eq("catalog_item_id", item.data.id)
        .maybeSingle()
    ).data;

    if (!link) {
      const created = await supabaseAdmin
        .from("referral_links")
        .insert({
          affiliate_id: affiliate.data.id,
          catalog_item_id: item.data.id,
          unique_slug: buildLinkSlug(),
        })
        .select("*")
        .single();
      if (created.error) throw new Error(created.error.message);
      link = created.data;
    }

    let coupon = (
      await supabaseAdmin
        .from("coupon_codes")
        .select("*")
        .eq("affiliate_id", affiliate.data.id)
        .eq("catalog_item_id", item.data.id)
        .maybeSingle()
    ).data;

    if (!coupon) {
      const created = await supabaseAdmin
        .from("coupon_codes")
        .insert({
          affiliate_id: affiliate.data.id,
          catalog_item_id: item.data.id,
          code: buildCouponCode(affiliate.data.full_name),
          discount_type: "percent",
          discount_value: 10,
        })
        .select("*")
        .single();
      if (created.error) throw new Error(created.error.message);
      coupon = created.data;
    }

    return {
      affiliateCode: affiliate.data.affiliate_code,
      itemSlug: item.data.slug,
      itemName: item.data.name,
      url: `/go/${affiliate.data.affiliate_code}/${item.data.slug}`,
      link,
      coupon,
    };
  });

export const getAffiliateDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const affiliate = (
      await supabase.from("affiliates").select("*").eq("user_id", context.userId).maybeSingle()
    ).data;
    if (!affiliate) return null;

    const [clicks, conversions, payouts, links, coupons] = await Promise.all([
      supabase.from("affiliate_clicks").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("conversions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("referral_links").select("*"),
      supabase.from("coupon_codes").select("*"),
    ]);

    const conv = conversions.data ?? [];
    const paid = conv.filter((c) => c.status === "paid").reduce((s, c) => s + Number(c.commission_earned), 0);
    const approved = conv
      .filter((c) => c.status === "approved")
      .reduce((s, c) => s + Number(c.commission_earned), 0);
    const pending = conv
      .filter((c) => c.status === "pending")
      .reduce((s, c) => s + Number(c.commission_earned), 0);

    return {
      affiliate,
      clicks: clicks.data ?? [],
      conversions: conv,
      payouts: payouts.data ?? [],
      links: links.data ?? [],
      coupons: coupons.data ?? [],
      totals: {
        clicks: (clicks.data ?? []).length,
        conversions: conv.length,
        earnings: paid + approved + pending,
        pendingPayout: approved,
        paidPayout: paid,
        unapproved: pending,
        conversionRate: (clicks.data ?? []).length
          ? Math.round((conv.length / (clicks.data ?? []).length) * 1000) / 10
          : 0,
      },
    };
  });

export const requestPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ amount: z.number().positive().max(10000000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const affiliate = (
      await supabaseAdmin
        .from("affiliates")
        .select("id, payout_method, min_payout_threshold, status")
        .eq("user_id", context.userId)
        .maybeSingle()
    ).data;
    if (!affiliate || affiliate.status !== "approved") throw new Error("Affiliate account not approved.");

    const conv = (
      await supabaseAdmin
        .from("conversions")
        .select("commission_earned")
        .eq("affiliate_id", affiliate.id)
        .eq("status", "approved")
    ).data ?? [];
    const available = conv.reduce((s, c) => s + Number(c.commission_earned), 0);

    if (data.amount > available) throw new Error("Requested amount exceeds your approved balance.");
    if (data.amount < Number(affiliate.min_payout_threshold))
      throw new Error(`Minimum payout is ${affiliate.min_payout_threshold}.`);

    const { error } = await supabaseAdmin.from("payouts").insert({
      affiliate_id: affiliate.id,
      amount: data.amount,
      method: affiliate.payout_method,
      status: "requested",
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ------------------------------- ADMIN SIDE ------------------------------- */

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "supreme_admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: supreme user access only");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [affiliates, items, conversions, clicks, payouts, coupons, links] = await Promise.all([
      supabaseAdmin.from("affiliates").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("catalog_items").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("conversions").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("affiliate_clicks").select("*").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("payouts").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("coupon_codes").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("referral_links").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      affiliates: affiliates.data ?? [],
      catalog: items.data ?? [],
      conversions: conversions.data ?? [],
      clicks: clicks.data ?? [],
      payouts: payouts.data ?? [],
      coupons: coupons.data ?? [],
      links: links.data ?? [],
    };
  });

export const reviewAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        affiliateId: z.string().uuid(),
        status: z.enum(["approved", "rejected", "suspended", "pending"]),
        tier: z.string().trim().max(30).optional(),
        customCommissionType: z.enum(["percent", "flat"]).nullable().optional(),
        customCommissionValue: z.number().min(0).max(1000000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: {
      status: string;
      tier?: string;
      custom_commission_value?: number | null;
      custom_commission_type?: string | null;
    } = { status: data.status };
    if (data.tier) patch.tier = data.tier;
    if (data.customCommissionValue !== undefined) {
      patch.custom_commission_value = data.customCommissionValue;
      patch.custom_commission_type = data.customCommissionType ?? "percent";
    }
    const { error } = await supabaseAdmin.from("affiliates").update(patch).eq("id", data.affiliateId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const upsertCatalogItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        type: z.enum(["website", "app", "product", "service"]),
        name: z.string().trim().min(2).max(120),
        slug: z
          .string()
          .trim()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
        category: z.string().trim().max(80).optional(),
        description: z.string().trim().max(600).optional(),
        landingUrl: z.string().trim().url().max(400),
        commissionType: z.enum(["percent", "flat"]),
        commissionValue: z.number().min(0).max(1000000),
        cookieDurationDays: z.number().int().min(1).max(365),
        recurring: z.boolean(),
        active: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      type: data.type,
      name: data.name,
      slug: data.slug,
      category: data.category ?? null,
      description: data.description ?? null,
      landing_url: data.landingUrl,
      default_commission_type: data.commissionType,
      default_commission_value: data.commissionValue,
      cookie_duration_days: data.cookieDurationDays,
      recurring: data.recurring,
      active: data.active,
    };
    const query = data.id
      ? supabaseAdmin.from("catalog_items").update(row).eq("id", data.id)
      : supabaseAdmin.from("catalog_items").insert(row);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setConversionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        conversionId: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected", "paid"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("conversions")
      .update({ status: data.status })
      .eq("id", data.conversionId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setCouponActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ couponId: z.string().uuid(), active: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("coupon_codes")
      .update({ active: data.active })
      .eq("id", data.couponId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const markPayoutPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        payoutId: z.string().uuid(),
        reference: z.string().trim().max(120).optional(),
        status: z.enum(["approved", "paid", "rejected"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payout = (
      await supabaseAdmin.from("payouts").select("*").eq("id", data.payoutId).maybeSingle()
    ).data;
    if (!payout) throw new Error("Payout not found");

    const { error } = await supabaseAdmin
      .from("payouts")
      .update({
        status: data.status,
        reference: data.reference ?? null,
        paid_at: data.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", data.payoutId);
    if (error) throw new Error(error.message);

    if (data.status === "paid") {
      // settle approved commissions up to the payout amount
      const conv = (
        await supabaseAdmin
          .from("conversions")
          .select("id, commission_earned")
          .eq("affiliate_id", payout.affiliate_id)
          .eq("status", "approved")
          .order("created_at", { ascending: true })
      ).data ?? [];
      let remaining = Number(payout.amount);
      const ids: string[] = [];
      for (const c of conv) {
        if (remaining <= 0) break;
        ids.push(c.id);
        remaining -= Number(c.commission_earned);
      }
      if (ids.length) {
        await supabaseAdmin
          .from("conversions")
          .update({ status: "paid", payout_id: payout.id })
          .in("id", ids);
      }
    }
    return { ok: true as const };
  });
