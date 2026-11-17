import { createHmac, randomUUID } from "node:crypto";
import { websiteSessionError } from "@/lib/website-session.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { influencerAdmin } from "@/lib/influencer-database.server";
import { influencerApplicationSchema, mediaBucket } from "@/lib/influencers";
import {
  assertInfluencerOrigin,
  boundedFormData,
  InfluencerRequestError,
  requestError,
  storeInfluencerImage,
} from "@/lib/influencer-upload.server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const denied = await websiteSessionError(request);
  if (denied) return denied;
  const uploaded: string[] = [];
  try {
    assertInfluencerOrigin(request);
    const fd = await boundedFormData(request);
    let input: unknown;
    try {
      input = JSON.parse(String(fd.get("application")));
    } catch {
      throw new InfluencerRequestError("Invalid application data");
    }
    const parsed = influencerApplicationSchema.safeParse(input);
    if (!parsed.success)
      throw new InfluencerRequestError(
        parsed.error.issues[0]?.message ?? "Please check your application",
      );
    const data = parsed.data;
    const files = [...fd.values()].filter((v): v is File => typeof v !== "string" && v.size > 0);
    if (
      files.length > 8 ||
      fd.getAll("gallery").filter((v) => typeof v !== "string" && v.size > 0).length > 6
    )
      throw new InfluencerRequestError(
        "Use one profile image, one cover and up to six portfolio images",
      );
    const client = influencerAdmin;
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = createHmac("sha256", process.env["SUPABASE_SERVICE_ROLE_KEY"]!)
      .update(address)
      .digest("hex");
    const { data: allowed, error: rateError } = await client.rpc(
      "take_influencer_submission_slot",
      { rate_key: key },
    );
    if (rateError) throw rateError;
    if (!allowed)
      throw new InfluencerRequestError("Too many applications. Please try again in an hour.", 429);
    const id = data.submission_id ?? randomUUID();
    const upload = async (value: FormDataEntryValue | null) => {
      if (typeof value === "string" || !value?.size) return null;
      const path = await storeInfluencerImage(value, id);
      uploaded.push(path);
      return path;
    };
    const profile_image = await upload(fd.get("profile_image"));
    const cover_image = await upload(fd.get("cover_image"));
    const gallery: string[] = [];
    for (const file of fd.getAll("gallery")) {
      const path = await upload(file);
      if (path) gallery.push(path);
    }
    const { error } = await client.from("partner_applications").insert({
      id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      country: data.country,
      platforms: [
        data.socials.instagram && "Instagram",
        data.socials.youtube && "YouTube",
        data.socials.facebook && "Facebook",
        data.socials.other.length && "Other",
      ]
        .filter(Boolean)
        .join(", "),
      handle:
        data.socials.instagram ||
        data.socials.youtube ||
        data.socials.facebook ||
        data.socials.other[0] ||
        null,
      niche: data.category,
      motivation: data.deliverables,
      target_level: "Paid promotion collaboration",
      is_influencer: true,
      status: "pending",
      influencer_review_status: "pending",
      processing_consent: true,
      publication_consent: true,
      consent_recorded_at: new Date().toISOString(),
      influencer_data: {
        ...data,
        profile_image,
        cover_image,
        gallery,
        consent_version: "2026-10-26",
      },
    });
    if (error) {
      if (error.code === "23505" && data.submission_id)
        throw new InfluencerRequestError(
          "This application has already been received. Contact our team if you need to update it.",
          409,
        );
      throw error;
    }
    return Response.json(
      { ok: true, message: "Application saved for review. Your profile is not published." },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (uploaded.length)
      await supabaseAdmin.storage
        .from(mediaBucket)
        .remove(uploaded)
        .catch(() => undefined);
    return requestError(error);
  }
}
