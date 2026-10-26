"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import "@/app/influencers/influencers.css";
import {
  influencerApplicationSchema,
  influencerCategories,
  maxImageBytes,
  maxUploadBytes,
} from "@/lib/influencers";

function Field({ name, label, children }: { name: string; label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}
const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
export function InfluencerApplicationForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const value = (key: string) => String(fd.get(key) ?? "").trim();
    const candidate = {
      ...Object.fromEntries(
        [
          "full_name",
          "display_name",
          "email",
          "phone",
          "city",
          "state",
          "country",
          "biography",
          "category",
          "specialization",
          "audience_location",
          "interest",
          "deliverables",
          "expected_terms",
          "previous_collaborations",
          "portfolio_url",
          "website",
        ].map((key) => [key, value(key)]),
      ),
      socials: {
        instagram: value("instagram"),
        instagram_followers: value("instagram_followers")
          ? Number(value("instagram_followers"))
          : null,
        youtube: value("youtube"),
        youtube_followers: value("youtube_followers") ? Number(value("youtube_followers")) : null,
        facebook: value("facebook"),
        facebook_followers: value("facebook_followers")
          ? Number(value("facebook_followers"))
          : null,
        other: lines(value("other_socials")),
      },
      video_urls: lines(value("video_urls")),
      processing_consent: fd.get("processing_consent") === "on",
      publication_consent: fd.get("publication_consent") === "on",
    };
    const parsed = influencerApplicationSchema.safeParse(candidate);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    const files = [...fd.values()].filter((v): v is File => typeof v !== "string" && v.size > 0);
    if (
      files.some(
        (f) =>
          f.size > maxImageBytes || !["image/jpeg", "image/png", "image/webp"].includes(f.type),
      ) ||
      files.reduce((n, f) => n + f.size, 0) > maxUploadBytes - 65536 ||
      fd.getAll("gallery").filter((f) => typeof f !== "string" && f.size > 0).length > 6
    ) {
      toast.error(
        "Use JPG, PNG or WebP images, up to 3 MB each, six portfolio images and 18 MB total.",
      );
      return;
    }
    const body = new FormData();
    body.set("application", JSON.stringify(parsed.data));
    for (const key of ["profile_image", "cover_image", "gallery"])
      for (const file of fd.getAll(key))
        if (typeof file !== "string" && file.size) body.append(key, file);
    setBusy(true);
    try {
      const response = await fetch("/api/influencers/apply", {
        method: "POST",
        headers: { "x-aa-rpc": "1" },
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save your application");
      form.reset();
      setDone(true);
      toast.success("Application received");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save your application. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="influencer-application mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <Link
        href="/influencers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Influencer partnership program
      </Link>
      <p className="mb-4 mt-10 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
        Your next chapter starts here
      </p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        Let’s build something <span className="text-primary">worth sharing.</span>
      </h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
        Tell us about your content and your ambitions. We review every application individually.
        Website or app development, promotional deliverables, compensation and timelines are agreed
        in writing before work begins.
      </p>
      {done ? (
        <div role="status" className="surface-card mt-10 space-y-4 p-8">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="text-2xl font-semibold">Your application is with our team.</h2>
          <p className="text-muted-foreground">
            We’ll contact you using the details you provided. Your profile stays private until
            approval, consent confirmation and publication. Applying does not guarantee a
            collaboration or free services.
          </p>
          <Button asChild>
            <Link href="/influencers">Back to the program</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="surface-card mt-10 space-y-10 p-5 sm:p-9">
          <fieldset className="space-y-5">
            <legend className="mb-5 text-xl font-semibold">01 / About you</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["full_name", "Full name", "text"],
                ["display_name", "Public creator name", "text"],
                ["email", "Private email", "email"],
                ["phone", "Private phone / WhatsApp", "tel"],
                ["city", "City (public)", "text"],
                ["state", "State (public)", "text"],
                ["country", "Country", "text"],
              ].map(([name, label, type]) => (
                <Field key={name} name={name!} label={`${label} *`}>
                  <Input
                    id={name}
                    name={name}
                    type={type}
                    required
                    maxLength={name === "email" ? 255 : name === "phone" ? 30 : 120}
                  />
                </Field>
              ))}
              <Field name="category" label="Main content category *">
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue=""
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    Select your niche
                  </option>
                  {influencerCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field name="biography" label="Short public biography *">
              <Textarea
                id="biography"
                name="biography"
                minLength={20}
                maxLength={1200}
                required
                rows={4}
                placeholder="Your story, your content and what you care about. Keep personal contact details private."
              />
            </Field>
            <Field name="specialization" label="Content specialization">
              <Input
                id="specialization"
                name="specialization"
                maxLength={250}
                placeholder="For example: practical tech tutorials in Hindi"
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-5">
            <legend className="mb-2 text-xl font-semibold">02 / Your audience</legend>
            <p className="text-sm text-muted-foreground">
              Add at least one social profile. Counts are self-reported and reviewed before
              publication.
            </p>
            {[
              ["instagram", "Instagram", "followers"],
              ["youtube", "YouTube", "subscribers"],
              ["facebook", "Facebook", "followers"],
            ].map(([name, label, count]) => (
              <div key={name} className="grid gap-5 sm:grid-cols-[2fr_1fr]">
                <Field name={name!} label={`${label} URL`}>
                  <Input
                    id={name}
                    name={name}
                    type="url"
                    maxLength={500}
                    placeholder={`https://${name}.com/your-profile`}
                  />
                </Field>
                <Field name={`${name}_followers`} label={`${label} ${count}`}>
                  <Input
                    id={`${name}_followers`}
                    name={`${name}_followers`}
                    type="number"
                    min={0}
                    max={10000000000}
                    step={1}
                  />
                </Field>
              </div>
            ))}
            <Field name="other_socials" label="Other public social URLs (one per line, up to five)">
              <Textarea id="other_socials" name="other_socials" maxLength={2500} />
            </Field>
            <Field name="audience_location" label="Main audience locations *">
              <Input
                id="audience_location"
                name="audience_location"
                required
                maxLength={250}
                placeholder="Countries or regions your audience is based in"
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-5">
            <legend className="mb-2 text-xl font-semibold">03 / Your work</legend>
            <p className="text-sm text-muted-foreground">
              JPG, PNG or WebP. Maximum 3 MB per image and 18 MB total. Upload only images you own
              or have permission to publish; they are reviewed before appearing publicly.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["profile_image", "Profile photograph"],
                ["cover_image", "Cover photograph"],
                ["gallery", "Portfolio images (up to six)"],
              ].map(([name, label]) => (
                <Field key={name} name={name!} label={label!}>
                  <Input
                    id={name}
                    name={name}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple={name === "gallery"}
                  />
                </Field>
              ))}
              <Field name="portfolio_url" label="Public portfolio URL">
                <Input id="portfolio_url" name="portfolio_url" type="url" maxLength={500} />
              </Field>
            </div>
            <Field name="video_urls" label="Promotional video URLs (one per line, up to five)">
              <Textarea id="video_urls" name="video_urls" maxLength={2500} />
            </Field>
            <Field name="previous_collaborations" label="Previous collaboration examples">
              <Textarea
                id="previous_collaborations"
                name="previous_collaborations"
                maxLength={1500}
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-5">
            <legend className="mb-5 text-xl font-semibold">04 / Your partnership</legend>
            <Field name="interest" label="What would you like to build? *">
              <select
                id="interest"
                name="interest"
                required
                defaultValue="both"
                className="h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="website">A professional website</option>
                <option value="app">A mobile application</option>
                <option value="both">A website and mobile application</option>
              </select>
            </Field>
            <Field name="deliverables" label="Proposed promotional deliverables *">
              <Textarea
                id="deliverables"
                name="deliverables"
                required
                minLength={20}
                maxLength={2000}
                placeholder="Content formats, platforms, frequency, audience fit and availability"
              />
            </Field>
            <Field name="expected_terms" label="Expected collaboration terms (private) *">
              <Textarea
                id="expected_terms"
                name="expected_terms"
                required
                minLength={10}
                maxLength={2000}
                placeholder="Your development needs, budget or rates, timelines and expectations"
              />
            </Field>
          </fieldset>
          <fieldset className="space-y-5 rounded-xl border border-border bg-background/60 p-5">
            <legend className="px-2 font-semibold">Your consent</legend>
            <p className="text-sm text-muted-foreground">
              An approved public profile may show your creator name, city and state, biography,
              niche, social links and counts, and approved photos and work. Your email, phone,
              private terms and documents are never part of the public profile.
            </p>
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                name="processing_consent"
                required
                className="mt-1 accent-orange-400"
              />
              <span>
                I consent to AA100X TECH processing my application data and contacting me about this
                partnership. *
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                name="publication_consent"
                required
                className="mt-1 accent-orange-400"
              />
              <span>
                I consent to publication of the public information described above after admin
                review and approval. I can request withdrawal of publication consent by contacting{" "}
                <a href="mailto:customer.care@aa100xtech.com" className="text-primary underline">
                  customer.care@aa100xtech.com
                </a>
                . *
              </span>
            </label>
            <Link
              href="/privacy-policy"
              className="inline-flex items-center gap-2 text-sm text-primary underline"
            >
              <ShieldCheck className="size-4" /> Privacy policy
            </Link>
          </fieldset>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Leave this field empty</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Saving your application…" : "Submit partnership application"}
          </Button>
        </form>
      )}
    </div>
  );
}
