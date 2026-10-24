"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppError, AppLoading, AppShell, RequireAppAuth, SignOutButton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/accounts.functions";

const title = "Settings — AA100XTech App";
const description =
  "Update your AA100XTech contact details and sign out of the mobile app. Changes are saved to your existing account.";

export default () => (
    <RequireAppAuth>
      <AppSettings />
    </RequireAppAuth>
  );

function AppSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", "account"],
    queryFn: () => getMyAccount(),
  });

  const profile = data?.profile ?? null;
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profile not loaded yet.");
      // RLS: users may update only their own profiles row.
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", profile.id);
      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: async () => {
      toast.success("Settings saved");
      await queryClient.invalidateQueries({ queryKey: ["app", "account"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Settings">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update the details you're allowed to change on your own account.
      </p>

      <div className="mt-5 space-y-4">
        {isLoading ? <AppLoading label="Loading settings…" /> : null}
        {error ? <AppError message={(error as Error).message} /> : null}

        {profile ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="set-name">Full name</Label>
              <Input
                id="set-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-phone">Phone</Label>
              <Input
                id="set-phone"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="set-bio">About</Label>
              <Textarea
                id="set-bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={600}
              />
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Account email
              </p>
              <p className="mt-1 break-words text-sm font-medium text-foreground">
                {profile.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Email, username and roles are managed by your company admin.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        ) : null}

        <Button asChild variant="outline" className="w-full">
          <Link to="/app/install">Install app on phone</Link>
        </Button>

        <SignOutButton className="w-full" />
      </div>
    </AppShell>
  );
}
