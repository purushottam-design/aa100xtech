import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { influencerAdmin } from "./influencer-database.server";
import { type CampaignInquiry } from "./marketing-intake";
import { prepareMarketingForm } from "./marketing-form.server";
import { boundedFormData, InfluencerRequestError } from "./influencer-upload.server";
import { marketingRequestError } from "./marketing-errors.server";
import { validWebsiteOrigin } from "./website-requests.server";
import { publicSiteSettings } from "./public-site.server";
import { site } from "@/data/site";
type MarketingDatabase = {
  public: {
    Tables: {
      marketing_intake_receipts: {
        Row: {
          token: string;
          kind: string;
          payload_hash: string;
          reference: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      brand_campaign_inquiries: {
        Row: CampaignInquiry;
        Insert: Partial<CampaignInquiry>;
        Update: Partial<CampaignInquiry> & { reviewed_by?: string; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_marketing_intake: {
        Args: { p_kind: string; p_token: string; p_hash: string; p_payload: unknown };
        Returns: { reference: string; created: boolean };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
export const marketingAdmin = supabaseAdmin as unknown as SupabaseClient<MarketingDatabase>;
export const kitBucket = "influencer-media-kits";
const hash = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");

async function storeKit(file: File) {
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new InfluencerRequestError("Media kits must be at most 5 MB");
  const raw = Buffer.from(await file.arrayBuffer());
  let bytes: Buffer;
  let extension: string;
  let type: string;
  if (
    file.type === "application/pdf" &&
    raw.subarray(0, 5).toString() === "%PDF-" &&
    raw.subarray(-1024).includes(Buffer.from("%%EOF"))
  ) {
    bytes = raw;
    extension = "pdf";
    type = "application/pdf";
  } else if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    try {
      bytes = await sharp(raw, { limitInputPixels: 25_000_000, animated: false })
        .rotate()
        .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
        .webp()
        .toBuffer();
    } catch {
      throw new InfluencerRequestError("Choose a valid PDF, JPG, PNG or WebP media kit");
    }
    extension = "webp";
    type = "image/webp";
  } else throw new InfluencerRequestError("Choose a PDF, JPG, PNG or WebP media kit");
  const path = `${randomUUID()}/${randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage
    .from(kitBucket)
    .upload(path, bytes, { contentType: type, upsert: false });
  if (error) throw error;
  return path;
}
export async function submitMarketingIntake(request: Request, kind: "creator" | "brand") {
  let uploaded: string | null = null;
  let committed = false;
  let cleanupSafe = true;
  let operation = "validate_request";
  try {
    if (!validWebsiteOrigin(request))
      throw new InfluencerRequestError("Cross-site request rejected", 403);
    const fd = await boundedFormData(request);
    const data = await prepareMarketingForm(fd, kind);
    if (
      !Number.isFinite(data.startedAt) ||
      Date.now() - data.startedAt < 1500 ||
      data.startedAt > Date.now() ||
      Date.now() - data.startedAt > 24 * 60 * 60 * 1000
    )
      throw new InfluencerRequestError("Please refresh the page and complete the form");
    operation = "check_marketing_schema";
    const readiness = await marketingAdmin
      .from("marketing_intake_receipts")
      .select("token")
      .limit(0);
    if (readiness.error) throw readiness.error;
    operation = "take_influencer_submission_slot";
    if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim())
      throw new Error("Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY");
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rate_key = createHmac("sha256", process.env["SUPABASE_SERVICE_ROLE_KEY"]!)
      .update(`marketing:${address}`)
      .digest("hex");
    const rate = await influencerAdmin.rpc("take_influencer_submission_slot", { rate_key });
    if (rate.error) throw rate.error;
    if (!rate.data)
      throw new InfluencerRequestError("Too many submissions. Please try again in an hour.", 429);
    const files = [...fd.values()].filter((v): v is File => typeof v !== "string" && v.size > 0);
    if (files.length && kind === "creator" && !data.creator)
      throw new InfluencerRequestError("This application form does not accept attachments");
    if (files.length > 1 || (kind === "brand" && files.length))
      throw new InfluencerRequestError("Only one media kit is allowed");
    const file = fd.get("media_kit");
    if (files.length && file !== files[0])
      throw new InfluencerRequestError("Invalid attachment field");
    if (file && typeof file !== "string" && file.size > 5 * 1024 * 1024)
      throw new InfluencerRequestError("Media kits must be at most 5 MB");
    const fileHash =
      file && typeof file !== "string" && file.size
        ? hash(Buffer.from(await file.arrayBuffer()))
        : "";
    const { token, details } = data;
    const fingerprint = hash(JSON.stringify(details) + fileHash);
    let payload: Record<string, unknown> = { ...details };
    if (data.creator) {
      operation = "store_media_kit";
      const c = data.creator;
      if (file && typeof file !== "string" && file.size) uploaded = await storeKit(file);
      const profile = (platform: string) => c.profiles.find((p) => p.platform === platform);
      payload = {
        ...details,
        display_name: c.full_name,
        processing_consent: true,
        consent_version: "2026-11-05",
        media_kit: uploaded,
        profile_image: null,
        cover_image: null,
        gallery: [],
        video_urls: [],
        portfolio_url: "",
        platforms: c.profiles.map((p) => p.platform).join(", "),
        handle: c.profiles[0]!.url,
        socials: {
          instagram: profile("Instagram")?.url ?? "",
          instagram_followers: profile("Instagram")?.followers ?? null,
          youtube: profile("YouTube")?.url ?? "",
          youtube_followers: profile("YouTube")?.followers ?? null,
          facebook: profile("Facebook")?.url ?? "",
          facebook_followers: profile("Facebook")?.followers ?? null,
          other: c.profiles
            .filter((p) => !["Instagram", "YouTube", "Facebook"].includes(p.platform))
            .map((p) => p.url),
        },
      };
    }
    // A transport timeout may happen after COMMIT. Keep the private kit in
    // that case so a saved application never loses its attachment.
    cleanupSafe = false;
    operation = "save_marketing_intake";
    const saved = await marketingAdmin.rpc("save_marketing_intake", {
      p_kind: kind,
      p_token: token,
      p_hash: fingerprint,
      p_payload: payload,
    });
    if (saved.error) {
      cleanupSafe = /^(22|23|42|PGRST20)/.test(saved.error.code ?? "");
      if (saved.error.code === "23505")
        throw new InfluencerRequestError(
          "This submission was already received with different details. Refresh to start a new application.",
          409,
        );
      throw saved.error;
    }
    if (!saved.data?.reference) throw new Error("Missing receipt");
    committed = saved.data.created;
    if (uploaded && !committed) {
      await supabaseAdmin.storage.from(kitBucket).remove([uploaded]);
      uploaded = null;
    }
    if (kind === "brand" && saved.data.created)
      await notifyBrand(saved.data.reference, data.email, payload);
    return Response.json(
      { ok: true, reference: saved.data.reference },
      { status: saved.data.created ? 201 : 200, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (uploaded && !committed && cleanupSafe)
      await supabaseAdmin.storage
        .from(kitBucket)
        .remove([uploaded])
        .catch(() => undefined);
    return marketingRequestError(error, operation);
  }
}
async function notifyBrand(id: string, email: string, payload: Record<string, unknown>) {
  let notification_status = "not_configured";
  if (process.env["RESEND_API_KEY"] && process.env["NOTIFICATION_FROM_EMAIL"]) {
    try {
      const settings = await publicSiteSettings();
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
          "content-type": "application/json",
          "Idempotency-Key": id,
        },
        body: JSON.stringify({
          from: process.env["NOTIFICATION_FROM_EMAIL"],
          to: [settings.email || site.email],
          reply_to: email,
          subject: `AA100XTECH campaign inquiry ${id}`,
          text: JSON.stringify(payload, null, 2),
        }),
        signal: AbortSignal.timeout(8000),
      });
      notification_status = response.ok ? "sent" : "failed";
    } catch {
      notification_status = "failed";
    }
  }
  await marketingAdmin
    .from("brand_campaign_inquiries")
    .update({ notification_status })
    .eq("id", id)
    .then(
      () => undefined,
      () => undefined,
    );
}
