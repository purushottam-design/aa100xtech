// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const listAdminSessions = createRpcClient<
  typeof import("./backend/handlers/admin-security").listAdminSessions
>("admin-security/listAdminSessions", "POST");
export const revokeAdminSession = createRpcClient<
  typeof import("./backend/handlers/admin-security").revokeAdminSession
>("admin-security/revokeAdminSession", "POST");
export const forceLogoutAdmin = createRpcClient<
  typeof import("./backend/handlers/admin-security").forceLogoutAdmin
>("admin-security/forceLogoutAdmin", "POST");
export const revokeAllPermissions = createRpcClient<
  typeof import("./backend/handlers/admin-security").revokeAllPermissions
>("admin-security/revokeAllPermissions", "POST");
export const startImpersonation = createRpcClient<
  typeof import("./backend/handlers/admin-security").startImpersonation
>("admin-security/startImpersonation", "POST");
export const stopImpersonation = createRpcClient<
  typeof import("./backend/handlers/admin-security").stopImpersonation
>("admin-security/stopImpersonation", "POST");
export const listAdminNotifications = createRpcClient<
  typeof import("./backend/handlers/admin-security").listAdminNotifications
>("admin-security/listAdminNotifications", "POST");
export const markNotificationsRead = createRpcClient<
  typeof import("./backend/handlers/admin-security").markNotificationsRead
>("admin-security/markNotificationsRead", "POST");
