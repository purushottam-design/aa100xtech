import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { consultationBookingSchema } from "./consultations.schemas";
import { consultationScheduleError } from "./consultation-schedule";
import { consultationServices, getConsultationPlan, meetingPlatforms } from "@/data/consultations";
import { assertIciciOrigin } from "./icici-origin.server";
import { requireIciciSuperAdmin } from "./icici-uat-access.server";
import { assertPaymentOrigin, iciciUatConfig, IciciPaymentError } from "./icici.server";
import { authorizeSuper } from "./rbac.server";

const cookieName = "__Host-aa-icici-uat";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const secret = () => randomBytes(32).toString("hex");
const localOrigins = ["http://127.0.0.1:3000", "http://localhost:3000"];
const hex = z.string().regex(/^[a-f0-9]{64}$/);
type Booking = z.infer<typeof consultationBookingSchema>;
type Handoff = {
  id: string;
  user_id: string;
  source_origin: string;
  destination_origin: string;
  ticket_hash: string;
  booking_data: Booking;
  state: "issued" | "presented" | "active";
  browser_hash: string | null;
  csrf_hash: string | null;
  checkout_id: string;
  expires_at: string;
  lease_expires_at: string | null;
  created_at: string;
};
type HandoffDatabase = {
  public: {
    Tables: {
      icici_uat_handoffs: {
        Row: Handoff;
        Insert: Partial<Handoff>;
        Update: Partial<Handoff>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
const db = supabaseAdmin as unknown as SupabaseClient<HandoffDatabase>;
function deny(): never {
  throw new IciciPaymentError(
    "ICICI_HANDOFF_INVALID",
    "This UAT authorization expired or was already used. Start again from localhost.",
    403,
  );
}
function storageError(): never {
  throw new IciciPaymentError(
    "ICICI_HANDOFF_STORAGE_UNAVAILABLE",
    "UAT transfer storage is unavailable. Apply the ICICI UAT handoff migration.",
    503,
  );
}

async function boundedBody(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) deny();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > limit) {
      await reader.cancel();
      deny();
    }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Forwarded HTTPS requests are never classified as direct HTTP development. */
export function directIciciLocalOrigin(request: Request): string | null {
  if (process.env.NODE_ENV !== "development") return null;
  const transport = new URL(request.url);
  const host = request.headers.get("host") ?? transport.host;
  const origin = `http://${host}`;
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (
    !localOrigins.includes(transport.origin) ||
    !localOrigins.includes(origin) ||
    request.headers.get("x-forwarded-proto") === "https" ||
    (forwardedHost && forwardedHost !== host)
  )
    return null;
  return origin;
}

export function iciciTransitionOrigin(): string {
  const config = iciciUatConfig();
  const tunnel = process.env["DEV_TUNNEL_ORIGIN"]?.trim();
  if (
    process.env.NODE_ENV !== "development" ||
    process.env["ICICI_UAT_TEST_MODE"] !== "true" ||
    process.env["ICICI_TRUST_PROXY"] !== "true" ||
    tunnel !== config.origin ||
    !/^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/.test(tunnel)
  )
    throw new IciciPaymentError(
      "ICICI_HANDOFF_DISABLED",
      "The controlled HTTPS UAT transition is not configured.",
      403,
    );
  return config.origin;
}

/** Probe only column availability, never authorization rows or booking data.
 * Local simulation remains usable even when UAT setup or storage is unavailable. */
export async function iciciLocalTestingAvailability(request: Request) {
  if (!directIciciLocalOrigin(request)) return null;
  try {
    iciciTransitionOrigin();
  } catch {
    return {
      mock: true,
      transition: false,
      transitionReason: "The HTTPS UAT transition is not configured.",
    };
  }
  try {
    const { error } = await db
      .from("icici_uat_handoffs")
      .select(
        "id,user_id,source_origin,destination_origin,ticket_hash,booking_data,state,browser_hash,csrf_hash,checkout_id,expires_at,lease_expires_at,created_at",
      )
      .limit(0)
      .abortSignal(AbortSignal.timeout(5000));
    if (!error) return { mock: true, transition: true };
  } catch {
    // A missing credential, database exception or timeout never enables transfer.
  }
  return {
    mock: true,
    transition: false,
    transitionReason:
      "Secure ICICI UAT transfer is temporarily unavailable. Local simulation is still available.",
  };
}

async function revalidateAdministrator(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = data.user;
  if (
    error ||
    !user ||
    !user.email_confirmed_at ||
    (user.banned_until && Date.parse(user.banned_until) > Date.now())
  )
    deny();
  await authorizeSuper(userId);
}

export async function issueUatHandoff(request: Request) {
  const source = directIciciLocalOrigin(request);
  if (!source || request.headers.get("origin") !== source || assertPaymentOrigin(request, source))
    deny();
  const destination = iciciTransitionOrigin();
  const userId = await requireIciciSuperAdmin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json")) deny();
  const body = await boundedBody(request, 20000);
  const booking = consultationBookingSchema.parse(JSON.parse(body));
  const plan = getConsultationPlan(booking.planId);
  if (
    !plan ||
    consultationScheduleError(booking) ||
    !consultationServices.includes(booking.service) ||
    !meetingPlatforms.includes(booking.meetingPlatform) ||
    booking.email.length > 48
  ) {
    throw new IciciPaymentError(
      "INVALID_BOOKING",
      "Please check the booking details and consultation hours.",
      400,
    );
  }
  const ticket = secret();
  const { error } = await db.from("icici_uat_handoffs").insert({
    id: randomUUID(),
    user_id: userId,
    source_origin: source,
    destination_origin: destination,
    ticket_hash: hash(ticket),
    booking_data: booking,
    checkout_id: randomUUID(),
    expires_at: new Date(Date.now() + 90000).toISOString(),
  });
  if (error) storageError();
  return { ok: true, ticket, destination: `${destination}/api/payments/icici/handoff` };
}

function browserSecret(request: Request) {
  const entries = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.startsWith(`${cookieName}=`));
  if (entries.length !== 1) deny();
  const parsed = hex.safeParse(entries[0]!.slice(cookieName.length + 1));
  if (!parsed.success) deny();
  return parsed.data;
}
const cookie = (value: string) =>
  `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`;

export async function authorizeUatHandoff(request: Request, checkoutId?: string): Promise<Handoff> {
  const destination = iciciTransitionOrigin();
  assertIciciOrigin(request, destination);
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (request.method !== "GET" &&
      (request.headers.get("origin") !== destination || request.headers.get("x-aa-rpc") !== "1"))
  )
    deny();
  const value = browserSecret(request);
  const { data, error } = await db
    .from("icici_uat_handoffs")
    .select("*")
    .eq("browser_hash", hash(value))
    .eq("state", "active")
    .eq("destination_origin", destination)
    .gt("lease_expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) storageError();
  if (!data || (checkoutId && data.checkout_id !== checkoutId)) deny();
  await revalidateAdministrator(data.user_id);
  return data;
}

const htmlHeaders = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};

/** A cross-origin ticket presentation never initializes a payment. Confirmation
 * is a new same-origin POST bound to the destination's independent host cookie. */
export async function receiveUatHandoff(request: Request) {
  const destination = iciciTransitionOrigin();
  assertIciciOrigin(request, destination);
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) deny();
  const body = await boundedBody(request, 2048);
  const form = new URLSearchParams(body);
  if ([...form.keys()].some((k) => form.getAll(k).length !== 1)) deny();
  if (form.has("ticket")) {
    const ticket = hex.parse(form.get("ticket"));
    const { data, error } = await db
      .from("icici_uat_handoffs")
      .select("*")
      .eq("ticket_hash", hash(ticket))
      .eq("state", "issued")
      .eq("destination_origin", destination)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) storageError();
    if (!data || request.headers.get("origin") !== data.source_origin) deny();
    await revalidateAdministrator(data.user_id);
    const browser = secret(),
      csrf = secret();
    const claimed = await db
      .from("icici_uat_handoffs")
      .update({ state: "presented", browser_hash: hash(browser), csrf_hash: hash(csrf) })
      .eq("id", data.id)
      .eq("state", "issued")
      .gt("expires_at", new Date().toISOString())
      .select("id")
      .maybeSingle();
    if (claimed.error) storageError();
    if (!claimed.data) deny();
    return new Response(
      `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm ICICI UAT</title><style>body{font:16px system-ui;background:#fffbf5;color:#21160d;margin:0;padding:24px}main{max-width:560px;margin:10vh auto;padding:32px;border:1px solid #ffd89c;border-radius:20px;background:white}button{background:#f97316;color:white;border:0;border-radius:12px;padding:14px 20px;font:inherit;cursor:pointer}p{line-height:1.6}</style><main><h1>Continue to ICICI UAT</h1><p>Your Super Admin authorized this consultation on localhost. This HTTPS site has its own temporary authorization for this checkout only.</p><p>This is bank UAT testing. Payment is confirmed only after an independently verified bank status response.</p><form method="post" action="/api/payments/icici/handoff"><input type="hidden" name="id" value="${data.id}"><input type="hidden" name="csrf" value="${csrf}"><button type="submit">Continue to secure consultation checkout</button></form></main></html>`,
      {
        headers: { ...htmlHeaders, "set-cookie": cookie(browser) },
      },
    );
  }
  if (
    request.headers.get("origin") !== destination ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    deny();
  const id = z.string().uuid().parse(form.get("id"));
  const csrf = hex.parse(form.get("csrf"));
  const browser = browserSecret(request);
  const query = await db
    .from("icici_uat_handoffs")
    .select("*")
    .eq("id", id)
    .eq("state", "presented")
    .eq("browser_hash", hash(browser))
    .eq("csrf_hash", hash(csrf))
    .eq("destination_origin", destination)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (query.error) storageError();
  if (!query.data) deny();
  await revalidateAdministrator(query.data.user_id);
  const activated = await db
    .from("icici_uat_handoffs")
    .update({ state: "active", lease_expires_at: new Date(Date.now() + 600000).toISOString() })
    .eq("id", id)
    .eq("state", "presented")
    .eq("browser_hash", hash(browser))
    .eq("csrf_hash", hash(csrf))
    .gt("expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();
  if (activated.error) storageError();
  if (!activated.data) deny();
  return new Response(null, {
    status: 303,
    headers: {
      location: `${destination}/consultation?icici_handoff=${id}`,
      "set-cookie": cookie(browser),
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}

export async function resumeUatHandoff(request: Request) {
  const row = await authorizeUatHandoff(request);
  if (!request.headers.get("content-type")?.startsWith("application/json")) deny();
  const text = await boundedBody(request, 256);
  const { id } = z.object({ id: z.string().uuid() }).parse(JSON.parse(text));
  if (id !== row.id) deny();
  const capability = {
    id: row.checkout_id,
    token: hash(`aa-icici-checkout:${browserSecret(request)}:${row.checkout_id}`),
  };
  const { prepareCheckout } = await import("./icici-checkout.server");
  const prepared = await prepareCheckout({ ...capability, booking: row.booking_data });
  return {
    ok: true,
    capability,
    booking: row.booking_data,
    amount: prepared.amount_paise,
    currency: prepared.currency,
    reference: prepared.merchant_reference,
  };
}
