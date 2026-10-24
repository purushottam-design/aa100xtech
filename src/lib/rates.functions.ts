// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getExchangeRates = createRpcClient<
  typeof import("./backend/handlers/rates").getExchangeRates
>("rates/getExchangeRates", "GET");
