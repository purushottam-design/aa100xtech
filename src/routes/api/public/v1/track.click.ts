import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  affiliate_id: z.string().trim().min(3).max(60),
  product_id: z.string().trim().max(120).optional(),
  source: z.string().trim().max(200).optional(),
});

export const Route = createFileRoute("/api/public/v1/track/click")({
  server: {
    handlers: {
      OPTIONS: async () => {
        const { jsonResponse } = await import("@/lib/affiliate.server");
        return jsonResponse(null, 204);
      },
      POST: async ({ request }) => {
        const { jsonResponse, hashIp, deviceFromUserAgent } = await import("@/lib/affiliate.server");

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const affiliate = (
          await supabaseAdmin
            .from("affiliates")
            .select("id, status")
            .eq("affiliate_code", parsed.affiliate_id)
            .maybeSingle()
        ).data;
        if (!affiliate || affiliate.status !== "approved") return jsonResponse({ ok: false }, 404);

        let itemId: string | null = null;
        if (parsed.product_id) {
          const isUuid = /^[0-9a-f-]{36}$/i.test(parsed.product_id);
          itemId =
            (
              await supabaseAdmin
                .from("catalog_items")
                .select("id")
                .eq(isUuid ? "id" : "slug", parsed.product_id)
                .maybeSingle()
            ).data?.id ?? null;
        }

        const ip =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;
        const ipHash = hashIp(ip);

        let isDuplicate = false;
        if (ipHash) {
          const since = new Date(Date.now() - 60_000).toISOString();
          const dupe = await supabaseAdmin
            .from("affiliate_clicks")
            .select("id")
            .eq("affiliate_id", affiliate.id)
            .eq("ip_hash", ipHash)
            .gte("created_at", since)
            .limit(1);
          isDuplicate = (dupe.data ?? []).length > 0;
        }

        await supabaseAdmin.from("affiliate_clicks").insert({
          affiliate_id: affiliate.id,
          catalog_item_id: itemId,
          ip_hash: ipHash,
          device: deviceFromUserAgent(request.headers.get("user-agent")),
          source: parsed.source ?? request.headers.get("referer"),
          is_duplicate: isDuplicate,
        });

        return jsonResponse({ ok: true, duplicate: isDuplicate });
      },
    },
  },
});
