import { saveWebsiteRequest } from "@/lib/website-requests.server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    return await saveWebsiteRequest(request, true);
  } catch {
    return Response.json(
      { saved: false, message: "Your request could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
