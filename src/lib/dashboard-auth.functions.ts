/**
 * Central dashboard authentication — used by BOTH the website and the phone
 * app. One endpoint, one account store, one role model.
 *
 * Each dashboard has its own credentials, configured server-side only:
 *   super     → SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD (or ADMIN_EMAIL / ADMIN_PASSWORD)
 *   company   → COMPANY_ADMIN_EMAIL / COMPANY_ADMIN_PASSWORD
 *   interview → INTERVIEW_ADMIN_EMAIL / INTERVIEW_ADMIN_PASSWORD
 *   marketing → MARKETING_ADMIN_EMAIL / MARKETING_ADMIN_PASSWORD
 *   business  → BUSINESS_ADMIN_EMAIL / BUSINESS_ADMIN_PASSWORD
 *
 * Credentials are read from process.env inside the handler and are never sent
 * to any client. Accounts created later by the super admin keep working: when
 * the submitted credentials are not the configured pair, the same endpoint
 * authenticates the real account and checks it holds the dashboard's role.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ADMIN_PANELS, PANEL_ROLE, type AdminPanel } from "@/lib/admin-panels";

const ENV_KEYS: Record<AdminPanel, { email: string[]; password: string[] }> = {
  super: { email: ["SUPER_ADMIN_EMAIL", "ADMIN_EMAIL"], password: ["SUPER_ADMIN_PASSWORD", "ADMIN_PASSWORD"] },
  company: { email: ["COMPANY_ADMIN_EMAIL"], password: ["COMPANY_ADMIN_PASSWORD"] },
  interview: { email: ["INTERVIEW_ADMIN_EMAIL"], password: ["INTERVIEW_ADMIN_PASSWORD"] },
  marketing: { email: ["MARKETING_ADMIN_EMAIL"], password: ["MARKETING_ADMIN_PASSWORD"] },
  business: { email: ["BUSINESS_ADMIN_EMAIL"], password: ["BUSINESS_ADMIN_PASSWORD"] },
};

const PANEL_NAME: Record<AdminPanel, string> = {
  super: "Supreme Admin",
  company: "Company Admin",
  interview: "Interview Admin",
  marketing: "Marketing Admin",
  business: "Business Admin",
};

function readEnv(names: string[]): string | undefined {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v;
  }
  return undefined;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Creates (or repairs) the auth account behind a configured dashboard login. */
async function provisionPanelAccount(panel: AdminPanel, email: string, password: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const role = PANEL_ROLE[panel];

  let userId: string | null = null;
  let page = 1;
  while (!userId) {
    const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    userId = list?.users.find((u: any) => (u.email ?? "").trim().toLowerCase() === email)?.id ?? null;
    if (!list?.nextPage) break;
    page = list.nextPage;
  }

  if (userId) {
    await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: PANEL_NAME[panel] },
    });
    if (error || !created?.user) throw new Error("Could not prepare the dashboard account.");
    userId = created.user.id as string;
  }

  const { data: profile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (!profile) {
    const base = email.split("@")[0]?.replace(/[^a-z0-9._-]/g, "") || "admin";
    await admin.from("profiles").insert({
      id: userId,
      username: `${base}-${userId.slice(0, 8)}`,
      full_name: PANEL_NAME[panel],
      email,
      phone: "",
      must_change_password: false,
    });
  }

  const { data: existingRole } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", role)
    .maybeSingle();
  if (!existingRole) await admin.from("user_roles").insert({ user_id: userId, role });

  return userId;
}

/** Publishable-key client used only to mint a normal user session. */
async function publicClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function rolesFor(userId: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

export const dashboardLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().trim().toLowerCase().max(255),
        password: z.string().max(128),
        dashboard: z.enum(ADMIN_PANELS),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const fail = { ok: false as const, message: "Invalid email or password." };
    if (!data.email || !data.password) return fail;

    const panel = data.dashboard as AdminPanel;
    const envEmail = readEnv(ENV_KEYS[panel].email);
    const envPassword = readEnv(ENV_KEYS[panel].password);

    // 1) Configured dashboard credentials (server-side only).
    const isConfigured =
      !!envEmail &&
      !!envPassword &&
      safeEqual(data.email, envEmail.trim().toLowerCase()) &&
      safeEqual(data.password, envPassword);

    if (isConfigured) {
      await provisionPanelAccount(panel, data.email, data.password);
    } else if (envEmail && safeEqual(data.email, envEmail.trim().toLowerCase())) {
      // Right dashboard email, wrong password — never say which.
      return fail;
    } else {
      // 2) Another dashboard's configured email must never open this one.
      for (const other of ADMIN_PANELS) {
        if (other === panel) continue;
        const otherEmail = readEnv(ENV_KEYS[other].email);
        if (otherEmail && safeEqual(data.email, otherEmail.trim().toLowerCase())) {
          return { ok: false as const, message: "These credentials do not open this dashboard." };
        }
      }
    }

    // 3) Mint a real session through the central auth service.
    const client = await publicClient();
    const { data: session, error } = await client.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error || !session.session || !session.user) return fail;

    // 4) Authorize the dashboard on the server — never trust the client.
    const roles = await rolesFor(session.user.id);
    const allowed = roles.includes("supreme_admin") || roles.includes(PANEL_ROLE[panel]);
    if (!allowed) {
      await client.auth.signOut();
      return { ok: false as const, message: "These credentials do not open this dashboard." };
    }

    return {
      ok: true as const,
      dashboard: panel,
      roles,
      session: {
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
      },
    };
  });
