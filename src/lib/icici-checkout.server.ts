import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { paymentAdmin } from "./payment-database.server";
import { consultationBookingSchema } from "./consultations.schemas";
import { consultationServices, getConsultationPlan, meetingPlatforms } from "@/data/consultations";
import { createConsultationBooking } from "./backend/handlers/consultations";
import {
  IciciPaymentError,
  iciciUatConfig,
  initiateIciciSale,
  queryIciciStatus,
} from "./icici.server";

export const checkoutCredentialsSchema = z.object({
  id: z.string().uuid(),
  token: z.string().regex(/^[a-f0-9]{64}$/),
});
export const checkoutPreparationSchema = checkoutCredentialsSchema.extend({
  booking: consultationBookingSchema,
});
export const checkoutInitiationSchema = checkoutCredentialsSchema.extend({
  gateway: z.enum(["razorpay", "icici"]),
});
type Booking = z.infer<typeof consultationBookingSchema>;
type Credentials = z.infer<typeof checkoutCredentialsSchema>;
export type Checkout = {
  id: string;
  token_hash: string;
  booking_data: Booking;
  amount_paise: number;
  currency: "INR";
  merchant_reference: string;
  booking_id: string | null;
  gateway: "razorpay" | "icici" | null;
  state: "ready" | "initiating" | "pending" | "paid" | "failed" | "cancelled";
  gateway_order_id: string | null;
  gateway_transaction_id: string | null;
  redirect_url: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
};
type CheckoutDatabase = {
  public: {
    Tables: {
      icici_uat_checkouts: {
        Row: Checkout;
        Insert: Partial<Checkout> &
          Pick<
            Checkout,
            "id" | "token_hash" | "booking_data" | "amount_paise" | "merchant_reference"
          >;
        Update: Partial<Checkout>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      settle_icici_uat_checkout: {
        Args: {
          checkout_uuid: string;
          merchant_ref: string;
          transaction_ref: string | null;
          verified_amount_paise: number;
          verified_status: string;
        };
        Returns: boolean;
      };
    };
  };
};
const checkoutAdmin = supabaseAdmin as unknown as SupabaseClient<CheckoutDatabase>;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
function storageFailure(): never {
  throw new IciciPaymentError(
    "CHECKOUT_STORAGE_UNAVAILABLE",
    "Payment records are unavailable. Check this booking before attempting another payment.",
  );
}

export async function iciciAvailability() {
  try {
    iciciUatConfig();
    if (process.env["ICICI_UAT_TESTS_PASSED"] !== "true") return false;
    const [sessions, bookings] = await Promise.all([
      checkoutAdmin
        .from("icici_uat_checkouts")
        .select("id")
        .limit(0)
        .abortSignal(AbortSignal.timeout(5_000)),
      paymentAdmin
        .from("consultation_bookings")
        .select("payment_gateway,gateway_order_id,gateway_transaction_id,paid_at")
        .limit(0)
        .abortSignal(AbortSignal.timeout(5_000)),
    ]);
    return !sessions.error && !bookings.error;
  } catch {
    return false;
  }
}

export async function readCheckout(credentials: Credentials): Promise<Checkout> {
  const { data, error } = await checkoutAdmin
    .from("icici_uat_checkouts")
    .select("*")
    .eq("id", credentials.id)
    .eq("token_hash", tokenHash(credentials.token))
    .maybeSingle();
  if (error) storageFailure();
  if (!data)
    throw new IciciPaymentError("CHECKOUT_NOT_FOUND", "This checkout could not be found.", 404);
  return data;
}
async function saveCheckout(id: string, update: Partial<Checkout>) {
  const { error } = await checkoutAdmin
    .from("icici_uat_checkouts")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .neq("state", "paid");
  if (error) storageFailure();
}

export async function prepareCheckout(input: z.infer<typeof checkoutPreparationSchema>) {
  iciciUatConfig();
  const plan = getConsultationPlan(input.booking.planId);
  if (
    !plan ||
    !consultationServices.includes(input.booking.service) ||
    !meetingPlatforms.includes(input.booking.meetingPlatform)
  )
    throw new IciciPaymentError("INVALID_BOOKING", "Please check the booking details.", 400);
  const { error } = await checkoutAdmin.from("icici_uat_checkouts").upsert(
    {
      id: input.id,
      token_hash: tokenHash(input.token),
      booking_data: input.booking,
      amount_paise: plan.price * 100,
      merchant_reference: `IC${input.id.replaceAll("-", "").slice(0, 18)}`,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) storageFailure();
  const checkout = await readCheckout(input);
  if (
    JSON.stringify(consultationBookingSchema.parse(checkout.booking_data)) !==
      JSON.stringify(consultationBookingSchema.parse(input.booking)) ||
    checkout.amount_paise !== plan.price * 100
  )
    throw new IciciPaymentError(
      "CHECKOUT_CHANGED",
      "This checkout has different booking details. Start a new booking.",
      409,
    );
  return checkout;
}

export async function startCheckout(input: z.infer<typeof checkoutInitiationSchema>) {
  const config = iciciUatConfig();
  let checkout = await readCheckout(input);
  if (checkout.gateway && checkout.gateway !== input.gateway)
    throw new IciciPaymentError(
      "CHECKOUT_LOCKED",
      "A payment has already started. Check its status before attempting another payment.",
      409,
    );
  if (checkout.state !== "ready") {
    if (checkout.gateway === "icici" && checkout.state === "pending" && checkout.redirect_url)
      return {
        gateway: "icici" as const,
        redirectUrl: checkout.redirect_url,
        bookingId: checkout.booking_id,
      };
    if (
      checkout.gateway === "razorpay" &&
      checkout.state === "pending" &&
      checkout.booking_id &&
      checkout.gateway_order_id
    ) {
      const plan = getConsultationPlan(checkout.booking_data.planId);
      const keyId = process.env["RAZORPAY_KEY_ID"];
      if (!plan || !keyId) storageFailure();
      return {
        gateway: "razorpay" as const,
        ok: true as const,
        bookingId: checkout.booking_id,
        orderId: checkout.gateway_order_id,
        amount: checkout.amount_paise,
        currency: checkout.currency,
        keyId,
        planName: plan.name,
        duration: plan.duration,
      };
    }
    return { gateway: input.gateway, pending: true as const, bookingId: checkout.booking_id };
  }
  if (new Date(checkout.expires_at).getTime() <= Date.now())
    throw new IciciPaymentError(
      "CHECKOUT_EXPIRED",
      "This checkout has expired. Start a new booking.",
      409,
    );
  if (input.gateway === "icici" && checkout.booking_data.email.length > 48)
    throw new IciciPaymentError(
      "INVALID_BOOKING",
      "ICICI Bank requires an email address of at most 48 characters. Please choose Razorpay.",
      400,
    );
  const { data: reserved, error } = await checkoutAdmin
    .from("icici_uat_checkouts")
    .update({ state: "initiating", gateway: input.gateway })
    .eq("id", checkout.id)
    .eq("state", "ready")
    .select("*")
    .maybeSingle();
  if (error) storageFailure();
  if (!reserved)
    throw new IciciPaymentError(
      "CHECKOUT_LOCKED",
      "A payment request is already processing. Check its status.",
      409,
    );
  checkout = reserved;
  if (input.gateway === "razorpay") {
    // Invoke the existing order-creation handler, with its API and signatures unchanged.
    // An ambiguous failure retains the reservation; never create another order automatically.
    const result = await createConsultationBooking({
      data: { ...checkout.booking_data, idempotencyKey: checkout.id },
    });
    if (!result.ok) throw new IciciPaymentError("CHECKOUT_STATUS_UNKNOWN", result.error);
    await saveCheckout(checkout.id, {
      booking_id: result.bookingId,
      gateway_order_id: result.orderId,
      state: "pending",
    });
    return { gateway: "razorpay" as const, ...result };
  }
  const b = checkout.booking_data;
  const plan = getConsultationPlan(b.planId);
  if (!plan || plan.price * 100 !== checkout.amount_paise) storageFailure();
  const bookingId = `CONS-${checkout.id.replaceAll("-", "").toUpperCase()}`;
  const { error: bookingError } = await paymentAdmin.from("consultation_bookings").insert({
    booking_id: bookingId,
    customer_name: b.fullName,
    company_name: b.companyName || null,
    email: b.email,
    phone: b.phone,
    country: b.country,
    service: b.service,
    plan_id: plan.id,
    consultation_plan: plan.name,
    consultation_type: plan.category,
    duration: plan.duration,
    amount: plan.price,
    currency: "INR",
    preferred_date: b.preferredDate,
    preferred_time: b.preferredTime,
    timezone: b.timezone,
    meeting_platform: b.meetingPlatform,
    project_description: b.projectDescription,
    payment_gateway: "icici",
    gateway_order_id: checkout.merchant_reference,
    payment_status: "PENDING",
    booking_status: "PENDING",
  });
  if (bookingError) storageFailure();
  await saveCheckout(checkout.id, {
    booking_id: bookingId,
    gateway_order_id: checkout.merchant_reference,
  });
  const result = await initiateIciciSale(
    {
      reference: checkout.merchant_reference,
      amountPaise: checkout.amount_paise,
      email: b.email,
      name: b.fullName,
    },
    config,
  );
  // The response does not settle anything: it only supplies a verified UAT redirect.
  await saveCheckout(checkout.id, { redirect_url: result.redirectUrl, state: "pending" });
  return { gateway: "icici" as const, redirectUrl: result.redirectUrl, bookingId };
}

export async function reconcileIciciCheckout(checkout: Checkout, callbackTransaction?: string) {
  if (checkout.gateway !== "icici" || !checkout.booking_id)
    throw new IciciPaymentError("CHECKOUT_NOT_READY", "This payment has not been started.", 409);
  const result = await queryIciciStatus({
    reference: checkout.merchant_reference,
    amountPaise: checkout.amount_paise,
    ...(callbackTransaction || checkout.gateway_transaction_id
      ? { transactionId: callbackTransaction || checkout.gateway_transaction_id! }
      : {}),
  });
  const { error } = await checkoutAdmin.rpc("settle_icici_uat_checkout", {
    checkout_uuid: checkout.id,
    merchant_ref: checkout.merchant_reference,
    transaction_ref: result.transactionId,
    verified_amount_paise: checkout.amount_paise,
    verified_status: result.status,
  });
  if (error)
    throw new IciciPaymentError(
      "CHECKOUT_SETTLEMENT_PENDING",
      "The bank responded, but booking confirmation is pending. Check status before paying again.",
    );
}

export async function checkoutStatus(credentials: Credentials) {
  let checkout = await readCheckout(credentials);
  let verificationPending = false;
  if (checkout.gateway === "icici" && checkout.booking_id && checkout.state !== "paid") {
    try {
      await reconcileIciciCheckout(checkout);
    } catch (error) {
      if (!(error instanceof IciciPaymentError)) throw error;
      verificationPending = true;
    }
    checkout = await readCheckout(credentials);
  } else if (checkout.gateway === "razorpay" && checkout.booking_id) {
    const { data, error } = await paymentAdmin
      .from("consultation_bookings")
      .select("payment_status,razorpay_payment_id")
      .eq("booking_id", checkout.booking_id)
      .eq("razorpay_order_id", checkout.gateway_order_id!)
      .maybeSingle();
    if (error) storageFailure();
    if (data?.payment_status === "PAID" && data.razorpay_payment_id) {
      await saveCheckout(checkout.id, {
        state: "paid",
        gateway_transaction_id: data.razorpay_payment_id,
      });
      checkout = await readCheckout(credentials);
    }
  }
  return {
    status: checkout.state === "paid" ? "paid" : checkout.state === "failed" ? "failed" : "pending",
    verificationPending,
    gateway: checkout.gateway,
    bookingId: checkout.booking_id,
    paymentId: checkout.gateway_transaction_id,
    amount: checkout.amount_paise,
    currency: checkout.currency,
    reference: checkout.merchant_reference,
    booking: checkout.booking_data,
  };
}

export async function checkoutForBankReference(reference: string) {
  const { data, error } = await checkoutAdmin
    .from("icici_uat_checkouts")
    .select("*")
    .eq("merchant_reference", reference)
    .maybeSingle();
  if (error) storageFailure();
  if (!data)
    throw new IciciPaymentError("CHECKOUT_NOT_FOUND", "This checkout could not be found.", 404);
  return data;
}
