import { checkoutPreparationSchema, prepareCheckout } from "@/lib/icici-checkout.server";
import { iciciJsonRequest } from "@/lib/icici-routes.server";
export const runtime = "nodejs";
export function POST(request: Request) {
  return iciciJsonRequest(request, checkoutPreparationSchema, async (input) => {
    const checkout = await prepareCheckout(input);
    return {
      amount: checkout.amount_paise,
      currency: checkout.currency,
      reference: checkout.merchant_reference,
    };
  });
}
