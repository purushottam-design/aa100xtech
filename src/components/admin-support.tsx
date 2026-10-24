"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  getTicketThread,
  listTickets,
  replyToTicket,
  updateTicket,
} from "@/lib/super-admin-plus.functions";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

function statusVariant(status: string) {
  if (status === "resolved" || status === "closed") return "secondary" as const;
  if (status === "in_progress") return "default" as const;
  return "destructive" as const;
}

function TicketThread({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);

  const q = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicketThread({ data: { ticketId } }),
    retry: false,
  });

  const reply = useMutation({
    mutationFn: () => replyToTicket({ data: { ticketId, body, isInternal: internal } }),
    onSuccess: () => {
      setBody("");
      toast.success("Reply sent");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ticket = q.data?.ticket as any;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket?.subject ?? "Ticket"}</DialogTitle>
          <DialogDescription>
            {ticket ? `${ticket.ticket_no} · ${ticket.requester_name} (${ticket.requester_email})` : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {ticket ? (
          <div className="flex flex-wrap gap-2">
            <Select
              value={ticket.status}
              onValueChange={async (v) => {
                await updateTicket({ data: { ticketId, status: v as (typeof STATUSES)[number] } });
                queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
                queryClient.invalidateQueries({ queryKey: ["tickets"] });
              }}
            >
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={ticket.priority}
              onValueChange={async (v) => {
                await updateTicket({ data: { ticketId, priority: v as (typeof PRIORITIES)[number] } });
                queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
                queryClient.invalidateQueries({ queryKey: ["tickets"] });
              }}
            >
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-3">
          {(q.data?.messages ?? []).map((m: any) => (
            <div
              key={m.id}
              className={`rounded-lg border p-3 text-sm ${m.is_internal ? "border-dashed bg-muted/40" : "border-border/60"}`}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{m.author_name ?? "User"}</span>
                {m.is_internal ? <Badge variant="secondary">internal note</Badge> : null}
                <span className="ml-auto">{new Date(m.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reply">Reply</Label>
          <Textarea id="reply" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />
              Internal note (customer cannot see it)
            </label>
            <Button
              className="ml-auto"
              disabled={body.trim().length < 1 || reply.isPending}
              onClick={() => reply.mutate()}
            >
              {reply.isPending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminSupport() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const pageSize = 10;

  const q = useQuery({
    queryKey: ["tickets", search, status, priority, page],
    queryFn: () => listTickets({ data: { search, status, priority, page, pageSize } }),
    retry: false,
  });

  const rows = (q.data?.rows ?? []) as any[];
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-52 flex-1"
          placeholder="Search ticket, subject or person"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => { setPriority(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tickets…</p>
      ) : q.isError ? (
        <p className="text-sm text-muted-foreground">{(q.error as Error).message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.ticket_no}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell className="text-muted-foreground">{t.requester_email}</TableCell>
                  <TableCell><Badge variant="secondary">{t.priority}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant(t.status)}>{t.status.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setOpenId(t.id)}>Open</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} tickets</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="self-center">Page {page} / {pages}</span>
          <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      {openId ? <TicketThread ticketId={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
