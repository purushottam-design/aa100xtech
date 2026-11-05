import { z } from "zod";
import { runWithRequestContext } from "@/lib/backend/request-context.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { authorize, AccessError } from "@/lib/rbac.server";
import { marketingAdmin } from "@/lib/marketing-intake.server";
import { campaignStatuses, type CampaignInquiry } from "@/lib/marketing-intake";
import { validWebsiteOrigin } from "@/lib/website-requests.server";
import { boundedFormData, InfluencerRequestError } from "@/lib/influencer-upload.server";
import { marketingRequestError } from "@/lib/marketing-errors.server";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[\s]*[=+@\-\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
}
async function handle(request: Request, write: boolean) {
  return runWithRequestContext(request, async (state) => {
    try {
      const { userId } = await requireSupabaseAuth();
      await authorize(userId, "leads.view");
      if (write) {
        if (!validWebsiteOrigin(request))
          throw new InfluencerRequestError("Cross-site request rejected", 403);
        await authorize(userId, "leads.edit");
        const fd = await boundedFormData(request);
        let input: unknown;
        try {
          input = JSON.parse(String(fd.get("data")));
        } catch {
          throw new InfluencerRequestError("Invalid request");
        }
        const parsed = z
          .object({
            id: z.string().uuid(),
            status: z.enum(campaignStatuses),
            notes: z.string().trim().max(6000),
          })
          .safeParse(input);
        if (!parsed.success) throw new InfluencerRequestError("Check the status and notes");
        const { id, ...changes } = parsed.data;
        const { data, error } = await marketingAdmin
          .from("brand_campaign_inquiries")
          .update({ ...changes, reviewed_by: userId, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select("id")
          .single();
        if (error || !data) throw new Error("Unable to save inquiry");
        return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
      }
      const url = new URL(request.url);
      const exporting = url.searchParams.get("export") === "csv";
      if (exporting) await authorize(userId, "leads.export");
      const rows: CampaignInquiry[] = [];
      for (let offset = 0; ; offset += 200) {
        const { data, error } = await marketingAdmin
          .from("brand_campaign_inquiries")
          .select("*")
          .order("created_at", { ascending: false })
          .order("id")
          .range(offset, offset + 199);
        if (error) throw error;
        rows.push(...data);
        if (data.length < 200) break;
      }
      const filtered = rows.filter(
        (r) =>
          (!url.searchParams.get("status") || r.status === url.searchParams.get("status")) &&
          (!url.searchParams.get("budget") || r.data.budget === url.searchParams.get("budget")) &&
          (!url.searchParams.get("category") ||
            r.data.category === url.searchParams.get("category")) &&
          (!url.searchParams.get("platform") ||
            r.data.platforms.includes(url.searchParams.get("platform") as never)),
      );
      if (exporting) {
        const header = [
          "Reference",
          "Submitted",
          "Company",
          "Contact",
          "Email",
          "Phone",
          "Website",
          "Industry",
          "Location",
          "Objective",
          "Platforms",
          "Category",
          "Target audience",
          "Follower range",
          "Influencers",
          "Start date",
          "Budget",
          "Promotions",
          "Description",
          "Status",
          "Notes",
        ];
        const body = [
          header,
          ...filtered.map((r) => [
            r.id,
            r.created_at,
            r.data.company,
            r.data.contact_name,
            r.data.email,
            r.data.phone,
            r.data.company_website,
            r.data.industry,
            r.data.location,
            r.data.objective,
            r.data.platforms.join("; "),
            r.data.category,
            r.data.audience_location,
            r.data.follower_range,
            r.data.influencer_count,
            r.data.start_date,
            r.data.budget,
            r.data.promotions.join("; "),
            r.data.description,
            r.status,
            r.notes,
          ]),
        ]
          .map((row) => row.map(csvCell).join(","))
          .join("\r\n");
        return new Response("\uFEFF" + body, {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": "attachment; filename=brand-campaign-inquiries.csv",
            "cache-control": "no-store",
          },
        });
      }
      return Response.json({ rows: filtered }, { headers: { "cache-control": "no-store" } });
    } catch (error) {
      if (error instanceof AccessError || state.status === 401)
        return Response.json(
          { error: "You do not have permission to access these inquiries" },
          { status: state.status === 401 ? 401 : 403, headers: { "cache-control": "no-store" } },
        );
      return marketingRequestError(error);
    }
  });
}
export const GET = (request: Request) => handle(request, false);
export const POST = (request: Request) => handle(request, true);
