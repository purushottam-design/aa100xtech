import { handlers } from "@/routes/go.$affiliateId.$slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ affiliateId: string; slug: string }> },
): Promise<Response> {
  return handlers.GET({ request, params: await context.params });
}
