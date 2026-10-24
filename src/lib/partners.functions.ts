// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const listPartnerApplications = createRpcClient<
  typeof import("./backend/handlers/partners").listPartnerApplications
>("partners/listPartnerApplications", "GET");
export const reviewPartnerApplication = createRpcClient<
  typeof import("./backend/handlers/partners").reviewPartnerApplication
>("partners/reviewPartnerApplication", "POST");
