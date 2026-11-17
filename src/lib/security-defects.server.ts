import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runWithRequestContext } from "@/lib/backend/request-context.server";
import { authorize, AccessError } from "@/lib/rbac.server";
import { validWebsiteOrigin } from "@/lib/website-requests.server";
import {
  defectAttachmentError,
  defectAttachmentLimit,
  defectStatuses,
  defectSubmissionSchema,
  defectTicketCode,
  defectUpdateSchema,
} from "@/lib/security-defects";

const bucket = "security-defect-attachments";
const columns =
  "id,ticket_number,full_name,email,phone,company,category,title,description,priority,status,created_at,updated_at,attachment_name";
// This feature's additive migration is kept separate from the generated legacy schema.
const admin = supabaseAdmin as any;
type Session = Awaited<ReturnType<typeof requireSupabaseAuth>>;
class DefectError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store", vary: "Authorization" },
  });
const digest = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

export async function securityDefectRequest(
  request: Request,
  handler: (session: Session) => Promise<Response>,
) {
  return runWithRequestContext(request, async (state) => {
    try {
      if (request.method !== "GET" && !validWebsiteOrigin(request))
        throw new DefectError("Cross-site request rejected.", 403);
      const session = await requireSupabaseAuth();
      return await handler(session);
    } catch (error) {
      if (error instanceof DefectError || error instanceof AccessError)
        return json({ message: error.message }, error.status);
      if (state.status === 401)
        return json({ message: "Please sign in to access your security reports." }, 401);
      return json(
        { message: "Security reports are temporarily unavailable. Please try again." },
        503,
      );
    }
  });
}

async function reviewAccess(userId: string) {
  try {
    const access = await authorize(userId, "support.view");
    return {
      canReview: true,
      canManage: access.isSuper || access.permissions.includes("support.reply"),
    };
  } catch (error) {
    if (error instanceof AccessError && error.status === 403)
      return { canReview: false, canManage: false };
    throw error;
  }
}

export async function listSecurityDefects(request: Request, session: Session) {
  const params = new URL(request.url).searchParams;
  const parsed = z
    .object({
      scope: z.enum(["mine", "team"]).default("mine"),
      status: z.enum(["all", ...defectStatuses]).default("all"),
      q: z.string().trim().max(100).default(""),
      page: z.coerce.number().int().min(1).max(10000).default(1),
    })
    .safeParse(Object.fromEntries(params));
  if (!parsed.success) throw new DefectError("Choose a valid ticket filter.");
  const access = await reviewAccess(session.userId);
  const { scope, status, q, page } = parsed.data;
  if (scope === "team" && !access.canReview) throw new DefectError("Access denied.", 403);
  let query = (scope === "team" ? admin : (session.supabase as any))
    .from("security_defects")
    .select(columns, { count: "exact" });
  if (scope === "mine") query = query.eq("user_id", session.userId);
  if (status !== "all") query = query.eq("status", status);
  if (q) {
    const code = /^SID-(\d{1,12})$/i.exec(q);
    query = code
      ? query.eq("ticket_number", Number(code[1]))
      : query.ilike("title", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  }
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * 25, page * 25 - 1);
  if (error) throw new Error("Ticket query failed");
  return json({ rows: data ?? [], total: count ?? 0, ...access });
}

