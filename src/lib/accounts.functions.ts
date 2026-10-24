// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getBootstrapStatus = createRpcClient<
  typeof import("./backend/handlers/accounts").getBootstrapStatus
>("accounts/getBootstrapStatus", "GET");
export const bootstrapSupremeAdmin = createRpcClient<
  typeof import("./backend/handlers/accounts").bootstrapSupremeAdmin
>("accounts/bootstrapSupremeAdmin", "POST");
export const getSupremeAdminAccess = createRpcClient<
  typeof import("./backend/handlers/accounts").getSupremeAdminAccess
>("accounts/getSupremeAdminAccess", "GET");
export const getMyAccount = createRpcClient<
  typeof import("./backend/handlers/accounts").getMyAccount
>("accounts/getMyAccount", "GET");
export const listAccessRequests = createRpcClient<
  typeof import("./backend/handlers/accounts").listAccessRequests
>("accounts/listAccessRequests", "GET");
export const listMembers = createRpcClient<
  typeof import("./backend/handlers/accounts").listMembers
>("accounts/listMembers", "GET");
export const approveAccessRequest = createRpcClient<
  typeof import("./backend/handlers/accounts").approveAccessRequest
>("accounts/approveAccessRequest", "POST");
export const rejectAccessRequest = createRpcClient<
  typeof import("./backend/handlers/accounts").rejectAccessRequest
>("accounts/rejectAccessRequest", "POST");
export const listTeam = createRpcClient<typeof import("./backend/handlers/accounts").listTeam>(
  "accounts/listTeam",
  "GET",
);
export const updateTeamMember = createRpcClient<
  typeof import("./backend/handlers/accounts").updateTeamMember
>("accounts/updateTeamMember", "POST");
export const verifyEnvAdminLogin = createRpcClient<
  typeof import("./backend/handlers/accounts").verifyEnvAdminLogin
>("accounts/verifyEnvAdminLogin", "POST");
export const signUpAccount = createRpcClient<
  typeof import("./backend/handlers/accounts").signUpAccount
>("accounts/signUpAccount", "POST");
