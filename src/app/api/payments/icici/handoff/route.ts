import { receiveUatHandoff } from "@/lib/icici-handoff.server";
import { iciciErrorResponse } from "@/lib/icici.server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    return await receiveUatHandoff(request);
  } catch (error) {
    return iciciErrorResponse(error);
  }
}
