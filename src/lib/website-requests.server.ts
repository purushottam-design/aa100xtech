import "server-only";
import { createHash } from "node:crypto";
import { websiteAdmin as db, type NotificationStatus } from "./website-database.server";
import { websiteRequestSchema } from "./website-requests";
import { site } from "@/data/site";
import { publicSiteSettings } from "./public-site.server";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export function validWebsiteOrigin(request: Request) {
  let expected = new URL(request.url).origin;
  const tunnel =
    process.env.NODE_ENV === "development" ? process.env["DEV_TUNNEL_ORIGIN"]?.trim() : undefined;
  if (tunnel) {
    const configured = new URL(tunnel);
    if (
      configured.protocol === "https:" &&
      configured.origin === tunnel &&
      request.headers.get("x-forwarded-host")?.toLowerCase() === configured.host &&
      request.headers.get("x-forwarded-proto") === "https"
    )
      expected = tunnel;
  }
  return (
    request.headers.get("x-aa-rpc") === "1" &&
    request.headers.get("origin") === expected &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}

export async function saveWebsiteRequest(request: Request) {
  if (!validWebsiteOrigin(request))
    return json({ saved: false, message: "Cross-site request rejected." }, 403);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    return json({ saved: false, message: "A form request is required." }, 415);
  // Limit the streamed body too; Content-Length alone is client-controlled.
  const reader = request.body?.getReader();
  if (!reader) return json({ saved: false, message: "A form is required." }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.byteLength;
    if (size > 6 * 1024 * 1024) {
      await reader.cancel();
      return json({ saved: false, message: "Maximum attachment size is 5 MB." }, 413);
    }
    chunks.push(item.value);
  }
  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    return json({ saved: false, message: "Please check the form." }, 400);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data")));
  } catch {
    return json({ saved: false, message: "Please check the form." }, 400);
  }
  const parsed = websiteRequestSchema.safeParse(raw);
  if (!parsed.success)
    return json(
      {
        saved: false,
        message: parsed.error.issues[0]?.message ?? "Please check the form.",
      },
      400,
    );
  const { website: _trap, startedAt, ...data } = parsed.data;
  if (Date.now() - startedAt < 2000 || startedAt > Date.now())
    return json(
      {
        saved: false,
        message: "Please take a moment to review your form and try again.",
      },
      429,
    );
  const file = form.get("attachment");
  let filePath: string | null = null;
  let fileDigest: string | null = null;
  let uploaded = false;
  if (file instanceof File && file.size) {
    if (
      data.kind !== "career" ||
      file.size > 5 * 1024 * 1024 ||
      !file.name.toLowerCase().endsWith(".pdf") ||
      file.type !== "application/pdf"
    )
      return json({ saved: false, message: "Upload a PDF no larger than 5 MB." }, 400);
    const bytes = Buffer.from(await file.arrayBuffer());
    if (
      bytes.subarray(0, 5).toString() !== "%PDF-" ||
      !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))
    )
      return json({ saved: false, message: "The attachment is not a valid PDF." }, 400);
    fileDigest = createHash("sha256").update(bytes).digest("hex");
    filePath = `website/${data.id}/${fileDigest}.pdf`;
    const { error } = await db.storage.from("website-resumes").upload(filePath, bytes, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error && String(error.statusCode) !== "409")
      return json(
        {
          saved: false,
          message: "Your attachment could not be saved. Please retry.",
        },
        503,
      );
    uploaded = !error;
  }
  const payload = { ...data, filePath };
  const recipient = data.kind === "career" ? site.hrEmail : (await publicSiteSettings()).email;
  const { data: created, error } = await db.rpc("submit_website_request", {
    request_id: data.id,
    request_kind: data.kind,
    request_payload: payload,
    request_hash: digest(JSON.stringify({ ...data, fileDigest })),
    sender_hash: digest(data.email.toLowerCase()),
    destination: recipient,
  });
  if (error || typeof created !== "boolean") {
    if (error && uploaded && filePath) await db.storage.from("website-resumes").remove([filePath]);
    return json(
      {
        saved: false,
        message:
          error?.code === "P0001"
            ? "Too many requests. Please try again later."
            : error?.code === "23505"
              ? "This request has changed. Reload the form to start a new request."
              : "Your request could not be saved. Please try again or email us directly.",
      },
      error?.code === "P0001" ? 429 : error?.code === "23505" ? 409 : 503,
    );
  }
  // Existing records remain authoritative. Missing mail configuration never
  // becomes a false delivery claim; the saved request stays available to admins.
  let notification: NotificationStatus | "previously_saved" = "not_configured";
  if (created && process.env["RESEND_API_KEY"] && process.env["NOTIFICATION_FROM_EMAIL"]) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
          "content-type": "application/json",
          "Idempotency-Key": data.id,
        },
        body: JSON.stringify({
          from: process.env["NOTIFICATION_FROM_EMAIL"],
          to: [recipient],
          reply_to: data.email,
          subject: `AA100XTech ${data.kind} request`,
          text: JSON.stringify(payload, null, 2),
        }),
        signal: AbortSignal.timeout(8000),
      });
      notification = response.ok ? "sent" : "failed";
    } catch {
      notification = "failed";
    }
  } else if (!created) notification = "previously_saved";
  if (created)
    await db
      .from("website_requests")
      .update({
        notification_status: notification === "previously_saved" ? "pending" : notification,
      })
      .eq("id", data.id);
  return json({ saved: true, notification });
}
