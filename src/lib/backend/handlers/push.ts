import "server-only";
/**
 * Device registration for app notifications.
 *
 * The mobile app registers a device once the person allows notifications;
 * announcements sent from the Super Admin console are then delivered to
 * that device through the service worker.
 */
import { createServerFn } from "@/lib/backend/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export const registerPushDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string().trim().min(8).max(400),
        platform: z.string().trim().max(40).default("web"),
        userAgent: z.string().trim().max(400).optional(),
        enabled: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const client = await admin();
    const { error } = await client.from("push_devices").upsert(
      {
        user_id: (context as { userId: string }).userId,
        device_token: data.token,
        platform: data.platform,
        user_agent: data.userAgent ?? null,
        enabled: data.enabled,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,device_token" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setPushEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ token: z.string().trim().min(8).max(400), enabled: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const client = await admin();
    const { error } = await client
      .from("push_devices")
      .update({ enabled: data.enabled, last_seen_at: new Date().toISOString() })
      .eq("user_id", (context as { userId: string }).userId)
      .eq("device_token", data.token);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** How many devices are reachable — shown next to the announcement composer. */
export const getPushReach = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const client = await admin();
    const [{ count: devices }, { count: people }] = await Promise.all([
      client.from("push_devices").select("id", { count: "exact", head: true }).eq("enabled", true),
      client
        .from("push_devices")
        .select("user_id", { count: "exact", head: true })
        .eq("enabled", true),
    ]);
    return { devices: devices ?? 0, people: people ?? 0 };
  });
