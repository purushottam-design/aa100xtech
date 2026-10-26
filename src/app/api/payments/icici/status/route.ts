import { assertPaymentOrigin, iciciUnavailableResponse } from "@/lib/icici.server";
export const runtime = "nodejs";
export function POST(request: Request) {
  return assertPaymentOrigin(request) ?? iciciUnavailableResponse();
}
