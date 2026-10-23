import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BadgeIndianRupee,
  LifeBuoy,
  ShoppingBag,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAnalytics } from "@/lib/super-admin-plus.functions";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="surface-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="font-display text-2xl">{value}</CardTitle>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardHeader>
    </Card>
  );
}

export function AdminDashboardAnalytics() {
  const [days, setDays] = useState(30);
  const q = useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: () => getAdminAnalytics({ data: { days } }),
    retry: false,
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading dashboard…</p>;
  if (q.isError) return <p className="text-sm text-muted-foreground">{(q.error as Error).message}</p>;

  const d = q.data!;
  const series = d.series.map((s) => ({ ...s, label: s.day.slice(5) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.days}
            size="sm"
            variant={days === r.days ? "default" : "outline"}
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-auto">
          Database {d.health.database} · API {d.health.api}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Total users" value={d.totals.totalUsers} />
        <StatCard icon={UserPlus} label="New sign-ups" value={d.totals.newUsers} hint={`last ${days} days`} />
        <StatCard icon={Activity} label="Active now" value={d.totals.activeSessions} hint="last hour" />
        <StatCard icon={BadgeIndianRupee} label="Revenue" value={d.totals.revenue.toLocaleString()} hint="paid bookings" />
        <StatCard icon={ShoppingBag} label="Paid orders" value={d.totals.paidOrders} />
        <StatCard icon={LifeBuoy} label="Open tickets" value={d.totals.openTickets} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Sign-ups</CardTitle>
            <CardDescription>New accounts per day</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} minTickGap={20} />
                <YAxis allowDecimals={false} fontSize={11} width={30} />
                <Tooltip />
                <Line type="monotone" dataKey="signups" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Revenue &amp; orders</CardTitle>
            <CardDescription>Paid consultation value per day</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="label" fontSize={11} minTickGap={20} />
                <YAxis fontSize={11} width={40} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Top services</CardTitle>
            <CardDescription>Most booked in this period</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {d.topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No paid bookings yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.topServices} dataKey="value" nameKey="name" outerRadius={90} label>
                    {d.topServices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent admin sign-ins</CardTitle>
            <CardDescription>With IP and device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(d.recentLogins as any[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>
            ) : (
              (d.recentLogins as any[]).map((l, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={l.status === "success" ? "default" : "destructive"}>{l.status}</Badge>
                  <span className="font-medium">{l.email}</span>
                  <span className="text-muted-foreground">{l.ip_address ?? "—"}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {l.logged_in_at ? new Date(l.logged_in_at).toLocaleString() : "—"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
