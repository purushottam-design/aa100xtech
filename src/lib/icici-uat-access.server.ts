import "server-only";
import { IciciPaymentError, type IciciUatConfig } from "./icici.server";

/** Initial UAT may be exercised by a verified super admin without claiming it passed. */
export async function assertIciciCheckoutAccess(request: Request, config: IciciUatConfig) {
  // Config validation rejects live endpoints/environments before this function runs.
  if (process.env["ICICI_UAT_TESTS_PASSED"]?.trim() === "true") return;
  if (process.env["ICICI_UAT_TEST_MODE"]?.trim() !== "true")
    throw new IciciPaymentError(
      "ICICI_UAT_TESTS_NOT_PASSED",
      "ICICI_UAT_TESTS_PASSED is not true. Enable ICICI_UAT_TEST_MODE for controlled super-admin testing.",
      503,
      { blocked: ["ICICI_UAT_TESTS_PASSED"] },
    );
  // Require the same registered HTTPS origin even for an authenticated tester.
  if (new URL(request.url).origin !== config.origin)
    throw new IciciPaymentError(
      "ICICI_WRONG_ORIGIN",
      "Request origin must match the HTTPS origin of ICICI_RETURN_URL.",
      403,
    );
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.auth.getUser(authorization.slice(7));
      if (!error && data.user) {
        const { authorizeSuper } = await import("./rbac.server");
        await authorizeSuper(data.user.id);
        return;
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
