import { issueUatHandoff } from "@/lib/icici-handoff.server";
import { iciciErrorResponse } from "@/lib/icici.server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    return Response.json(await issueUatHandoff(request), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return iciciErrorResponse(error);
  }
}
