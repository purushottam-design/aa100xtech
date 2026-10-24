"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { findSettingGroup } from "@/lib/app-settings";
import { getAppSettings, updateAppSettings } from "@/lib/app-settings.functions";

type Values = Record<string, string | number | boolean>;

/**
 * Real settings editor backed by the `app_settings` table. Reads are open to
 * signed-in admins; saving is re-checked on the server and is super-admin only.
 */
export function SettingsForm({ group }: { group: "website" | "general" | "email" }) {
  const def = findSettingGroup(group);
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Values>({});
  const [busy, setBusy] = useState(false);

  const q = useQuery({
    queryKey: ["app-settings", group],
    queryFn: () => getAppSettings({ data: { group } }),
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (q.data?.values) setValues(q.data.values as Values);
  }, [q.data]);

  if (!def) return null;

  const canEdit = q.data?.canEdit ?? false;

  const save = async () => {
    setBusy(true);
    try {
      await updateAppSettings({ data: { group, values } });
      toast.success(`${def.label} saved`);
      queryClient.invalidateQueries({ queryKey: ["app-settings", group] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="surface-card">
      <CardHeader>
        <CardTitle className="font-display text-lg">{def.label}</CardTitle>
        <CardDescription>
          {def.description}
          {q.data?.updatedAt ? ` · Last updated ${new Date(q.data.updatedAt).toLocaleString()}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        ) : q.isError ? (
          <p className="text-sm text-muted-foreground">
            You do not have permission to perform this action.
          </p>
        ) : (
          <>
            {!canEdit ? (
              <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                Read-only: only the super admin can change these settings.
              </p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {def.fields.map((f) => {
                const v = values[f.key];
                if (f.type === "boolean") {
                  return (
                    <div
                      key={f.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-3 sm:col-span-2"
                    >
                      <div>
                        <Label htmlFor={`s-${f.key}`}>{f.label}</Label>
                        {f.help ? (
                          <p className="text-xs text-muted-foreground">{f.help}</p>
                        ) : null}
                      </div>
                      <Switch
                        id={`s-${f.key}`}
                        checked={Boolean(v)}
                        disabled={!canEdit}
                        onCheckedChange={(c) => setValues({ ...values, [f.key]: c })}
                      />
                    </div>
                  );
                }
                if (f.type === "textarea") {
                  return (
                    <div key={f.key} className="space-y-1 sm:col-span-2">
                      <Label htmlFor={`s-${f.key}`}>{f.label}</Label>
                      <Textarea
                        id={`s-${f.key}`}
                        rows={3}
                        value={String(v ?? "")}
                        disabled={!canEdit}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      />
                      {f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
                    </div>
                  );
                }
                return (
                  <div key={f.key} className="space-y-1">
                    <Label htmlFor={`s-${f.key}`}>{f.label}</Label>
                    <Input
                      id={`s-${f.key}`}
                      type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                      value={String(v ?? "")}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                        })
                      }
                    />
                    {f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={!canEdit || busy}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
