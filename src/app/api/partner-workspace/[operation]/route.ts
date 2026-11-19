import { ZodError } from "zod";
import { ApiError, authenticate, resolveAccess } from "@/lib/partner-workspace/server/access";
import { operate } from "@/lib/partner-workspace/server/operations";

export const runtime = "nodejs";
async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 524288) {
        await reader.cancel();
        throw new ApiError(413, "TOO_LARGE", "Import at most 100 rows per request.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
  } finally {
    reader.releaseLock();
  }
}
function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization, Cookie" },
  });
}
export async function POST(request: Request, context: { params: Promise<{ operation: string }> }) {
  try {
    const origin = request.headers.get("origin");
    const url = new URL(request.url);
    const host = request.headers.get("host");
    const validLocal =
      process.env.NODE_ENV === "development" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      host &&
      ["localhost", "127.0.0.1"].some((h) => host === `${h}:${url.port}`);
    if (
      request.headers.get("x-aa-rpc") !== "1" ||
      request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== url.origin && !(validLocal && origin === `http://${host}`))
    )
      throw new ApiError(403, "CROSS_SITE", "Cross-site request rejected.");
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      throw new ApiError(415, "CONTENT_TYPE", "Expected application/json.");
    const body = await boundedBody(request);
    const input: unknown = JSON.parse(body);
    const { db, user } = await authenticate(request);
    const access = await resolveAccess(db, user);
    const { operation } = await context.params;
    return json({
      data: operation === "access-state" ? access : await operate(operation, input, db, access),
    });
  } catch (error) {
    if (error instanceof ApiError)
      return json({ error: { message: error.message, code: error.code } }, error.status);
    if (error instanceof ZodError)
      return json(
        {
          error: {
            message: error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .slice(0, 5)
              .join("; "),
            code: "INVALID_DATA",
          },
        },
        400,
      );
    if (error instanceof SyntaxError)
      return json({ error: { message: "Invalid JSON request.", code: "INVALID_DATA" } }, 400);
    return json(
      {
        error: {
          message: "Workspace service unavailable. Please retry or contact your operator.",
          code: "UNAVAILABLE",
        },
      },
      503,
    );
  }
}
