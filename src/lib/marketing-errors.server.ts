import "server-only";
import { InfluencerRequestError } from "./influencer-upload.server";

// Keep schema repair instructions in server logs, never in a visitor's form.
export function marketingRequestError(error: unknown, operation = "unknown") {
  const headers = { "cache-control": "no-store" };
  if (error instanceof InfluencerRequestError)
    return Response.json(
      { error: error.message, ...(error.status === 429 ? { code: "MARKETING_RATE_LIMITED" } : {}) },
      {
        status: error.status,
        headers: { ...headers, ...(error.status === 429 ? { "retry-after": "3600" } : {}) },
      },
    );

  const failure = error as { code?: unknown; message?: unknown; cause?: { code?: unknown } } | null;
  const databaseCode = typeof failure?.code === "string" ? failure.code : "";
  const description = [failure?.message, failure?.cause?.code].join(" ");
  let code = "MARKETING_SAVE_UNAVAILABLE";
  let action = "Run npm run diagnose:marketing to check the database connection and schema.";
  if (["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"].includes(databaseCode)) {
    code = "MARKETING_SCHEMA_MISSING";
    action =
      "Run npm run diagnose:marketing. Verify SQL-side objects with supabase/diagnostics/marketing_intake.sql. If the original migration was already run, apply supabase/migrations/20261105143000_marketing_intake_recovery.sql to restore grants and reload PostgREST. The API cannot distinguish an absent table from stale schema metadata.";
  } else if (databaseCode === "42501") {
    code = "MARKETING_DATABASE_PERMISSION";
    action = "Check the server service-role credential and marketing table/function grants.";
  } else if (
    /Invalid API key|Invalid JWT|JWT expired/i.test(description) ||
    /^PGRST30[123]$/.test(databaseCode)
  ) {
    code = "MARKETING_DATABASE_CREDENTIALS";
    action =
      "Verify the server Supabase URL and service-role key belong to the same active project.";
  } else if (/Missing Supabase environment variable|not configured/.test(description)) {
    code = "MARKETING_DATABASE_CONFIGURATION";
    action = "Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.";
  } else if (/CERT|SIGNATURE|unable to verify|certificate/i.test(description)) {
    code = "MARKETING_TLS_ERROR";
    action = "Check system CA trust and restart with npm run dev. Keep TLS verification enabled.";
  }
  const safeDatabaseCode = /^[A-Z0-9]{5,12}$/.test(databaseCode) ? databaseCode : "none";
  const safeOperation = /^[a-z_]{1,40}$/.test(operation) ? operation : "unknown";
  console.error(
    `[Marketing] ${code}; operation=${safeOperation}; database_code=${safeDatabaseCode}. ${action}`,
  );
  return Response.json(
    {
      error:
        "We couldn’t save your submission right now. Your details are still in the form. Please try again later or contact our team.",
      code,
    },
    { status: 503, headers },
  );
}
