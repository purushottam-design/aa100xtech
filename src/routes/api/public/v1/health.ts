import "server-only";

/**
 * Backend + database health check.
 * Verifies that the server can reach the Supabase (Lovable Cloud) database
 * using the environment-provided public credentials. No secrets are ever returned.
 */
export const handlers = {
  OPTIONS: async () => {
    const { jsonResponse } = await import("@/lib/affiliate.server");
    return jsonResponse(null, 204);
  },
  GET: async () => {
    const { jsonResponse } = await import("@/lib/affiliate.server");
    const startedAt = Date.now();

    // Check the same configured project used by the application clients.
    const url = process.env["SUPABASE_URL"];
    const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"];

    const missing = [
      ...(url ? [] : ["SUPABASE_URL"]),
      ...(publishable ? [] : ["SUPABASE_PUBLISHABLE_KEY"]),
    ];

    if (missing.length > 0) {
      console.error(`[health] Missing backend environment variable(s): ${missing.join(", ")}`);
      return jsonResponse({ ok: false, database: "unconfigured", missing }, 503);
    }

    if (!url || !publishable) {
      return jsonResponse({ ok: false, database: "unconfigured" }, 503);
    }

    try {
      const authResponse = await fetch(`${url}/auth/v1/settings`, {
        headers: { apikey: publishable },
      });

      if (!authResponse.ok) {
        console.error(`[health] Supabase responded with HTTP ${authResponse.status}`);
        return jsonResponse(
          { ok: false, database: "unreachable", upstream_status: authResponse.status },
          503,
          { "access-control-allow-methods": "GET, OPTIONS" },
        );
      }

      const catalogResponse = await fetch(`${url}/rest/v1/catalog_items?select=id&limit=1`, {
        headers: { apikey: publishable },
      });

      let bookings = "unknown";
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("consultation_bookings").select("id").limit(1);
        bookings = error ? `error: ${error.code ?? ""} ${error.message}` : "ready";
      } catch (error) {
        bookings = `error: ${error instanceof Error ? error.message : String(error)}`;
      }

      return jsonResponse(
        {
          ok: true,
          database: "connected",
          project_ref: new URL(url).hostname.split(".")[0],
          schema: catalogResponse.ok ? "ready" : "migration_required",
          bookings,
          latency_ms: Date.now() - startedAt,
        },
        200,
        { "access-control-allow-methods": "GET, OPTIONS" },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[health] Database connection failed: ${message}`);
      return jsonResponse({ ok: false, database: "unreachable", error: message }, 503, {
        "access-control-allow-methods": "GET, OPTIONS",
      });
    }
  },
};
