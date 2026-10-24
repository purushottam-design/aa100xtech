// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const listRoles = createRpcClient<typeof import("./backend/handlers/roles").listRoles>(
  "roles/listRoles",
  "GET",
);
export const createRole = createRpcClient<typeof import("./backend/handlers/roles").createRole>(
  "roles/createRole",
  "POST",
);
export const updateRole = createRpcClient<typeof import("./backend/handlers/roles").updateRole>(
  "roles/updateRole",
  "POST",
);
export const duplicateRole = createRpcClient<
  typeof import("./backend/handlers/roles").duplicateRole
>("roles/duplicateRole", "POST");
export const deleteRole = createRpcClient<typeof import("./backend/handlers/roles").deleteRole>(
  "roles/deleteRole",
  "POST",
);
export const setRoleAdmins = createRpcClient<
  typeof import("./backend/handlers/roles").setRoleAdmins
>("roles/setRoleAdmins", "POST");
export const listDepartments = createRpcClient<
  typeof import("./backend/handlers/roles").listDepartments
>("roles/listDepartments", "GET");
