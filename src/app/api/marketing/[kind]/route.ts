import { submitMarketingIntake } from "@/lib/marketing-intake.server";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (kind !== "creator" && kind !== "brand")
    return Response.json({ error: "Not found" }, { status: 404 });
  return submitMarketingIntake(request, kind);
}
