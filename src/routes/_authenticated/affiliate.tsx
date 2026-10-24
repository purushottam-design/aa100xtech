"use client";

import { Link } from "@/lib/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getAffiliateDashboard,
  getOrCreateAssets,
  listCatalogItems,
  registerAffiliate,
  requestPayout,
} from "@/lib/affiliate.functions";

export default AffiliatePortal;

function money(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function copy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copied"),
    () => toast.error("Copy failed"),
  );
}

function AffiliatePortal() {
  const qc = useQueryClient();
  const dashboard = useQuery({ queryKey: ["affiliate-dashboard"], queryFn: () => getAffiliateDashboard() });
  const catalog = useQuery({ queryKey: ["public-catalog"], queryFn: () => listCatalogItems() });

  if (dashboard.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboard.data) {
    return <RegisterForm onDone={() => qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] })} />;
  }

  const { affiliate, totals, conversions, payouts, links, coupons, clicks } = dashboard.data;
  const sitewideCoupon = coupons.find((c) => !c.catalog_item_id);
  const origin = typeof window === "undefined" ? "https://aa100xtech.com" : window.location.origin;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Affiliate portal</h1>
          <p className="mt-2 text-muted-foreground">
            Affiliate ID <span className="font-mono text-foreground">{affiliate.affiliate_code}</span> ·
            tier {affiliate.tier}
          </p>
        </div>
        <Badge variant={affiliate.status === "approved" ? "default" : "outline"} className="uppercase">
          {affiliate.status}
        </Badge>
      </div>

      {affiliate.status !== "approved" ? (
        <div className="surface-card mt-6 p-6 text-sm text-muted-foreground">
          Your account is <strong className="text-foreground">{affiliate.status}</strong>. Links and coupon
          codes activate as soon as the AA100XTech team approves you.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Clicks", value: String(totals.clicks) },
          { label: "Conversions", value: String(totals.conversions) },
          { label: "Conversion rate", value: `${totals.conversionRate}%` },
          { label: "Total earnings", value: money(totals.earnings) },
          { label: "Pending payout", value: money(totals.pendingPayout) },
          { label: "Paid out", value: money(totals.paidPayout) },
        ].map((s) => (
          <div key={s.label} className="surface-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {sitewideCoupon ? (
        <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-sm text-muted-foreground">Your sitewide coupon code</p>
            <p className="mt-1 font-mono text-xl font-bold text-primary">{sitewideCoupon.code}</p>
          </div>
          <Button variant="outline" onClick={() => copy(sitewideCoupon.code)}>
            <Copy className="size-4" /> Copy code
          </Button>
        </div>
      ) : null}

      <h2 className="mt-12 text-2xl font-bold">Promote any product</h2>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {(catalog.data ?? []).map((item) => (
          <PromoteCard
            key={item.id}
            item={item}
            origin={origin}
            disabled={affiliate.status !== "approved"}
            existingLink={links.find((l) => l.catalog_item_id === item.id) ?? null}
            existingCoupon={coupons.find((c) => c.catalog_item_id === item.id) ?? null}
            affiliateCode={affiliate.affiliate_code}
          />
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold">Performance funnel</h2>
      <div className="surface-card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Order</th>
              <th className="p-3">Type</th>
              <th className="p-3">Attribution</th>
              <th className="p-3">Order value</th>
              <th className="p-3">Commission</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {conversions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No conversions yet — {clicks.length} clicks recorded so far.
                </td>
              </tr>
            ) : (
              conversions.map((c) => (
                <tr key={c.id} className="border-b border-border/40">
                  <td className="p-3">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-mono text-xs">{c.order_id}</td>
                  <td className="p-3">{c.is_recurring ? "renewal" : c.event_type}</td>
                  <td className="p-3">{c.attribution}</td>
                  <td className="p-3">{money(Number(c.order_value))}</td>
                  <td className="p-3">{money(Number(c.commission_earned))}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="uppercase">{c.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PayoutSection
        available={totals.pendingPayout}
        threshold={Number(affiliate.min_payout_threshold)}
        payouts={payouts}
        onDone={() => qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] })}
      />

      <p className="mt-10 text-sm text-muted-foreground">
        Need marketing assets or a custom commission? <Link to="/contact" className="text-primary underline">Talk to the team</Link>.
      </p>
    </div>
  );
}

function PromoteCard(props: {
  item: { id: string; name: string; slug: string; type: string; default_commission_type: string; default_commission_value: number; cookie_duration_days: number; recurring: boolean };
  origin: string;
  disabled: boolean;
  affiliateCode: string;
  existingLink: { unique_slug: string } | null;
  existingCoupon: { code: string } | null;
}) {
  const qc = useQueryClient();
  const [assets, setAssets] = useState<{ url: string; coupon: string } | null>(
    props.existingLink && props.existingCoupon
      ? {
          url: `${props.origin}/go/${props.affiliateCode}/${props.item.slug}`,
          coupon: props.existingCoupon.code,
        }
      : null,
  );

  const generate = useMutation({
    mutationFn: () => getOrCreateAssets({ data: { catalogItemId: props.item.id } }),
    onSuccess: (res) => {
      setAssets({ url: `${props.origin}${res.url}`, coupon: res.coupon.code });
      qc.invalidateQueries({ queryKey: ["affiliate-dashboard"] });
      toast.success("Link and coupon ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const caption = assets
    ? `I use ${props.item.name} by AA100XTech — grab it here: ${assets.url} (use code ${assets.coupon} for a discount)`
    : "";

  return (
    <div className="surface-card p-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="uppercase">{props.item.type}</Badge>
        {props.item.recurring ? <Badge variant="outline">Recurring</Badge> : null}
      </div>
      <h3 className="mt-3 text-lg font-semibold">{props.item.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {props.item.default_commission_type === "flat"
          ? `Flat ${money(props.item.default_commission_value)} per sale`
          : `${props.item.default_commission_value}% commission`}{" "}
        · {props.item.cookie_duration_days}-day cookie
      </p>

      {assets ? (
        <div className="mt-4 grid gap-3">
          <div className="grid gap-1">
            <Label className="text-xs uppercase text-muted-foreground">Referral link</Label>
            <div className="flex gap-2">
              <Input readOnly value={assets.url} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(assets.url)} aria-label="Copy link">
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs uppercase text-muted-foreground">Coupon code</Label>
            <div className="flex gap-2">
              <Input readOnly value={assets.coupon} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(assets.coupon)} aria-label="Copy coupon">
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs uppercase text-muted-foreground">Ready-to-post caption</Label>
            <div className="flex gap-2">
              <Textarea readOnly value={caption} rows={3} className="text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(caption)} aria-label="Copy caption">
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          className="mt-4"
          disabled={props.disabled || generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Get link & coupon
        </Button>
      )}
    </div>
  );
}

function PayoutSection(props: {
  available: number;
  threshold: number;
  payouts: Array<{ id: string; amount: number; status: string; method: string | null; created_at: string; paid_at: string | null }>;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const mutation = useMutation({
    mutationFn: (value: number) => requestPayout({ data: { amount: value } }),
    onSuccess: () => {
      toast.success("Payout requested");
      setAmount("");
      props.onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <h2 className="mt-12 text-2xl font-bold">Payouts</h2>
      <div className="surface-card mt-6 flex flex-wrap items-end gap-4 p-6">
        <div className="grid gap-2">
          <Label htmlFor="payout-amount">Request amount (min {money(props.threshold)})</Label>
          <Input
            id="payout-amount"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={String(props.available)}
            className="w-48"
          />
        </div>
        <Button
          disabled={mutation.isPending || !amount}
          onClick={() => mutation.mutate(Number(amount))}
        >
          Request payout
        </Button>
        <p className="text-sm text-muted-foreground">Approved balance available: {money(props.available)}</p>
      </div>

      <div className="surface-card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 text-left text-muted-foreground">
            <tr>
              <th className="p-3">Requested</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Status</th>
              <th className="p-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {props.payouts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">No payouts yet.</td>
              </tr>
            ) : (
              props.payouts.map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{money(Number(p.amount))}</td>
                  <td className="p-3">{p.method ?? "—"}</td>
                  <td className="p-3"><Badge variant="outline" className="uppercase">{p.status}</Badge></td>
                  <td className="p-3">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

type RegisterInput = {
  entityType: "individual" | "company";
  fullName: string;
  companyName?: string | undefined;
  email: string;
  phone?: string | undefined;
  country?: string | undefined;
  audienceNote?: string | undefined;
  payoutMethod: "upi" | "bank" | "paypal" | "stripe" | "razorpay";
  payoutAccount: string;
  payoutName?: string | undefined;
  payoutIfsc?: string | undefined;
  panOrTaxId?: string | undefined;
};

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [entityType, setEntityType] = useState<"individual" | "company">("individual");
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank" | "paypal" | "stripe" | "razorpay">("upi");

  const mutation = useMutation({
    mutationFn: (data: RegisterInput) => registerAffiliate({ data }),
    onSuccess: () => {
      toast.success("Application submitted — approval usually takes under 48 hours.");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      entityType,
      fullName: String(fd.get("full_name") ?? ""),
      companyName: String(fd.get("company_name") ?? "") || undefined,
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? "") || undefined,
      country: String(fd.get("country") ?? "") || undefined,
      audienceNote: String(fd.get("audience") ?? "") || undefined,
      payoutMethod,
      payoutAccount: String(fd.get("payout_account") ?? ""),
      payoutName: String(fd.get("payout_name") ?? "") || undefined,
      payoutIfsc: String(fd.get("payout_ifsc") ?? "") || undefined,
      panOrTaxId: String(fd.get("pan") ?? "") || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Join the affiliate & partner program</h1>
      <p className="mt-3 text-muted-foreground">
        One application covers every AA100XTech website, app, product and service. Individuals and
        companies both welcome.
      </p>

      <form onSubmit={onSubmit} className="surface-card mt-8 grid gap-5 p-6 sm:p-8">
        <div className="grid gap-2">
          <Label>I am applying as *</Label>
          <div className="flex gap-2">
            {(["individual", "company"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={entityType === t ? "default" : "outline"}
                onClick={() => setEntityType(t)}
                className="capitalize"
              >
                {t === "individual" ? "Individual / creator" : "Company / brand"}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" name="full_name" required maxLength={120} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input id="company_name" name="company_name" maxLength={120} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required maxLength={255} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone / WhatsApp</Label>
            <Input id="phone" name="phone" maxLength={30} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" maxLength={80} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pan">PAN / Tax ID (KYC)</Label>
            <Input id="pan" name="pan" maxLength={60} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="audience">Where will you promote? (channels, audience size)</Label>
          <Textarea id="audience" name="audience" rows={3} maxLength={1000} />
        </div>

        <div className="grid gap-2">
          <Label>Payout method *</Label>
          <div className="flex flex-wrap gap-2">
            {(["upi", "bank", "paypal", "stripe", "razorpay"] as const).map((m) => (
              <Button
                key={m}
                type="button"
                variant={payoutMethod === m ? "default" : "outline"}
                onClick={() => setPayoutMethod(m)}
                className="uppercase"
              >
                {m}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="payout_account">UPI ID / account no. / PayPal email *</Label>
            <Input id="payout_account" name="payout_account" required maxLength={200} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout_name">Account holder name</Label>
            <Input id="payout_name" name="payout_name" maxLength={120} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout_ifsc">IFSC / SWIFT</Label>
            <Input id="payout_ifsc" name="payout_ifsc" maxLength={30} />
          </div>
        </div>

        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit application
        </Button>
      </form>
    </div>
  );
}
