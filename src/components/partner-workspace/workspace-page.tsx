"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Upload,
  ArrowRight,
  Download,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  ExternalLink,
  CalendarClock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { workspaceApi } from "@/lib/partner-workspace/api";
import {
  base,
  moduleTitles,
  leadSchema,
  assignmentDeadline,
  type LeadInput,
  type WorkspaceRow,
} from "@/lib/partner-workspace/domain";
import { parseLeadCsv } from "@/lib/partner-workspace/import";
import { useWorkspace } from "./workspace-shell";
import { Dashboard } from "./dashboard";
import {
  ApprovalTable,
  Badge,
  Empty,
  LoadError,
  localDate,
  money,
  rowName,
  Skeleton,
  useWorkspaceData,
} from "./shared";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="pw-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function useMutation(refresh?: () => void) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null),
    [error, setError] = useState<string | null>(null);
  async function run(operation: string, input: unknown, success = "Changes saved.") {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const result = await workspaceApi(operation, input);
      setMessage(success);
      refresh?.();
      return { ok: true, data: result };
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save changes.");
      return { ok: false, data: null };
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    message,
    error,
    run,
    feedback: (
      <>
        {error && (
          <p className="pw-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="pw-success" role="status">
            <Check size={16} />
            {message}
          </p>
        )}
      </>
    ),
  };
}
function Confirm({
  open,
  onClose,
  title,
  children,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{children}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export function WorkspacePage({ module, recordId }: { module: string; recordId: string | null }) {
  const access = useWorkspace();
  if (recordId) return <RecordDetail module={module} id={recordId} />;
  if (["overview", "dashboard"].includes(module)) return <Dashboard />;
  if (module === "lead-add")
    return (
      <>
        <PageTitle
          module={module}
          description="Add a lead for admin review. Collecting a lead does not publish a creator or approve a deal."
        />
        <div className="pw-card pw-form-card">
          <LeadForm domain="influencer" />
        </div>
      </>
    );
  if (["import", "lead-import"].includes(module)) return <ImportPage />;
  if (module === "reports")
    return (
      <>
        <PageTitle
          module={module}
          description="Current operational counts and date-based activity for your authorized workspace."
        />
        <Dashboard />
      </>
    );
  if (["admin", "panel"].includes(module))
    return (
      <>
        <PageTitle module={module} description="Manage the Creator Moves 365 workspace." />
        <div className="pw-hub-grid">
          {[
            "imtm",
            "lead-team",
            "permissions",
            "influencer-logins",
            "ownership",
            "duplicates",
            "companies",
            "allocations",
            "activity",
            "settings",
          ].map((key) => (
            <Link className="pw-card" key={key} href={`${base}/${key}`}>
              <ShieldCheck size={24} />
              <h2>{moduleTitles[key]}</h2>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </>
    );
  if (module === "me")
    return (
      <>
        <PageTitle
          module={module}
          description="Your existing AA100XTech identity and authorized workspace access."
        />
        <div className="pw-card pw-form-card">
          <h2>{access.user.name}</h2>
          <dl className="pw-detail-grid">
            <dt>Email</dt>
            <dd>{access.user.email}</dd>
            <dt>Partners role</dt>
            <dd>{access.role}</dd>
            <dt>Membership</dt>
            <dd>
              <Badge value={access.state} />
            </dd>
            {access.domain && (
              <>
                <dt>Lead domain</dt>
                <dd>{access.domain}</dd>
              </>
            )}
          </dl>
          <Link className="pw-text-link" href="/profile">
            Open AA100XTech profile <ExternalLink size={16} />
          </Link>
        </div>
      </>
    );
  if (module === "matchmaker")
    return (
      <>
        <PageTitle
          module={module}
          description="Find relevant creators for an authorized brand brief."
        />
        <Matchmaker />
      </>
    );
  if (module === "settings")
    return (
      <>
        <PageTitle module={module} description="Workspace policies and access management." />
        <div className="pw-card pw-form-card">
          <h2>Workspace policies</h2>
          <dl className="pw-detail-grid">
            <dt>Identity provider</dt>
            <dd>Shared AA100XTech Supabase Auth</dd>
            <dt>Assignment window</dt>
            <dd>7 days; time under admin review is paused.</dd>
            <dt>Membership</dt>
            <dd>Approval and an active linked account are required.</dd>
          </dl>
          <Link href={`${base}/permissions`} className="pw-button pw-button-outline">
            Review memberships
          </Link>
          <p className="pw-muted">
            Policy editing and staff provisioning require the source account-management integration.
          </p>
        </div>
      </>
    );
  const aliases: Record<string, string> = {
    "lead-overview": "lead-dashboard",
    "my-tasks": "follow-ups",
    team: "team-accounts",
    ownership: "creators",
  };
  const key = aliases[module] ?? module;
  if (
    [
      "creators",
      "my-influencers",
      "lead-dashboard",
      "my-leads",
      "gamer-leads",
      "campaigns",
      "projects",
      "inventory",
      "products",
      "shipments",
      "deal-approvals",
      "follow-ups",
      "imtm",
      "team-accounts",
      "lead-team",
      "permissions",
      "activity",
    ].includes(key)
  )
    return <RecordsPage module={key} />;
  return (
    <>
      <PageTitle module={module} />
      <div className="pw-card">
        <Empty title="This workflow is awaiting integration">
          This feature needs the original Partners workflow and reconciled database schema before it
          can be used. Contact your workspace operator for setup progress.
        </Empty>
      </div>
    </>
  );
}
function PageTitle({
  module,
  description,
  children,
}: {
  module: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="pw-welcome">
      <div>
        <span className="pw-eyebrow">CREATOR MOVES 365</span>
        <h1>{moduleTitles[module]}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="pw-actions">{children}</div>
    </div>
  );
}
function LeadForm({ domain, onSaved }: { domain: "influencer" | "gamer"; onSaved?: () => void }) {
  const [lead, setLead] = useState<LeadInput>({
    name: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    category: "",
    notes: "",
    socials: [{ platform: "instagram", handle: "", url: "", followers: 0 }],
  });
  const mutation = useMutation();
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = leadSchema.safeParse(lead);
    if (!parsed.success) return;
    const result = await mutation.run(
      "add-lead",
      { domain, rows: [parsed.data] },
      "Lead saved for admin review.",
    );
    if (result.ok) onSaved?.();
  }
  return (
    <form className="pw-form" onSubmit={submit}>
      <div className="pw-fields">
        {["name", "email", "phone", "city", "country", "category"].map((key) => (
          <Field
            key={key}
            label={`${key.charAt(0).toUpperCase() + key.slice(1)}${key === "name" ? " *" : ""}`}
          >
            <input
              required={key === "name"}
              minLength={key === "name" ? 2 : undefined}
              maxLength={key === "phone" ? 40 : 200}
              type={key === "email" ? "email" : "text"}
              value={String(lead[key as keyof LeadInput])}
              onChange={(e) => setLead((v) => ({ ...v, [key]: e.target.value }))}
            />
          </Field>
        ))}
      </div>
      <div className="pw-card-heading">
        <h2>Social accounts</h2>
        <button
          type="button"
          className="pw-text-link"
          disabled={lead.socials.length >= 10}
          onClick={() =>
            setLead((v) => ({
              ...v,
              socials: [...v.socials, { platform: "instagram", handle: "", url: "", followers: 0 }],
            }))
          }
        >
          <Plus size={16} /> Add account
        </button>
      </div>
      {lead.socials.map((social, index) => (
        <fieldset className="pw-social-fields" key={index}>
          <legend className="sr-only">Social account {index + 1}</legend>
          <Field label="Platform">
            <select
              value={social.platform}
              onChange={(e) =>
                setLead((v) => ({
                  ...v,
                  socials: v.socials.map((s, i) =>
                    i === index ? { ...s, platform: e.target.value as typeof social.platform } : s,
                  ),
                }))
              }
            >
              {["instagram", "youtube", "facebook", "x", "tiktok", "twitch", "other"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          {["handle", "url", "followers"].map((key) => (
            <Field
              key={key}
              label={
                key === "url" ? "HTTPS profile URL *" : key === "handle" ? "Handle *" : "Followers"
              }
            >
              <input
                type={key === "followers" ? "number" : key === "url" ? "url" : "text"}
                min={0}
                max={key === "followers" ? 1e10 : undefined}
                required
                maxLength={key === "url" ? 500 : 120}
                pattern={key === "url" ? "https://.*" : undefined}
                value={social[key as keyof typeof social]}
                onChange={(e) =>
                  setLead((v) => ({
                    ...v,
                    socials: v.socials.map((s, i) =>
                      i === index
                        ? {
                            ...s,
                            [key]: key === "followers" ? Number(e.target.value) : e.target.value,
                          }
                        : s,
                    ),
                  }))
                }
              />
            </Field>
          ))}
          {lead.socials.length > 1 && (
            <button
              type="button"
              className="pw-icon-button"
              aria-label={`Remove social account ${index + 1}`}
              onClick={() =>
                setLead((v) => ({ ...v, socials: v.socials.filter((_, i) => i !== index) }))
              }
            >
              <X size={18} />
            </button>
          )}
        </fieldset>
      ))}
      <Field label="Internal notes">
        <textarea
          rows={3}
          maxLength={4000}
          value={lead.notes}
          onChange={(e) => setLead((v) => ({ ...v, notes: e.target.value }))}
        />
      </Field>
      {mutation.feedback}
      <button className="pw-button" disabled={mutation.busy}>
        {mutation.busy ? "Saving…" : "Save lead for review"}
      </button>
    </form>
  );
}
function RecordsPage({ module }: { module: string }) {
  const access = useWorkspace(),
    [page, setPage] = useState(1),
    [filter, setFilter] = useState({
      search: "",
      platform: "",
      city: "",
      country: "",
      category: "",
      minFollowers: 0,
      maxFollowers: 1e10,
    });
  const { data, error, refresh } = useWorkspaceData<{ rows: WorkspaceRow[]; count: number }>(
    "list",
    { module, page, ...filter },
  );
  const [creating, setCreating] = useState(false),
    [confirmTask, setConfirmTask] = useState<string | null>(null);
  const mutation = useMutation(refresh);
  const leadModule = ["lead-dashboard", "my-leads", "gamer-leads"].includes(module),
    identity = leadModule || ["creators", "my-influencers"].includes(module);
  const searchable =
    identity ||
    [
      "campaigns",
      "projects",
      "products",
      "inventory",
      "imtm",
      "team-accounts",
      "lead-team",
    ].includes(module);
  return (
    <>
      <PageTitle
        module={module}
        description={
          identity
            ? "Search authorized records, review social profiles and follow the next step."
            : "Manage your authorized workspace records."
        }
      >
        {leadModule && (
          <>
            <Link
              className="pw-button pw-button-outline"
              href={`${base}/${module === "gamer-leads" ? "gamer-leads#import" : access.role === "admin" ? "import" : "lead-import"}`}
            >
              <Upload size={17} /> Import
            </Link>
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <button className="pw-button">
                  <Plus size={18} /> Add lead
                </button>
              </DialogTrigger>
              <DialogContent className="pw pw-dialog">
                <DialogHeader>
                  <DialogTitle>
                    Add {module === "gamer-leads" ? "gamer" : "influencer"} lead
                  </DialogTitle>
                  <DialogDescription>
                    Save a new lead for review using your authorized account.
                  </DialogDescription>
                </DialogHeader>
                <LeadForm
                  domain={module === "gamer-leads" ? "gamer" : "influencer"}
                  onSaved={() => {
                    setCreating(false);
                    refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
        {["creators", "my-influencers"].includes(module) && (
          <Link className="pw-button" href={`${base}/lead-add`}>
            <Plus size={18} /> Add influencer lead
          </Link>
        )}
        {["campaigns", "projects", "inventory", "products"].includes(module) && (
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <button className="pw-button">
                <Plus size={18} /> Add{" "}
                {module === "inventory" || module === "products" ? "product" : module.slice(0, -1)}
              </button>
            </DialogTrigger>
            <DialogContent className="pw pw-dialog">
              <DialogHeader>
                <DialogTitle>
                  Create {module === "inventory" ? "product" : module.slice(0, -1)}
                </DialogTitle>
                <DialogDescription>Save a record in your Partner Workspace.</DialogDescription>
              </DialogHeader>
              <OperationForm
                kind={module === "inventory" ? "products" : module}
                onSaved={() => {
                  setCreating(false);
                  refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </PageTitle>
      {searchable && (
        <form
          className="pw-card pw-filters"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setPage(1);
            setFilter({
              search: String(form.get("search") ?? ""),
              platform: String(form.get("platform") ?? ""),
              city: String(form.get("city") ?? ""),
              country: String(form.get("country") ?? ""),
              category: String(form.get("category") ?? ""),
              minFollowers: Number(form.get("minFollowers") || 0),
              maxFollowers: Number(form.get("maxFollowers") || 1e10),
            });
          }}
        >
          <Field label="Search by name">
            <input name="search" placeholder="Search records…" maxLength={100} />
          </Field>
          {identity && (
            <>
              <Field label="Platform">
                <select name="platform">
                  <option value="">All platforms</option>
                  {["instagram", "youtube", "facebook", "x", "tiktok", "twitch", "other"].map(
                    (p) => (
                      <option key={p}>{p}</option>
                    ),
                  )}
                </select>
              </Field>
              {["city", "country", "category"].map((key) => (
                <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                  <input name={key} maxLength={100} />
                </Field>
              ))}
              <Field label="Min followers">
                <input name="minFollowers" type="number" min={0} />
              </Field>
              <Field label="Max followers">
                <input name="maxFollowers" type="number" min={0} max={1e10} />
              </Field>
            </>
          )}
          <button className="pw-button pw-button-outline">
            <Search size={16} /> Apply filters
          </button>
        </form>
      )}
      {mutation.feedback}
      {error ? (
        <LoadError message={error} retry={refresh} />
      ) : !data ? (
        <Skeleton />
      ) : (
        <section className="pw-card">
          <div className="pw-card-heading">
            <h2>
              {moduleTitles[module]} <span className="pw-muted">({data.count})</span>
            </h2>
            <button className="pw-text-link" onClick={refresh}>
              Refresh
            </button>
          </div>
          {module === "deal-approvals" ? (
            <ApprovalTable rows={data.rows} />
          ) : !data.rows.length ? (
            <Empty />
          ) : (
            <div className="pw-table-scroll">
              <table className="pw-table">
                <thead>
                  <tr>
                    {(identity
                      ? [
                          "Name / Social Profiles",
                          "Location",
                          "Category",
                          "Status",
                          "Created",
                          "Action",
                        ]
                      : module === "follow-ups"
                        ? ["Influencer", "Next action", "Assigned to", "Due", "Action"]
                        : ["Name / Reference", "Details", "Status", "Created", "Action"]
                    ).map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={String(row["id"] ?? row["user_id"])}>
                      {identity ? (
                        <>
                          <td>
                            <strong>{String(row["name"])}</strong>
                            {Array.isArray(row["socials"]) &&
                              row["socials"].map((s: Record<string, unknown>, i: number) => (
                                <small key={i}>
                                  <a
                                    href={String(s["url"])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {String(s["platform"])} · @{String(s["handle"])}{" "}
                                    <ExternalLink size={11} />
                                  </a>
                                </small>
                              ))}
                          </td>
                          <td>{[row["city"], row["country"]].filter(Boolean).join(", ") || "—"}</td>
                          <td>{String(row["category"] || "—")}</td>
                          <td>
                            <Badge value={row["stage"] ?? row["status"]} />
                          </td>
                          <td>{localDate(row["created_at"])}</td>
                          <td>
                            {module !== "gamer-leads" &&
                              (access.role === "admin" || !leadModule) && (
                                <Link
                                  className="pw-button pw-button-outline pw-button-small"
                                  href={`${base}/${leadModule ? "leads" : "influencers"}/${row["id"]}`}
                                >
                                  View
                                </Link>
                              )}
                          </td>
                        </>
                      ) : module === "follow-ups" ? (
                        <>
                          <td>
                            <strong>{rowName(row["influencer"])}</strong>
                          </td>
                          <td>{String(row["next_action"])}</td>
                          <td>{rowName(row["assignee"])}</td>
                          <td>
                            {localDate(row["due_at"], true)}
                            {new Date(String(row["due_at"])).getTime() < Date.now() && (
                              <small className="pw-overdue">Overdue</small>
                            )}
                          </td>
                          <td>
                            <button
                              disabled={mutation.busy}
                              className="pw-button pw-button-outline pw-button-small"
                              onClick={() => setConfirmTask(String(row["id"]))}
                            >
                              Complete
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong>
                              {String(
                                row["name"] ??
                                  row["tracking_number"] ??
                                  row["action"] ??
                                  row["user_id"] ??
                                  "Record",
                              )}
                            </strong>
                            {!!row["sku"] && <small>{String(row["sku"])}</small>}
                          </td>
                          <td>
                            {row["stock"] !== undefined
                              ? `${row["stock"]} available`
                              : String(
                                  row["brand"] ??
                                    row["lead_domain"] ??
                                    row["role"] ??
                                    row["entity"] ??
                                    row["carrier"] ??
                                    "—",
                                )}
                          </td>
                          <td>
                            <Badge
                              value={
                                row["status"] ??
                                (row["active"] !== undefined
                                  ? row["active"]
                                    ? "active"
                                    : "disabled"
                                  : "recorded")
                              }
                            />
                          </td>
                          <td>{localDate(row["created_at"])}</td>
                          <td>
                            {["inventory", "products"].includes(module) && (
                              <StockForm row={row} refresh={refresh} />
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="pw-pagination">
            <span>
              {data.count
                ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, data.count)} of ${data.count}`
                : "0 records"}
            </span>
            <div>
              <button
                className="pw-button pw-button-outline pw-button-small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="pw-button pw-button-outline pw-button-small"
                disabled={page * 20 >= data.count}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
      <Confirm
        open={!!confirmTask}
        onClose={() => setConfirmTask(null)}
        title="Complete this follow-up?"
        onConfirm={() => {
          void mutation.run("complete-task", { id: confirmTask }, "Follow-up completed.");
          setConfirmTask(null);
        }}
      >
        Confirm that the scheduled next action has been completed.
      </Confirm>
      {module === "gamer-leads" && (
        <div id="import">
          <ImportPage domain="gamer" />
        </div>
      )}
    </>
  );
}
function OperationForm({ kind, onSaved }: { kind: string; onSaved: () => void }) {
  const mutation = useMutation();
  return (
    <form
      className="pw-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const result = await mutation.run("create-operation", {
          kind,
          name: f.get("name"),
          brand: f.get("brand") ?? "",
          sku: f.get("sku") ?? "",
          status: f.get("status") ?? "draft",
        });
        if (result.ok) onSaved();
      }}
    >
      <Field label="Name *">
        <input name="name" required minLength={2} maxLength={200} />
      </Field>
      {kind === "products" ? (
        <Field label="Unique SKU *">
          <input name="sku" required maxLength={100} />
        </Field>
      ) : (
        <>
          {kind === "campaigns" && (
            <Field label="Brand">
              <input name="brand" maxLength={200} />
            </Field>
          )}
          <Field label="Status">
            <select name="status">
              {["draft", "active", "completed", "cancelled"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </>
      )}
      {mutation.feedback}
      <button className="pw-button" disabled={mutation.busy}>
        {mutation.busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
function StockForm({ row, refresh }: { row: WorkspaceRow; refresh: () => void }) {
  const mutation = useMutation(refresh),
    [open, setOpen] = useState(false),
    [adjustment, setAdjustment] = useState<Record<string, unknown> | null>(null);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="pw-button pw-button-outline pw-button-small">Adjust stock</button>
      </DialogTrigger>
      <DialogContent className="pw">
        <DialogHeader>
          <DialogTitle>Adjust {String(row["name"])} stock</DialogTitle>
          <DialogDescription>
            Current available stock: {String(row["stock"])}. Negative adjustments cannot exceed
            availability.
          </DialogDescription>
        </DialogHeader>
        <form
          className="pw-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setAdjustment({
              id: row["id"],
              quantity: Number(f.get("quantity")),
              reason: f.get("reason"),
              requestId: crypto.randomUUID(),
            });
          }}
        >
          <Field label="Quantity change (+ / −)">
            <input
              name="quantity"
              type="number"
              min={-Number(row["stock"])}
              max={1000000}
              required
            />
          </Field>
          <Field label="Reason">
            <textarea name="reason" minLength={3} maxLength={500} required />
          </Field>
          {mutation.feedback}
          <button className="pw-button" disabled={mutation.busy}>
            Review adjustment
          </button>
        </form>
        <Confirm
          open={!!adjustment}
          onClose={() => setAdjustment(null)}
          title="Apply this stock adjustment?"
          onConfirm={async () => {
            const result = await mutation.run("adjust-stock", adjustment);
            setAdjustment(null);
            if (result.ok) setOpen(false);
          }}
        >
          Change stock by {String(adjustment?.["quantity"])} units. This movement will be recorded
          in the audit history.
        </Confirm>
      </DialogContent>
    </Dialog>
  );
}
function ImportPage({ domain = "influencer" }: { domain?: "influencer" | "gamer" }) {
  const [rows, setRows] = useState<ReturnType<typeof parseLeadCsv>>([]),
    [parseError, setParseError] = useState<string | null>(null),
    [outcomes, setOutcomes] = useState<{ row: number; status: string }[]>([]),
    [progress, setProgress] = useState(0);
  const mutation = useMutation();
  async function importRows() {
    const valid = rows.filter((r): r is typeof r & { lead: LeadInput } => !!r.lead);
    setOutcomes([]);
    setProgress(0);
    for (let i = 0; i < valid.length; i += 100) {
      const chunk = valid.slice(i, i + 100);
      const result = await mutation.run(
        "import-leads",
        { domain, rows: chunk.map((r) => r.lead) },
        "Batch saved.",
      );
      if (!result.ok) break;
      const batch = (result.data as { outcomes: { row: number; status: string }[] }).outcomes;
      setOutcomes((o) => [
        ...o,
        ...batch.map((r) => ({ row: chunk[r.row - 1]!.row, status: r.status })),
      ]);
      setProgress(i + chunk.length);
    }
  }
  const [importing, setImporting] = useState(false);
  return (
    <>
      <PageTitle
        module="import"
        description={`Validate and import ${domain} leads. Ownership is assigned from your signed-in account.`}
      />
      <div className="pw-card pw-form-card">
        <h2>CSV import</h2>
        <p className="pw-muted">
          Required columns: name, platform, handle, url. Optional: email, phone, city, country,
          category, followers, notes. One social account per CSV row; use manual entry for multiple
          profiles. Excel and Google Sheets import are awaiting source integration.
        </p>
        <Field label="Choose CSV (up to 2 MB / 1,000 rows)">
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={importing}
            onChange={async (e) => {
              setRows([]);
              setOutcomes([]);
              setParseError(null);
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 2_000_000) throw new Error("Choose a file smaller than 2 MB.");
                setRows(parseLeadCsv(await file.text()));
              } catch (error) {
                setParseError(error instanceof Error ? error.message : "Unable to read CSV.");
              }
            }}
          />
        </Field>
        {parseError && (
          <p className="pw-error" role="alert">
            {parseError}
          </p>
        )}
        {!!rows.length && (
          <>
            <div className="pw-card-heading">
              <strong>
                {rows.filter((r) => r.lead).length} valid · {rows.filter((r) => !r.lead).length}{" "}
                invalid
              </strong>
              <button
                className="pw-button"
                disabled={importing || !rows.some((r) => r.lead)}
                onClick={async () => {
                  setImporting(true);
                  try {
                    await importRows();
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                <Upload size={17} />
                {importing ? "Importing…" : "Import valid rows"}
              </button>
            </div>
            <progress
              className="pw-import-progress"
              value={progress}
              max={rows.filter((r) => r.lead).length}
              aria-label="Import progress"
            />
            <p className="pw-muted" role="status">
              {progress} processed · {outcomes.filter((o) => o.status === "inserted").length}{" "}
              inserted · {outcomes.filter((o) => o.status === "duplicate").length} duplicates.
              Retries preserve existing social identities.
            </p>
            <div className="pw-table-scroll">
              <table className="pw-table">
                <thead>
                  <tr>
                    <th>CSV row</th>
                    <th>Name</th>
                    <th>Validation / outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r) => (
                    <tr key={r.row}>
                      <td>{r.row}</td>
                      <td>{r.lead?.name ?? "—"}</td>
                      <td>{outcomes.find((o) => o.row === r.row)?.status ?? r.error ?? "Ready"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <p className="pw-muted">
                Preview shows the first 100 rows. All valid rows are imported in batches of 100.
              </p>
            )}
          </>
        )}
        {mutation.feedback}
      </div>
    </>
  );
}
function Matchmaker() {
  const mutation = useMutation();
  return (
    <div className="pw-card pw-form-card">
      <div className="pw-configuration">
        <Sparkles size={26} />
        <h2>AI matching configuration required</h2>
        <p>
          The authorized AI provider and per-user quota policy must be connected before
          recommendations can run.
        </p>
      </div>
      <form
        className="pw-form"
        onSubmit={(e) => {
          e.preventDefault();
          void mutation.run("match-creators", Object.fromEntries(new FormData(e.currentTarget)));
        }}
      >
        <Field label="Brand / campaign requirements">
          <textarea name="requirements" rows={4} required maxLength={4000} />
        </Field>
        <div className="pw-fields">
          {["category", "platform", "country"].map((key) => (
            <Field key={key} label={key}>
              <input name={key} maxLength={100} />
            </Field>
          ))}
          <Field label="Minimum followers">
            <input name="minFollowers" type="number" min={0} />
          </Field>
        </div>
        {mutation.feedback}
        <button className="pw-button" disabled={mutation.busy}>
          <Sparkles size={17} /> Check matching availability
        </button>
      </form>
    </div>
  );
}

function RecordDetail({ module, id }: { module: string; id: string }) {
  const kind =
    module === "deal-approvals" ? "approval" : module === "leads" ? "lead" : "influencer";
  const { data, error, refresh } = useWorkspaceData<{
    record: WorkspaceRow;
    draft?: { revision: number; terms: WorkspaceRow };
    communications?: WorkspaceRow[];
  }>("detail", { kind, id });
  const mutation = useMutation(refresh),
    router = useRouter(),
    access = useWorkspace();
  const [decision, setDecision] = useState<string | null>(null),
    [note, setNote] = useState("");
  if (error) return <LoadError message={error} retry={refresh} />;
  if (!data) return <Skeleton />;
  const row = data.record;
  return (
    <>
      <PageTitle
        module={module}
        description={String(row["name"] ?? `Deal revision ${row["revision"] ?? ""}`)}
      />
      {mutation.feedback}
      {kind === "approval" ? (
        <div className="pw-card pw-form-card">
          <h2>Submitted deal snapshot</h2>
          <TermsView terms={row["snapshot"] as WorkspaceRow} />
          <p>
            <Badge value={row["status"]} /> · Submitted {localDate(row["created_at"], true)}
          </p>
          {!!row["review_note"] && <p>{String(row["review_note"])}</p>}
          {row["status"] === "pending" && (
            <>
              <Field label="Decision note (required)">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  minLength={3}
                  maxLength={1000}
                />
              </Field>
              <div className="pw-actions">
                {[
                  ["approved", "Approve"],
                  ["changes_requested", "Request changes"],
                  ["rejected", "Reject"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={`pw-button ${value === "approved" ? "" : "pw-button-outline"}`}
                    disabled={mutation.busy || note.trim().length < 3}
                    onClick={() => setDecision(value!)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="pw-muted">
            The saved snapshot is immutable. Agreements, advanced commercial terms and reopening
            require the remaining source integration.
          </p>
        </div>
      ) : (
        <>
          <div className="pw-card pw-form-card">
            <h2>{String(row["name"])}</h2>
            <dl className="pw-detail-grid">
              {["email", "phone", "city", "country", "category", "status", "stage"]
                .filter((k) => row[k])
                .map((key) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(row[key])}</dd>
                  </div>
                ))}
            </dl>
            {Array.isArray(row["socials"]) &&
              row["socials"].map((s: WorkspaceRow, i: number) => (
                <p key={i}>
                  <a
                    className="pw-text-link"
                    href={String(s["url"])}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {String(s["platform"])} · @{String(s["handle"])} ·{" "}
                    {Number(s["followers"]).toLocaleString()} followers <ExternalLink size={14} />
                  </a>
                </p>
              ))}
            {kind === "lead" && access.role === "admin" && (
              <button
                className="pw-button"
                disabled={mutation.busy}
                onClick={() => setDecision("convert")}
              >
                Review &amp; convert to CRM
              </button>
            )}
            {kind === "influencer" && !!row["assigned_at"] && (
              <p className="pw-deadline">
                <CalendarClock size={18} />
                Assignment deadline:{" "}
                {localDate(
                  assignmentDeadline(
                    String(row["assigned_at"]),
                    Number(row["paused_seconds"] ?? 0),
                    row["review_started_at"] ? String(row["review_started_at"]) : null,
                  ).toISOString(),
                  true,
                )}
                {row["review_started_at"] ? " · Paused for admin review" : ""}
              </p>
            )}
          </div>
          {kind === "influencer" && (
            <>
              {access.role === "admin" && <AssignmentForm id={id} refresh={refresh} />}
              <CommunicationForm id={id} refresh={refresh} />
              <div className="pw-card pw-form-card">
                <h2>Communication history</h2>
                {data.communications?.length ? (
                  data.communications.map((c) => (
                    <article className="pw-history" key={String(c["id"])}>
                      <Badge value={c["channel"]} />
                      <small>{localDate(c["created_at"], true)}</small>
                      <p>{String(c["notes"])}</p>
                    </article>
                  ))
                ) : (
                  <Empty title="No contact logged" />
                )}
              </div>
              <DealDraft id={id} draft={data.draft ?? null} refresh={refresh} />
            </>
          )}
        </>
      )}
      <Confirm
        open={!!decision}
        onClose={() => setDecision(null)}
        title={decision === "convert" ? "Convert this reviewed lead?" : "Save this deal decision?"}
        onConfirm={async () => {
          const result = await mutation.run(
            decision === "convert" ? "convert-lead" : "decide-deal",
            decision === "convert" ? { id } : { id, decision, note },
          );
          setDecision(null);
          if (result.ok && decision === "convert")
            router.push(`${base}/influencers/${result.data}`);
        }}
      >
        {decision === "convert"
          ? "This creates one private CRM record linked to the originating lead. It does not publish a creator or issue login access."
          : "This decision applies to the displayed saved revision and will be recorded atomically in the approval history."}
      </Confirm>
    </>
  );
}
function AssignmentForm({ id, refresh }: { id: string; refresh: () => void }) {
  const team = useWorkspaceData<{ rows: WorkspaceRow[] }>("list", { module: "imtm", page: 1 }),
    mutation = useMutation(refresh),
    [account, setAccount] = useState<string | null>(null);
  return (
    <div className="pw-card pw-form-card">
      <h2>Assign IMTM</h2>
      {team.error ? (
        <LoadError message={team.error} retry={team.refresh} />
      ) : !team.data ? (
        <Skeleton />
      ) : (
        <form
          className="pw-form"
          onSubmit={(e) => {
            e.preventDefault();
            setAccount(String(new FormData(e.currentTarget).get("account")));
          }}
        >
          <Field label="Active team account">
            <select name="account" required>
              <option value="">Select an IMTM account</option>
              {team.data.rows
                .filter((r) => r["active"])
                .map((r) => (
                  <option key={String(r["id"])} value={String(r["id"])}>
                    {String(r["name"])}
                  </option>
                ))}
            </select>
          </Field>
          {mutation.feedback}
          <button className="pw-button pw-button-outline" disabled={mutation.busy}>
            Review assignment
          </button>
        </form>
      )}
      <Confirm
        open={!!account}
        onClose={() => setAccount(null)}
        title="Assign this influencer?"
        onConfirm={() => {
          void mutation.run("assign", { id, accountId: account });
          setAccount(null);
        }}
      >
        The seven-day window restarts and the previous assignee loses access. Pending approvals must
        be decided first.
      </Confirm>
    </div>
  );
}
function CommunicationForm({ id, refresh }: { id: string; refresh: () => void }) {
  const mutation = useMutation(refresh);
  return (
    <div className="pw-card pw-form-card">
      <h2>Log communication &amp; next action</h2>
      <form
        className="pw-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            f = new FormData(form);
          const due = String(f.get("due") || "");
          const result = await mutation.run("log-contact", {
            id,
            channel: f.get("channel"),
            notes: f.get("notes"),
            due: due ? new Date(due).toISOString() : null,
            action: f.get("action"),
          });
          if (result.ok) form.reset();
        }}
      >
        <Field label="Channel">
          <select name="channel">
            {["call", "whatsapp", "instagram", "email", "meeting", "other"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Internal notes *">
          <textarea name="notes" required maxLength={4000} />
        </Field>
        <div className="pw-fields">
          <Field label="Next action">
            <input name="action" maxLength={500} />
          </Field>
          <Field label="Follow-up in your local timezone">
            <input name="due" type="datetime-local" />
          </Field>
        </div>
        <p className="pw-muted">
          Logging a contact records an internal note. Follow-ups require a current assigned team
          member.
        </p>
        {mutation.feedback}
        <button className="pw-button" disabled={mutation.busy}>
          Save contact
        </button>
      </form>
    </div>
  );
}
const initialTerms = {
  brand: "",
  collaboration: "paid",
  currency: "INR",
  amount: 0,
  advance: 0,
  summary: "",
  agreementStatus: "draft",
  paymentTerms: "",
  deliverables: [{ platform: "instagram", type: "reel", quantity: 1, dueDate: "" }],
};
function DealDraft({
  id,
  draft,
  refresh,
}: {
  id: string;
  draft: { revision: number; terms: WorkspaceRow } | null;
  refresh: () => void;
}) {
  const [terms, setTerms] = useState(initialTerms),
    [loadedRevision, setLoadedRevision] = useState(-1),
    [confirm, setConfirm] = useState(false);
  const revision = draft?.revision ?? 0;
  if (loadedRevision !== revision) {
    setLoadedRevision(revision);
    setTerms(draft ? (draft.terms as typeof initialTerms) : initialTerms);
  }
  const mutation = useMutation(refresh);
  return (
    <div className="pw-card pw-form-card">
      <h2>
        Structured deal draft <span className="pw-muted">· revision {revision}</span>
      </h2>
      <form
        className="pw-form"
        onSubmit={(e) => {
          e.preventDefault();
          void mutation.run(
            "save-draft",
            { id, revision, terms },
            "Draft revision saved. Review the saved terms before submitting.",
          );
        }}
      >
        <div className="pw-fields">
          {["brand", "currency", "amount", "advance"].map((key) => (
            <Field key={key} label={key}>
              <input
                required
                type={["amount", "advance"].includes(key) ? "number" : "text"}
                min={0}
                step={["amount", "advance"].includes(key) ? "0.01" : undefined}
                maxLength={key === "currency" ? 3 : 200}
                value={terms[key as "brand"]}
                onChange={(e) =>
                  setTerms((v) => ({
                    ...v,
                    [key]: ["amount", "advance"].includes(key)
                      ? Number(e.target.value)
                      : e.target.value,
                  }))
                }
              />
            </Field>
          ))}
          <Field label="Collaboration">
            <select
              value={terms.collaboration}
              onChange={(e) => setTerms((v) => ({ ...v, collaboration: e.target.value }))}
            >
              {["paid", "barter", "affiliate", "hybrid"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Agreement status">
            <select
              value={terms.agreementStatus}
              onChange={(e) => setTerms((v) => ({ ...v, agreementStatus: e.target.value }))}
            >
              <option value="draft">Draft</option>
              <option value="agreed">Agreed (no file attached)</option>
            </select>
          </Field>
        </div>
        <Field label="Negotiation summary (at least 20 characters to submit)">
          <textarea
            maxLength={4000}
            value={terms.summary}
            onChange={(e) => setTerms((v) => ({ ...v, summary: e.target.value }))}
          />
        </Field>
        <Field label="Payment terms">
          <textarea
            maxLength={2000}
            value={terms.paymentTerms}
            onChange={(e) => setTerms((v) => ({ ...v, paymentTerms: e.target.value }))}
          />
        </Field>
        <div className="pw-card-heading">
          <h2>Deliverables</h2>
          <button
            type="button"
            className="pw-text-link"
            disabled={terms.deliverables.length >= 50}
            onClick={() =>
              setTerms((v) => ({
                ...v,
                deliverables: [
                  ...v.deliverables,
                  { platform: "instagram", type: "reel", quantity: 1, dueDate: "" },
                ],
              }))
            }
          >
            <Plus size={15} /> Add deliverable
          </button>
        </div>
        {terms.deliverables.map((d, i) => (
          <div className="pw-social-fields" key={i}>
            {["platform", "type", "quantity", "dueDate"].map((key) => (
              <Field key={key} label={key}>
                <input
                  required
                  type={key === "quantity" ? "number" : key === "dueDate" ? "date" : "text"}
                  min={key === "quantity" ? 1 : undefined}
                  value={d[key as keyof typeof d]}
                  onChange={(e) =>
                    setTerms((v) => ({
                      ...v,
                      deliverables: v.deliverables.map((item, j) =>
                        j === i
                          ? {
                              ...item,
                              [key]: key === "quantity" ? Number(e.target.value) : e.target.value,
                            }
                          : item,
                      ),
                    }))
                  }
                />
              </Field>
            ))}
            {terms.deliverables.length > 1 && (
              <button
                type="button"
                className="pw-icon-button"
                aria-label={`Remove deliverable ${i + 1}`}
                onClick={() =>
                  setTerms((v) => ({
                    ...v,
                    deliverables: v.deliverables.filter((_, j) => j !== i),
                  }))
                }
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
        {mutation.feedback}
        <div className="pw-actions">
          <button className="pw-button" disabled={mutation.busy}>
            Save new revision
          </button>
          <button
            type="button"
            className="pw-button pw-button-outline"
            disabled={
              mutation.busy || !revision || JSON.stringify(terms) !== JSON.stringify(draft?.terms)
            }
            onClick={() => setConfirm(true)}
          >
            Submit saved revision
          </button>
        </div>
      </form>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit this saved deal for review?"
        onConfirm={() => {
          void mutation.run(
            "submit-deal",
            { id, revision },
            "Deal submitted. Assignment countdown is paused during review.",
          );
          setConfirm(false);
        }}
      >
        Revision {revision} will be submitted as an immutable snapshot. The seven-day assignment
        countdown pauses until an admin decision.
      </Confirm>
    </div>
  );
}
function TermsView({ terms }: { terms: WorkspaceRow }) {
  return (
    <>
      <dl className="pw-detail-grid">
        {[
          "brand",
          "collaboration",
          "currency",
          "amount",
          "advance",
          "agreementStatus",
          "summary",
          "paymentTerms",
        ].map((key) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>
              {["amount", "advance"].includes(key)
                ? money(terms[key], terms["currency"])
                : String(terms[key] || "—")}
            </dd>
          </div>
        ))}
      </dl>
      <h2>Deliverables</h2>
      {Array.isArray(terms["deliverables"]) &&
        terms["deliverables"].map((d: WorkspaceRow, i: number) => (
          <p key={i}>
            {String(d["quantity"])} × {String(d["platform"])} {String(d["type"])} · Due{" "}
            {String(d["dueDate"])}
          </p>
        ))}
    </>
  );
}
