import "server-only";
import { z } from "zod";
import { runWithRequestContext } from "./backend/request-context.server";
import {
  assertPaymentOrigin,
  amountInPaise,
  iciciErrorResponse,
  IciciPaymentError,
  iciciUatConfig,
  verifyIciciCallback,
} from "./icici.server";
import { checkoutForBankReference, reconcileIciciCheckout } from "./icici-checkout.server";

export async function iciciJsonRequest<Schema extends z.ZodTypeAny>(
  request: Request,
  schema: Schema,
  action: (input: z.output<Schema>) => Promise<unknown>,
) {
  const forbidden = assertPaymentOrigin(request);
  if (forbidden) return forbidden;
  try {
    // Validate the activation gate before touching the database or parsing input.
    const config = iciciUatConfig();
    if (new URL(request.url).origin !== config.origin)
      throw new IciciPaymentError(
        "ICICI_WRONG_ORIGIN",
        "ICICI UAT is not available on this website.",
        403,
      );
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new IciciPaymentError("INVALID_REQUEST", "A JSON request is required.", 400);
    const body = await request.text();
    if (body.length > 20_000)
      throw new IciciPaymentError("INVALID_REQUEST", "The payment request is too large.", 413);
    let input: z.output<Schema>;
    try {
      input = schema.parse(JSON.parse(body));
    } catch {
      throw new IciciPaymentError("INVALID_REQUEST", "Please check the payment request.", 400);
    }
    return Response.json(
      { ok: true, ...((await runWithRequestContext(request, () => action(input))) as object) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return iciciErrorResponse(error);
  }
}

export async function receiveIciciCallback(request: Request, advice = false) {
  try {
    const config = iciciUatConfig();
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/x-www-form-urlencoded")
    )
      throw new IciciPaymentError(
        "ICICI_INVALID_CALLBACK",
        "A form-encoded bank response is required.",
        415,
      );
    const body = await request.text();
    if (body.length > 20_000)
      throw new IciciPaymentError("ICICI_INVALID_CALLBACK", "Invalid bank response.", 413);
    const form = new URLSearchParams(body);
    const fields: Record<string, string> = Object.create(null);
    for (const [key, value] of form) {
      if (Object.hasOwn(fields, key))
        throw new IciciPaymentError(
          "ICICI_INVALID_CALLBACK",
          "Duplicate bank response fields.",
          400,
        );
      fields[key] = value;
    }
    // Only POST fields participate. Query parameters never influence signatures or identity.
    const reference = verifyIciciCallback(fields, config);
    const checkout = await checkoutForBankReference(reference);
    if (
      checkout.gateway !== "icici" ||
      !/^[A-Za-z0-9]{1,24}$/.test(fields["txnID"] ?? "") ||
      ((fields["amount"] ?? fields["Amount"]) !== undefined &&
        amountInPaise(fields["amount"] ?? fields["Amount"]) !== checkout.amount_paise)
    )
      throw new IciciPaymentError(
        "ICICI_INVALID_CALLBACK",
        "The bank response does not match this checkout.",
        400,
      );
    try {
      await reconcileIciciCheckout(checkout, fields["txnID"]);
    } catch (error) {
      if (advice) throw error; /* Browser returns to a pending state; advice delivery must retry. */
    }
    if (advice) return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
    // No token, PII or claimed success appears in the redirect. The owning browser
    // uses its session-scoped capability to request the server-verified outcome.
    const target = new URL("/consultation", config.origin);
    target.searchParams.set("icici_return", checkout.id);
    return new Response(null, {
      status: 303,
      headers: {
        Location: target.href,
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    });
  } catch (error) {
    return iciciErrorResponse(error);
  }
}
