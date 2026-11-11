"use client";
import { useRef, useState, type FormEvent } from "react";
import { inquiryOptions } from "@/data/business-plans";
import { submitWebsiteRequest } from "@/lib/website-requests";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { partnershipInterestGroups, partnershipPackages } from "@/data/influencer-partnership";
import { partnershipProposalSchema } from "@/lib/influencer-partnership";

export function InquiryForm({
  kind = "proposal",
  initialPlan = "other",
  partnership = false,
  initialPackage = "expert-guidance",
}: {
  kind?: "proposal" | "influencer";
  initialPlan?: string;
  partnership?: boolean;
  initialPackage?: string;
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
        ...(partnership
          ? {
              partnership: partnershipProposalSchema.parse({
                package: value("partnershipPackage"),
                services: data.getAll("partnershipServices").map(String),
                budget: value("budget"),
                timeline: value("timeline"),
                privacy: data.get("privacy") === "on",
              }),
              message: [
                "Service: Influencer Partnership",
                `Package: ${partnershipPackages.find((p) => p.id === value("partnershipPackage"))?.name ?? ""}`,
                `Required services: ${data.getAll("partnershipServices").join(", ") || "Need expert guidance"}`,
                `Budget: ${value("budget") || "To discuss"}`,
                `Timeline: ${value("timeline") || "To discuss"}`,
                value("message"),
              ]
                .filter(Boolean)
                .join("\n"),
            }
          : {}),
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
        <Label htmlFor="inquiry-company">
          {partnership ? "Company / Creator Name" : "Business / company name"}
        </Label>
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
          disabled={partnership}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {inquiryOptions
            .filter((p) => partnership || p.id !== "influencer-partnership")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        {partnership && <input type="hidden" name="selectedPlan" value="influencer-partnership" />}
      </div>
      {partnership && (
        <>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="partnership-package">Selected Package *</Label>
            <select
              id="partnership-package"
              name="partnershipPackage"
              defaultValue={initialPackage}
              required
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {partnershipPackages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {partnershipInterestGroups.map((group) => (
            <fieldset key={group.name} className="space-y-3 sm:col-span-2">
              <legend className="mb-2 text-sm font-semibold">
                Required Services – {group.name}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.services.map((service) => (
                  <label className="flex items-start gap-2 text-sm" key={service}>
                    <input
                      className="mt-1 accent-orange-500"
                      type="checkbox"
                      name="partnershipServices"
                      value={service}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="space-y-2">
            <Label htmlFor="partnership-budget">Budget Range (Optional)</Label>
            <Input
              id="partnership-budget"
              name="budget"
              maxLength={200}
              placeholder="Your preferred budget, or to discuss"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partnership-timeline">Expected Timeline (Optional)</Label>
            <Input
              id="partnership-timeline"
              name="timeline"
              maxLength={200}
              placeholder="When would you like to get started?"
            />
          </div>
        </>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="inquiry-requirements">
          {partnership ? "Project Description *" : "Business requirements *"}
        </Label>
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
      {partnership && (
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="privacy" required className="mt-1 accent-orange-500" />
          <span>
            I agree to the{" "}
            <Link
              className="text-primary underline"
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>{" "}
            and to being contacted about my partnership proposal. *
          </span>
        </label>
      )}
      <Button disabled={busy} className="sm:col-span-2" type="submit">
        {busy ? "Saving…" : partnership ? "Request My Partnership Proposal" : "Request a proposal"}
      </Button>
      {status && (
        <p role="status" className="text-sm sm:col-span-2">
          {status}
        </p>
      )}
    </form>
  );
}
