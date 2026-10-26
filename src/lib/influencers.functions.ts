import { createRpcClient } from "./backend/client";
export const listInfluencerApplications = createRpcClient<
  typeof import("./backend/handlers/influencers").listInfluencerApplications
>("influencers/listInfluencerApplications", "GET");
export const saveInfluencer = createRpcClient<
  typeof import("./backend/handlers/influencers").saveInfluencer
>("influencers/saveInfluencer", "POST");
