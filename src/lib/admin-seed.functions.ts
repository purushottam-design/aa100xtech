// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const seedStarterAdmins = createRpcClient<
  typeof import("./backend/handlers/admin-seed").seedStarterAdmins
>("admin-seed/seedStarterAdmins", "POST");
