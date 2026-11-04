"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { influencerApplicationSchema, influencerCategories } from "@/lib/influencers";

export function InfluencerProgramApplication({
  heading = "Let’s get to know you.",
  submitLabel = "Apply to Join AA100XTech",
}: {
  heading?: string;
  submitLabel?: string;
} = {}) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const submissionId = useRef<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const value = (name: string) => String(fields.get(name) ?? "").trim();
    const primary = value("primary_platform") as "instagram" | "youtube" | "facebook";
    if (!value(primary)) {
      setError("Add the profile URL for your selected primary platform.");
      return;
    }
    const motivation = value("motivation");
    const followers = value("follower_count") ? Number(value("follower_count")) : null;
    const parsed = influencerApplicationSchema.safeParse({
      submission_id: (submissionId.current ??= crypto.randomUUID()),
      full_name: value("full_name"),
      display_name: value("full_name"),
      email: value("email"),
      phone: value("phone"),
      city: value("city"),
      state: value("state"),
      country: value("country"),
      category: value("category"),
      biography: motivation,
      audience_location: value("audience_location"),
      socials: {
        primary,
        instagram: value("instagram"),
        youtube: value("youtube"),
        facebook: value("facebook"),
        instagram_followers: primary === "instagram" ? followers : null,
        youtube_followers: primary === "youtube" ? followers : null,
        facebook_followers: primary === "facebook" ? followers : null,
      },
      interest: "both",
      deliverables: value("collaboration_interests") || motivation,
      portfolio_url: value("portfolio_url"),
      expected_terms:
        "Partnership eligibility, rewards, scope and costs to be agreed in a written partnership agreement.",
      processing_consent: fields.get("processing_consent") === "on",
      publication_consent: fields.get("publication_consent") === "on",
      program_terms_consent: fields.get("program_terms_consent") === "on",
      website: value("website"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your application details.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("application", JSON.stringify(parsed.data));
      const response = await fetch("/api/influencers/apply", {
        method: "POST",
        headers: { "x-aa-rpc": "1" },
        body,
      });
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw new Error(result.error || "Your application could not be saved. Please try again.");
      setDone(true);
      form.reset();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your application could not be saved. Please try again.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="ip-application-success" role="status">
        <CheckCircle2 className="size-12 text-primary" />
        <h3 className="mt-5 text-2xl font-bold">Your next chapter starts here.</h3>
        <p className="mt-3 leading-7">
          Your application is with our team. We’ll review your details and contact you about the
          next steps. Your profile stays private until approval and publication consent are
          confirmed.
        </p>
        <Link href="/influencers#directory" className="ip-profile-link mt-6">
          Explore our partners <ArrowUpRight className="size-4" />
        </Link>
      </div>
    );
  return (
    <form
      className="ip-application-form"
      onSubmit={submit}
      aria-label="Influencer partner application"
    >
      <div className="ip-form-heading">
        <span className="ip-icon">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h3 className="text-xl font-bold">{heading}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your details stay private while we review your application.
          </p>
        </div>
      </div>
      <div className="ip-form-grid">
        {[
          ["full_name", "Full Name", "text"],
          ["phone", "Mobile Number", "tel"],
          ["email", "Email", "email"],
          ["city", "City", "text"],
          ["state", "State / Region", "text"],
          ["country", "Country", "text"],
        ].map(([name, label, type]) => (
          <div key={name} className="ip-form-field">
            <Label htmlFor={`program-${name}`}>{label} *</Label>
            <Input
              id={`program-${name}`}
              name={name}
              type={type}
              required
              maxLength={name === "email" ? 255 : name === "phone" ? 30 : 80}
              autoComplete={
                name === "full_name"
                  ? "name"
                  : name === "phone"
                    ? "tel"
                    : name === "email"
                      ? "email"
                      : "off"
              }
            />
          </div>
        ))}
        {[
          ["instagram", "Instagram Profile URL"],
          ["youtube", "YouTube Channel URL"],
          ["facebook", "Facebook Profile / Page URL"],
        ].map(([name, label]) => (
          <div key={name} className="ip-form-field">
            <Label htmlFor={`program-${name}`}>{label}</Label>
            <Input
              id={`program-${name}`}
              name={name}
              type="url"
              maxLength={500}
              placeholder={`https://${name}.com/your-profile`}
            />
          </div>
        ))}
        <div className="ip-form-field">
          <Label htmlFor="program-primary">Primary Social Platform *</Label>
          <select id="program-primary" name="primary_platform" required defaultValue="">
            <option value="" disabled>
              Select a platform
            </option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
        <div className="ip-form-field">
          <Label htmlFor="program-followers">Follower Count *</Label>
          <Input
            id="program-followers"
            name="follower_count"
            type="number"
            min={0}
            max={10000000000}
            step={1}
            required
            placeholder="Followers on your primary platform"
          />
        </div>
        <div className="ip-form-field">
          <Label htmlFor="program-category">Content Category / Niche *</Label>
          <select id="program-category" name="category" required defaultValue="">
            <option value="" disabled>
              Select your niche
            </option>
            {influencerCategories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="ip-form-field col-span-full">
          <Label htmlFor="program-audience">Main Audience Locations *</Label>
          <Input
            id="program-audience"
            name="audience_location"
            required
            maxLength={250}
            placeholder="Countries or regions your audience is based in"
          />
        </div>
        <div className="ip-form-field col-span-full">
          <Label htmlFor="program-portfolio">Portfolio URL</Label>
          <Input
            id="program-portfolio"
            name="portfolio_url"
            type="url"
            maxLength={500}
            placeholder="https://your-portfolio.com"
          />
        </div>
        <div className="ip-form-field col-span-full">
          <Label htmlFor="program-collaboration">Collaboration Interests</Label>
          <Textarea
            id="program-collaboration"
            name="collaboration_interests"
            minLength={20}
            maxLength={2000}
            rows={3}
            placeholder="Tell us about the content and collaborations you’d like to work on."
          />
        </div>
        <div className="ip-form-field col-span-full">
          <Label htmlFor="program-motivation">Why do you want to partner with AA100XTech? *</Label>
          <Textarea
            id="program-motivation"
            name="motivation"
            required
            minLength={20}
            maxLength={1200}
            rows={4}
            placeholder="Tell us about your content, the businesses you can introduce, and what you’d like to achieve together."
          />
          <p className="text-xs leading-5 text-muted-foreground">
            This introduction is reviewed before any public profile is prepared. Please leave
            private contact details in the contact fields above.
          </p>
        </div>
      </div>
      <div className="ip-form-consents">
        <label>
          <input type="checkbox" name="program_terms_consent" required />
          <span>
            I agree to the{" "}
            <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              Influencer Partner Program terms
            </Link>
            . Eligibility, benefits, rewards and any costs will be agreed in writing; applying does
            not guarantee a collaboration or free services. *
          </span>
        </label>
        <label>
          <input type="checkbox" name="processing_consent" required />
          <span>
            I consent to processing my application and being contacted about this partnership. *
          </span>
        </label>
        <label>
          <input type="checkbox" name="publication_consent" required />
          <span>
            I consent to an approved public profile with my creator name, location, social links and
            introduction after review. My private email and phone will not be published. I can
            withdraw publication consent. *
          </span>
        </label>
      </div>
      <div hidden aria-hidden="true">
        <label htmlFor="program-website">Leave empty</label>
        <input id="program-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy} className="w-full">
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending your application…
          </>
        ) : (
          <>
            {submitLabel} <ArrowUpRight className="size-4" />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Handled with care. Read our{" "}
        <Link href="/privacy-policy" className="text-primary underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
