import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  startTwoFactorSetup,
  verifyTwoFactor,
} from "@/lib/super-admin-plus.functions";

export function AdminTwoFactor() {
  const queryClient = useQueryClient();
  const [setup, setSetup] = useState<{ secret: string; otpauth: string } | null>(null);
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState<string[] | null>(null);

  const status = useQuery({ queryKey: ["2fa"], queryFn: () => getTwoFactorStatus(), retry: false });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["2fa"] });

  const start = useMutation({
    mutationFn: () => startTwoFactorSetup(),
    onSuccess: (d) => setSetup(d),
    onError: (e: Error) => toast.error(e.message),
  });

  const confirm = useMutation({
    mutationFn: () => confirmTwoFactor({ data: { code } }),
    onSuccess: (d) => {
      setRecovery(d.recoveryCodes);
      setSetup(null);
      setCode("");
      toast.success("Two-factor authentication is on");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verify = useMutation({
    mutationFn: () => verifyTwoFactor({ data: { code } }),
    onSuccess: () => {
      setCode("");
      toast.success("Verified for this device");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disable = useMutation({
    mutationFn: () => disableTwoFactor({ data: { code } }),
    onSuccess: () => {
      setCode("");
      toast.success("Two-factor authentication turned off");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const enabled = status.data?.enabled ?? false;
  const unlocked = status.data?.unlocked ?? false;

  const qr = setup
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setup.otpauth)}`
    : null;

  return (
    <Card className="surface-card">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <CardTitle className="font-display text-lg">Two-factor authentication</CardTitle>
            <CardDescription>Authenticator app code for the admin account.</CardDescription>
          </div>
          <Badge className="ml-auto" variant={enabled ? "default" : "secondary"}>
            {enabled ? (unlocked ? "On · verified" : "On · verify needed") : "Off"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.isLoading ? (
          <p className="text-sm text-muted-foreground">Checking…</p>
        ) : !enabled && !setup ? (
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? "Preparing…" : "Set up two-factor"}
          </Button>
        ) : null}

        {setup ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Scan this in Google Authenticator (or any authenticator app), then enter the 6-digit code.
            </p>
            {qr ? <img src={qr} alt="Two-factor QR code" width={200} height={200} className="rounded-md border" /> : null}
            <p className="text-xs text-muted-foreground">
              Can’t scan? Enter this key manually: <span className="font-mono">{setup.secret}</span>
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="code-confirm">6-digit code</Label>
                <Input
                  id="code-confirm"
                  className="w-40"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={8}
                />
              </div>
              <Button disabled={code.length < 6 || confirm.isPending} onClick={() => confirm.mutate()}>
                {confirm.isPending ? "Checking…" : "Turn on"}
              </Button>
            </div>
          </div>
        ) : null}

        {recovery ? (
          <div className="rounded-md border border-border/60 p-3">
            <p className="text-sm font-medium">Save these recovery codes</p>
            <p className="text-xs text-muted-foreground">Each one works once if you lose your phone.</p>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm sm:grid-cols-4">
              {recovery.map((c) => <span key={c}>{c}</span>)}
            </div>
          </div>
        ) : null}

        {enabled ? (
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="code-verify">Current code</Label>
              <Input
                id="code-verify"
                className="w-40"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={20}
              />
            </div>
            <Button disabled={code.length < 6 || verify.isPending} onClick={() => verify.mutate()}>
              {verify.isPending ? "Checking…" : "Verify this device"}
            </Button>
            <Button
              variant="destructive"
              disabled={code.length < 6 || disable.isPending}
              onClick={() => disable.mutate()}
            >
              Turn off
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
