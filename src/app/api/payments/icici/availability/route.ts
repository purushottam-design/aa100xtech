import { iciciAvailability } from "@/lib/icici-checkout.server";
import { iciciUatConfig } from "@/lib/icici.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  let available = false;
  try {
    available =
      new URL(request.url).origin === iciciUatConfig().origin && (await iciciAvailability());
  } catch {
    /* unavailable */
  }
  return Response.json(
    { icici: available, environment: "uat" },
    { headers: { "cache-control": "no-store" } },
  );
}
