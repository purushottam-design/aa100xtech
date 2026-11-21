import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createServerFn } from "@/lib/backend/server";
import { resolveAccess } from "@/lib/rbac.server";
import { ADMIN_PANELS, PANEL_ROLE } from "@/lib/admin-panels";
import { isReservedAdminEmail } from "@/lib/admin-env.server";

function authClient() {
  const url = process.env["SUPABASE_URL"]?.trim();
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]?.trim();
  if (!url || !key) throw new Error("AUTH_CONFIGURATION");
  const browserUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"]?.trim();
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error("Invalid URL");
    if (browserUrl && new URL(browserUrl).origin !== parsed.origin)
      throw new Error("Project mismatch");
  } catch {
    throw new Error("AUTH_CONFIGURATION");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
          headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers, signal: AbortSignal.timeout(15000) });
      },
    },
  });
}

// Passwords are verified only by Supabase Auth against its stored hashes.
// Public login never creates users, changes passwords or assigns roles.
export const dashboardLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().email().max(255),
        password: z.string().min(1).max(128),
        dashboard: z.enum(ADMIN_PANELS),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const invalid = {
      ok: false as const,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    };
    let client: ReturnType<typeof authClient> | undefined;
    let minted = false;
    try {
      client = authClient();
      const result = await client.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        if (result.error.status === 429)
          return {
            ok: false as const,
            code: "AUTH_RATE_LIMITED",
            message: "Too many sign-in attempts. Please wait and try again.",
          };
        if (
          result.error.status === 400 ||
          result.error.status === 401 ||
          result.error.status === 422
        )
          return invalid;
        throw new Error("AUTH_SERVICE_UNAVAILABLE");
      }
      if (!result.data.session || !result.data.user) return invalid;
      minted = true;
      const access = await resolveAccess(result.data.user.id);
      const allowed =
        access.status === "active" &&
        (access.isSuper || access.roles.includes(PANEL_ROLE[data.dashboard]));
      if (!allowed) {
        await client.auth.signOut({ scope: "local" });
        minted = false;
        if (access.status !== "active")
          return {
            ok: false as const,
            code: "ACCOUNT_INACTIVE",
            message: "This account is inactive or suspended. Contact your administrator.",
          };
        if (isReservedAdminEmail(data.email))
          return {
            ok: false as const,
            code: "ADMIN_SETUP_REQUIRED",
            message:
              "This administrator account has not been provisioned for this dashboard. Contact the operator to complete administrator setup.",
          };
        if (access.roleLookupUnavailable)
          return {
            ok: false as const,
            code: "AUTHORIZATION_UNAVAILABLE",
            message:
              "Administrator access could not be verified. Please try again later or contact your administrator.",
          };
        return {
          ok: false as const,
          code: "DASHBOARD_FORBIDDEN",
          message: "This account is not authorized to open this dashboard.",
        };
      }
      return {
        ok: true as const,
        dashboard: data.dashboard,
        roles: access.roles,
        session: {
          access_token: result.data.session.access_token,
          refresh_token: result.data.session.refresh_token,
        },
      };
    } catch (cause) {
      if (minted && client) await client.auth.signOut({ scope: "local" }).catch(() => undefined);
      if (cause instanceof Error && cause.message === "AUTH_CONFIGURATION") {
        console.warn("[Dashboard auth] Missing, invalid or mismatched Supabase configuration.");
        return {
          ok: false as const,
          code: "AUTH_CONFIGURATION_REQUIRED",
          message:
            "Administrator sign-in is not configured correctly. Ask the operator to verify the server and browser Supabase settings in the hosting environment.",
        };
      }
      console.warn(
        "[Dashboard auth] Sign-in or authorization service unavailable; no session was returned.",
      );
      return {
        ok: false as const,
        code: "AUTH_SERVICE_UNAVAILABLE",
        message:
          "The sign-in service is unavailable. Ask your administrator to check the Supabase connection and hosting configuration, then retry.",
      };
    }
  });
