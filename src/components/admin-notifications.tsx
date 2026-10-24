"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getPushReach } from "@/lib/push.functions";
import {
  deleteNotification,
  deleteTemplate,
  listNotifications,
  listTemplates,
  saveNotification,
  saveTemplate,
  sendNotification,
} from "@/lib/super-admin-plus.functions";

const AUDIENCES = ["all", "customers", "employees", "partners", "admins"] as const;
const CHANNELS = ["in_app", "email", "push"] as const;

function NotificationEditor({ row, onClose }: { row: any | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(row?.title ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [audience, setAudience] = useState(row?.audience ?? "all");
  const [channel, setChannel] = useState(row?.channel ?? "in_app");
  const [linkUrl, setLinkUrl] = useState(row?.link_url ?? "");
  const [scheduledFor, setScheduledFor] = useState(
    row?.scheduled_for ? String(row.scheduled_for).slice(0, 16) : "",
  );

  const save = useMutation({
    mutationFn: () =>
      saveNotification({
        data: {
          ...(row?.id ? { id: row.id as string } : {}),
          title: title.trim(),
          body: body.trim(),
          audience: audience as (typeof AUDIENCES)[number],
          channel: channel as (typeof CHANNELS)[number],
          linkUrl: linkUrl.trim() || undefined,
          scheduledFor: scheduledFor || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit notification" : "New notification"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="n-title">Title</Label>
            <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="n-body">Message</Label>
            <Textarea id="n-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c.replace("_", "-")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="n-link">Link (optional)</Label>
            <Input id="n-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} maxLength={400} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="n-when">Schedule for (optional)</Label>
            <Input
              id="n-when"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={title.trim().length < 2 || body.trim().length < 2 || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateEditor({ row, onClose }: { row: any | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState(row?.key ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [channel, setChannel] = useState(row?.channel ?? "email");
  const [subject, setSubject] = useState(row?.subject ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [active, setActive] = useState(row?.active ?? true);

  const save = useMutation({
    mutationFn: () =>
      saveTemplate({
        data: {
          ...(row?.id ? { id: row.id as string } : {}),
          key: key.trim().toLowerCase(),
          name: name.trim(),
          channel: channel as "email" | "sms" | "push",
          subject: subject.trim() || undefined,
          body: body.trim(),
          active,
        },
      }),
    onSuccess: () => {
      toast.success("Template saved");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? "Edit template" : "New template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="t-key">Key</Label>
              <Input id="t-key" value={key} onChange={(e) => setKey(e.target.value)} placeholder="booking_confirmed" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">email</SelectItem>
                  <SelectItem value="sms">sms</SelectItem>
                  <SelectItem value="push">push</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Switch id="t-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="t-active">Active</Label>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-subject">Subject</Label>
            <Input id="t-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="t-body">Body</Label>
            <Textarea id="t-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              You can use placeholders like {"{{name}}"} and {"{{booking_id}}"}.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={key.trim().length < 2 || name.trim().length < 2 || body.trim().length < 2 || save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminNotifications() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<any | null | undefined>(undefined);
  const [editingTemplate, setEditingTemplate] = useState<any | null | undefined>(undefined);
  const pageSize = 10;

  const list = useQuery({
    queryKey: ["notifications", search, status, page],
    queryFn: () => listNotifications({ data: { search, status, page, pageSize } }),
    retry: false,
  });
  const templates = useQuery({ queryKey: ["templates"], queryFn: () => listTemplates(), retry: false });
  const reach = useQuery({ queryKey: ["push-reach"], queryFn: () => getPushReach(), retry: false });

  const rows = (list.data?.rows ?? []) as any[];
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Tabs defaultValue="messages" className="space-y-4">
      <TabsList>
        <TabsTrigger value="messages">Notifications</TabsTrigger>
        <TabsTrigger value="templates">Email / SMS templates</TabsTrigger>
      </TabsList>

      <TabsContent value="messages" className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="min-w-52 flex-1"
            placeholder="Search title"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">
            {reach.data ? `${reach.data.devices} device(s) can receive push` : "Checking push reach…"}
          </Badge>
          <Button onClick={() => setEditing(null)}>+ New notification</Button>
        </div>

        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-200">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell className="text-muted-foreground">{n.audience}</TableCell>
                    <TableCell className="text-muted-foreground">{n.channel}</TableCell>
                    <TableCell><Badge variant={n.status === "sent" ? "default" : "secondary"}>{n.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {n.scheduled_for ? new Date(n.scheduled_for).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditing(n)}>Edit</Button>
                        {n.status !== "sent" ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                await sendNotification({ data: { id: n.id } });
                                toast.success("Notification sent");
                                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                              } catch (e) { toast.error((e as Error).message); }
                            }}
                          >
                            Send now
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await deleteNotification({ data: { id: n.id } });
                              toast.success("Deleted");
                              queryClient.invalidateQueries({ queryKey: ["notifications"] });
                            } catch (e) { toast.error((e as Error).message); }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} notifications</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="self-center">Page {page} / {pages}</span>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="templates" className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setEditingTemplate(null)}>+ New template</Button>
        </div>
        {templates.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading templates…</p>
        ) : (templates.data?.rows ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-150">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(templates.data?.rows ?? []).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.key}</TableCell>
                    <TableCell className="text-muted-foreground">{t.channel}</TableCell>
                    <TableCell><Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Yes" : "No"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingTemplate(t)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await deleteTemplate({ data: { id: t.id } });
                              toast.success("Deleted");
                              queryClient.invalidateQueries({ queryKey: ["templates"] });
                            } catch (e) { toast.error((e as Error).message); }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {editing !== undefined ? (
        <NotificationEditor row={editing} onClose={() => setEditing(undefined)} />
      ) : null}
      {editingTemplate !== undefined ? (
        <TemplateEditor row={editingTemplate} onClose={() => setEditingTemplate(undefined)} />
      ) : null}
    </Tabs>
  );
}
