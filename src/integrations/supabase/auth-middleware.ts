// Shared server-side bearer authentication for every protected RPC.
import "server-only";
import { getRequest, setResponseStatus } from "@/lib/backend/request-context.server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export async function requireSupabaseAuth() {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  const request = getRequest();

  if (!request?.headers) {
    setResponseStatus(401);
    throw new Error("Unauthorized: No request headers available");
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    setResponseStatus(401);
    throw new Error("Unauthorized: No authorization header provided");
  }

  if (!authHeader.startsWith("Bearer ")) {
    setResponseStatus(401);
    throw new Error("Unauthorized: Only Bearer tokens are supported");
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    setResponseStatus(401);
    throw new Error("Unauthorized: No token provided");
  }

  if (token.split(".").length !== 3) {
    setResponseStatus(401);
    throw new Error("Unauthorized: Invalid token");
  }

  const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY!),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    const unavailable =
      error && ((error.status ?? 0) >= 500 || error.name === "AuthRetryableFetchError");
    setResponseStatus(unavailable ? 503 : 401);
    throw new Error(
      unavailable
        ? "Authentication service unavailable. Please try again."
        : "Unauthorized: Invalid token",
    );
  }

  if (!data.claims.sub) {
    setResponseStatus(401);
    throw new Error("Unauthorized: No user ID found in token");
  }

  // A signature-valid JWT can outlive logout. Ask Auth to validate the live
  // session as well, so revoked sessions cannot keep using administrative RPCs.
  const verified = await supabase.auth.getUser(token);
  if (verified.error || !verified.data.user || verified.data.user.id !== data.claims.sub) {
    const unavailable =
      verified.error &&
      ((verified.error.status ?? 0) >= 500 || verified.error.name === "AuthRetryableFetchError");
    setResponseStatus(unavailable ? 503 : 401);
    throw new Error(
      unavailable
        ? "Authentication service unavailable. Please try again."
        : "Unauthorized: Session is invalid or expired",
    );
  }

  return { supabase, userId: data.claims.sub, claims: data.claims };
}
