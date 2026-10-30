import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { associatePaymentCustomer } from "@/lib/payment-database.server";

import { getConsultationPlan } from "@/data/consultations";
import { meetingPlatforms, consultationServices } from "@/data/consultations";
import {
  consultationBookingCreationSchema,
  consultationPaymentFailureSchema,
  consultationPaymentVerificationSchema,
} from "@/lib/consultations.schemas";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayCheckoutKeyId,
  verifyRazorpaySignature,
} from "@/lib/consultations.server";
import {
  consultationRequestBookingId,
  matchesConsultationRequest,
} from "@/lib/consultation-idempotency.server";

function bookingStorageFailure(error: unknown, linkingOrder = false) {
  const rawCode = (error as { code?: unknown } | null)?.code;
  const code =
    typeof rawCode === "string" &&
    ["PGRST205", "42P01", "PGRST204", "42703", "42501", "23505", "23514", "PGRST116"].includes(
      rawCode,
    )
      ? rawCode
      : "UNAVAILABLE";
  // Never log customer details, raw database messages, request URLs or keys.
  console.warn(
    `[Consultations] Booking persistence unavailable (${code}). Check the consultation schema and server database access.`,
  );
  return {
    ok: false as const,
    code: linkingOrder ? "BOOKING_ORDER_SAVE_FAILED" : "BOOKING_STORAGE_UNAVAILABLE",
    error: linkingOrder
      ? "Your booking was saved, but payment could not be prepared. Please contact us before retrying."
      : "Your booking could not be saved. No payment was started. Please try again shortly.",
  };
}

