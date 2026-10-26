import { createRpcClient } from "./backend/client";
export const listPayments = createRpcClient<
  typeof import("./backend/handlers/payments").listPayments
>("payments/listPayments", "POST");
