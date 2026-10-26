import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { associatePaymentCustomer } from "@/lib/payment-database.server";

import { getConsultationPlan } from "@/data/consultations";
import { meetingPlatforms, consultationServices } from "@/data/consultations";
import {
  consultationBookingSchema,
  consultationPaymentFailureSchema,
  consultationPaymentVerificationSchema,
} from "@/lib/consultations.schemas";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  fetchRazorpayOrder,
  generateBookingId,
  verifyRazorpaySignature,
} from "@/lib/consultations.server";

export const createConsultationBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => consultationBookingSchema.parse(data))
  .handler(async ({ data }) => {
    const plan = getConsultationPlan(data.planId);
    if (!plan) throw new Error("That consultation plan is not available.");
    if (!consultationServices.includes(data.service)) throw new Error("Invalid service selected.");
    if (!meetingPlatforms.includes(data.meetingPlatform))
      throw new Error("Invalid meeting platform selected.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bookingId = generateBookingId();
    const amountInPaise = plan.price * 100;

    // Storage is best-effort: if the booking table is unavailable the customer
    // must still be able to pay. The Razorpay order carries the booking notes.
    const { error: storageError } = await supabaseAdmin
      .from("consultation_bookings")
      .select("id")
      .limit(1);
    const storageAvailable = !storageError;
    if (storageError) console.error("Booking storage unavailable", storageError);

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
      };
    }

    if (storageAvailable) {
      const { error } = await supabaseAdmin.from("consultation_bookings").insert({
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
        razorpay_order_id: order.id,
        payment_status: "PENDING",
        booking_status: "PENDING",
      });
      if (error) console.error("Booking insert failed", error);
      else await associatePaymentCustomer(bookingId);
    }

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

    if (booking && booking.razorpay_order_id !== data.razorpayOrderId)
      throw new Error("Payment does not match this booking.");
    if (booking && booking.payment_status.toUpperCase() === "PAID") {
      if (booking.razorpay_payment_id !== data.razorpayPaymentId)
        throw new Error("This booking already has a different settled payment. Contact support.");
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
    if (booking) {
      if (payment.amount !== booking.amount * 100 || payment.currency !== booking.currency)
        throw new Error("Payment amount or currency does not match this booking.");
    } else {
      // Preserve existing storage fallback, but bind the gateway order to this
      // actual booking/plan and server-created amount before reporting success.
      const gatewayOrder = await fetchRazorpayOrder(data.razorpayOrderId);
      if (
        gatewayOrder.id !== data.razorpayOrderId ||
        gatewayOrder.receipt !== data.bookingId ||
        gatewayOrder.notes?.["bookingId"] !== data.bookingId ||
        !getConsultationPlan(gatewayOrder.notes?.["planId"] ?? "") ||
        gatewayOrder.amount !== payment.amount ||
        gatewayOrder.currency !== payment.currency
      )
        throw new Error("Payment does not match this booking.");
    }

    const status =
      payment.status === "captured" ? "paid" : payment.status === "failed" ? "failed" : "pending";
    if (status !== "paid") {
      if (status === "failed" && booking)
        await supabaseAdmin
          .from("consultation_bookings")
          .update({ payment_status: "FAILED" })
          .eq("booking_id", data.bookingId)
          .neq("payment_status", "PAID");
      return {
        ok: true as const,
        status,
        bookingId: data.bookingId,
        paymentId: data.razorpayPaymentId,
        duplicate: false as const,
      };
    }
    if (error || !booking)
      return {
        ok: true as const,
        status: "paid" as const,
        bookingId: data.bookingId,
        paymentId: data.razorpayPaymentId,
        duplicate: false as const,
      };

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
      console.error("Booking update failed", updateError);
      throw new Error("Payment received but booking update failed. Please contact support.");
    }

    if (!settled) {
      const { data: latest, error: latestError } = await supabaseAdmin
        .from("consultation_bookings")
        .select("razorpay_payment_id, payment_status")
        .eq("booking_id", data.bookingId)
        .maybeSingle();
      if (
        latestError ||
        latest?.payment_status !== "PAID" ||
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
    await supabaseAdmin
      .from("consultation_bookings")
      .update({ payment_status: "FAILED" })
      .eq("booking_id", data.bookingId)
      .neq("payment_status", "PAID");
    return { ok: true as const };
  });
