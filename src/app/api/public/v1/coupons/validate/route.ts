import { handlers } from "@/routes/api/public/v1/coupons.validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = handlers.OPTIONS;
export async function POST(request: Request): Promise<Response> {
  return handlers.POST({ request });
}