async function readBody(request: Request, limit: number, message: string) {
  if (Number(request.headers.get("content-length")) > limit) throw new DefectError(message, 413);
  const reader = request.body?.getReader();
  if (!reader) throw new DefectError("Complete the report form.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new DefectError(message, 413);
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

async function readForm(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data"))
    throw new DefectError("Submit the report as a form.", 415);
  const body = await readBody(
    request,
    defectAttachmentLimit + 64 * 1024,
    "Maximum attachment size is 5 MB.",
  );
  try {
    return await new Response(body, {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new DefectError("The report form could not be read.");
  }
}

async function attachmentData(file: File) {
  const invalid = defectAttachmentError(file);
  if (invalid) throw new DefectError(invalid);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf") {
    if (
      bytes.subarray(0, 5).toString() !== "%PDF-" ||
      !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))
    )
      throw new DefectError("This file is not a valid PDF.");
    return { bytes, type: "application/pdf", extension: "pdf" };
  }
  try {
    const image = sharp(bytes, {
      limitInputPixels: 25_000_000,
      animated: false,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    const expected: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpeg",
      "image/webp": "webp",
    };
    if (metadata.format !== expected[file.type] || (metadata.pages ?? 1) > 1) throw new Error();
    const output = await image
      .rotate()
      .resize(2200, 2200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();
    if (output.byteLength > defectAttachmentLimit) throw new Error();
    return { bytes: output, type: "image/webp", extension: "webp" };
  } catch {
    throw new DefectError("This image could not be read. Choose a valid PNG, JPG or WebP.");
  }
}

export async function createSecurityDefect(request: Request, session: Session) {
  const form = await readForm(request);
  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data")));
  } catch {
    throw new DefectError("Complete the report form.");
  }
  const parsed = defectSubmissionSchema.safeParse(raw);
  if (!parsed.success) throw new DefectError(parsed.error.issues[0]?.message ?? "Check the form.");
  const { id, ...fields } = parsed.data;
  const file = form.get("attachment");
  if (file !== null && (typeof file === "string" || !file.size))
    throw new DefectError("Choose a valid attachment or leave it empty.");
  const attachment = file && typeof file !== "string" ? await attachmentData(file) : null;
  const fileHash = attachment ? digest(attachment.bytes) : null;
  const hash = digest(JSON.stringify({ ...fields, fileHash }));
  // Check retries before touching storage. Ownership is checked even with the service client.
  const previous = await admin
    .from("security_defects")
    .select("id,user_id,payload_hash,ticket_number,status,created_at")
    .eq("id", id)
    .maybeSingle();
  if (previous.error) throw new Error("Ticket lookup failed");
  if (previous.data) {
    if (previous.data.user_id !== session.userId || previous.data.payload_hash !== hash)
      throw new DefectError("This report changed. Start a new report before submitting.", 409);
    const { user_id: _owner, payload_hash: _hash, ...ticket } = previous.data;
    return json({ saved: true, ticket });
  }
  const filePath = attachment
    ? `security/${session.userId}/${id}/${fileHash}.${attachment.extension}`
    : null;
  if (attachment && filePath) {
    const { error } = await admin.storage.from(bucket).upload(filePath, attachment.bytes, {
      contentType: attachment.type,
      upsert: false,
    });
    if (error && String(error.statusCode) !== "409") throw new Error("Attachment upload failed");
  }
  const { data, error } = await admin.rpc("submit_security_defect", {
    p_id: id,
    p_user_id: session.userId,
    p_hash: hash,
    p_payload: {
      ...fields,
      attachment_path: filePath,
      attachment_name: attachment && file ? `attachment.${attachment.extension}` : null,
      attachment_type: attachment?.type ?? null,
    },
  });
  if (error || !data) {
    // Network failures may have committed. Never delete evidence after an uncertain save.
    // Explicit database rejection guarantees this invocation did not create a ticket.
    if (filePath && error && ["P0001", "23514", "23503"].includes(error.code)) {
      const existing = await admin.from("security_defects").select("id").eq("id", id).maybeSingle();
      if (!existing.error && !existing.data) await admin.storage.from(bucket).remove([filePath]);
    }
    if (error?.code === "P0001")
      throw new DefectError("Too many reports. Please try again in an hour.", 429);
    if (error?.code === "23505")
      throw new DefectError("This report changed. Start a new report before submitting.", 409);
    throw new Error("Ticket save failed");
  }
  return json({ saved: true, ticket: data }, data.created ? 201 : 200);
}

export async function updateSecurityDefect(request: Request, session: Session) {
  await authorize(session.userId, "support.view");
  await authorize(session.userId, "support.reply");
  let raw: unknown;
  const text = (await readBody(request, 1024, "Invalid status update.")).toString("utf8");
  try {
    raw = JSON.parse(text);
  } catch {
    throw new DefectError("Invalid status update.");
  }
  const parsed = defectUpdateSchema.safeParse(raw);
  if (!parsed.success) throw new DefectError("Choose a valid ticket and status.");
  const { id, status, previousStatus } = parsed.data;
  const result = await admin
    .from("security_defects")
    .update({ status, updated_by: session.userId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", previousStatus)
    .select(columns)
    .maybeSingle();
  if (result.error) throw new Error("Status update failed");
  if (!result.data)
    throw new DefectError(
      "This ticket changed or is unavailable. Refresh the list and try again.",
      409,
    );
  return json({ saved: true, ticket: result.data });
}

export async function downloadSecurityAttachment(id: string, session: Session) {
  if (!z.string().uuid().safeParse(id).success)
    throw new DefectError("Attachment unavailable.", 404);
  // First try the customer's RLS-protected row; only an authorized reviewer can widen access.
  let result = await (session.supabase as any)
    .from("security_defects")
    .select("id,user_id,ticket_number,attachment_path,attachment_type")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (result.error) throw new Error("Attachment lookup failed");
  if (!result.data) {
    const access = await reviewAccess(session.userId);
    if (!access.canReview) throw new DefectError("Attachment unavailable.", 404);
    result = await admin
      .from("security_defects")
      .select("id,user_id,ticket_number,attachment_path,attachment_type")
      .eq("id", id)
      .maybeSingle();
  }
  const row = result.data;
  if (result.error) throw new Error("Attachment lookup failed");
  const prefix = row ? `security/${row.user_id}/${row.id}/` : "";
  if (
    !row?.attachment_path?.startsWith(prefix) ||
    !/^[a-f0-9]{64}\.(pdf|webp)$/.test(row.attachment_path.slice(prefix.length))
  )
    throw new DefectError("Attachment unavailable.", 404);
  const { data, error } = await admin.storage.from(bucket).download(row.attachment_path);
  if (error || !data) throw new Error("Attachment download failed");
  const pdf = row.attachment_path.endsWith(".pdf");
  return new Response(data, {
    headers: {
      "content-type": pdf ? "application/pdf" : "image/webp",
      "content-disposition": `attachment; filename="${defectTicketCode(row.ticket_number)}.${pdf ? "pdf" : "webp"}"`,
      "cache-control": "no-store",
      vary: "Authorization",
      "x-content-type-options": "nosniff",
      "content-security-policy": "sandbox",
    },
  });
}
