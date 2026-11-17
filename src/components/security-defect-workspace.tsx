"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { customerActionHeaders, redirectExpiredCustomerSession } from "@/lib/customer-action-auth";
import {
  defectAttachmentError,
  defectCategories,
  defectFieldsSchema,
  defectPriorities,
  defectStatuses,
  defectTicketCode,
  type DefectFields,
  type DefectList,
  type DefectStatus,
  type SecurityDefectTicket,
} from "@/lib/security-defects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const selectClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 md:text-sm";
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(
    new Date(value),
  );

class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function ticketRequest(path = "", init?: RequestInit) {
  const headers = await customerActionHeaders();
  if (init?.body && typeof init.body === "string") headers.set("content-type", "application/json");
  const response = await fetch(`/api/security-defects${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(30_000),
  });
  redirectExpiredCustomerSession(response);
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new RequestError(
      result?.message ?? "The request could not be completed. Please try again.",
      response.status,
    );
  }
  return response;
}

function TicketStatus({ status }: { status: DefectStatus }) {
  return (
    <Badge
      variant="outline"
      className={
        status === "Resolved" || status === "Closed"
          ? "border-signal/25 bg-signal/10 text-foreground"
          : "border-primary/25 bg-primary/8 text-foreground"
      }
    >
      {status}
    </Badge>
  );
}

export function SecurityDefectWorkspace() {
  const { session } = useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"mine" | "team">("mine");
  const [status, setStatus] = useState("all");
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SecurityDefectTicket | null>(null);
  const [nextStatus, setNextStatus] = useState<DefectStatus>("Open");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const attempt = useRef<{ signature: string; id: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DefectFields>({
    resolver: zodResolver(defectFieldsSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      category: "Identity Verification",
      title: "",
      description: "",
      priority: "Medium",
    },
  });
  const tickets = useQuery<DefectList>({
    queryKey: ["security-defects", userId, scope, status, search, page],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async ({ signal }) => {
      const query = new URLSearchParams({ scope, status, q: search, page: String(page) });
      return (await ticketRequest(`?${query}`, { signal })).json();
    },
  });
  const update = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Choose a ticket.");
      return (
        await ticketRequest("", {
          method: "PATCH",
          body: JSON.stringify({
            id: selected.id,
            status: nextStatus,
            previousStatus: selected.status,
          }),
        })
      ).json() as Promise<{ ticket: SecurityDefectTicket }>;
    },
    onSuccess: ({ ticket }) => {
      setSelected((current) => (current?.id === ticket.id ? ticket : current));
      void queryClient.invalidateQueries({ queryKey: ["security-defects", userId] });
    },
  });

  async function submit(fields: DefectFields) {
    setSubmitError(null);
    setReceipt(null);
    setConflict(false);
    const invalidFile = file ? defectAttachmentError(file) : null;
    setFileError(invalidFile);
    if (invalidFile) {
      attachmentInput.current?.focus();
      return;
    }
    const signature = JSON.stringify({
      ...fields,
      attachment: file ? [file.name, file.size, file.lastModified] : null,
    });
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, id: crypto.randomUUID() };
    const form = new FormData();
    form.set("data", JSON.stringify({ ...fields, id: attempt.current.id }));
    if (file) form.set("attachment", file);
    try {
      const result = await (await ticketRequest("", { method: "POST", body: form })).json();
      setReceipt(defectTicketCode(result.ticket.ticket_number));
      attempt.current = null;
      setFile(null);
      if (attachmentInput.current) attachmentInput.current.value = "";
      reset({ ...fields, title: "", description: "", priority: "Medium" });
      setScope("mine");
      setStatus("all");
      setSearch("");
      setDraftSearch("");
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ["security-defects", userId] });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Your report could not be saved. Please retry.",
      );
      setConflict(error instanceof RequestError && error.status === 409);
    }
  }

  function showTicket(ticket: SecurityDefectTicket) {
    setSelected(ticket);
    setNextStatus(ticket.status);
    setDownloadError(null);
    update.reset();
  }
  async function download() {
    if (!selected) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await ticketRequest(`/${selected.id}/attachment`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${defectTicketCode(selected.ticket_number)}-${selected.attachment_name ?? "attachment"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Attachment unavailable.");
    } finally {
      setDownloading(false);
    }
  }

  const rows = tickets.data?.rows ?? [];
  const pages = Math.max(1, Math.ceil((tickets.data?.total ?? 0) / 25));
  const errorText = (name: keyof DefectFields) =>
    errors[name]?.message ? (
      <p id={`defect-${name}-error`} className="mt-2 text-sm text-destructive" role="alert">
        {errors[name]?.message}
      </p>
    ) : null;
  const fieldAccessibility = (name: keyof DefectFields) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `defect-${name}-error` : undefined,
  });

  return (
    <>
      <section
        id="report-issue"
        aria-labelledby="report-heading"
        className="scroll-mt-24 border-b border-border/60 bg-surface py-16 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-8">
          <div>
            <span className="mb-5 flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-background text-primary">
              <Send aria-hidden="true" className="size-5" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              A clear place to start
            </p>
            <h2 id="report-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
              Report an Issue
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Tell us what happened, where it happened and what you expected. A clear report helps
              the team review the issue.
            </p>
            <div className="mt-8 rounded-xl border border-primary/20 bg-background p-5">
              <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">Keep sensitive information private</h3>
              <p id="defect-privacy" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Do not include passwords, OTPs, recovery codes, identity documents or access tokens.
                Redact personal and confidential information in attachments.
              </p>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              Reports are visible to you and authorized support administrators.
            </p>
          </div>
          <form
            onSubmit={handleSubmit(submit)}
            noValidate
            aria-label="Security issue report"
            aria-describedby="defect-privacy"
            className="surface-card min-w-0 p-5 sm:p-8"
          >
            <fieldset disabled={isSubmitting} className="min-w-0 space-y-5">
              <legend className="sr-only">Security issue details</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ["fullName", "Full Name", "text", "name", 120],
                    ["email", "Email Address", "email", "email", 254],
                    ["phone", "Phone Number", "tel", "tel", 30],
                    ["company", "Company Name (optional)", "text", "organization", 160],
                  ] as const
                ).map(([name, label, type, autoComplete, maxLength]) => (
                  <div key={name} className="min-w-0 space-y-2">
                    <Label htmlFor={`defect-${name}`}>{label}</Label>
                    <Input
                      id={`defect-${name}`}
                      type={type}
                      autoComplete={autoComplete}
                      maxLength={maxLength}
                      required={name !== "company"}
                      className="h-11"
                      {...register(name)}
                      {...fieldAccessibility(name)}
                    />
                    {errorText(name)}
                  </div>
                ))}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="defect-category">Issue Category</Label>
                  <select
                    id="defect-category"
                    className={selectClass}
                    {...register("category")}
                    {...fieldAccessibility("category")}
                  >
                    {defectCategories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  {errorText("category")}
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="defect-priority">Priority Level</Label>
                  <select
                    id="defect-priority"
                    className={selectClass}
                    {...register("priority")}
                    {...fieldAccessibility("priority")}
                  >
                    {defectPriorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                  {errorText("priority")}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defect-title">Issue Title</Label>
                <Input
                  id="defect-title"
                  placeholder="A short, specific summary of the issue"
                  className="h-11"
                  maxLength={160}
                  required
                  {...register("title")}
                  {...fieldAccessibility("title")}
                />
                {errorText("title")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defect-description">Detailed Description</Label>
                <Textarea
                  id="defect-description"
                  rows={6}
                  placeholder="What happened? Include the affected page, steps to reproduce and any error message. Redact sensitive details."
                  maxLength={8000}
                  required
                  {...register("description")}
                  {...fieldAccessibility("description")}
                />
                {errorText("description")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="defect-attachment">Screenshot or File Attachment (optional)</Label>
                <Input
                  id="defect-attachment"
                  ref={attachmentInput}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  className="h-auto py-3 file:mr-3 file:whitespace-normal"
                  aria-describedby="defect-file-help"
                  aria-invalid={Boolean(fileError)}
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null;
                    setFile(selectedFile);
                    setFileError(selectedFile ? defectAttachmentError(selectedFile) : null);
                  }}
                />
                <p id="defect-file-help" className="text-xs text-muted-foreground">
                  PNG, JPG, WebP or PDF. Maximum 5 MB. Images are optimized and metadata is removed.
                </p>
                {fileError && (
                  <p role="alert" className="text-sm text-destructive">
                    {fileError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                className="min-h-11 w-full sm:w-auto"
                disabled={!userId || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Send aria-hidden="true" />
                )}{" "}
                {isSubmitting ? "Saving report…" : "Submit report"}
              </Button>
            </fieldset>
            {submitError && (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
              >
                {submitError}
                {conflict && (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      attempt.current = null;
                      setSubmitError(null);
                      setConflict(false);
                    }}
                  >
                    Start a new report
                  </Button>
                )}
              </div>
            )}
            {receipt && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-signal/25 bg-signal/5 p-4"
              >
                <p className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="size-5 text-signal" aria-hidden="true" />
                  Report saved: {receipt}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Follow its latest status in your private ticket list below.
                </p>
                <a
                  href="#security-tickets"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4"
                >
                  View your tickets <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            )}
          </form>
        </div>
      </section>

      <section
        id="security-tickets"
        aria-labelledby="tickets-heading"
        className="scroll-mt-24 py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Keep track
              </p>
              <h2 id="tickets-heading" className="mt-3 text-3xl font-bold sm:text-4xl">
                Your security tickets
              </h2>
              <p className="mt-3 text-muted-foreground">
                Search your reports and follow their latest status.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={tickets.isFetching}
              onClick={() => void tickets.refetch()}
            >
              <RefreshCw
                className={tickets.isFetching ? "animate-spin motion-reduce:animate-none" : ""}
                aria-hidden="true"
              />
              Refresh tickets
            </Button>
          </div>
          <div className="surface-card mt-8 min-w-0 overflow-hidden p-4 sm:p-6">
            <div className="grid items-end gap-4 lg:grid-cols-[1fr_220px_auto]">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearch(draftSearch.trim());
                  setPage(1);
                }}
                role="search"
                aria-label="Search security tickets"
              >
                <Label htmlFor="ticket-search">Ticket ID or issue title</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="ticket-search"
                    className="h-11 min-w-0"
                    placeholder="e.g. SID-000001 or login issue"
                    maxLength={100}
                    value={draftSearch}
                    onChange={(event) => setDraftSearch(event.target.value)}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="size-11 shrink-0 p-0"
                    aria-label="Search tickets"
                  >
                    <Search className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </form>
              <div>
                <Label htmlFor="ticket-status-filter">Filter by status</Label>
                <select
                  id="ticket-status-filter"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className={`${selectClass} mt-2`}
                >
                  <option value="all">All statuses</option>
                  {defectStatuses.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </div>
              {tickets.data?.canReview && (
                <div>
                  <Label htmlFor="ticket-scope">Ticket access</Label>
                  <select
                    id="ticket-scope"
                    value={scope}
                    onChange={(event) => {
                      setScope(event.target.value as "mine" | "team");
                      setPage(1);
                    }}
                    className={`${selectClass} mt-2`}
                  >
                    <option value="mine">My tickets</option>
                    <option value="team">Support queue</option>
                  </select>
                </div>
              )}
            </div>
            {tickets.isPending && (
              <p role="status" className="py-12 text-center text-muted-foreground">
                Loading your tickets…
              </p>
            )}
            {tickets.isError && (
              <p
                role="alert"
                className="mt-6 rounded-lg border border-destructive/20 p-4 text-sm text-destructive"
              >
                {tickets.error.message}
              </p>
            )}
            {!tickets.isPending && !tickets.isError && rows.length === 0 && (
              <div className="py-14 text-center">
                <ClipboardList className="mx-auto size-10 text-primary/60" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">
                  {search || status !== "all" ? "No matching tickets" : "No tickets yet"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {search || status !== "all"
                    ? "Try another search or status filter."
                    : "Reports you submit will appear here. Your tickets stay private."}
                </p>
              </div>
            )}
            {rows.length > 0 && !tickets.isError && (
              <>
                <div className="mt-6 hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {[
                          "Ticket ID",
                          "Issue Title",
                          "Category",
                          "Priority",
                          "Reported Date",
                          "Status",
                        ].map((heading) => (
                          <TableHead key={heading}>{heading}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="whitespace-nowrap font-mono text-xs">
                            {defectTicketCode(ticket.ticket_number)}
                          </TableCell>
                          <TableCell className="max-w-72">
                            <button
                              type="button"
                              onClick={() => showTicket(ticket)}
                              className="rounded text-left font-semibold underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [overflow-wrap:anywhere]"
                            >
                              {ticket.title}
                              <span className="sr-only"> — View ticket details</span>
                            </button>
                          </TableCell>
                          <TableCell>{ticket.category}</TableCell>
                          <TableCell>
                            <Badge
                              variant={ticket.priority === "Critical" ? "destructive" : "secondary"}
                            >
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {dateLabel(ticket.created_at)}
                          </TableCell>
                          <TableCell>
                            <TicketStatus status={ticket.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 space-y-3 md:hidden">
                  {rows.map((ticket) => (
                    <article key={ticket.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {defectTicketCode(ticket.ticket_number)}
                        </span>
                        <TicketStatus status={ticket.status} />
                      </div>
                      <button
                        type="button"
                        onClick={() => showTicket(ticket)}
                        className="mt-4 min-h-11 text-left font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [overflow-wrap:anywhere]"
                      >
                        {ticket.title}
                        <span className="sr-only"> — View ticket details</span>
                      </button>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-muted-foreground">Category</dt>
                          <dd className="mt-1 font-medium">{ticket.category}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Priority</dt>
                          <dd className="mt-1 font-medium">{ticket.priority}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-muted-foreground">Reported Date</dt>
                          <dd className="mt-1">{dateLabel(ticket.created_at)}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </>
            )}
            {!tickets.isPending && !tickets.isError && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 text-sm">
                <p className="text-muted-foreground" aria-live="polite">
                  {tickets.data?.total ?? 0} ticket{tickets.data?.total === 1 ? "" : "s"} · Page{" "}
                  {page} of {pages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page <= 1 || tickets.isFetching}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page >= pages || tickets.isFetching}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl">
          <DialogTitle className="pr-6 leading-relaxed [overflow-wrap:anywhere]">
            {selected?.title}
          </DialogTitle>
          <DialogDescription>
            {selected ? defectTicketCode(selected.ticket_number) : "Ticket details"} · Private
            security report
          </DialogDescription>
          {selected && (
            <>
              <div className="flex flex-wrap gap-2">
                <TicketStatus status={selected.status} />
                <Badge variant="secondary">{selected.priority} priority</Badge>
                <Badge variant="outline">{selected.category}</Badge>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {[
                  ["Reported by", selected.full_name],
                  ["Email", selected.email],
                  ["Phone", selected.phone],
                  ["Company", selected.company || "—"],
                  ["Reported Date", dateLabel(selected.created_at)],
                  ["Last updated", dateLabel(selected.updated_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 [overflow-wrap:anywhere]">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-lg bg-secondary/50 p-4">
                <h3 className="text-sm font-semibold">Detailed Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
                  {selected.description}
                </p>
              </div>
              {selected.attachment_name && (
                <Button
                  variant="outline"
                  className="min-h-11"
                  disabled={downloading}
                  onClick={() => void download()}
                >
                  <ArrowDownToLine aria-hidden="true" />
                  {downloading ? "Downloading…" : "Download attachment"}
                </Button>
              )}
              {downloadError && (
                <p role="alert" className="text-sm text-destructive">
                  {downloadError}
                </p>
              )}
              {tickets.data?.canManage && (
                <div className="border-t border-border pt-4">
                  <Label htmlFor="ticket-next-status">Update ticket status</Label>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <select
                      id="ticket-next-status"
                      value={nextStatus}
                      onChange={(event) => setNextStatus(event.target.value as DefectStatus)}
                      className={`${selectClass} sm:w-auto`}
                      disabled={update.isPending}
                    >
                      {defectStatuses.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    <Button
                      className="min-h-11"
                      onClick={() => update.mutate()}
                      disabled={update.isPending || nextStatus === selected.status}
                    >
                      {update.isPending ? "Saving…" : "Save status"}
                    </Button>
                  </div>
                  {update.isError && (
                    <p role="alert" className="mt-3 text-sm text-destructive">
                      {update.error.message}
                    </p>
                  )}
                  {update.isSuccess && (
                    <p role="status" className="mt-3 text-sm">
                      Ticket status updated.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
