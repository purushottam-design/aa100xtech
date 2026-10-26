import { iciciUnavailableResponse } from "@/lib/icici.server";
export const runtime = "nodejs";
export function POST() {
  // Never accept, acknowledge as successful, or mutate data from an unverified
  // callback. Its authentication/acknowledgement contract needs the bank kit.
  return iciciUnavailableResponse();
}
