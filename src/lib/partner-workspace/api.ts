import { supabase } from "@/integrations/supabase/client";

export class WorkspaceError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
export async function workspaceApi<T>(
  operation: string,
  data: unknown = {},
  signal?: AbortSignal,
): Promise<T> {
  const session = await supabase.auth.getSession();
  if (session.error)
    throw new WorkspaceError(
      "Authentication service unavailable. Retry after checking your connection.",
      503,
      "AUTH_UNAVAILABLE",
    );
  const token = session.data.session?.access_token;
  if (!token)
    throw new WorkspaceError(
      "Please sign in with your existing AA100XTech account.",
      401,
      "SIGN_IN_REQUIRED",
    );
  const response = await fetch(`/api/partner-workspace/${operation}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-aa-rpc": "1",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw new WorkspaceError(
      result.error?.message ?? "Workspace request failed. Please retry.",
      response.status,
      result.error?.code ?? "UNAVAILABLE",
    );
  return result.data as T;
}
