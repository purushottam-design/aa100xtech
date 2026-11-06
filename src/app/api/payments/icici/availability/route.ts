import { iciciAvailability } from "@/lib/icici-checkout.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const development = process.env.NODE_ENV === "development";
  const result = await iciciAvailability(request);
  if (development && !result.available)
    console.warn(`[ICICI availability] ${JSON.stringify(result)}`);
  return Response.json(
    {
      // Keep the original key for existing clients; available is the canonical key.
      icici: result.available,
      environment: "uat",
      // Opt-in, development-only evidence for comparing the app with ngrok's
      // inspector. Never expose Authorization, cookies or arbitrary headers.
      ...(development && process.env["ICICI_ORIGIN_DEBUG"] === "true"
        ? {
            proxyHeaders: Object.fromEntries(
              ["host", "x-forwarded-host", "x-forwarded-proto"].map((name) => [
                name,
                request.headers.get(name)?.slice(0, 256) ?? null,
              ]),
            ),
          }
        : {}),
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
