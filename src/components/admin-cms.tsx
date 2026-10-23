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
import { Textarea } from "@/components/ui/textarea";
import {
  deleteContentBlock,
  listContentBlocks,
  saveContentBlock,
} from "@/lib/super-admin-plus.functions";

const TYPES = ["banner", "notice", "section", "blog", "offer"] as const;

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function BlockEditor({ row, onClose }: { row: any | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [blockType, setBlockType] = useState(row?.block_type ?? "banner");
  const [title, setTitle] = useState(row?.title ?? "");
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [subtitle, setSubtitle] = useState(row?.subtitle ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [imageUrl, setImageUrl] = useState(row?.image_url ?? "");
  const [linkUrl, setLinkUrl] = useState(row?.link_url ?? "");
  const [linkLabel, setLinkLabel] = useState(row?.link_label ?? "");
  const [placement, setPlacement] = useState(row?.placement ?? "home");
  const [position, setPosition] = useState(String(row?.position ?? 0));
  const [active, setActive] = useState(row?.active ?? true);

  const save = useMutation({
    mutationFn: () =>
      saveContentBlock({
        data: {
          ...(row?.id ? { id: row.id as string } : {}),
          blockType: blockType as (typeof TYPES)[number],
          slug: slug.trim() ? slugify(slug) : slugify(title),
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          body: body.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          linkLabel: linkLabel.trim() || undefined,
          placement: placement.trim() || "home",
          position: Number(position) || 0,
          active,
        },
      }),
    onSuccess: () => {
      toast.success("Content saved");
      queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{row ? "Edit content" : "New content"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={blockType} onValueChange={setBlockType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-place">Where it shows</Label>
              <Input id="c-place" value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="home" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-title">Title</Label>
            <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-slug">Slug</Label>
            <Input id="c-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(title) || "auto"} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-sub">Subtitle</Label>
            <Input id="c-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={300} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-body">Body</Label>
            <Textarea id="c-body" rows={7} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-img">Image URL</Label>
            <Input id="c-img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={600} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="c-link">Button link</Label>
              <Input id="c-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} maxLength={600} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="c-label">Button label</Label>
              <Input id="c-label" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} maxLength={80} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <Label htmlFor="c-pos">Order</Label>
              <Input id="c-pos" className="w-24" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch id="c-active" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="c-active">Visible on the site</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={title.trim().length < 2 || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCms() {
  const queryClient = useQueryClient();
  const [blockType, setBlockType] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null | undefined>(undefined);

  const q = useQuery({
    queryKey: ["content-blocks", blockType, search],
    queryFn: () => listContentBlocks({ data: { blockType, search } }),
    retry: false,
  });
  const rows = (q.data?.rows ?? []) as any[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="min-w-52 flex-1"
          placeholder="Search title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={blockType} onValueChange={setBlockType}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setEditing(null)}>+ New content</Button>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading content…</p>
      ) : q.isError ? (
        <p className="text-sm text-muted-foreground">{(q.error as Error).message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet — add a banner or notice.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Where</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell className="text-muted-foreground">{b.block_type}</TableCell>
                  <TableCell className="text-muted-foreground">{b.placement}</TableCell>
                  <TableCell className="text-muted-foreground">{b.position}</TableCell>
                  <TableCell><Badge variant={b.active ? "default" : "secondary"}>{b.active ? "Live" : "Hidden"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditing(b)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await deleteContentBlock({ data: { id: b.id } });
                            toast.success("Deleted");
                            queryClient.invalidateQueries({ queryKey: ["content-blocks"] });
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

      {editing !== undefined ? <BlockEditor row={editing} onClose={() => setEditing(undefined)} /> : null}
    </div>
  );
}
