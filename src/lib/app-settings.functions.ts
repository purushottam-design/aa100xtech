// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getAppSettings = createRpcClient<
  typeof import("./backend/handlers/app-settings").getAppSettings
>("app-settings/getAppSettings", "GET");
export const updateAppSettings = createRpcClient<
  typeof import("./backend/handlers/app-settings").updateAppSettings
>("app-settings/updateAppSettings", "POST");
