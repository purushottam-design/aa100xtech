import { checkoutInitiationSchema, startCheckout } from "@/lib/icici-checkout.server";
import { iciciJsonRequest } from "@/lib/icici-routes.server";
export const runtime = "nodejs";
export function POST(request: Request) {
  return iciciJsonRequest(request, checkoutInitiationSchema, startCheckout);
}
