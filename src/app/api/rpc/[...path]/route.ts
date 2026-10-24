import { rpcRegistry } from "@/lib/backend/registry.server";
import { handleRpc } from "@/lib/backend/transport.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context): Promise<Response> {
  return handleRpc(request, (await context.params).path.join("/"), rpcRegistry);
}

export { handle as GET, handle as POST };
