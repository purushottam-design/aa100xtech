"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { campaignServices, campaignPackages, creatorCategories } from "@/data/influencer-marketing";
import { campaignPlatforms, type CampaignDetails } from "@/lib/campaign-enquiry";
import type { CreatorListing } from "@/lib/creator-discovery";
import { submitWebsiteRequest } from "@/lib/website-requests";

export function CampaignEnquiryForm({
  creator,
  categoryChoice,
  packageChoice,
  onPackageChange,
  onClearCreator,
  submitLabel = "Get Customised Proposal",
  includeAudience = false,
}: {
  creator: CreatorListing | null;
  categoryChoice: string;
  packageChoice: string;
  onPackageChange: (value: string) => void;
  onClearCreator: () => void;
  submitLabel?: string;
  includeAudience?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("Any category");
  const [status, setStatus] = useState<{ error: boolean; message: string } | null>(null);
  const inFlight = useRef(false);
  const openedAt = useRef(Date.now());
  const attempt = useRef<{ id: string; startedAt: number } | null>(null);
  useEffect(() => {
    const chosen = creatorCategories.find((item) => item.id === categoryChoice);
    if (chosen) setCategory(chosen.name);
  }, [categoryChoice]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const value = (key: string) => String(fields.get(key) ?? "").trim();
    attempt.current ??= { id: crypto.randomUUID(), startedAt: openedAt.current };
    inFlight.current = true;
    setBusy(true);
    setStatus(null);
    try {
      await submitWebsiteRequest({
        ...attempt.current,
        kind: "influencer",
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
        company: value("company"),
        selectedPlan:
          value("campaignType") === "Viral Influencer Marketing"
            ? "viral-influencer-marketing"
            : "influencer-marketing",
        requirements: value("requirements"),
        website: value("website"),
        campaign: {
          type: value("campaignType"),
          category,
          platform: value("platform") as CampaignDetails["platform"],
          location: value("location"),
          budget: value("budget"),
          timeline: value("timeline"),
          package: packageChoice,
          ...(includeAudience ? { targetAudience: value("targetAudience") } : {}),
          ...(creator
            ? { creator: { id: creator.id, slug: creator.slug, name: creator.display_name } }
            : {}),
        },
      });
      setStatus({
        error: false,
        message:
          "Your campaign enquiry has been saved. Our team will review your brief and discuss the next steps.",
      });
      form.reset();
      setCategory("Any category");
      onPackageChange("");
      onClearCreator();
      attempt.current = null;
      openedAt.current = Date.now();
    } catch (error) {
      setStatus({
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Your enquiry could not be saved. Please try again.",
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const selectClass =
    "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <form
      aria-label="Brand campaign enquiry"
      onSubmit={submit}
      className="surface-card grid min-w-0 gap-5 p-5 sm:grid-cols-2 sm:p-8"
    >
      {creator && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
          <div>
            <p className="text-xs text-muted-foreground">Selected creator</p>
            <p className="mt-1 font-semibold">{creator.display_name}</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClearCreator}
            aria-label="Remove selected creator"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="campaign-name">Full name *</Label>
        <Input
          id="campaign-name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-company">Business name *</Label>
        <Input
          id="campaign-company"
          name="company"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={160}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-email">Email *</Label>
        <Input
          id="campaign-email"
          name="email"
          autoComplete="email"
          type="email"
          required
          maxLength={254}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-phone">Phone / WhatsApp *</Label>
        <Input
          id="campaign-phone"
          name="phone"
          autoComplete="tel"
          type="tel"
          required
          minLength={6}
          maxLength={30}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-type">Campaign type *</Label>
        <select id="campaign-type" name="campaignType" required className={selectClass}>
          {campaignServices.map((item) => (
            <option key={item.name}>{item.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-category">Influencer category *</Label>
        <select
          id="campaign-category"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
          className={selectClass}
        >
          <option>Any category</option>
          {creatorCategories.map((item) => (
            <option key={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-platform">Target platform *</Label>
        <select id="campaign-platform" name="platform" required className={selectClass}>
          {campaignPlatforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-location">Target location *</Label>
        <Input
          id="campaign-location"
          name="location"
          placeholder="City, state or country"
          required
          minLength={2}
          maxLength={200}
        />
      </div>
      {includeAudience && (
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="campaign-audience">Target audience *</Label>
          <Input
            id="campaign-audience"
            name="targetAudience"
            required
            minLength={2}
            maxLength={500}
            placeholder="Who would you like to reach?"
          />
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="campaign-budget">Estimated budget *</Label>
        <Input
          id="campaign-budget"
          name="budget"
          placeholder="Your budget or range"
          required
          maxLength={100}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="campaign-timeline">Preferred timeline *</Label>
        <Input
          id="campaign-timeline"
          name="timeline"
          placeholder="e.g. next month"
          required
          minLength={2}
          maxLength={200}
        />
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="campaign-package">Campaign package</Label>
        <select
          id="campaign-package"
          name="package"
          value={packageChoice}
          onChange={(event) => onPackageChange(event.target.value)}
          className={selectClass}
        >
          <option value="">Help me choose a scope</option>
          {campaignPackages.map((item) => (
            <option key={item.name}>{item.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:col-span-2">
        <Label htmlFor="campaign-description">Campaign description *</Label>
        <Textarea
          id="campaign-description"
          name="requirements"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          placeholder="Tell us about your brand, audience, goals and content requirements."
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="campaign-website">Leave blank</Label>
        <Input id="campaign-website" name="website" autoComplete="off" tabIndex={-1} />
      </div>
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:col-span-2">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Saving enquiry…
          </>
        ) : (
          <>
            {submitLabel} <ArrowUpRight className="size-4" />
          </>
        )}
      </Button>
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground sm:col-span-2">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        Your details are shared with our campaign team, never published in the directory.
      </p>
      {status && (
        <p
          role={status.error ? "alert" : "status"}
          className={`rounded-xl border p-4 text-sm sm:col-span-2 ${status.error ? "border-destructive/25 bg-destructive/5 text-destructive" : "border-primary/20 bg-primary/5 text-foreground"}`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}
