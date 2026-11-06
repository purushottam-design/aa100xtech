import "server-only";
import { IciciPaymentError, type IciciUatConfig } from "./icici.server";
import { assertIciciOrigin } from "./icici-origin.server";

/** Verify the actual Supabase session, never user-provided roles or an env password. */
export async function requireIciciSuperAdmin(request: Request): Promise<string> {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.auth.getUser(authorization.slice(7));
      if (!error && data.user) {
        const { authorizeSuper } = await import("./rbac.server");
        await authorizeSuper(data.user.id);
        return data.user.id;
      }
    } catch {
      // Auth SDK and role errors may contain sensitive information; never forward them.
    }
  }
  throw new IciciPaymentError(
    "ICICI_UAT_TEST_ACCESS_REQUIRED",
    "Controlled ICICI UAT testing requires a signed-in super administrator.",
    403,
  );
}

/** UAT always requires a Super Admin, even when an old guest/passed flag is set. */
export async function assertIciciCheckoutAccess(
  request: Request,
  config: IciciUatConfig,
  checkoutId?: string,
): Promise<{ checkoutId?: string }> {
  assertIciciOrigin(request, config.origin);
  if (
    process.env["ICICI_UAT_TESTS_PASSED"]?.trim() !== "true" &&
    process.env["ICICI_UAT_TEST_MODE"]?.trim() !== "true"
  )
    throw new IciciPaymentError(
      "ICICI_UAT_TESTS_NOT_PASSED",
      "ICICI_UAT_TESTS_PASSED is not true. Enable controlled Super Admin UAT testing first.",
      503,
      { blocked: ["ICICI_UAT_TESTS_PASSED"] },
    );
  if (request.headers.get("authorization")) {
    await requireIciciSuperAdmin(request);
    return {};
  }
  if (
    process.env.NODE_ENV === "development" &&
    request.headers.get("cookie")?.includes("__Host-aa-icici-uat=")
  ) {
    const { authorizeUatHandoff } = await import("./icici-handoff.server");
    const grant = await authorizeUatHandoff(request, checkoutId);
    return { checkoutId: grant.checkout_id };
  }
  await requireIciciSuperAdmin(request);
  return {};
}
