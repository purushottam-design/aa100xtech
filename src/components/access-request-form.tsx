"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Briefcase,
  Building2,
  Check,
  Lock,
  Megaphone,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { signUpAccount } from "@/lib/accounts.functions";
import { useNavigate } from "@/lib/navigation";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .default(null);

export const accessRequestSchema = z.object({
  first_name: z.string().trim().min(1, "Enter your first name").max(60),
  middle_name: optionalText(60),
  last_name: z.string().trim().min(1, "Enter your last name").max(60),
  personal_email: z.string().trim().email("Enter a valid personal email").max(255),
  company_email: optionalText(255).refine(
    (v) => v === null || z.string().email().safeParse(v).success,
    "Enter a valid company email or leave it blank",
  ),
  whatsapp_number: z
    .string()
    .trim()
    .min(6, "Enter a valid WhatsApp number")
    .max(30, "WhatsApp number is too long"),
  telegram_number: optionalText(30).refine(
    (v) => v === null || v.length >= 6,
    "Enter a valid Telegram number or leave it blank",
  ),
  requested_role: z.enum(["employee", "customer", "job_seeker", "partner"]),
  company: optionalText(120),
  message: optionalText(1000),
});

/**
 * Public account types. Each maps onto the existing app_role enum so no
 * database change is needed and the admin console keeps working as-is.
 * Admin is deliberately NOT selectable here — the supreme admin account is
 * configured through ADMIN_EMAIL / ADMIN_PASSWORD in the environment.
 */
export const accountTypes = [
  {
    value: "employee",
    label: "Company",
    icon: Building2,
    description: "Employee / team member account",
    extras: [
      { name: "company_name", label: "Company name", required: true },
      { name: "industry", label: "Industry", required: true },
      { name: "company_website", label: "Company website" },
      { name: "company_size", label: "Company size" },
      { name: "location", label: "Location", required: true },
    ],
  },
  {
    value: "job_seeker",
    label: "Interview",
    icon: Briefcase,
    description: "Job seeker in the interview process",
    extras: [
      { name: "experience", label: "Experience (years)", required: true },
      { name: "skills", label: "Skills", required: true },
      { name: "designation", label: "Designation applied for", required: true },
    ],
  },
  {
    value: "partner",
    label: "Marketing",
    icon: Megaphone,
    description: "Influencer, affiliate or marketing partner",
    extras: [
      {
        name: "marketing_type",
        label: "Marketing type",
        required: true,
        options: ["Agency", "Freelancer", "In-house"],
      },
      { name: "company_name", label: "Company name" },
    ],
  },
  {
    value: "customer",
    label: "Business",
    icon: TrendingUp,
    description: "Client or business partner",
    extras: [
      { name: "business_name", label: "Business name", required: true },
      { name: "business_category", label: "Business category", required: true },
      { name: "location", label: "Location", required: true },
    ],
  },
] as const;

// Kept for backward compatibility with any existing import.
export const accessRoleOptions = accountTypes.map((t) => ({
  value: t.value,
  label: t.label,
}));

