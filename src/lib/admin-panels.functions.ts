// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getMyAdminRoles = createRpcClient<
  typeof import("./backend/handlers/admin-panels").getMyAdminRoles
>("admin-panels/getMyAdminRoles", "GET");
export const getPanelDashboard = createRpcClient<
  typeof import("./backend/handlers/admin-panels").getPanelDashboard
>("admin-panels/getPanelDashboard", "POST");
export const assignRole = createRpcClient<
  typeof import("./backend/handlers/admin-panels").assignRole
>("admin-panels/assignRole", "POST");
export const removeRole = createRpcClient<
  typeof import("./backend/handlers/admin-panels").removeRole
>("admin-panels/removeRole", "POST");
