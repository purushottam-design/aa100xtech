// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const createConsultationBooking = createRpcClient<
  typeof import("./backend/handlers/consultations").createConsultationBooking
>("consultations/createConsultationBooking", "POST");
export const verifyConsultationPayment = createRpcClient<
  typeof import("./backend/handlers/consultations").verifyConsultationPayment
>("consultations/verifyConsultationPayment", "POST");
export const markConsultationPaymentFailed = createRpcClient<
  typeof import("./backend/handlers/consultations").markConsultationPaymentFailed
>("consultations/markConsultationPaymentFailed", "POST");
