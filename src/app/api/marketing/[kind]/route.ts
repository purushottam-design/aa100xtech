import { submitMarketingIntake } from "@/lib/marketing-intake.server";
import { websiteSessionError } from "@/lib/website-session.server";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (kind !== "creator" && kind !== "brand")
    return Response.json({ error: "Not found" }, { status: 404 });
  const denied = await websiteSessionError(request);
  if (denied) return denied;
  return submitMarketingIntake(request, kind);
}
