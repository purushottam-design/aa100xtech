// Browser-safe RPC entrypoints. Implementations live behind Next.js route handlers.
import { createRpcClient } from "./backend/client";

export const listCatalogItems = createRpcClient<
  typeof import("./backend/handlers/affiliate").listCatalogItems
>("affiliate/listCatalogItems", "GET");
export const getMyAffiliate = createRpcClient<
  typeof import("./backend/handlers/affiliate").getMyAffiliate
>("affiliate/getMyAffiliate", "GET");
export const registerAffiliate = createRpcClient<
  typeof import("./backend/handlers/affiliate").registerAffiliate
>("affiliate/registerAffiliate", "POST");
export const getOrCreateAssets = createRpcClient<
  typeof import("./backend/handlers/affiliate").getOrCreateAssets
>("affiliate/getOrCreateAssets", "POST");
export const getAffiliateDashboard = createRpcClient<
  typeof import("./backend/handlers/affiliate").getAffiliateDashboard
>("affiliate/getAffiliateDashboard", "GET");
export const requestPayout = createRpcClient<
  typeof import("./backend/handlers/affiliate").requestPayout
>("affiliate/requestPayout", "POST");
export const adminOverview = createRpcClient<
  typeof import("./backend/handlers/affiliate").adminOverview
>("affiliate/adminOverview", "GET");
export const reviewAffiliate = createRpcClient<
  typeof import("./backend/handlers/affiliate").reviewAffiliate
>("affiliate/reviewAffiliate", "POST");
export const upsertCatalogItem = createRpcClient<
  typeof import("./backend/handlers/affiliate").upsertCatalogItem
>("affiliate/upsertCatalogItem", "POST");
export const setConversionStatus = createRpcClient<
  typeof import("./backend/handlers/affiliate").setConversionStatus
>("affiliate/setConversionStatus", "POST");
export const setCouponActive = createRpcClient<
  typeof import("./backend/handlers/affiliate").setCouponActive
>("affiliate/setCouponActive", "POST");
export const markPayoutPaid = createRpcClient<
  typeof import("./backend/handlers/affiliate").markPayoutPaid
>("affiliate/markPayoutPaid", "POST");
