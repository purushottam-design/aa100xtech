import "server-only";
import { runWithRequestContext } from "./request-context.server";

type Endpoint = {
  method: "GET" | "POST";
  (options: { data: never }): Promise<unknown>;
};

function json(body: unknown, status: number, headers = new Headers()): Response {
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("vary", "Authorization, Cookie");
  return new Response(JSON.stringify(body), { status, headers });
}

/** Framework-independent transport, exercised with mock handlers without database writes. */
export async function handleRpc(
  request: Request,
  path: string,
  registry: Readonly<Record<string, Endpoint>>,
): Promise<Response> {
  // The custom header plus no CORS response prevents cross-site form/RPC submission.
  const origin = request.headers.get("origin");
  if (
    request.headers.get("x-aa-rpc") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    return json({ error: { message: "Cross-site request rejected." } }, 403);
  }
  const endpoint = Object.hasOwn(registry, path) ? registry[path] : undefined;
  if (!endpoint) return json({ error: { message: "Unknown server function." } }, 404);
  if (request.method !== endpoint.method) {
    return json(
      { error: { message: "Method not allowed." } },
      405,
      new Headers({ allow: endpoint.method }),
    );
  }
  return runWithRequestContext(request, async (state) => {
    try {
      let input: unknown;
      if (request.method === "GET") {
        const data = new URL(request.url).searchParams.get("data");
        if (data !== null) input = JSON.parse(data);
      } else {
        if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
          return json({ error: { message: "Expected application/json." } }, 415);
        }
        const text = await request.text();
        if (text.length > 1_048_576)
          return json({ error: { message: "Request payload is too large." } }, 413);
        const body: unknown = JSON.parse(text);
        if (body === null || typeof body !== "object" || Array.isArray(body)) {
          return json({ error: { message: "Invalid request payload." } }, 400);
        }
        input = (body as { data?: unknown }).data;
      }
      const data = await endpoint({ data: input as never });
      return json({ data }, state.status, state.headers);
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      const status =
        state.status !== 200
          ? state.status
          : failure.name === "ZodError" || failure instanceof SyntaxError
            ? 400
            : 500;
      return json(
        { error: { message: failure.message, name: failure.name } },
        status,
        state.headers,
      );
    }
  });
}
