import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminOverview,
  markPayoutPaid,
  reviewAffiliate,
  setConversionStatus,
  setCouponActive,
  upsertCatalogItem,
} from "@/lib/affiliate.functions";

export const Route = createFileRoute("/_authenticated/affiliate-admin")({
  head: () => ({
    meta: [
      { title: "Affiliate control center — AA100XTech admin" },
      {
        name: "description",
        content: "Manage the unified catalog, affiliates, links, coupons, conversions and payouts.",
      },
      { property: "og:title", content: "Affiliate control center — AA100XTech admin" },
      { property: "og:description", content: "One panel for the whole affiliate program." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AffiliateAdminPage,
});

const TABS = ["Analytics", "Catalog", "Affiliates", "Links & coupons", "Conversions", "Payouts"] as const;
type Tab = (typeof TABS)[number];

function money(v: number) {
  return `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function AffiliateAdminPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("Analytics");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [affiliateFilter, setAffiliateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const overview = useQuery({ queryKey: ["affiliate-admin"], queryFn: () => adminOverview() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["affiliate-admin"] });

  const data = overview.data;

  const filteredConversions = useMemo(() => {
    if (!data) return [];
    return data.conversions.filter((c) => {
      if (affiliateFilter && c.affiliate_id !== affiliateFilter) return false;
      if (productFilter && c.catalog_item_id !== productFilter) return false;
      if (from && new Date(c.created_at) < new Date(from)) return false;
      if (to && new Date(c.created_at) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [data, affiliateFilter, productFilter, from, to]);

  if (overview.isLoading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nameOf = (id: string | null) => data.affiliates.find((a) => a.id === id)?.full_name ?? "—";
  const itemOf = (id: string | null) => data.catalog.find((i) => i.id === id)?.name ?? "sitewide";

  const revenue = filteredConversions.reduce((s, c) => s + Number(c.order_value), 0);
  const commission = filteredConversions.reduce((s, c) => s + Number(c.commission_earned), 0);
  const clicks = data.clicks.length;

  const topAffiliates = [...data.affiliates]
    .map((a) => ({
      name: a.full_name,
      revenue: data.conversions
        .filter((c) => c.affiliate_id === a.id)
        .reduce((s, c) => s + Number(c.order_value), 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topProducts = [...data.catalog]
    .map((i) => ({
      name: i.name,
      revenue: data.conversions
        .filter((c) => c.catalog_item_id === i.id)
        .reduce((s, c) => s + Number(c.order_value), 0),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  function exportCsv(rows: Array<Record<string, unknown>>, filename: string) {
    if (!rows.length) {
      toast.error("Nothing to export");
      return;
    }
    const headers = Object.keys(rows[0]!);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Affiliate control center</h1>
      <p className="mt-2 text-muted-foreground">
        One catalog, one affiliate table, one tracking engine — for every website, app, product and service.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>

      {tab === "Analytics" ? (
        <div className="mt-8">
          <div className="surface-card flex flex-wrap items-end gap-4 p-5">
            <div className="grid gap-1">
              <Label htmlFor="from">From</Label>
              <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="to">To</Label>
              <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="aff">Affiliate</Label>
              <select
                id="aff"
                value={affiliateFilter}
                onChange={(e) => setAffiliateFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" className="text-black">All affiliates</option>
                {data.affiliates.map((a) => (
                  <option key={a.id} value={a.id} className="text-black">{a.full_name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="prod">Product</Label>
              <select
                id="prod"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="" className="text-black">All items</option>
                {data.catalog.map((i) => (
                  <option key={i.id} value={i.id} className="text-black">{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Clicks", value: String(clicks) },
              { label: "Conversions", value: String(filteredConversions.length) },
              {
                label: "Conversion rate",
                value: clicks ? `${Math.round((filteredConversions.length / clicks) * 1000) / 10}%` : "0%",
              },
              { label: "Attributed revenue", value: money(revenue) },
              { label: "Commission owed", value: money(commission) },
            ].map((s) => (
              <div key={s.label} className="surface-card p-5">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="surface-card p-6">
              <h3 className="font-semibold">Top affiliates</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {topAffiliates.map((a) => (
                  <li key={a.name} className="flex justify-between">
                    <span>{a.name}</span>
                    <span className="text-muted-foreground">{money(a.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface-card p-6">
              <h3 className="font-semibold">Top products</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {topProducts.map((p) => (
                  <li key={p.name} className="flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">{money(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "Catalog" ? <CatalogTab items={data.catalog} onDone={refresh} /> : null}

      {tab === "Affiliates" ? (
        <div className="mt-8 grid gap-4">
          {data.affiliates.length === 0 ? (
            <p className="text-muted-foreground">No affiliates yet.</p>
          ) : (
            data.affiliates.map((a) => <AffiliateRow key={a.id} affiliate={a} onDone={refresh} />)
          )}
        </div>
      ) : null}

      {tab === "Links & coupons" ? (
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() =>
              exportCsv(
                data.coupons.map((c) => ({
                  code: c.code,
                  affiliate: nameOf(c.affiliate_id),
                  scope: itemOf(c.catalog_item_id),
                  discount: `${c.discount_value}${c.discount_type === "percent" ? "%" : ""}`,
                  active: c.active,
                })),
                "aa100x-coupons.csv",
              )
            }
          >
            Export coupon list (CSV)
          </Button>

          <div className="surface-card mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data.coupons.map((c) => (
                  <tr key={c.id} className="border-b border-border/40">
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3">{nameOf(c.affiliate_id)}</td>
                    <td className="p-3">{itemOf(c.catalog_item_id)}</td>
                    <td className="p-3">
                      {c.discount_value}
                      {c.discount_type === "percent" ? "%" : ""}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{c.active ? "active" : "disabled"}</Badge>
                    </td>
                    <td className="p-3">
                      <CouponToggle id={c.id} active={c.active} onDone={refresh} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-8 font-semibold">Referral links ({data.links.length})</h3>
          <div className="surface-card mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {data.links.map((l) => {
                  const code = data.affiliates.find((a) => a.id === l.affiliate_id)?.affiliate_code ?? "";
                  const slug = data.catalog.find((i) => i.id === l.catalog_item_id)?.slug ?? "";
                  return (
                    <tr key={l.id} className="border-b border-border/40">
                      <td className="p-3">{nameOf(l.affiliate_id)}</td>
                      <td className="p-3">{itemOf(l.catalog_item_id)}</td>
                      <td className="p-3 font-mono text-xs">/go/{code}/{slug}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "Conversions" ? (
        <div className="surface-card mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-muted-foreground">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Affiliate</th>
                <th className="p-3">Item</th>
                <th className="p-3">Order</th>
                <th className="p-3">Value</th>
                <th className="p-3">Commission</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.conversions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">No conversions yet.</td>
                </tr>
              ) : (
                data.conversions.map((c) => (
                  <tr key={c.id} className="border-b border-border/40">
                    <td className="p-3">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-3">{nameOf(c.affiliate_id)}</td>
                    <td className="p-3">{itemOf(c.catalog_item_id)}</td>
                    <td className="p-3 font-mono text-xs">{c.order_id}</td>
                    <td className="p-3">{money(Number(c.order_value))}</td>
                    <td className="p-3">{money(Number(c.commission_earned))}</td>
                    <td className="p-3"><Badge variant="outline">{c.status}</Badge></td>
                    <td className="p-3">
                      <ConversionActions id={c.id} onDone={refresh} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "Payouts" ? (
        <div className="mt-8">
          <Button
            variant="outline"
            onClick={() =>
              exportCsv(
                data.payouts.map((p) => ({
                  date: p.created_at,
                  affiliate: nameOf(p.affiliate_id),
                  amount: p.amount,
                  method: p.method,
                  status: p.status,
                  reference: p.reference,
                })),
                "aa100x-payouts.csv",
              )
            }
          >
            Export payouts (CSV)
          </Button>
          <div className="surface-card mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-muted-foreground">
                <tr>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data.payouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">No payout requests.</td>
                  </tr>
                ) : (
                  data.payouts.map((p) => (
                    <tr key={p.id} className="border-b border-border/40">
                      <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{nameOf(p.affiliate_id)}</td>
                      <td className="p-3">{money(Number(p.amount))}</td>
                      <td className="p-3">{p.method ?? "—"}</td>
                      <td className="p-3"><Badge variant="outline">{p.status}</Badge></td>
                      <td className="p-3">
                        <PayoutActions id={p.id} onDone={refresh} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CouponToggle({ id, active, onDone }: { id: string; active: boolean; onDone: () => void }) {
  const m = useMutation({
    mutationFn: () => setCouponActive({ data: { couponId: id, active: !active } }),
    onSuccess: () => {
      toast.success("Updated");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate()}>
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}

function ConversionActions({ id, onDone }: { id: string; onDone: () => void }) {
  const m = useMutation({
    mutationFn: (status: "approved" | "rejected") => setConversionStatus({ data: { conversionId: id, status } }),
    onSuccess: () => {
      toast.success("Updated");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={m.isPending} onClick={() => m.mutate("approved")}>Approve</Button>
      <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate("rejected")}>
        Reject
      </Button>
    </div>
  );
}

function PayoutActions({ id, onDone }: { id: string; onDone: () => void }) {
  const [reference, setReference] = useState("");
  const m = useMutation({
    mutationFn: (status: "approved" | "paid" | "rejected") =>
      markPayoutPaid({ data: { payoutId: id, status, reference: reference || undefined } }),
    onSuccess: () => {
      toast.success("Payout updated");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="UTR / txn ref"
        className="h-9 w-36"
      />
      <Button size="sm" disabled={m.isPending} onClick={() => m.mutate("paid")}>Mark paid</Button>
      <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate("rejected")}>
        Reject
      </Button>
    </div>
  );
}

function AffiliateRow({
  affiliate,
  onDone,
}: {
  affiliate: {
    id: string;
    full_name: string;
    company_name: string | null;
    email: string;
    phone: string | null;
    affiliate_code: string;
    entity_type: string;
    status: string;
    tier: string;
    payout_method: string | null;
    custom_commission_value: number | null;
    kyc_info: unknown;
  };
  onDone: () => void;
}) {
  const [commission, setCommission] = useState(
    affiliate.custom_commission_value != null ? String(affiliate.custom_commission_value) : "",
  );
  const m = useMutation({
    mutationFn: (status: "approved" | "rejected" | "suspended") =>
      reviewAffiliate({
        data: {
          affiliateId: affiliate.id,
          status,
          customCommissionValue: commission === "" ? null : Number(commission),
          customCommissionType: "percent",
        },
      }),
    onSuccess: () => {
      toast.success("Affiliate updated");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="surface-card grid gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {affiliate.full_name}{" "}
            <span className="font-mono text-xs text-muted-foreground">{affiliate.affiliate_code}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {affiliate.entity_type} · {affiliate.email} · {affiliate.phone ?? "no phone"} ·{" "}
            payout via {affiliate.payout_method ?? "—"}
          </p>
        </div>
        <Badge variant="outline" className="uppercase">{affiliate.status}</Badge>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label className="text-xs">Custom commission % (blank = catalog default)</Label>
          <Input
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="h-9 w-48"
            placeholder="e.g. 25"
          />
        </div>
        <Button size="sm" disabled={m.isPending} onClick={() => m.mutate("approved")}>Approve</Button>
        <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate("suspended")}>
          Suspend
        </Button>
        <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => m.mutate("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  );
}

function CatalogTab({
  items,
  onDone,
}: {
  items: Array<{
    id: string;
    type: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
    landing_url: string;
    default_commission_type: string;
    default_commission_value: number;
    cookie_duration_days: number;
    recurring: boolean;
    active: boolean;
  }>;
  onDone: () => void;
}) {
  const m = useMutation({
    mutationFn: (data: {
      id?: string | undefined;
      type: "website" | "app" | "product" | "service";
      name: string;
      slug: string;
      category?: string | undefined;
      description?: string | undefined;
      landingUrl: string;
      commissionType: "percent" | "flat";
      commissionValue: number;
      cookieDurationDays: number;
      recurring: boolean;
      active: boolean;
    }) => upsertCatalogItem({ data }),
    onSuccess: () => {
      toast.success("Catalog saved");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    m.mutate({
      type: String(fd.get("type") ?? "service") as "website" | "app" | "product" | "service",
      name: String(fd.get("name") ?? ""),
      slug: String(fd.get("slug") ?? "").toLowerCase(),
      category: String(fd.get("category") ?? "") || undefined,
      description: String(fd.get("description") ?? "") || undefined,
      landingUrl: String(fd.get("landing_url") ?? ""),
      commissionType: String(fd.get("commission_type") ?? "percent") as "percent" | "flat",
      commissionValue: Number(fd.get("commission_value") ?? 10),
      cookieDurationDays: Number(fd.get("cookie") ?? 30),
      recurring: fd.get("recurring") === "on",
      active: true,
    });
    e.currentTarget.reset();
  }

  return (
    <div className="mt-8 grid gap-8">
      <form onSubmit={onSubmit} className="surface-card grid gap-4 p-6">
        <h3 className="font-semibold">Add a website / app / product / service</h3>
        <p className="text-sm text-muted-foreground">
          Adding a row here is all that is needed — links, coupons, tracking and payouts work instantly
          with zero new code.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="slug">Slug * (used in /go/&#123;affiliateID&#125;/&#123;slug&#125;)</Label>
            <Input id="slug" name="slug" required placeholder="new-product" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              name="type"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {["service", "website", "app", "product"].map((t) => (
                <option key={t} value={t} className="text-black">{t}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="landing_url">Landing URL *</Label>
            <Input id="landing_url" name="landing_url" required placeholder="https://aa100xtech.com/..." />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="commission_type">Commission type</Label>
            <select
              id="commission_type"
              name="commission_type"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="percent" className="text-black">percent</option>
              <option value="flat" className="text-black">flat</option>
            </select>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="commission_value">Commission value</Label>
            <Input id="commission_value" name="commission_value" type="number" defaultValue={10} min={0} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="cookie">Cookie duration (days)</Label>
            <Input id="cookie" name="cookie" type="number" defaultValue={30} min={1} max={365} />
          </div>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="recurring" /> Pays recurring commission on renewals
        </label>
        <Button type="submit" disabled={m.isPending} className="justify-self-start">
          {m.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Save to catalog
        </Button>
      </form>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Commission</th>
              <th className="p-3">Cookie</th>
              <th className="p-3">Recurring</th>
              <th className="p-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-border/40">
                <td className="p-3">{i.name}</td>
                <td className="p-3">{i.type}</td>
                <td className="p-3 font-mono text-xs">{i.slug}</td>
                <td className="p-3">
                  {i.default_commission_value}
                  {i.default_commission_type === "percent" ? "%" : " flat"}
                </td>
                <td className="p-3">{i.cookie_duration_days}d</td>
                <td className="p-3">{i.recurring ? "yes" : "no"}</td>
                <td className="p-3">{i.active ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
