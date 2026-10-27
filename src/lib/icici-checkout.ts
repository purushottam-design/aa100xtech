import type { z } from "zod";
import type { consultationBookingSchema } from "./consultations.schemas";

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
export async function iciciRequest<T>(
  action: "checkout" | "initiate" | "status",
  input: unknown,
): Promise<T> {
  const response = await fetch(`/api/payments/icici/${action}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json", "x-aa-rpc": "1" },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok || !result.ok)
    throw new Error(
      result.message || "Payment status could not be confirmed. Please check again before paying.",
    );
  return result as T;
}
