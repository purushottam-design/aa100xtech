import { supabase } from "./client";

/** Preserve the existing localStorage-backed Supabase session on every RPC. */
export async function attachSupabaseAuth(): Promise<Headers> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return new Headers(token ? { Authorization: `Bearer ${token}` } : {});
}
