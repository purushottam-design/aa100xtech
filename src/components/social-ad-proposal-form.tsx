"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { adPlatforms, adServices, adBudgets, adObjectives } from "@/lib/social-ad-proposal";
import { submitWebsiteRequest, type WebsiteRequestInput } from "@/lib/website-requests";

export function SocialAdProposalForm() {
  const openedAt = useRef(Date.now());
  const attempt = useRef<WebsiteRequestInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("privacy") !== "on") {
      setError("Please agree to the Privacy Policy.");
      return;
    }
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const socialAds = {
      companyWebsite: value("companyWebsite"),
      services: data.getAll("services") as (typeof adServices)[number][],
      platforms: data.getAll("platforms") as (typeof adPlatforms)[number][],
      budget: value("budget") as (typeof adBudgets)[number],
      location: value("location"),
      objective: value("objective") as (typeof adObjectives)[number],
      startDate: value("startDate"),
      privacy: true as const,
    };
    const fields = {
      kind: "proposal" as const,
      name: value("name"),
      company: value("company"),
      email: value("email"),
      phone: value("phone"),
      selectedPlan: "social-media-ads",
      requirements: value("requirements"),
      website: value("website"),
      socialAds,
    };
    // Reuse the same request on transport retries; changed form details start a new attempt.
    const previous = attempt.current;
    const comparable = previous
      ? (({ id: _id, startedAt: _time, ...rest }) => rest)(previous)
      : null;
    if (!previous || JSON.stringify(comparable) !== JSON.stringify(fields))
      attempt.current = { id: crypto.randomUUID(), startedAt: openedAt.current, ...fields };
    setBusy(true);
    setError("");
    try {
      await submitWebsiteRequest(attempt.current!);
      setSaved(true);
      form.reset();
      attempt.current = null;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your enquiry could not be saved. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (saved)
    return (
      <div className="ads-form-success" role="status">
        <CheckCircle2 className="size-10 text-green-700" aria-hidden="true" />
        <h3>Thank you for sharing your advertising requirements.</h3>
        <p>
          Your enquiry has been received successfully. Our team will review your information and
          contact you using the details provided.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSaved(false);
            openedAt.current = Date.now();
          }}
        >
          Send another enquiry
        </Button>
      </div>
    );
  return (
    <form
      onSubmit={submit}
      className="ads-proposal-form"
      aria-label="Social media advertising proposal"
    >
      <fieldset disabled={busy} className="ads-form-fields">
        <div>
          <Label htmlFor="ad-name">Full name *</Label>
          <Input
            id="ad-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="ad-company">Business / company name *</Label>
          <Input
            id="ad-company"
            name="company"
            required
            minLength={2}
            maxLength={160}
            autoComplete="organization"
          />
        </div>
        <div>
          <Label htmlFor="ad-email">Business email address *</Label>
          <Input
            id="ad-email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="ad-phone">Phone / WhatsApp number *</Label>
          <Input
            id="ad-phone"
            name="phone"
            type="tel"
            required
            minLength={6}
            maxLength={30}
            autoComplete="tel"
          />
        </div>
        <div className="ads-form-wide">
          <Label htmlFor="ad-company-website">Company website (optional)</Label>
          <Input
            id="ad-company-website"
            name="companyWebsite"
            type="url"
            maxLength={600}
            placeholder="https://yourcompany.com"
            autoComplete="url"
          />
        </div>
        <fieldset className="ads-form-wide ads-choice-group">
          <legend>Services required *</legend>
          <div className="ads-checkbox-grid">
            {adServices.map((service) => (
              <label key={service}>
                <input type="checkbox" name="services" value={service} />
                <span>{service}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="ads-form-wide ads-choice-group">
          <legend>Preferred advertising platforms *</legend>
          <div className="ads-checkbox-grid">
            {adPlatforms.map((platform) => (
              <label key={platform}>
                <input type="checkbox" name="platforms" value={platform} />
                <span>{platform}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="ad-budget">Monthly advertising budget *</Label>
          <select id="ad-budget" name="budget" required defaultValue="">
            <option value="" disabled>
              Select your advertising budget
            </option>
            {adBudgets.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="ad-objective">Primary advertising objective *</Label>
          <select id="ad-objective" name="objective" required defaultValue="">
            <option value="" disabled>
              Select your campaign objective
            </option>
            {adObjectives.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <p className="ads-form-wide ads-budget-note">
          Advertising platform spend is separate from our agency service fee unless an approved
          written proposal states otherwise.
        </p>
        <div>
          <Label htmlFor="ad-location">Target city / region / country *</Label>
          <Input
            id="ad-location"
            name="location"
            required
            minLength={2}
            maxLength={200}
            placeholder="For example, Patna, India"
          />
        </div>
        <div>
          <Label htmlFor="ad-start">Expected campaign start date *</Label>
          <Input id="ad-start" name="startDate" type="date" required />
        </div>
        <div className="ads-form-wide">
          <Label htmlFor="ad-requirements">Project requirements / additional information *</Label>
          <Textarea
            id="ad-requirements"
            name="requirements"
            required
            minLength={10}
            maxLength={5000}
            rows={5}
            placeholder="What are you promoting, who do you want to reach, and what would a useful outcome look like?"
          />
        </div>
        <label className="ads-consent ads-form-wide">
          <input type="checkbox" name="privacy" required />
          <span>
            I agree to the <Link href="/privacy-policy">Privacy Policy</Link> and consent to being
            contacted about this enquiry. *
          </span>
        </label>
        <div className="hidden" aria-hidden="true">
          <label htmlFor="ad-trap">Leave blank</label>
          <input id="ad-trap" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {error && (
          <p className="ads-form-wide ads-form-error" role="alert">
            {error}
          </p>
        )}
        <Button className="ads-form-wide ads-submit" type="submit" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving your enquiry…
            </>
          ) : (
            <>
              Request My Customised Ad Proposal <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
        <p className="ads-form-wide ads-form-security">
          <ShieldCheck className="size-4" aria-hidden="true" /> Your details are shared with our
          team for this enquiry.
        </p>
      </fieldset>
    </form>
  );
}
