import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { loginHref } from "@/lib/auth-navigation";

export async function customerActionHeaders() {
  const headers = await attachSupabaseAuth();
  headers.set("x-aa-rpc", "1");
  return headers;
}

export function redirectExpiredCustomerSession(response: Response) {
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign(
      loginHref(window.location.pathname + window.location.search + window.location.hash),
    );
  }
}
