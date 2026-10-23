import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    // Server-function callers handle typed failures in their existing forms.
    // Returning an HTML error document here corrupts the RPC response and can
    // replace the current page with a blank error screen.
    const request = getRequest();
    if (new URL(request.url).pathname.startsWith("/_serverFn/")) {
      throw error;
    }
    // The visitor navigated away or closed the tab mid-request — not a crash.
    const message = String((error as { message?: string } | null)?.message ?? "");
    if (
      request.signal?.aborted ||
      (error as { name?: string } | null)?.name === "AbortError" ||
      /\baborted\b|ECONNRESET|ERR_STREAM_PREMATURE_CLOSE/i.test(message)
    ) {
      return new Response(null, { status: 499 });
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
