"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { createTicket, listMyTickets } from "@/lib/super-admin-plus.functions";

/** Lets any signed-in person raise a support request and follow its status. */
export function SupportWidget() {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");

  const mine = useQuery({ queryKey: ["my-tickets"], queryFn: () => listMyTickets(), retry: false });

  const send = useMutation({
    mutationFn: () => createTicket({ data: { subject: subject.trim(), message: message.trim(), priority } }),
    onSuccess: (d) => {
      toast.success(`Request sent — ${d.ticketNo}`);
      setSubject("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">Help &amp; support</CardTitle>
        <CardDescription>Raise a request and our team will reply here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="s-subject">Subject</Label>
          <Input id="s-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="s-msg">What do you need help with?</Label>
          <Textarea id="s-msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="ml-auto"
            disabled={subject.trim().length < 3 || message.trim().length < 5 || send.isPending}
            onClick={() => send.mutate()}
          >
            {send.isPending ? "Sending…" : "Send request"}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Your requests</p>
          {mine.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (mine.data?.rows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not raised any requests yet.</p>
          ) : (
            (mine.data?.rows ?? []).map((t: any) => (
              <div key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{t.ticket_no}</span>
                <span className="font-medium">{t.subject}</span>
                <Badge variant={t.status === "resolved" || t.status === "closed" ? "secondary" : "default"}>
                  {String(t.status).replace("_", " ")}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
