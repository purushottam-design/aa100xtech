import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminAnalytics } from "@/lib/super-admin-plus.functions";

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "12 months", days: 365 },
];

const dayISO = (offset: number) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function GrowthPill({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        up ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
      }`}
    >
      <Icon className="size-3" aria-hidden />
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

export function AdminReports() {
  const [from, setFrom] = useState(dayISO(29));
  const [to, setTo] = useState(dayISO(0));

  const q = useQuery({
    queryKey: ["admin-reports", from, to],
    queryFn: () => getAdminAnalytics({ data: { days: 30, from, to } }),
    retry: false,
  });

  const rows = useMemo(
    () =>
      (q.data?.cumulative ?? []).map((r) => ({
        Date: r.day,
        "New sign-ups": r.signups,
        Bookings: r.orders,
        Revenue: r.revenue,
        "Revenue (running total)": r.cumulative,
      })),
    [q.data],
  );

  const headers = ["Date", "New sign-ups", "Bookings", "Revenue", "Revenue (running total)"];
  const title = `AA100XTech report ${from} to ${to}`;

  function exportCsv() {
    const lines = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => JSON.stringify((r as Record<string, unknown>)[h] ?? "")).join(",")),
    );
    download(`aa100xtech-report-${from}_${to}.csv`, "text/csv", `\uFEFF${lines.join("\n")}`);
  }

  function exportExcel() {
    const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = rows
      .map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(String((r as Record<string, unknown>)[h] ?? ""))}</td>`).join("")}</tr>`)
      .join("");
    const totals = q.data?.totals;
    const summary = totals
      ? `<tr><td colspan="5"></td></tr><tr><th colspan="2">Total revenue</th><td>${totals.revenue}</td><th>Paid orders</th><td>${totals.paidOrders}</td></tr>`
      : "";
    const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head><body><h3>${escapeHtml(
      title,
    )}</h3><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}${summary}</tbody></table></body></html>`;
    download(`aa100xtech-report-${from}_${to}.xls`, "application/vnd.ms-excel", html);
  }

  function exportPdf() {
    const totals = q.data?.totals;
    const growth = q.data?.growth;
    const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
    const body = rows
      .map((r) => `<tr>${headers.map((h) => `<td>${escapeHtml(String((r as Record<string, unknown>)[h] ?? ""))}</td>`).join("")}</tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;padding:32px;color:#111}
        h1{font-size:20px;margin:0 0 4px}
        p.sub{color:#555;margin:0 0 20px;font-size:12px}
        .cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        .card{border:1px solid #ddd;border-radius:8px;padding:10px 14px;font-size:12px;min-width:130px}
        .card b{display:block;font-size:18px;margin-top:2px}
        table{border-collapse:collapse;width:100%;font-size:11px}
        th,td{border:1px solid #ddd;padding:5px 7px;text-align:left}
        thead{background:#f4f4f5}
      </style></head><body>
      <h1>${escapeHtml(title)}</h1>
      <p class="sub">Generated ${new Date().toLocaleString()} · Absolute Advancement 100X Tech</p>
      <div class="cards">
        <div class="card">Revenue<b>${totals?.revenue?.toLocaleString() ?? 0}</b>${growth ? `${growth.revenue}% vs previous` : ""}</div>
        <div class="card">Paid orders<b>${totals?.paidOrders ?? 0}</b>${growth ? `${growth.paidOrders}% vs previous` : ""}</div>
        <div class="card">New sign-ups<b>${totals?.newUsers ?? 0}</b>${growth ? `${growth.newUsers}% vs previous` : ""}</div>
        <div class="card">Avg order value<b>${totals?.avgOrderValue ?? 0}</b></div>
      </div>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=980,height=760");
    if (!w) return;
    w.document.write(html);
    w.document.close();
  }

  const applyPreset = (days: number) => {
    setFrom(dayISO(days - 1));
    setTo(dayISO(0));
  };

  const d = q.data;

  return (
    <div className="space-y-6">
      <Card className="surface-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg">Reports &amp; analytics</CardTitle>
          <CardDescription>Pick any date range, compare growth and export the data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="rep-from">From</Label>
              <Input id="rep-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rep-to">To</Label>
              <Input id="rep-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button key={p.days} size="sm" variant="outline" onClick={() => applyPreset(p.days)}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={exportPdf} disabled={!d}>
              <FileText className="size-4" /> Export PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={exportExcel} disabled={!d}>
              <FileSpreadsheet className="size-4" /> Export Excel
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!d}>
              <Download className="size-4" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading report…</p> : null}
      {q.isError ? <p className="text-sm text-muted-foreground">{(q.error as Error).message}</p> : null}

      {d ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: d.totals.revenue.toLocaleString(), growth: d.growth.revenue, prev: d.previous.revenue },
              { label: "Paid orders", value: d.totals.paidOrders, growth: d.growth.paidOrders, prev: d.previous.paidOrders },
              { label: "New sign-ups", value: d.totals.newUsers, growth: d.growth.newUsers, prev: d.previous.newUsers },
              { label: "Avg order value", value: d.totals.avgOrderValue.toLocaleString(), growth: 0, prev: null },
            ].map((c) => (
              <Card key={c.label} className="surface-card">
                <CardHeader className="pb-2">
                  <CardDescription>{c.label}</CardDescription>
                  <CardTitle className="font-display text-2xl">{c.value}</CardTitle>
                  {c.prev !== null ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GrowthPill value={c.growth} />
                      <span>vs {c.prev.toLocaleString()} previous period</span>
                    </div>
                  ) : null}
                </CardHeader>
              </Card>
            ))}
          </div>

          <Badge variant="secondary">
            {d.range.from} → {d.range.to} · {d.range.days} days
          </Badge>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="surface-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Revenue growth</CardTitle>
                <CardDescription>Running total across the selected range</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.cumulative.map((r) => ({ ...r, label: r.day.slice(5) }))}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" fontSize={11} minTickGap={24} />
                    <YAxis fontSize={11} width={48} />
                    <Tooltip />
                    <Area type="monotone" dataKey="cumulative" stroke="#22c55e" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader>
                <CardTitle className="font-display text-lg">Daily revenue &amp; bookings</CardTitle>
                <CardDescription>Per day in the selected range</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.series.map((r) => ({ ...r, label: r.day.slice(5) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" fontSize={11} minTickGap={24} />
                    <YAxis fontSize={11} width={40} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="surface-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-display text-lg">Sign-up trend</CardTitle>
                <CardDescription>New accounts per day</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={d.series.map((r) => ({ ...r, label: r.day.slice(5) }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" fontSize={11} minTickGap={24} />
                    <YAxis allowDecimals={false} fontSize={11} width={30} />
                    <Tooltip />
                    <Line type="monotone" dataKey="signups" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
