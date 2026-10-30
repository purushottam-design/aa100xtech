import { receiveIciciCallback } from "@/lib/icici-routes.server";
export const runtime = "nodejs";
export function POST(request: Request) {
  return receiveIciciCallback(request);
}
