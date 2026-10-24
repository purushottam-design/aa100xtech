// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getSuperStatus = createRpcClient<
  typeof import("./backend/handlers/super-admin").getSuperStatus
>("super-admin/getSuperStatus", "GET");
export const getSuperOverview = createRpcClient<
  typeof import("./backend/handlers/super-admin").getSuperOverview
>("super-admin/getSuperOverview", "GET");
export const listAllUsers = createRpcClient<
  typeof import("./backend/handlers/super-admin").listAllUsers
>("super-admin/listAllUsers", "POST");
export const createUserAccount = createRpcClient<
  typeof import("./backend/handlers/super-admin").createUserAccount
>("super-admin/createUserAccount", "POST");
export const updateUserAccount = createRpcClient<
  typeof import("./backend/handlers/super-admin").updateUserAccount
>("super-admin/updateUserAccount", "POST");
export const setUserRoles = createRpcClient<
  typeof import("./backend/handlers/super-admin").setUserRoles
>("super-admin/setUserRoles", "POST");
export const resetUserPassword = createRpcClient<
  typeof import("./backend/handlers/super-admin").resetUserPassword
>("super-admin/resetUserPassword", "POST");
export const deleteUserAccount = createRpcClient<
  typeof import("./backend/handlers/super-admin").deleteUserAccount
>("super-admin/deleteUserAccount", "POST");
export const listModuleRecords = createRpcClient<
  typeof import("./backend/handlers/super-admin").listModuleRecords
>("super-admin/listModuleRecords", "POST");
export const updateModuleRecord = createRpcClient<
  typeof import("./backend/handlers/super-admin").updateModuleRecord
>("super-admin/updateModuleRecord", "POST");
export const deleteModuleRecord = createRpcClient<
  typeof import("./backend/handlers/super-admin").deleteModuleRecord
>("super-admin/deleteModuleRecord", "POST");
export const exportModuleRecords = createRpcClient<
  typeof import("./backend/handlers/super-admin").exportModuleRecords
>("super-admin/exportModuleRecords", "POST");
