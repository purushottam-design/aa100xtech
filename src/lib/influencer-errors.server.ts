import "server-only";

export function influencerFailure(error: unknown) {
  const failure = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    cause?: { code?: unknown };
  } | null;
  const code = typeof failure?.code === "string" ? failure.code : "";
  // Inspect, but never return or log, database details or connection strings.
  const description = [failure?.message, failure?.details, failure?.cause?.code].join(" ");
  if (
    /UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF_SIGNED_CERT|CERT_HAS_EXPIRED|unable to verify|certificate/i.test(
      description,
    )
  )
    return {
      code: "INFLUENCER_TLS_ERROR",
      action:
        "Restart using npm run dev to load the operating system's trusted CA certificates. Keep TLS verification enabled.",
      development:
        "The server could not establish a trusted database connection. Restart npm run dev and check the server's CA configuration.",
    };
  if (["PGRST202", "PGRST204", "PGRST205", "42P01", "42703", "42883"].includes(code))
    return {
      code: "INFLUENCER_SCHEMA_MISSING",
      action:
        "Apply supabase/repairs/restore_influencer_applications.sql to the intended Supabase project, then reload its API schema cache.",
      development:
        "The influencer application database is not ready. Apply supabase/repairs/restore_influencer_applications.sql in the intended Supabase project.",
    };
  if (code === "42501")
    return {
      code: "INFLUENCER_DATABASE_PERMISSION",
      action: "Verify the server service-role credential and influencer table/function grants.",
      development:
        "The server cannot access the influencer application database. Check its service-role credential and permissions.",
    };
  if (/Invalid API key|Invalid JWT|JWT expired/i.test(description) || /^PGRST30[123]$/.test(code))
    return {
      code: "INFLUENCER_DATABASE_CREDENTIALS",
      action:
        "Verify that the server Supabase URL and service-role key belong to the same active project.",
      development:
        "The database rejected the server credentials. Check the server's Supabase configuration.",
    };
  if (/Missing Supabase environment variable|not configured/.test(description))
    return {
      code: "INFLUENCER_DATABASE_CONFIGURATION",
      action: "Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.",
      development: "The server's Supabase application configuration is missing.",
    };
  return {
    code: "INFLUENCER_SAVE_UNAVAILABLE",
    action:
      "Run npm run diagnose:influencers to check the database connection and application schema.",
    development:
      "The application could not be saved. Run npm run diagnose:influencers and check the server logs.",
  };
}
