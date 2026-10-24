"use client";

import { Link } from "@/lib/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  approveAccessRequest,
  getSupremeAdminAccess,
  listAccessRequests,
  listMembers,
  rejectAccessRequest,
} from "@/lib/accounts.functions";
import { SuperAdminOverview } from "@/components/super-admin-overview";
import { listPartnerApplications, reviewPartnerApplication } from "@/lib/partners.functions";

export default AdminPage;

type AccessRequest = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  personal_email: string | null;
  company_email: string | null;
  whatsapp_number: string | null;
  telegram_number: string | null;
  requested_role: string;
  company: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

/** Prefers the new split-name columns, falling back to the legacy full_name. */
function requestName(r: AccessRequest) {
  const composed = [r.first_name, r.middle_name, r.last_name]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return composed || r.full_name;
}

function requestEmail(r: AccessRequest) {
  return r.personal_email?.trim() || r.email;
}

function requestPhone(r: AccessRequest) {
  return r.whatsapp_number?.trim() || r.phone;
}


const roleLabels: Record<string, string> = {
  supreme_admin: "Supreme user",
  employee: "Employee",
  customer: "Customer",
  job_seeker: "Job seeker",
  partner: "Partner",
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function suggestUsername(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 32);
}

type IssuedCred = { username: string; email: string; phone: string; password: string; name: string };

function credentialMessage(c: IssuedCred) {
  return [
    `Hello ${c.name},`,
    "",
    "Your AA100XTech portal account has been approved by the supreme user (aman@aa100xtech.com). Here are your account details:",
    `Username: ${c.username}`,
    `Email: ${c.email}`,
    `Phone: ${c.phone}`,
    `Temporary password: ${c.password}`,
    "",
    "Sign in at https://aa100xtech.lovable.app/auth and change your password right away.",
  ].join("\n");
}

function mailtoLink(c: IssuedCred) {
  return `mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(
    "Your AA100XTech portal account",
  )}&body=${encodeURIComponent(credentialMessage(c))}`;
}

function smsLink(c: IssuedCred) {
  return `sms:${encodeURIComponent(c.phone)}?&body=${encodeURIComponent(credentialMessage(c))}`;
}

function whatsappLink(c: IssuedCred) {
  return `https://wa.me/${c.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
    credentialMessage(c),
  )}`;
}

