// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const dashboardLogin = createRpcClient<
  typeof import("./backend/handlers/dashboard-auth").dashboardLogin
>("dashboard-auth/dashboardLogin", "POST");
