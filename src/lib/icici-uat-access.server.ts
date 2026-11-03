import "server-only";
import { IciciPaymentError, type IciciUatConfig } from "./icici.server";
import { assertIciciOrigin } from "./icici-origin.server";

/** Initial UAT supports explicitly enabled local guest tests without claiming it passed. */
export async function assertIciciCheckoutAccess(request: Request, config: IciciUatConfig) {
  // Config validation rejects live endpoints/environments before this function runs.
  assertIciciOrigin(request, config.origin);
  if (process.env["ICICI_UAT_TESTS_PASSED"]?.trim() === "true") return;
  if (process.env["ICICI_UAT_TEST_MODE"]?.trim() !== "true")
    throw new IciciPaymentError(
      "ICICI_UAT_TESTS_NOT_PASSED",
      "ICICI_UAT_TESTS_PASSED is not true. Enable ICICI_UAT_TEST_MODE for controlled super-admin testing.",
      503,
      { blocked: ["ICICI_UAT_TESTS_PASSED"] },
    );
  // Guest testing is a local-development opt-in, pinned to the configured HTTPS
  // tunnel. It cannot open an unverified deployed build or a live bank adapter.
  if (
    process.env["NODE_ENV"] === "development" &&
    process.env["ICICI_UAT_GUEST_CHECKOUT"]?.trim() === "true" &&
    process.env["ICICI_TRUST_PROXY"]?.trim() === "true" &&
    process.env["DEV_TUNNEL_ORIGIN"]?.trim() === config.origin
  )
    return;
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
