import { saveWebsiteRequest, validWebsiteOrigin } from "@/lib/website-requests.server";
import { enquiryStatuses } from "@/lib/social-ad-proposal";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { websiteAdmin } from "@/lib/website-database.server";
import { authorize } from "@/lib/rbac.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    return await saveWebsiteRequest(request);
  } catch {
    return Response.json(
      {
        saved: false,
        message: "Your request could not be saved. Please try again.",
      },
      { status: 503 },
    );
  }
}
export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return Response.json({ message: "Sign in required." }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user)
      return Response.json({ message: "Sign in required." }, { status: 401 });
    const access = await authorize(data.user.id);
    const canReadLeads = access.isSuper || access.permissions.includes("leads.view");
    const canReadCandidates = access.isSuper || access.permissions.includes("candidates.view");
    if (!canReadLeads && !canReadCandidates)
      return Response.json({ message: "Access denied." }, { status: 403 });
    const attachment = new URL(request.url).searchParams.get("attachment");
    if (attachment) {
      if (!canReadCandidates) return Response.json({ message: "Access denied." }, { status: 403 });
      if (!/^[0-9a-f-]{36}$/i.test(attachment))
        return Response.json({ message: "Invalid request." }, { status: 400 });
      const { data: row, error: rowError } = await websiteAdmin
        .from("website_requests")
        .select("payload")
        .eq("id", attachment)
        .eq("kind", "career")
        .maybeSingle();
      const filePath = row?.payload?.["filePath"];
      if (
        rowError ||
        typeof filePath !== "string" ||
        !filePath.startsWith(`website/${attachment}/`)
      )
        return Response.json({ message: "Attachment unavailable." }, { status: 404 });
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from("website-resumes")
        .createSignedUrl(filePath, 60, { download: "application.pdf" });
      if (signError || !signed)
        return Response.json({ message: "Attachment unavailable." }, { status: 503 });
      return Response.json(
        { url: signed.signedUrl },
        { headers: { "cache-control": "no-store", vary: "Authorization" } },
      );
    }
    let query = websiteAdmin
      .from("website_requests")
      .select("id,kind,payload,recipient,notification_status,created_at");
    if (!access.isSuper)
      query = query.in("kind", [
        ...(canReadLeads ? ["proposal", "influencer", "contact"] : []),
        ...(canReadCandidates ? ["career"] : []),
      ]);
    const { data: rows, error: readError } = await query
      .order("created_at", { ascending: false })
      .limit(100);
    if (readError)
      return Response.json({ message: "Requests are temporarily unavailable." }, { status: 503 });
    return Response.json(
      {
        rows,
        canEditLeads: canReadLeads && (access.isSuper || access.permissions.includes("leads.edit")),
      },
      { headers: { "cache-control": "no-store", vary: "Authorization" } },
    );
  } catch {
    return Response.json({ message: "Access denied." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  if (!validWebsiteOrigin(request))
    return Response.json({ message: "Cross-site request rejected." }, { status: 403 });
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return Response.json({ message: "Sign in required." }, { status: 401 });
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user)
      return Response.json({ message: "Sign in required." }, { status: 401 });
    const access = await authorize(data.user.id);
    if (
      !access.isSuper &&
      !(access.permissions.includes("leads.view") && access.permissions.includes("leads.edit"))
    )
      return Response.json({ message: "Access denied." }, { status: 403 });
    const parsed = z
      .object({ id: z.string().uuid(), status: z.enum(enquiryStatuses) })
      .strict()
      .safeParse(await request.json());
    if (!parsed.success)
      return Response.json({ message: "Choose a valid enquiry and status." }, { status: 400 });
    const current = await websiteAdmin
      .from("website_requests")
      .select("payload")
      .eq("id", parsed.data.id)
      .eq("kind", "proposal")
      .maybeSingle();
    if (current.error)
      return Response.json({ message: "Enquiry could not be loaded." }, { status: 503 });
    if (!current.data?.payload["socialAds"])
      return Response.json({ message: "Advertising proposal not found." }, { status: 404 });
    // Compare the full payload so a concurrent update cannot overwrite another admin's change.
    const result = await websiteAdmin
      .from("website_requests")
      .update({ payload: { ...current.data.payload, status: parsed.data.status } })
      .eq("id", parsed.data.id)
      .eq("kind", "proposal")
      .filter("payload", "eq", JSON.stringify(current.data.payload))
      .select("id")
      .maybeSingle();
    if (result.error)
      return Response.json(
        { message: "Status could not be saved. Please try again." },
        { status: 503 },
      );
    if (!result.data)
      return Response.json(
        { message: "This enquiry changed. Refresh the inbox and try again." },
        { status: 409 },
      );
    return Response.json({ saved: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json(
      { message: "Status could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
