"use client";

import { Link, useNavigate } from "@/lib/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  LogIn,
  Megaphone,
  UserRoundPlus,
} from "lucide-react";
import styles from "./auth.module.css";

import { AccessRequestForm } from "@/components/access-request-form";
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
import { supabase } from "@/integrations/supabase/client";
import { PANEL_PATH, panelsForRoles } from "@/lib/admin-panels";
import { getMyAccount } from "@/lib/accounts.functions";
import { recordAdminLogin } from "@/lib/admin-management.functions";

export default AuthPage;

const signInModes = [
  {
    id: "company",
    label: "Company Login",
    short: "Company",
    icon: Building2,
    description: "For AA100XTech employees and the supreme user.",
    roles: ["supreme_admin", "employee"],
  },
  {
    id: "marketing",
    label: "Marketing Partners",
    short: "Marketing",
    icon: Megaphone,
    description: "For influencer and affiliate partners on the 30-level ladder.",
    roles: ["partner"],
  },
  {
    id: "business",
    label: "Business Partners",
    short: "Business",
    icon: BriefcaseBusiness,
    description: "For clients and business partners with an active project or retainer.",
    roles: ["customer", "partner"],
  },
  {
    id: "interviews",
    label: "Interviews — Job Seekers",
    short: "Interviews",
    icon: GraduationCap,
    description: "For candidates in the interview and trial process.",
    roles: ["job_seeker"],
  },
] as const;

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<(typeof signInModes)[number]["id"]>("company");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const active = signInModes.find((m) => m.id === mode)!;
  const ActiveModeIcon = active.icon;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error("Enter your email and password to sign in.");
      return;
    }
    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setBusy(false);
      toast.error(
        error.message === "Invalid login credentials"
          ? "That email and password combination is not recognised. Check the credentials issued to you."
          : error.message,
      );
      return;
    }

    // Records the sign-in and blocks deactivated / suspended accounts.
    try {
      const login = await recordAdminLogin();
      if (login.blocked) {
        await supabase.auth.signOut();
        setBusy(false);
        toast.error(
          login.status === "suspended"
            ? "This account is suspended. Contact the super admin."
            : "This account is deactivated. Contact the super admin.",
        );
        return;
      }
    } catch {
      // never block sign-in on a logging failure
    }

    try {
      const account = await getMyAccount();
      const roles: string[] = account.roles ?? [];
      const allowed = roles.some((r: string) => (active.roles as readonly string[]).includes(r));
      if (!allowed) {
        // The same email + password works on every login mode; we only hint
        // that this account belongs to a different workspace.
        toast.info(`Signed in — your workspace is not ${active.label.toLowerCase()}.`);
      }

      // Role-based admin routing: one admin role opens its dashboard directly,
      // several roles show the "Continue as" selection screen.
      const panels = panelsForRoles(roles);
      if (panels.length === 1) {
        setBusy(false);
        toast.success("Signed in");
        navigate({ to: PANEL_PATH[panels[0]!] as never, replace: true });
        return;
      }
      if (panels.length > 1) {
        setBusy(false);
        toast.success("Signed in");
        navigate({ to: "/admin/select", replace: true });
        return;
      }
    } catch {
      // if the role check fails, continue — the dashboard shows the correct workspace
    }

    setBusy(false);
    toast.success("Signed in");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className={styles["page"]}>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className={styles["intro"]}>
          <span className={styles["introAccent"]} aria-hidden="true" />
          <h1 className={styles["title"]}>
            Welcome to <span className={styles["brand"]}>AA100X Tech</span>
          </h1>
          <p className={styles["introCopy"]}>
            Create your account first — choose your account type, set an email and password, and you
            can sign in straight away on Company, Interviews, Marketing or Business login.
          </p>
          <p className={styles["guide"]}>
            Admin ya super admin ho?{" "}
            <Link to="/admin-guide" className={styles["guideLink"]}>
              Picture guide dekhein — panel kaise khulta hai
            </Link>
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
          {/* Sign in — first on mobile, right column on desktop */}
          <Card className={`surface-card order-1 lg:order-2 ${styles["card"]}`}>
            <CardHeader className={styles["cardHeader"]}>
              <span className={styles["cardIcon"]}>
                <LogIn className="size-5" aria-hidden="true" />
              </span>
              <CardTitle className={styles["cardTitle"]}>Already have an account?</CardTitle>
              <CardDescription
                className={styles["cardDescription"]}
                id="login-mode-description"
                aria-live="polite"
              >
                Sign in to your AA100XTech account. {active.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="mb-5 space-y-2">
                <Label htmlFor="login-mode">Login as</Label>
                <Select
                  value={mode}
                  disabled={busy}
                  onValueChange={(value) => {
                    const selected = signInModes.find((item) => item.id === value);
                    if (selected) setMode(selected.id);
                  }}
                >
                  <SelectTrigger
                    id="login-mode"
                    aria-describedby="login-mode-description"
                    className="h-12 rounded-xl border-primary/30 bg-primary/5 px-4 font-medium shadow-sm transition-colors hover:border-primary/60 hover:bg-primary/10 focus:ring-2"
                  >
                    <SelectValue>
                      <span className="flex items-center gap-3">
                        <ActiveModeIcon
                          className="size-4 shrink-0 text-amber-700"
                          aria-hidden="true"
                        />
                        {active.short}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/20 bg-background p-1.5 shadow-lg motion-reduce:animate-none">
                    {signInModes.map(({ id, short, icon: Icon }) => (
                      <SelectItem
                        key={id}
                        value={id}
                        textValue={short}
                        className="cursor-pointer rounded-lg py-3 pl-3 pr-9 font-medium focus:bg-primary/10 focus:text-foreground data-[state=checked]:bg-primary/8"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="size-4 shrink-0 text-amber-700" aria-hidden="true" />
                          {short}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    ref={emailRef}
                    type="email"
                    required
                    maxLength={255}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign up request — second on mobile, left column on desktop */}
          <Card className={`surface-card order-2 lg:order-1 ${styles["card"]}`}>
            <CardHeader className={styles["cardHeader"]}>
              <span className={styles["cardIcon"]}>
                <UserRoundPlus className="size-5" aria-hidden="true" />
              </span>
              <CardTitle className={styles["cardTitle"]}>Create your account</CardTitle>
              <CardDescription className={styles["cardDescription"]}>
                {signUpDone
                  ? "Your account is ready."
                  : "Create your account with an email and password, then sign in on any login mode."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signUpDone ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Account created</p>
                    <p className="mt-1">
                      You can now sign in with the same email and password on Company, Interviews,
                      Marketing or Business login.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => emailRef.current?.focus()}
                  >
                    Go to Sign In
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setSignUpDone(false)}
                  >
                    Create another account
                  </Button>
                </div>
              ) : (
                <AccessRequestForm
                  idPrefix="signup"
                  submitLabel="Create my account"
                  onSuccess={() => setSignUpDone(true)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
