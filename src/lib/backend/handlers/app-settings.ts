import "server-only";
import { createServerFn } from "@/lib/backend/server";
import { getRequestHeader, setResponseStatus } from "@/lib/backend/request-context.server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findSettingGroup, SETTING_GROUP_KEYS } from "@/lib/app-settings";

type Ctx = { supabase: any; userId: string };

type SettingValues = Record<string, string | number | boolean>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

function deny(message: string): never {
  setResponseStatus(403);
  throw new Error(message);
}

async function isSuper(userId: string) {
  const client = await admin();
  const { data } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "supreme_admin");
  if ((data ?? []).length > 0) return true;
  const { isEnvAdminUser } = await import("@/lib/admin-env.server");
  return isEnvAdminUser(userId);
}

function clientIp(): string | null {
  return (
    (getRequestHeader("cf-connecting-ip") ??
      (getRequestHeader("x-forwarded-for") ?? "").split(",")[0]?.trim() ??
      null) ||
    null
  );
}

/** Any signed-in admin may read settings; only the super admin may change them. */
export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { group: string }) =>
    z.object({ group: z.enum(SETTING_GROUP_KEYS as [string, ...string[]]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as Ctx).userId;
    const client = await admin();
    const { data: row } = await client
      .from("app_settings")
      .select("key, value, updated_at, updated_by")
      .eq("key", data.group)
      .maybeSingle();
    return {
      group: data.group,
      values: (row?.value ?? {}) as SettingValues,
      updatedAt: row?.updated_at ?? null,
      canEdit: await isSuper(userId),
    };
  });

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { group: string; values: SettingValues }) =>
    z
      .object({
        group: z.enum(SETTING_GROUP_KEYS as [string, ...string[]]),
        values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const userId = (context as Ctx).userId;
    if (!(await isSuper(userId))) deny("Only the super admin can change application settings.");

    const group = findSettingGroup(data.group);
    if (!group) deny("Unknown settings group.");

    // Only fields declared in the registry are ever written.
    const clean: SettingValues = {};
    for (const field of group.fields) {
      if (!(field.key in data.values)) continue;
      const raw = data.values[field.key];
      if (field.type === "boolean") clean[field.key] = Boolean(raw);
      else if (field.type === "number") clean[field.key] = Number(raw) || 0;
      else clean[field.key] = String(raw ?? "");
    }

    const client = await admin();
    const { data: existing } = await client
      .from("app_settings")
      .select("value")
      .eq("key", data.group)
      .maybeSingle();

    const merged: SettingValues = { ...((existing?.value ?? {}) as SettingValues), ...clean };
    const { error } = await client
      .from("app_settings")
      .upsert({ key: data.group, value: merged, updated_by: userId }, { onConflict: "key" });
    if (error) throw new Error(error.message);

    const { data: profile } = await client
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    await client.from("admin_activity_log").insert({
      actor_id: userId,
      actor_email: profile?.email ?? null,
      action: "settings.update",
      module: `settings:${data.group}`,
      description: `Updated ${group.label} (${Object.keys(clean).join(", ")})`,
      ip_address: clientIp(),
    });

    return { values: merged };
  });
