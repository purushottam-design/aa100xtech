import type { z } from "zod";
import type { consultationBookingSchema } from "./consultations.schemas";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

export type CheckoutCapability = { id: string; token: string };
export type IciciCheckoutStatus = {
  status: "paid" | "failed" | "pending";
  gateway: "icici" | "razorpay" | null;
  bookingId: string | null;
  paymentId: string | null;
  amount: number;
  currency: string;
  reference: string;
  booking: z.infer<typeof consultationBookingSchema>;
};
export type CheckoutStart = {
  gateway: "icici" | "razorpay";
  redirectUrl?: string;
  pending?: boolean;
  bookingId?: string | null;
  orderId?: string;
  keyId?: string;
  amount?: number;
  currency?: string;
};
export async function fetchIciciAvailability(signal?: AbortSignal) {
  return fetch("/api/payments/icici/availability", {
    cache: "no-store",
    credentials: "same-origin",
    headers: await attachSupabaseAuth(),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
      : AbortSignal.timeout(10_000),
  });
}
export async function iciciRequest<T>(
  action: "checkout" | "initiate" | "status",
  input: unknown,
): Promise<T> {
  const headers = await attachSupabaseAuth();
  headers.set("content-type", "application/json");
  headers.set("x-aa-rpc", "1");
  const response = await fetch(`/api/payments/icici/${action}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok || !result.ok)
    throw new Error(
      result.message || "Payment status could not be confirmed. Please check again before paying.",
    );
  return result as T;
}
