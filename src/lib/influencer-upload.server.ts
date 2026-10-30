import "server-only";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { maxImageBytes, maxUploadBytes, mediaBucket } from "./influencers";
import { influencerFailure } from "./influencer-errors.server";

export class InfluencerRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assertInfluencerOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("x-aa-rpc") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && origin !== new URL(request.url).origin)
  )
    throw new InfluencerRequestError("Cross-site request rejected", 403);
}
export async function boundedFormData(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    throw new InfluencerRequestError("Expected a multipart form", 415);
  if (Number(request.headers.get("content-length")) > maxUploadBytes)
    throw new InfluencerRequestError("Uploads must total less than 18 MB", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InfluencerRequestError("Missing form body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > maxUploadBytes) {
        await reader.cancel();
        throw new InfluencerRequestError("Uploads must total less than 18 MB", 413);
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new InfluencerRequestError("Invalid multipart form");
  }
}
export async function storeInfluencerImage(file: File, applicationId: string): Promise<string> {
  if (
    !file.size ||
    file.size > maxImageBytes ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new InfluencerRequestError("Images must be JPG, PNG or WebP, up to 3 MB each");
  let output: Buffer;
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 25_000_000,
      animated: false,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1)
      throw new Error("Invalid image");
    // Decode, re-encode, bound dimensions and remove EXIF/GPS metadata.
    output = await image
      .rotate()
      .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    throw new InfluencerRequestError(
      "This image could not be decoded. Use a valid JPG, PNG or WebP.",
    );
  }
  const path = `${applicationId}/${randomUUID()}.webp`;
  if (output.byteLength > maxImageBytes)
    throw new InfluencerRequestError("The optimized image is too large. Choose a smaller image.");
  const { error } = await supabaseAdmin.storage
    .from(mediaBucket)
    .upload(path, output, { contentType: "image/webp", upsert: false });
  if (error) throw new Error("Could not save images. Please try again.");
  return path;
}
export function requestError(error: unknown) {
  if (error instanceof InfluencerRequestError)
    return Response.json({ error: error.message }, { status: error.status });
  const failure = influencerFailure(error);
  console.error(`[Influencers] ${failure.code}. ${failure.action}`);
  return Response.json(
    {
      error:
        process.env.NODE_ENV === "development"
          ? failure.development
          : "We could not save your changes. Please try again or contact our team.",
      code: failure.code,
    },
    { status: 503, headers: { "cache-control": "no-store" } },
  );
}
