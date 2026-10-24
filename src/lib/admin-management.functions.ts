// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getMyAccess = createRpcClient<
  typeof import("./backend/handlers/admin-management").getMyAccess
>("admin-management/getMyAccess", "GET");
export const recordAdminLogin = createRpcClient<
  typeof import("./backend/handlers/admin-management").recordAdminLogin
>("admin-management/recordAdminLogin", "POST");
export const listAdmins = createRpcClient<
  typeof import("./backend/handlers/admin-management").listAdmins
>("admin-management/listAdmins", "POST");
export const getAdminHierarchy = createRpcClient<
  typeof import("./backend/handlers/admin-management").getAdminHierarchy
>("admin-management/getAdminHierarchy", "GET");
export const createAdmin = createRpcClient<
  typeof import("./backend/handlers/admin-management").createAdmin
>("admin-management/createAdmin", "POST");
export const updateAdmin = createRpcClient<
  typeof import("./backend/handlers/admin-management").updateAdmin
>("admin-management/updateAdmin", "POST");
export const setAdminStatus = createRpcClient<
  typeof import("./backend/handlers/admin-management").setAdminStatus
>("admin-management/setAdminStatus", "POST");
export const deleteAdmin = createRpcClient<
  typeof import("./backend/handlers/admin-management").deleteAdmin
>("admin-management/deleteAdmin", "POST");
export const resetAdminPassword = createRpcClient<
  typeof import("./backend/handlers/admin-management").resetAdminPassword
>("admin-management/resetAdminPassword", "POST");
export const getAdminPermissions = createRpcClient<
  typeof import("./backend/handlers/admin-management").getAdminPermissions
>("admin-management/getAdminPermissions", "POST");
export const setAdminPermissions = createRpcClient<
  typeof import("./backend/handlers/admin-management").setAdminPermissions
>("admin-management/setAdminPermissions", "POST");
export const listAdminActivity = createRpcClient<
  typeof import("./backend/handlers/admin-management").listAdminActivity
>("admin-management/listAdminActivity", "POST");
export const listLoginHistory = createRpcClient<
  typeof import("./backend/handlers/admin-management").listLoginHistory
>("admin-management/listLoginHistory", "POST");
export { describeAgent } from "./backend/describe-agent";
