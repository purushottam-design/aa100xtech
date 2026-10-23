import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listTeam, updateTeamMember } from "@/lib/accounts.functions";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Company team — AA100XTech portal" },
      {
        name: "description",
        content:
          "Internal AA100XTech team directory: each person's profile, time in the company, target achieved and employee of the month.",
      },
      { property: "og:title", content: "Company team — AA100XTech portal" },
      { property: "og:description", content: "Internal team directory for AA100XTech members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

type Member = {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  joined_at: string;
  job_title: string | null;
  department: string | null;
  target_label: string | null;
  target_percent: number;
  employee_of_month_for: string | null;
  bio: string | null;
  roles: string[];
};

function tenure(joinedAt: string) {
  const start = new Date(`${joinedAt}T00:00:00Z`);
  const now = new Date();
  const totalDays = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  let months = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
  if (now.getUTCDate() < start.getUTCDate()) months -= 1;
  months = Math.max(0, months);
  const anchor = new Date(start);
  anchor.setUTCMonth(anchor.getUTCMonth() + months);
  const days = Math.max(0, Math.floor((now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)));
  return { months, days, totalDays };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

function TeamPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["team"], queryFn: () => listTeam() });

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Company members only</h1>
        <p className="mt-3 text-muted-foreground">
          The team directory is visible to AA100XTech employees and the supreme user.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to my account</Link>
        </Button>
      </div>
    );
  }

  const team = (data?.team ?? []) as Member[];
  const canEdit = data?.canEdit ?? false;
  const month = currentMonth();
  const stars = team.filter((m) => m.employee_of_month_for === month);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Our team</h1>
          <p className="mt-2 text-muted-foreground">
            Every person in the company, how long they've been with us and what they've achieved.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard">My account</Link>
        </Button>
      </div>

      {stars.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <h2 className="font-display text-xl font-semibold">Employee of the month</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recognised for {month}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stars.map((m) => (
              <Badge key={m.id}>{m.full_name || m.username}</Badge>
            ))}
          </div>
        </section>
      ) : null}

      {isLoading ? <p className="mt-10 text-muted-foreground">Loading the team…</p> : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {team.map((m) => (
          <MemberCard key={m.id} member={m} canEdit={canEdit} month={month} />
        ))}
      </div>

      {!isLoading && team.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          No company accounts yet. Issue employee accounts from the admin console.
        </p>
      ) : null}
    </div>
  );
}

function MemberCard({
  member,
  canEdit,
  month,
}: {
  member: Member;
  canEdit: boolean;
  month: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    jobTitle: member.job_title ?? "",
    department: member.department ?? "",
    joinedAt: member.joined_at,
    targetLabel: member.target_label ?? "",
    targetPercent: String(member.target_percent ?? 0),
    employeeOfMonth: member.employee_of_month_for === month,
  });

  const t = tenure(member.joined_at);
  const name = member.full_name || member.username;
  const isStar = member.employee_of_month_for === month;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const percent = Number(form.targetPercent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 999) {
      toast.error("Target achieved must be between 0 and 999");
      return;
    }
    setBusy(true);
    try {
      await updateTeamMember({
        data: {
          userId: member.id,
          jobTitle: form.jobTitle.trim() || null,
          department: form.department.trim() || null,
          joinedAt: form.joinedAt,
          targetLabel: form.targetLabel.trim() || null,
          targetPercent: Math.round(percent),
          employeeOfMonthFor: form.employeeOfMonth ? month : null,
        },
      });
      toast.success("Profile updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={`surface-card ${isStar ? "border-primary/50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 font-display text-lg font-semibold text-primary">
            {initials(name)}
          </div>
          <div>
            <CardTitle className="font-display text-lg">{name}</CardTitle>
            <CardDescription>
              {member.job_title || (member.roles.includes("supreme_admin") ? "Supreme user" : "Team member")}
              {member.department ? ` · ${member.department}` : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isStar ? <Badge>Employee of the month</Badge> : null}
        <div className="flex flex-wrap gap-2 text-muted-foreground">
          <span>@{member.username}</span>
          <span>·</span>
          <span>{member.is_active ? "Active" : "Suspended"}</span>
        </div>
        <div className="rounded-xl border border-border/60 p-3">
          <p className="text-muted-foreground">Time in the company</p>
          <p className="font-medium">
            {t.months} {t.months === 1 ? "month" : "months"} · {t.days} {t.days === 1 ? "day" : "days"}
          </p>
          <p className="text-xs text-muted-foreground">{t.totalDays} days total · joined {member.joined_at}</p>
        </div>
        <div className="rounded-xl border border-border/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Target achieved</p>
            <p className="font-medium">{member.target_percent}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, member.target_percent))}%` }}
            />
          </div>
          {member.target_label ? (
            <p className="mt-2 text-xs text-muted-foreground">{member.target_label}</p>
          ) : null}
        </div>

        {canEdit ? (
          editing ? (
            <form onSubmit={save} className="space-y-2 rounded-xl border border-border/60 p-3">
              <Field label="Role title" id={`t-${member.id}`}>
                <Input
                  id={`t-${member.id}`}
                  value={form.jobTitle}
                  maxLength={120}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                />
              </Field>
              <Field label="Department" id={`d-${member.id}`}>
                <Input
                  id={`d-${member.id}`}
                  value={form.department}
                  maxLength={120}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                />
              </Field>
              <Field label="Joined on" id={`j-${member.id}`}>
                <Input
                  id={`j-${member.id}`}
                  type="date"
                  required
                  value={form.joinedAt}
                  onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
                />
              </Field>
              <Field label="Target achieved (%)" id={`p-${member.id}`}>
                <Input
                  id={`p-${member.id}`}
                  type="number"
                  min={0}
                  max={999}
                  value={form.targetPercent}
                  onChange={(e) => setForm((f) => ({ ...f, targetPercent: e.target.value }))}
                />
              </Field>
              <Field label="Target note" id={`n-${member.id}`}>
                <Input
                  id={`n-${member.id}`}
                  value={form.targetLabel}
                  maxLength={160}
                  onChange={(e) => setForm((f) => ({ ...f, targetLabel: e.target.value }))}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.employeeOfMonth}
                  onChange={(e) => setForm((f) => ({ ...f, employeeOfMonth: e.target.checked }))}
                />
                Employee of the month ({month})
              </label>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