function AdminPage() {
  const queryClient = useQueryClient();
  const [issued, setIssued] = useState<IssuedCred[]>([]);
  const access = useQuery({
    queryKey: ["supreme-admin-access"],
    queryFn: () => getSupremeAdminAccess(),
    retry: false,
    throwOnError: false,
  });

  const requests = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => listAccessRequests(),
    enabled: access.data?.allowed === true,
    retry: false,
    throwOnError: false,
  });
  const members = useQuery({
    queryKey: ["members"],
    queryFn: () => listMembers(),
    enabled: access.data?.allowed === true,
    retry: false,
    throwOnError: false,
  });

  if (access.isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-muted-foreground">Checking access…</div>;
  }

  if (access.isError || !access.data?.allowed || requests.isError || members.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Supreme user access only</h1>
        <p className="mt-3 text-muted-foreground">
          This console is restricted to the company's supreme user.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to my account</Link>
        </Button>
      </div>
    );
  }

  const list = (requests.data ?? []) as AccessRequest[];
  const pending = list.filter((r) => r.status === "pending");
  const handled = list.filter((r) => r.status !== "pending");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Admin console</h1>
          <p className="mt-2 text-muted-foreground">
            Approve verified people and allot their username, email, phone and password.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard">My account</Link>
        </Button>
      </div>

      <SuperAdminOverview />

      {issued.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <h2 className="font-display text-xl font-semibold">Credentials just allotted</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy and share these now — the password is not stored anywhere and cannot be shown again.
          </p>
          <div className="mt-4 space-y-3 text-sm">
            {issued.map((c) => (
              <div key={c.username} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium">{c.name}</p>
                <p>Username: {c.username}</p>
                <p>Email: {c.email}</p>
                <p>Phone: {c.phone}</p>
                <p>Password: {c.password}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={mailtoLink(c)}>Send by email</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={smsLink(c)}>Send by SMS</a>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={whatsappLink(c)} target="_blank" rel="noreferrer">
                      Send on WhatsApp
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(credentialMessage(c));
                      toast.success("Credentials copied");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Pending requests ({pending.length})</h2>
        <div className="mt-4 space-y-4">
          {requests.isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
          {!requests.isLoading && pending.length === 0 ? (
            <p className="text-muted-foreground">No pending requests right now.</p>
          ) : null}
          {pending.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              onIssued={(cred) => setIssued((prev) => [cred, ...prev])}
              onDone={() => {
                queryClient.invalidateQueries({ queryKey: ["access-requests"] });
                queryClient.invalidateQueries({ queryKey: ["members"] });
              }}
            />
          ))}
        </div>
      </section>

      <PartnerApplications />


      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Member accounts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(members.data ?? []).map((m: any) => (
            <Card key={m.id} className="surface-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base">{m.full_name || m.username}</CardTitle>
                <CardDescription>@{m.username}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{m.email}</p>
                <p>{m.phone ?? "—"}</p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {(m.roles ?? []).map((role: string) => (
                    <Badge key={role} variant="secondary">
                      {roleLabels[role] ?? role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {members.data && members.data.length === 0 ? (
            <p className="text-muted-foreground">No accounts issued yet.</p>
          ) : null}
        </div>
      </section>

      {handled.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Handled requests</h2>
          <div className="mt-4 space-y-2">
            {handled.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm"
              >
                <span className="font-medium">{requestName(r)}</span>
                <span className="text-muted-foreground">{requestEmail(r)}</span>

                <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RequestCard({
  request,
  onDone,
  onIssued,
}: {
  request: AccessRequest;
  onDone: () => void;
  onIssued: (cred: IssuedCred) => void;
}) {
  const displayName = requestName(request);
  const [username, setUsername] = useState(suggestUsername(displayName));
  const [email, setEmail] = useState(requestEmail(request));
  const [phone, setPhone] = useState(requestPhone(request));

  const [password, setPassword] = useState(generatePassword());
  const [role, setRole] = useState(request.requested_role);
  const [busy, setBusy] = useState(false);
  const [issuedLocal, setIssuedLocal] = useState(false);

  async function approve() {
    setBusy(true);
    try {
      await approveAccessRequest({
        data: { requestId: request.id, username, email, phone, password, role: role as any },
      });
      setIssuedLocal(true);
      onIssued({ username, email, phone, password, name: displayName });
      toast.success("Account created — share the credentials with them");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the account");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setBusy(true);
    try {
      await rejectAccessRequest({ data: { requestId: request.id } });
      toast.success("Request rejected");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reject the request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">{displayName}</CardTitle>
        <CardDescription>
          Wants a {roleLabels[request.requested_role] ?? request.requested_role} account
          {request.company ? ` · ${request.company}` : ""}
        </CardDescription>
        <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
          <p>Personal email: {requestEmail(request)}</p>
          <p>Company email: {request.company_email?.trim() || "—"}</p>
          <p>WhatsApp: {requestPhone(request)}</p>
          <p>Telegram: {request.telegram_number?.trim() || "—"}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {request.message ? (
          <p className="text-sm text-muted-foreground">{request.message}</p>
        ) : null}

        {issuedLocal ? (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm">
            <p className="font-medium">Credentials allotted — copy them now:</p>
            <p className="mt-2">Username: {username}</p>
            <p>Email: {email}</p>
            <p>Phone: {phone}</p>
            <p>Password: {password}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={40} />
              </div>
              <div className="space-y-2">
                <Label>Login email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
              </div>
              <div className="space-y-2">
                <Label>Account type</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Allotted password</Label>
                <div className="flex gap-2">
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
                  <Button type="button" variant="outline" onClick={() => setPassword(generatePassword())}>
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={approve} disabled={busy}>
                {busy ? "Working…" : "Approve & create account"}
              </Button>
              <Button variant="outline" onClick={reject} disabled={busy}>
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type PartnerApp = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  platforms: string | null;
  handle: string | null;
  followers: string | null;
  plan_name: string | null;
  affiliate_platforms: string | null;
  target_level: string | null;
  motivation: string | null;
  status: string;
  created_at: string;
};

function PartnerApplications() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const apps = useQuery({
    queryKey: ["partner-applications"],
    queryFn: () => listPartnerApplications(),
    retry: false,
    throwOnError: false,
  });


  async function review(id: string, status: "approved" | "rejected") {
    setBusy(id);
    try {
      await reviewPartnerApplication({ data: { applicationId: id, status } });
      toast.success(status === "approved" ? "Partner approved" : "Application rejected");
      queryClient.invalidateQueries({ queryKey: ["partner-applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the application");
    } finally {
      setBusy(null);
    }
  }

  const list = (apps.data ?? []) as PartnerApp[];
  const pending = list.filter((a) => a.status === "pending");

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold">
        Partner applications ({pending.length} pending)
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Affiliate and influencer sign-ups wait here until the supreme user approves them.
      </p>
      <div className="mt-4 space-y-3">
        {apps.isLoading ? <p className="text-muted-foreground">Loading…</p> : null}
        {!apps.isLoading && list.length === 0 ? (
          <p className="text-muted-foreground">No partner applications yet.</p>
        ) : null}
        {list.map((a) => (
          <Card key={a.id} className="surface-card">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="font-display text-base">{a.full_name}</CardTitle>
                <Badge variant={a.status === "approved" ? "default" : "secondary"}>
                  {a.status}
                </Badge>
              </div>
              <CardDescription>
                {a.email}
                {a.phone ? ` · ${a.phone}` : ""}
                {a.country ? ` · ${a.country}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>Plan: {a.plan_name ?? a.target_level ?? "—"}</p>
              <p>
                Audience: {a.platforms ?? "—"} {a.handle ? `(${a.handle})` : ""}{" "}
                {a.followers ? `· ${a.followers}` : ""}
              </p>
              <p>Affiliate platforms: {a.affiliate_platforms || "—"}</p>
              {a.motivation ? <p className="pt-1 text-foreground/80">{a.motivation}</p> : null}
              {a.status === "pending" ? (
                <div className="flex flex-wrap gap-2 pt-3">
                  <Button size="sm" disabled={busy === a.id} onClick={() => void review(a.id, "approved")}>
                    Approve partner
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === a.id}
                    onClick={() => void review(a.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
