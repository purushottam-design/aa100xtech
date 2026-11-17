"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminNav } from "./admin-nav";
import { useMyAccess } from "./admin-management";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import {
  budgets,
  categories,
  campaignStatuses,
  type CampaignInquiry,
} from "@/lib/marketing-intake";

async function api(url: string, init: RequestInit = {}) {
  const headers = await attachSupabaseAuth();
  headers.set("x-aa-rpc", "1");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error ?? "Unable to load inquiries");
  }
  return response;
}
export function BrandInquiryManagement() {
  const access = useMyAccess();
  const allowed = (permission: string) =>
    !!(access.data?.isSuper || access.data?.permissions.includes(permission));
  const [filters, setFilters] = useState<Record<string, string>>({}),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(""),
    [exporting, setExporting] = useState(false);
  const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => !!v));
  const query = useQuery<{ rows: CampaignInquiry[] }>({
    queryKey: ["brand-inquiries", filters],
    queryFn: async () => {
      const result = await api(`/api/marketing/admin?${params}`);
      return result.json();
    },
    enabled: allowed("leads.view"),
    retry: false,
  });
  const rows = (query.data?.rows ?? []).filter((r) =>
    `${r.data.company} ${r.data.contact_name} ${r.data.email} ${r.id}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const current = rows.find((r) => r.id === selected);
  const download = async () => {
    setExporting(true);
    try {
      const response = await api(`/api/marketing/admin?${params}&export=csv`);
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "brand-campaign-inquiries.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };
  if (access.isLoading) return <p className="p-10">Checking access…</p>;
  if (!allowed("leads.view"))
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-3">You need permission to view leads.</p>
      </div>
    );
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Influencer marketing</p>
          <h1 className="mt-3 text-3xl font-bold">Brand Campaign Inquiries</h1>
          <p className="mt-3 text-muted-foreground">
            Review briefs, follow up with brands and record campaign progress.
          </p>
        </div>
        {allowed("leads.export") && (
          <Button variant="outline" disabled={exporting} onClick={() => void download()}>
            {exporting ? "Exporting…" : "Export filtered CSV"}
          </Button>
        )}
      </div>
      <AdminNav className="mt-6" />
      <div className="mt-8 flex flex-wrap gap-3">
        <Input
          aria-label="Search brand inquiries"
          placeholder="Search company, contact, email or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {(
          [
            ["status", "Status", campaignStatuses],
            ["budget", "Budget", budgets],
            ["category", "Category", categories],
            ["platform", "Platform", ["Instagram", "YouTube", "Facebook", "Snapchat", "Other"]],
          ] as const
        ).map(([name, label, options]) => (
          <select
            key={name}
            aria-label={`Filter by ${label}`}
            value={filters[name] ?? ""}
            onChange={(e) => setFilters((s) => ({ ...s, [name]: e.target.value }))}
            className="max-w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All {label.toLowerCase()}s</option>
            {options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ))}
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {query.isLoading && <p className="mt-8">Loading inquiries…</p>}
      {query.error && (
        <p role="alert" className="mt-6 text-destructive">
          {query.error.message}
        </p>
      )}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <div className="space-y-3">
          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => setSelected(row.id)}
              className={`w-full rounded-xl border p-4 text-left focus-visible:ring-2 focus-visible:ring-primary ${selected === row.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}
            >
              <p className="font-semibold">{row.data.company}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {row.data.category} · {row.data.budget}
              </p>
              <p className="mt-3 text-sm text-primary">{row.status}</p>
            </button>
          ))}
          {!query.isLoading && !query.error && !rows.length && (
            <p className="surface-card p-6 text-sm text-muted-foreground">
              No inquiries match this view.
            </p>
          )}
        </div>
        {current ? (
          <InquiryEditor
            key={`${current.id}:${current.status}:${current.notes}`}
            row={current}
            edit={allowed("leads.edit")}
          />
        ) : (
          <p className="surface-card p-8 text-muted-foreground">
            Select an inquiry to review the full campaign requirements.
          </p>
        )}
      </div>
    </div>
  );
}
function InquiryEditor({ row, edit }: { row: CampaignInquiry; edit: boolean }) {
  const [status, setStatus] = useState(row.status),
    [notes, setNotes] = useState(row.notes),
    [busy, setBusy] = useState(false);
  const cache = useQueryClient();
  const save = async () => {
    setBusy(true);
    try {
      const body = new FormData();
      body.set("data", JSON.stringify({ id: row.id, status, notes }));
      await api("/api/marketing/admin", { method: "POST", body });
      await cache.invalidateQueries({ queryKey: ["brand-inquiries"] });
      toast.success("Inquiry updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };
  const d = row.data;
  const details: [string, unknown][] = [
    ["Contact person", d.contact_name],
    ["Business email", d.email],
    ["Phone / WhatsApp", d.phone],
    ["Website", d.company_website],
    ["Industry", d.industry],
    ["Location", d.location],
    ["Campaign objective", d.objective],
    ["Platforms", d.platforms.join(", ")],
    ["Influencer category", d.category],
    ["Target audience", d.audience_location],
    ["Follower range", d.follower_range],
    ["Number of influencers", d.influencer_count],
    ["Campaign start date", d.start_date],
    ["Budget", d.budget],
    ...(d.campaign_offer
      ? ([
          [
            "Creator Moves365 campaign package",
            `${d.campaign_offer.name} — ${d.campaign_offer.priceLabel}`,
          ],
          ["Indicative campaign scope", d.campaign_offer.features.join("\n")],
          ["Campaign scope qualification", d.campaign_offer.qualification],
          ["Campaign scope version", d.campaign_offer.scopeVersion],
        ] as [string, unknown][])
      : []),
    ["Promotion types", d.promotions.join(", ")],
    ["Campaign description", d.description],
    ["Privacy consent", d.privacy ? "Recorded" : "Not recorded"],
    ["Admin notification", row.notification_status],
    ...(d.creator ? ([["Selected creator", d.creator.name]] as [string, unknown][]) : []),
    ...(d.legacy_campaign
      ? ([
          ["Campaign type", d.legacy_campaign.type],
          ["Preferred timeline", d.legacy_campaign.timeline],
          ["Campaign package", d.legacy_campaign.package],
          ["Target audience description", d.legacy_campaign.targetAudience],
          ["Selected creator", d.legacy_campaign.creator?.name],
        ] as [string, unknown][])
      : []),
  ];
  return (
    <form
      className="surface-card min-w-0 space-y-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div>
        <h2 className="text-2xl font-bold">{d.company}</h2>
        <p className="mt-2 break-all text-xs text-muted-foreground">
          {row.id} · {new Date(row.created_at).toLocaleString()}
        </p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className={label === "Campaign description" ? "sm:col-span-2" : ""}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words whitespace-pre-line text-sm">
              {value === null || value === "" ? "Not supplied" : String(value)}
            </dd>
          </div>
        ))}
      </dl>
      <fieldset disabled={!edit || busy} className="space-y-5 border-t border-border pt-6">
        <div>
          <label htmlFor="inquiry-status" className="mb-2 block text-sm font-medium">
            Inquiry status
          </label>
          <select
            id="inquiry-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full rounded-lg border border-input bg-background p-3"
          >
            {campaignStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inquiry-notes" className="mb-2 block text-sm font-medium">
            Internal notes
          </label>
          <Textarea
            id="inquiry-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={6000}
            rows={5}
          />
        </div>
        <Button type="submit">{busy ? "Saving…" : "Save inquiry"}</Button>
      </fieldset>
    </form>
  );
}
