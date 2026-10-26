/** Public display metadata only. Bank credentials never belong in this module. */
export type PaymentGateway = "razorpay" | "icici";
export const defaultPaymentGateway: PaymentGateway = "icici";
export const paymentGateways = [
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Secure online payment · UPI / Cards / NetBanking",
    available: true,
  },
  { id: "icici", name: "ICICI Bank", description: "Secure Bank Payment Gateway", available: false },
] as const;
export type PaymentStatus = "paid" | "failed" | "pending" | "cancelled" | "refunded";
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Payment Successful",
  failed: "Payment Failed",
  pending: "Payment Pending",
  cancelled: "Payment Cancelled",
  refunded: "Payment Refunded",
};
export function normalizePaymentStatus(status: string): PaymentStatus {
  switch (status.toUpperCase()) {
    case "PAID":
      return "paid";
    case "FAILED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    default:
      return "pending";
  }
}
