import { iciciAvailability } from "@/lib/icici-checkout.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const development = process.env.NODE_ENV === "development";
  // Temporary server diagnostic: this approval flag is nonsecret.
  if (development)
    console.log("ICICI_UAT_MERCHANT_CONFIRMED:", process.env["ICICI_UAT_MERCHANT_CONFIRMED"]);
  const result = await iciciAvailability(request);
  if (development && !result.available)
    console.warn(`[ICICI availability] ${JSON.stringify(result)}`);
  return Response.json(
    {
      // Keep the original key for existing clients; available is the canonical key.
      icici: result.available,
      environment: "uat",
      ...(development
        ? result
        : {
            available: result.available,
            ...(!result.available
              ? { reason: "ICICI Bank payments are currently unavailable." }
              : {}),
          }),
    },
    { headers: { "cache-control": "no-store", vary: "Authorization" } },
  );
}
