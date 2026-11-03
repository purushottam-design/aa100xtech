import "server-only";
import { site } from "@/data/site";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
export async function publicSiteSettings() {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "website")
    .abortSignal(AbortSignal.timeout(5000))
    .maybeSingle();
  const values = (
    !error && data?.value && typeof data.value === "object" && !Array.isArray(data.value)
      ? data.value
      : {}
  ) as Record<string, unknown>;
  const text = (key: string, fallback: string, max = 250) =>
    typeof values[key] === "string" &&
    String(values[key]).trim() &&
    String(values[key]).length <= max
      ? String(values[key]).trim()
      : fallback;
  const phone = text("phone", site.phone, 30);
  const email = text("supportEmail", site.email);
  return {
    name: text("siteName", site.name),
    legalName: text("legalName", site.legalName),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : site.email,
    phone: /^[+\d\s()-]+$/.test(phone) ? phone : site.phone,
    phoneHref: /^[+\d\s()-]+$/.test(phone) ? `tel:${phone.replace(/[^+\d]/g, "")}` : site.phoneHref,
    address: text("address", site.address),
    hours: site.hours,
  };
}
