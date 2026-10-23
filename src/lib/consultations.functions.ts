import { createServerFn } from "@tanstack/react-start";

import { getConsultationPlan } from "@/data/consultations";
import { meetingPlatforms, consultationServices } from "@/data/consultations";
import {
  consultationBookingSchema,
  consultationPaymentFailureSchema,
  consultationPaymentVerificationSchema,
} from "./consultations.schemas";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  generateBookingId,
  verifyRazorpaySignature,
} from "./consultations.server";

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

    const { data: booking, error } = await supabaseAdmin
      .from("consultation_bookings")
      .select("*")
      .eq("booking_id", data.bookingId)
      .maybeSingle();

    if (error || !booking) {
      // Booking row unavailable (storage not provisioned). Verify the payment
      // directly with Razorpay: signature + captured status is authoritative.
      const valid = verifyRazorpaySignature({
        orderId: data.razorpayOrderId,
        paymentId: data.razorpayPaymentId,
        signature: data.razorpaySignature,
      });
      if (!valid) throw new Error("Payment verification failed.");
      const payment = await fetchRazorpayPayment(data.razorpayPaymentId);
      if (
        payment.order_id !== data.razorpayOrderId ||
        (payment.status !== "captured" && payment.status !== "authorized")
      ) {
        throw new Error("Payment could not be confirmed.");
      }
      return {
        ok: true as const,
        bookingId: data.bookingId,
        paymentId: data.razorpayPaymentId,
        duplicate: false as const,
      };
    }


    if (booking.payment_status === "PAID") {
      return {
        ok: true as const,
        bookingId: booking.booking_id,
        paymentId: booking.razorpay_payment_id,
        duplicate: true as const,
      };
    }
    if (booking.razorpay_order_id !== data.razorpayOrderId) {
      throw new Error("Payment does not match this booking.");
    }

    const valid = verifyRazorpaySignature({
      orderId: booking.razorpay_order_id,
      paymentId: data.razorpayPaymentId,
      signature: data.razorpaySignature,
    });
    if (!valid) {
      await supabaseAdmin
        .from("consultation_bookings")
        .update({ payment_status: "FAILED" })
        .eq("booking_id", data.bookingId);
      throw new Error("Payment verification failed.");
    }

    const payment = await fetchRazorpayPayment(data.razorpayPaymentId);
    const paid = payment.status === "captured" || payment.status === "authorized";
    if (
      !paid ||
      payment.order_id !== data.razorpayOrderId ||
      payment.amount !== booking.amount * 100 ||
      payment.currency !== booking.currency
    ) {
      throw new Error("Payment could not be confirmed.");
    }

    const { error: updateError } = await supabaseAdmin
      .from("consultation_bookings")
      .update({
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
        payment_status: "PAID",
        booking_status: "CONFIRMED",
      })
      .eq("booking_id", data.bookingId);
    if (updateError) {
      console.error("Booking update failed", updateError);
      throw new Error("Payment received but booking update failed. Please contact support.");
    }

    return {
      ok: true as const,
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
