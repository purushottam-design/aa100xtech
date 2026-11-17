import { securityDefectRequest, downloadSecurityAttachment } from "@/lib/security-defects.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return securityDefectRequest(request, async (session) => {
    const { id } = await context.params;
    return downloadSecurityAttachment(id, session);
  });
}
