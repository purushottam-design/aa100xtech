// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const getAdminAnalytics = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").getAdminAnalytics
>("super-admin-plus/getAdminAnalytics", "POST");
export const listTickets = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listTickets
>("super-admin-plus/listTickets", "POST");
export const getTicketThread = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").getTicketThread
>("super-admin-plus/getTicketThread", "POST");
export const replyToTicket = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").replyToTicket
>("super-admin-plus/replyToTicket", "POST");
export const updateTicket = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").updateTicket
>("super-admin-plus/updateTicket", "POST");
export const createTicket = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").createTicket
>("super-admin-plus/createTicket", "POST");
export const listMyTickets = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listMyTickets
>("super-admin-plus/listMyTickets", "GET");
export const listNotifications = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listNotifications
>("super-admin-plus/listNotifications", "POST");
export const saveNotification = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").saveNotification
>("super-admin-plus/saveNotification", "POST");
export const sendNotification = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").sendNotification
>("super-admin-plus/sendNotification", "POST");
export const deleteNotification = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").deleteNotification
>("super-admin-plus/deleteNotification", "POST");
export const listMyNotifications = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listMyNotifications
>("super-admin-plus/listMyNotifications", "GET");
export const listTemplates = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listTemplates
>("super-admin-plus/listTemplates", "GET");
export const saveTemplate = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").saveTemplate
>("super-admin-plus/saveTemplate", "POST");
export const deleteTemplate = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").deleteTemplate
>("super-admin-plus/deleteTemplate", "POST");
export const listContentBlocks = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listContentBlocks
>("super-admin-plus/listContentBlocks", "POST");
export const saveContentBlock = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").saveContentBlock
>("super-admin-plus/saveContentBlock", "POST");
export const deleteContentBlock = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").deleteContentBlock
>("super-admin-plus/deleteContentBlock", "POST");
export const getPublicContent = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").getPublicContent
>("super-admin-plus/getPublicContent", "POST");
export const getTwoFactorStatus = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").getTwoFactorStatus
>("super-admin-plus/getTwoFactorStatus", "GET");
export const startTwoFactorSetup = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").startTwoFactorSetup
>("super-admin-plus/startTwoFactorSetup", "POST");
export const confirmTwoFactor = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").confirmTwoFactor
>("super-admin-plus/confirmTwoFactor", "POST");
export const verifyTwoFactor = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").verifyTwoFactor
>("super-admin-plus/verifyTwoFactor", "POST");
export const disableTwoFactor = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").disableTwoFactor
>("super-admin-plus/disableTwoFactor", "POST");
export const listAdminAccounts = createRpcClient<
  typeof import("./backend/handlers/super-admin-plus").listAdminAccounts
>("super-admin-plus/listAdminAccounts", "GET");
