"use client";
import { useRef, useState, type FormEvent } from "react";
import { inquiryOptions } from "@/data/business-plans";
import { submitWebsiteRequest } from "@/lib/website-requests";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function InquiryForm({
  kind = "proposal",
  initialPlan = "other",
}: {
  kind?: "proposal" | "influencer";
  initialPlan?: string;
}) {
  const attempt = useRef<{ id: string; startedAt: number } | null>(null);
  const openedAt = useRef(Date.now());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    attempt.current ??= {
      id: crypto.randomUUID(),
      startedAt: openedAt.current,
    };
    setBusy(true);
    setStatus("");
    try {
      const value = (name: string) => String(data.get(name) ?? "");
      await submitWebsiteRequest({
        ...attempt.current,
        kind,
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
        company: value("company"),
        selectedPlan: value("selectedPlan"),
        requirements: value("requirements"),
        message: value("message"),
        website: value("website"),
      });
      setStatus("Your request has been saved. Our team will review your requirements.");
      form.reset();
      attempt.current = null;
      openedAt.current = Date.now();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save your request.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="surface-card mx-auto grid max-w-3xl gap-5 p-6 sm:grid-cols-2 sm:p-8"
      aria-label="Proposal inquiry"
    >
      <div className="space-y-2">
        <Label htmlFor="inquiry-name">Full name *</Label>
        <Input
          id="inquiry-name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inquiry-company">Business / company name</Label>
        <Input id="inquiry-company" name="company" maxLength={160} autoComplete="organization" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inquiry-email">Email *</Label>
        <Input
          id="inquiry-email"
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inquiry-phone">Phone *</Label>
        <Input
          id="inquiry-phone"
          name="phone"
          type="tel"
          required
          minLength={6}
          maxLength={30}
          autoComplete="tel"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="inquiry-plan">Selected plan or service *</Label>
        <select
          id="inquiry-plan"
          name="selectedPlan"
          required
          defaultValue={initialPlan}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {inquiryOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="inquiry-requirements">Business requirements *</Label>
        <Textarea
          id="inquiry-requirements"
          name="requirements"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="inquiry-message">Additional message</Label>
        <Textarea id="inquiry-message" name="message" maxLength={5000} rows={3} />
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="inquiry-website">Leave blank</Label>
        <Input id="inquiry-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button disabled={busy} className="sm:col-span-2" type="submit">
        {busy ? "Saving…" : "Request a proposal"}
      </Button>
      {status && (
        <p role="status" className="text-sm sm:col-span-2">
          {status}
        </p>
      )}
    </form>
  );
}
