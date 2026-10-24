// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const registerPushDevice = createRpcClient<
  typeof import("./backend/handlers/push").registerPushDevice
>("push/registerPushDevice", "POST");
export const setPushEnabled = createRpcClient<
  typeof import("./backend/handlers/push").setPushEnabled
>("push/setPushEnabled", "POST");
export const getPushReach = createRpcClient<typeof import("./backend/handlers/push").getPushReach>(
  "push/getPushReach",
  "GET",
);
