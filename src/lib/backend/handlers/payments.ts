import "server-only";
import { z } from "zod";
import { createServerFn } from "@/lib/backend/server";
import { setResponseStatus } from "@/lib/backend/request-context.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { authorize, AccessError } from "@/lib/rbac.server";
import { normalizePaymentStatus, type PaymentGateway } from "@/lib/payment-gateways";
import type { Database } from "@/integrations/supabase/types";

type Booking = Database["public"]["Tables"]["consultation_bookings"]["Row"] & {
  customer_id?: string | null;
  payment_gateway?: PaymentGateway;
  gateway_order_id?: string | null;
  gateway_transaction_id?: string | null;
  paid_at?: string | null;
};
export const listPayments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        gateway: z.enum(["all", "razorpay", "icici"]).default("all"),
        search: z.string().trim().max(120).default(""),
        page: z.number().int().min(1).default(1),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    try {
      await authorize(context.userId, "payments.view");
    } catch (error) {
      if (error instanceof AccessError) setResponseStatus(error.status);
      throw error;
    }
    const matches: Booking[] = [];
    for (let offset = 0; ; offset += 200) {
      const { data: rows, error } = await supabaseAdmin
        .from("consultation_bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 199);
      if (error) throw new Error("Could not load payments. Check database access and retry.");
      for (const booking of rows ?? []) {
        const row = booking as Booking;
        const gateway = row.payment_gateway ?? "razorpay";
        if (
          (data.gateway === "all" || data.gateway === gateway) &&
          `${row.booking_id} ${row.customer_name}`.toLowerCase().includes(data.search.toLowerCase())
        )
          matches.push(row);
      }
      if (!rows || rows.length < 200) break;
    }
    return {
      total: matches.length,
      page: data.page,
      pageSize: 20,
      rows: matches.slice((data.page - 1) * 20, data.page * 20).map((row) => ({
        id: row.id,
        orderId: row.booking_id,
        customerId: row.customer_id ?? null,
        customerName: row.customer_name,
        amount: row.amount,
        currency: row.currency,
        gateway: row.payment_gateway ?? "razorpay",
        gatewayOrderId: row.gateway_order_id ?? row.razorpay_order_id,
        transactionId: row.gateway_transaction_id ?? row.razorpay_payment_id,
        status: normalizePaymentStatus(row.payment_status),
        rawStatus: row.payment_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        paidAt: row.paid_at ?? null,
      })),
    };
  });
