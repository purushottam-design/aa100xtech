import { publicSiteSettings } from "@/lib/public-site.server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await publicSiteSettings(), {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json({}, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
