import "server-only";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runWithRequestContext } from "@/lib/backend/request-context.server";

/** Check the live account session before accepting any customer submission. */
export async function websiteSessionError(request: Request): Promise<Response | null> {
  const denied = (status = 401) => {
    const message =
      status === 503
        ? "Login verification is temporarily unavailable. Please try again."
        : "Please log in or create an account to continue.";
    return Response.json(
      { ok: false, saved: false, error: message, message },
      {
        status,
        headers: { "cache-control": "no-store", vary: "Authorization" },
      },
    );
  };
  if (!request.headers.get("authorization")?.startsWith("Bearer ")) return denied();
  return runWithRequestContext(request, async (state) => {
    try {
      await requireSupabaseAuth();
      return null;
    } catch {
      return denied(state.status === 401 ? 401 : 503);
    }
  });
}