export const createConsultationBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationBookingCreationSchema.parse(data))
  .handler(async ({ data }) => {
    const plan = getConsultationPlan(data.planId);
    if (!plan) throw new Error("That consultation plan is not available.");
    if (!consultationServices.includes(data.service)) throw new Error("Invalid service selected.");
    if (!meetingPlatforms.includes(data.meetingPlatform))
      throw new Error("Invalid meeting platform selected.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bookingId = consultationRequestBookingId(data.idempotencyKey);
    const amountInPaise = plan.price * 100;
    const pendingBooking = {
      booking_id: bookingId,
      customer_name: data.fullName,
      company_name: data.companyName || null,
      email: data.email,
      phone: data.phone,
      country: data.country,
      service: data.service,
      plan_id: plan.id,
      consultation_plan: plan.name,
      consultation_type: plan.category,
      duration: plan.duration,
      amount: plan.price,
      currency: plan.currency,
      preferred_date: data.preferredDate,
      preferred_time: data.preferredTime,
      timezone: data.timezone,
      meeting_platform: data.meetingPlatform,
      project_description: data.projectDescription,
    };

    // Persist the complete pending booking BEFORE calling a payment gateway.
    let saved;
    try {
      const result = await supabaseAdmin
        .from("consultation_bookings")
        .insert({
          ...pendingBooking,
          payment_status: "PENDING",
          booking_status: "PENDING",
        })
        .select("id,booking_id,amount,currency,payment_status,booking_status")
        .single();
      if (result.error?.code === "23505") {
        const existing = await supabaseAdmin
          .from("consultation_bookings")
          .select("*")
          .eq("booking_id", bookingId)
          .maybeSingle();
        if (existing.error || !existing.data) return bookingStorageFailure(existing.error);
        if (!matchesConsultationRequest(existing.data, pendingBooking))
          return {
            ok: false as const,
            code: "IDEMPOTENCY_CONFLICT",
            bookingId,
            error: "This request belongs to different booking details. Please start a new booking.",
          };
        if (["PAID", "REFUNDED"].includes(existing.data.payment_status.toUpperCase()))
          return {
            ok: false as const,
            code: "BOOKING_ALREADY_PAID",
            bookingId,
            error:
              "This booking already has a completed payment. Please check your confirmation before paying again.",
          };
        if (!existing.data.razorpay_order_id)
          return {
            ok: false as const,
            code: "BOOKING_PREPARATION_PENDING",
            bookingId,
            error:
              "Your booking is saved, but payment preparation is not yet confirmed. Check again or contact us before attempting another payment.",
          };
        const keyId = getRazorpayCheckoutKeyId();
        if (!keyId)
          return {
            ok: false as const,
            code: "CONFIGURATION_MISSING",
            bookingId,
            error: "Online payment is temporarily unavailable. Your booking remains saved.",
          };
        return {
          ok: true as const,
          bookingId: existing.data.booking_id,
          orderId: existing.data.razorpay_order_id,
          amount: existing.data.amount * 100,
          currency: existing.data.currency,
          keyId,
          planName: plan.name,
          duration: plan.duration,
        };
      }
      if (
        result.error ||
        !result.data ||
        result.data.booking_id !== bookingId ||
        result.data.amount !== plan.price ||
        result.data.currency !== plan.currency ||
        result.data.payment_status !== "PENDING" ||
        result.data.booking_status !== "PENDING"
      )
        return bookingStorageFailure(result.error);
      saved = result.data;
    } catch (error) {
      return bookingStorageFailure(error);
    }

    const order = await createRazorpayOrder({
      amountInPaise,
      receipt: bookingId,
      notes: { bookingId, planId: plan.id, email: data.email },
    });

    if (!order.ok) {
      return {
        ok: false as const,
        error: order.message,
        code: order.code,
        bookingId,
      };
    }

    // Do not expose a payable order until its reference is durably attached to
    // the saved booking. A failed link retains the pending row for support.
    try {
      const linked = await supabaseAdmin
        .from("consultation_bookings")
        .update({ razorpay_order_id: order.id })
        .eq("id", saved.id)
        .eq("booking_id", bookingId)
        .is("razorpay_order_id", null)
        .eq("payment_status", "PENDING")
        .select("booking_id,razorpay_order_id")
        .single();
      if (
        linked.error ||
        linked.data?.booking_id !== bookingId ||
        linked.data.razorpay_order_id !== order.id
      )
        return bookingStorageFailure(linked.error, true);
    } catch (error) {
      return bookingStorageFailure(error, true);
    }
    await associatePaymentCustomer(bookingId);

    return {
      ok: true as const,
      bookingId,
      orderId: order.id,
      amount: amountInPaise,
      currency: order.currency,
      keyId: order.keyId,
      planName: plan.name,
      duration: plan.duration,
    };
  });

export const verifyConsultationPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationPaymentVerificationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Never return a paid result or change a booking on an unsigned request,
    // including repeated requests for an already-settled booking.
    if (
      !verifyRazorpaySignature({
        orderId: data.razorpayOrderId,
        paymentId: data.razorpayPaymentId,
        signature: data.razorpaySignature,
      })
    )
      throw new Error("Payment verification failed.");

    const { data: booking, error } = await supabaseAdmin
      .from("consultation_bookings")
      .select("*")
      .eq("booking_id", data.bookingId)
      .maybeSingle();

    if (error || !booking) {
      bookingStorageFailure(error);
      throw new Error(
        "Booking records could not be loaded. Payment confirmation is pending; contact support before paying again.",
      );
    }

    if (booking && booking.razorpay_order_id !== data.razorpayOrderId)
      throw new Error("Payment does not match this booking.");
    if (booking && booking.payment_status.toUpperCase() === "PAID") {
      if (booking.razorpay_payment_id !== data.razorpayPaymentId)
        throw new Error("This booking already has a different settled payment. Contact support.");
      if (booking.booking_status !== "CONFIRMED")
        throw new Error(
          "Payment is recorded, but booking confirmation is pending. Please contact support.",
        );
      return {
        ok: true as const,
        status: "paid" as const,
        bookingId: booking.booking_id,
        paymentId: booking.razorpay_payment_id,
        duplicate: true as const,
      };
    }
    const payment = await fetchRazorpayPayment(data.razorpayPaymentId);
    if (payment.id !== data.razorpayPaymentId || payment.order_id !== data.razorpayOrderId)
      throw new Error("Payment could not be confirmed.");
    if (payment.amount !== booking.amount * 100 || payment.currency !== booking.currency)
      throw new Error("Payment amount or currency does not match this booking.");

    const status =
      payment.status === "captured" ? "paid" : payment.status === "failed" ? "failed" : "pending";
    if (status !== "paid") {
      if (status === "failed") {
        const { error: failedError } = await supabaseAdmin
          .from("consultation_bookings")
          .update({ payment_status: "FAILED" })
          .eq("booking_id", data.bookingId)
          .neq("payment_status", "PAID");
        if (failedError)
          throw new Error("The payment result could not be saved. Please check status again.");
      }
      return {
        ok: true as const,
        status,
        bookingId: data.bookingId,
        paymentId: data.razorpayPaymentId,
        duplicate: false as const,
      };
    }
    const { data: settled, error: updateError } = await supabaseAdmin
      .from("consultation_bookings")
      .update({
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
        payment_status: "PAID",
        booking_status: "CONFIRMED",
      })
      .eq("booking_id", data.bookingId)
      .neq("payment_status", "PAID")
      .select("booking_id, razorpay_payment_id, payment_status")
      .maybeSingle();
    if (updateError) {
      bookingStorageFailure(updateError);
      throw new Error("Payment received but booking update failed. Please contact support.");
    }

    if (!settled) {
      const { data: latest, error: latestError } = await supabaseAdmin
        .from("consultation_bookings")
        .select("razorpay_payment_id, payment_status, booking_status")
        .eq("booking_id", data.bookingId)
        .maybeSingle();
      if (
        latestError ||
        latest?.payment_status !== "PAID" ||
        latest.booking_status !== "CONFIRMED" ||
        latest.razorpay_payment_id !== data.razorpayPaymentId
      )
        throw new Error(
          "Booking settlement could not be confirmed. Contact support before retrying payment.",
        );
      return {
        ok: true as const,
        status: "paid" as const,
        bookingId: data.bookingId,
        paymentId: data.razorpayPaymentId,
        duplicate: true as const,
      };
    }

    return {
      ok: true as const,
      status: "paid" as const,
      bookingId: booking.booking_id,
      paymentId: data.razorpayPaymentId,
      duplicate: false as const,
    };
  });

export const markConsultationPaymentFailed = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationPaymentFailureSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("consultation_bookings")
      .update({ payment_status: "FAILED" })
      .eq("booking_id", data.bookingId)
      .neq("payment_status", "PAID");
    if (error) throw new Error("The payment result could not be saved. Please check status again.");
    return { ok: true as const };
  });