export function composeFullName(first: string, middle: string | null | undefined, last: string) {
  return [first, middle, last]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export function AccessRequestForm({
  idPrefix = "req",
  submitLabel = "Send request for approval",
  onSuccess,
}: {
  idPrefix?: string;
  submitLabel?: string;
  onSuccess: () => void;
}) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [extraSelects, setExtraSelects] = useState<Record<string, string>>({});

  const activeType = accountTypes.find((t) => t.value === role) ?? null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    if (!role) {
      toast.error("Please select an account type.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const value = (name: string) => ((fd.get(name) as string) ?? "").trim();

    // Role-specific answers are appended to the message so existing tables,
    // APIs and the admin console keep working unchanged.
    const extras = activeType?.extras ?? [];
    const missing = extras.find(
      (f) =>
        "required" in f &&
        f.required &&
        !(("options" in f ? extraSelects[f.name] : value(f.name)) ?? "").trim(),
    );
    if (missing) {
      toast.error(`Please fill in ${missing.label.toLowerCase()}.`);
      return;
    }
    const extraLines = extras
      .map((f) => {
        const v = ("options" in f ? extraSelects[f.name] : value(f.name)) ?? "";
        return v.trim() ? `${f.label}: ${v.trim()}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const note = value("message");
    const composedMessage = [
      `Account type: ${activeType?.label ?? role}`,
      extraLines,
      note ? `Notes: ${note}` : "",
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1000);

    const parsed = accessRequestSchema.safeParse({
      first_name: value("first_name"),
      middle_name: value("middle_name"),
      last_name: value("last_name"),
      personal_email: value("personal_email"),
      company_email: value("company_email"),
      whatsapp_number: value("whatsapp_number"),
      telegram_number: value("telegram_number"),
      requested_role: role,
      company: value("company_name") || value("business_name") || value("company") || "",
      message: composedMessage,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }

    const d = parsed.data;
    const fullName = composeFullName(d.first_name, d.middle_name, d.last_name);

    const password = value("password");
    const confirm = value("confirm_password");
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);
    let existing = false;
    try {
      const result = await signUpAccount({
        data: {
          fullName,
          email: d.personal_email,
          phone: d.whatsapp_number,
          password,
          role: d.requested_role,
          details: composedMessage,
        },
      });
      existing = result?.code === "email_exists";
    } catch (error) {
      setBusy(false);
      const message =
        error instanceof Error ? error.message : "Could not create your account. Please try again.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    const { error: signInError } = await supabase.auth
      .signInWithPassword({
        email: d.personal_email,
        password,
      })
      .catch(() => ({ error: new Error("Sign-in is temporarily unavailable.") }));
    setBusy(false);

    if (signInError) {
      if (existing) {
        toast.error("This email already has an account. Please sign in with your password.");
        return;
      }
      toast.success("Account created. Please sign in with your email and password.");
      onSuccess();
      return;
    }

    toast.success(
      existing ? "Signed in to your existing account" : "Account created — you are signed in",
    );
    onSuccess();
    navigate({ to: "/dashboard", replace: true });
  }

  const id = (name: string) => `${idPrefix}-${name}`;

  if (!role) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-foreground">What are you here for?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Select your account type to continue.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accountTypes.map((t) => {
            const Icon = t.icon;
            const selected = picked === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setPicked(t.value)}
                className={`relative flex h-full flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                    : "border-border/60 bg-card/40"
                }`}
              >
                {selected ? (
                  <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
                <Icon className={`size-5 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-semibold text-foreground">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            );
          })}

          <div className="flex h-full flex-col items-start gap-2 rounded-xl border border-dashed border-border/60 p-4 opacity-70">
            <ShieldCheck className="size-5 text-muted-foreground" />
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              Admin <Lock className="size-3.5 text-muted-foreground" />
            </span>
            <span className="text-xs text-muted-foreground">
              Issued by the company only — not available for public sign-up.
            </span>
          </div>
        </div>

        <Button type="button" className="w-full" disabled={!picked} onClick={() => setRole(picked)}>
          Continue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
        <span className="text-sm">
          Account type: <span className="font-semibold text-foreground">{activeType?.label}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setRole(null);
            setExtraSelects({});
          }}
        >
          Change
        </Button>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground">Personal details</legend>
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field htmlFor={id("first_name")} label="First name">
            <Input
              id={id("first_name")}
              name="first_name"
              required
              maxLength={60}
              autoComplete="given-name"
              placeholder="Aman"
            />
          </Field>
          <Field htmlFor={id("middle_name")} label="Middle name" optional>
            <Input
              id={id("middle_name")}
              name="middle_name"
              maxLength={60}
              autoComplete="additional-name"
              placeholder="Kumar"
            />
          </Field>
          <Field htmlFor={id("last_name")} label="Last name">
            <Input
              id={id("last_name")}
              name="last_name"
              required
              maxLength={60}
              autoComplete="family-name"
              placeholder="Sharma"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground">
          {activeType?.label} details
        </legend>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          {(activeType?.extras ?? []).map((f) => (
            <Field
              key={f.name}
              htmlFor={id(f.name)}
              label={f.label}
              optional={!("required" in f && f.required)}
            >
              {"options" in f ? (
                <Select
                  value={extraSelects[f.name] ?? ""}
                  onValueChange={(v) => setExtraSelects((s) => ({ ...s, [f.name]: v }))}
                >
                  <SelectTrigger id={id(f.name)} className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input id={id(f.name)} name={f.name} maxLength={120} />
              )}
            </Field>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground">Email addresses</legend>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field htmlFor={id("personal_email")} label="Personal email">
            <Input
              id={id("personal_email")}
              name="personal_email"
              type="email"
              required
              maxLength={255}
              autoComplete="email"
              placeholder="you@gmail.com"
            />
          </Field>
          <Field htmlFor={id("company_email")} label="Company email" optional>
            <Input
              id={id("company_email")}
              name="company_email"
              type="email"
              maxLength={255}
              autoComplete="email"
              placeholder="you@company.com"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground">Contact numbers</legend>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field htmlFor={id("whatsapp_number")} label="WhatsApp number">
            <Input
              id={id("whatsapp_number")}
              name="whatsapp_number"
              type="tel"
              inputMode="tel"
              required
              minLength={6}
              maxLength={30}
              autoComplete="tel"
              placeholder="+91 98765 43210"
            />
          </Field>
          <Field htmlFor={id("telegram_number")} label="Telegram number" optional>
            <Input
              id={id("telegram_number")}
              name="telegram_number"
              type="tel"
              inputMode="tel"
              maxLength={30}
              autoComplete="tel"
              placeholder="+91 98765 43210"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-foreground">Create your password</legend>
        <div className="grid items-end gap-4 sm:grid-cols-2">
          <Field htmlFor={id("password")} label="Password">
            <Input
              id={id("password")}
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </Field>
          <Field htmlFor={id("confirm_password")} label="Confirm password">
            <Input
              id={id("confirm_password")}
              name="confirm_password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
            />
          </Field>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={id("message")}>
          Anything we should know?{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea id={id("message")} name="message" rows={4} maxLength={1000} />
      </div>

      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {submitError}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}

/**
 * Field keeps the label area flexible and pins the control to the bottom of the
 * grid cell, so inputs in a row stay on one baseline even when a label wraps.
 */
function Field({
  htmlFor,
  label,
  optional = false,
  children,
}: {
  htmlFor: string;
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-2">
      <Label
        htmlFor={htmlFor}
        className="flex flex-1 flex-wrap items-start gap-x-1.5 leading-tight"
      >
        <span>{label}</span>
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </Label>
      <div className="[&>*]:w-full">{children}</div>
    </div>
  );
}
