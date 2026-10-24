import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

type AnyRpc = (...args: never[]) => Promise<unknown>;

/** Only public endpoint names and erased TypeScript signatures reach the browser. */
export function createRpcClient<Handler extends AnyRpc>(
  path: string,
  method: "GET" | "POST",
): Handler {
  const call = async (options?: { data?: unknown }) => {
    const headers = await attachSupabaseAuth();
    headers.set("x-aa-rpc", "1");
    const endpoint = `/api/rpc/${path}`;
    const query =
      method === "GET" && options?.data !== undefined
        ? `?data=${encodeURIComponent(JSON.stringify(options.data))}`
        : "";
    if (method === "POST") headers.set("content-type", "application/json");
    const response = await fetch(endpoint + query, {
      method,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      ...(method === "POST" ? { body: JSON.stringify({ data: options?.data }) } : {}),
    });
    const result = (await response.json()) as {
      data?: unknown;
      error?: { message: string; name?: string };
    };
    if (!response.ok || result.error) {
      const error = new Error(result.error?.message ?? "The request could not be completed.");
      error.name = result.error?.name ?? "Error";
      throw error;
    }
    return result.data;
  };
  return call as unknown as Handler;
}
