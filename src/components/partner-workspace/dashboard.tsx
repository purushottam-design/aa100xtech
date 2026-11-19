"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Plus,
  UsersRound,
  Megaphone,
  ShieldCheck,
  CalendarClock,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from "recharts";
import { useWorkspace } from "./workspace-shell";
import {
  ApprovalTable,
  Empty,
  LoadError,
  localDate,
  rowName,
  SectionHeader,
  Skeleton,
  useWorkspaceData,
} from "./shared";
import { base, type DashboardData } from "@/lib/partner-workspace/domain";

export function Dashboard() {
  const access = useWorkspace(),
    [range, setRange] = useState("30"),
    [greeting, setGreeting] = useState("Welcome");
  const { data, error, refresh } = useWorkspaceData<DashboardData>("dashboard", { range });
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  const admin = access.role === "admin";
  return (
    <>
      <div className="pw-welcome">
        <div>
          <h1>
            <span aria-hidden="true">👋</span> {greeting}, {access.user.name.split(" ")[0]}
          </h1>
          <p>Here’s what’s happening in Creator Moves 365 today.</p>
        </div>
        <div className="pw-actions">
          {admin && (
            <Link className="pw-button pw-button-outline" href={`${base}/import`}>
              <Upload size={18} /> Import Leads
            </Link>
          )}
          <Link className="pw-button" href={`${base}/lead-add`}>
            <Plus size={21} /> Add Influencer
          </Link>
        </div>
      </div>
      {error ? (
        <LoadError message={error} retry={refresh} />
      ) : !data ? (
        <Skeleton />
      ) : (
        <>
          <div className="pw-kpis">
            {[
              {
                title: admin ? "Total Influencers" : "My Influencers",
                value: data.influencers,
                icon: UsersRound,
                href: admin ? "creators" : "my-influencers",
                note: "Current authorized roster",
                points: data.activity.map((p) => ({ value: p.leads })),
              },
              ...(admin
                ? [
                    {
                      title: "Active Campaigns",
                      value: data.campaigns,
                      icon: Megaphone,
                      href: "campaigns",
                      note: "Campaigns currently active",
                      points: data.activity.map((p) => ({ value: p.campaigns })),
                    },
                  ]
                : []),
              {
                title: "Pending Approvals",
                value: data.pending,
                icon: ShieldCheck,
                href: admin ? "deal-approvals" : "my-influencers",
                note: "Awaiting an admin decision",
                points: [],
              },
              {
                title: "Follow-ups Due",
                value: data.due,
                icon: CalendarClock,
                href: "follow-ups",
                note: "Outstanding and due now",
                points: [],
              },
            ].map(({ title, value, icon: Icon, href, note, points }) => (
              <Link href={`${base}/${href}`} className="pw-card pw-kpi" key={title}>
                <div className="pw-kpi-top">
                  <span className="pw-kpi-icon">
                    <Icon size={28} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h2>{title}</h2>
                    <strong className="pw-kpi-value">{value.toLocaleString("en-IN")}</strong>
                  </div>
                  <ArrowUpRight size={16} className="pw-kpi-arrow" />
                </div>
                <div className="pw-kpi-bottom">
                  <div>
                    <span className="pw-neutral">No comparable history</span>
                    <p>{note}</p>
                  </div>
                  {points.length > 0 && points.some((p) => p.value > 0) && (
                    <div className="pw-sparkline" aria-label="Activity in selected period">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points}>
                          <defs>
                            <linearGradient id={`spark-${href}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ffad13" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#ffad13" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#ffa000"
                            strokeWidth={1.5}
                            fill={`url(#spark-${href})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="pw-chart-grid">
            <section className="pw-card pw-activity">
              <div className="pw-card-heading">
                <h2>Lead &amp; Campaign Activity</h2>
                <div className="pw-range" aria-label="Activity date range">
                  {[
                    ["7", "7 Days"],
                    ["30", "30 Days"],
                    ["90", "90 Days"],
                    ["year", "This Year"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={range === value}
                      onClick={() => setRange(value!)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pw-legend">
                <span>
                  <i /> New Leads
                </span>
                {admin && (
                  <span>
                    <i className="navy" /> Campaigns Created
                  </span>
                )}
              </div>
              <div
                className="pw-chart"
                role="img"
                aria-label={`Daily new leads${admin ? " and campaigns created" : ""}, ${range === "year" ? "this year" : `last ${range} days`}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={data.activity}
                    margin={{ top: 12, right: 16, left: -28, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="pw-bars" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffb314" />
                        <stop offset="100%" stopColor="#ff9529" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#f0f1f4" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) =>
                        new Intl.DateTimeFormat(undefined, {
                          month: "short",
                          day: "numeric",
                          timeZone: "UTC",
                        }).format(new Date(`${v}T12:00:00Z`))
                      }
                      axisLine={false}
                      tickLine={false}
                      minTickGap={28}
                      fontSize={11}
                    />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
                    <Tooltip
                      labelFormatter={(v) => String(v)}
                      contentStyle={{ borderRadius: 12, borderColor: "#e5e7eb" }}
                    />
                    <Bar
                      dataKey="leads"
                      name="New leads"
                      fill="url(#pw-bars)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    {admin && (
                      <Line
                        type="monotone"
                        dataKey="campaigns"
                        name="Campaigns created"
                        stroke="#101633"
                        strokeWidth={2.5}
                        dot={
                          data.activity.length <= 31
                            ? { r: 3, fill: "white", strokeWidth: 2 }
                            : false
                        }
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {!data.activity.some((v) => v.leads || v.campaigns) && (
                <p className="pw-chart-note">No activity recorded in this period.</p>
              )}
              <details className="pw-chart-data">
                <summary>View chart data</summary>
                <div className="pw-table-scroll">
                  <table className="pw-table">
                    <thead>
                      <tr>
                        <th>Date (UTC)</th>
                        <th>New leads</th>
                        {admin && <th>Campaigns created</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.activity.map((p) => (
                        <tr key={p.date}>
                          <td>{p.date}</td>
                          <td>{p.leads}</td>
                          {admin && <td>{p.campaigns}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
            <section className="pw-card pw-progress">
              <h2>Lead Conversion</h2>
              <p className="pw-muted">All-time workspace activity</p>
              <div className="pw-progress-content">
                <div
                  className="pw-donut"
                  style={{
                    background: `conic-gradient(#ff9700 ${Math.min(100, Math.max(0, data.conversion))}%, #ececee 0)`,
                  }}
                  role="img"
                  aria-label={`${data.conversion}% of leads converted to an approved deal`}
                >
                  <div>
                    <strong>{data.conversion}%</strong>
                    <span>Conversion rate</span>
                  </div>
                </div>
                <dl>
                  {[
                    ["Leads Collected", data.leads, "orange"],
                    ["Deals in Progress", data.inProgress, "navy"],
                    ["Approved Deals", data.closed, "green"],
                    ["Conversion Rate", `${data.conversion}%`, "brown"],
                  ].map(([label, value, color]) => (
                    <div key={String(label)}>
                      <dt>
                        <i className={String(color)} />
                        {label}
                      </dt>
                      <dd>{typeof value === "number" ? value.toLocaleString("en-IN") : value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="pw-chart-note">
                Conversion = distinct creators with an approved deal ÷ collected influencer leads.
                No target has been configured.
              </p>
            </section>
          </div>
          <div className="pw-bottom-grid">
            {admin && (
              <section className="pw-card pw-approvals">
                <SectionHeader
                  title="Pending Deal Approvals"
                  href={`${base}/deal-approvals`}
                  count={data.pending}
                />
                <ApprovalTable rows={data.approvals} />
              </section>
            )}
            <section className="pw-card pw-followups">
              <SectionHeader title="Upcoming Follow-ups" href={`${base}/follow-ups`} />
              <div className="pw-followup-list">
                {data.followUps.length ? (
                  data.followUps.map((row) => (
                    <Link
                      href={`${base}/follow-ups`}
                      className="pw-followup"
                      key={String(row["id"])}
                    >
                      <span className="pw-calendar-icon">
                        <CalendarDays size={23} />
                      </span>
                      <div>
                        <strong>{rowName(row["influencer"])}</strong>
                        <span>{String(row["next_action"])}</span>
                        <small>Assigned to {rowName(row["assignee"])}</small>
                      </div>
                      <time
                        className={
                          new Date(String(row["due_at"])).getTime() < Date.now() ? "overdue" : ""
                        }
                      >
                        {localDate(row["due_at"], true)}
                      </time>
                    </Link>
                  ))
                ) : (
                  <Empty title="No upcoming follow-ups">
                    Scheduled next actions will appear here.
                  </Empty>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
