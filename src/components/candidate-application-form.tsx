"use client";

import { Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { globalCohort } from "@/data/careers";
import { submitWebsiteRequest } from "@/lib/website-requests";
import { site } from "@/data/site";

export function CandidateApplicationForm({
  idPrefix = "",
  initialRole = "",
  onSubmitted,
}: {
  idPrefix?: string;
  initialRole?: string;
  onSubmitted?: () => void;
}) {
  const fieldId = (name: string) => `${idPrefix}${name}`;

  const [submitting, setSubmitting] = useState(false);
  const openedAt = useRef(Date.now());
  const requestId = useRef<string | null>(null);
  const [role, setRole] = useState(initialRole);
  const [fileName, setFileName] = useState("");
  useEffect(() => setRole(initialRole), [initialRole]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (submitting) return;
    const value = (key: string) => String(fd.get(key) ?? "").trim();
    const file = fd.get("file");
    requestId.current ??= crypto.randomUUID();
    setSubmitting(true);
    try {
      const result = await submitWebsiteRequest(
        {
          id: requestId.current,
          startedAt: openedAt.current,
          kind: "career",
          name: value("full_name"),
          email: value("email"),
          phone: value("phone"),
          role,
          requirements: value("task_title"),
          hours: value("hours_needed"),
          availability: value("availability"),
          expectedCost: value("expected_cost"),
          portfolio: value("portfolio_url"),
          experience: value("experience"),
          message: value("deliverables"),
        },
        file instanceof File && file.size ? file : undefined,
      );
      if (result.notification === "sent") {
        toast.success("Your application has been submitted to HR.");
      } else if (result.notification === "previously_saved") {
        toast.success("This application is already saved for HR review.");
      } else {
        toast.warning(
          `Your application was saved, but the HR email could not be sent. Please email your resume to ${site.hrEmail}.`,
        );
      }
      form.reset();
      setRole("");
      setFileName("");
      requestId.current = null;
      openedAt.current = Date.now();
      onSubmitted?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save your application. Please contact " + site.hrEmail,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="surface-card grid gap-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={fieldId("full_name")}>Full name *</Label>
          <Input id={fieldId("full_name")} name="full_name" required placeholder="Your name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("email")}>Email *</Label>
          <Input
            id={fieldId("email")}
            name="email"
            type="email"
            required
            placeholder="you@email.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("phone")}>Phone / WhatsApp</Label>
          <Input id={fieldId("phone")} name="phone" placeholder="+91 ..." />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("role_applied")}>Role you are applying for</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id={fieldId("role_applied")}>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {globalCohort.roles.map((r) => (
                <SelectItem key={r.title} value={r.title}>
                  {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("task_title")}>Task / brief you are taking on *</Label>
        <Input
          id={fieldId("task_title")}
          name="task_title"
          required
          placeholder="e.g. Cinematic tour from 18 listing photos"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor={fieldId("hours_needed")}>Time needed</Label>
          <Input
            id={fieldId("hours_needed")}
            name="hours_needed"
            placeholder="e.g. 14 hours / 3 days"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("availability")}>Working hours / timezone</Label>
          <Input
            id={fieldId("availability")}
            name="availability"
            placeholder="10am–7pm IST, Mon–Sat"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={fieldId("expected_cost")}>Your cost / rate</Label>
          <Input
            id={fieldId("expected_cost")}
            name="expected_cost"
            placeholder="₹ per task or per month"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("deliverables")}>What exactly will you deliver? *</Label>
        <Textarea
          id={fieldId("deliverables")}
          name="deliverables"
          required
          rows={5}
          placeholder="List the files, formats, revisions and the day-by-day plan you will follow."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={fieldId("experience")}>Experience</Label>
        <Textarea
          id={fieldId("experience")}
          name="experience"
          maxLength={1000}
          rows={3}
          placeholder="Describe your relevant experience"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("portfolio_url")}>Portfolio / previous work link</Label>
        <Input id={fieldId("portfolio_url")} name="portfolio_url" placeholder="https://" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={fieldId("file")}>Resume / work sample (PDF, max 5 MB)</Label>
        <label
          htmlFor={fieldId("file")}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border/70 bg-surface-2/50 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50"
        >
          <Upload className="size-5 shrink-0 text-primary" />
          <span>{fileName || "Choose a PDF resume or work sample"}</span>
        </label>
        <input
          id={fieldId("file")}
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
        <p className="text-xs text-muted-foreground">
          Larger files? Upload to Drive or WeTransfer and paste the link in the portfolio field.
        </p>
      </div>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {submitting ? "Sending..." : "Submit task plan"}
      </Button>
    </form>
  );
}
