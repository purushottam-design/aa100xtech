import { z } from "zod";
import { consultationScheduleError } from "./consultation-schedule";

export const consultationBookingSchema = z.object({
  planId: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(30),
  country: z.string().trim().min(2).max(80),
  service: z.string().trim().min(2).max(80),
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(2).max(60),
  meetingPlatform: z.string().trim().min(2).max(60),
  projectDescription: z.string().trim().min(10).max(4000),
});

// A request key identifies one booking intent, including network retries.
// The base form remains unchanged for stored ICICI checkout data.
export const consultationBookingCreationSchema = consultationBookingSchema
  .extend({
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((booking, context) => {
    const message = consultationScheduleError(booking);
    if (message) context.addIssue({ code: "custom", path: ["preferredTime"], message });
  });

export const consultationPaymentVerificationSchema = z.object({
  bookingId: z.string().trim().min(5).max(40),
  razorpayOrderId: z.string().trim().min(5).max(80),
  razorpayPaymentId: z.string().trim().min(5).max(80),
  razorpaySignature: z.string().trim().min(10).max(255),
});

export const consultationPaymentFailureSchema = z.object({
  bookingId: z.string().trim().min(5).max(40),
});
