"use client";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { submitMarketingForm } from "@/lib/marketing-submission";
import { showMarketingSuccess } from "@/lib/marketing-feedback";
import type { CreatorListing } from "@/lib/creator-discovery";
import "./marketing-intake.css";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  brandIntakeSchema,
  creatorIntakeSchema,
  platforms,
  categories,
  objectives,
  budgets,
  promotions,
  creatorSuccess,
  brandSuccess,
} from "@/lib/marketing-intake";

type Field = {
  name: string;
  label: string;
  type?: string;
  options?: readonly string[];
  required?: boolean;
  help?: string;
  placeholder?: string;
  wide?: boolean;
};
const creatorFields: Field[][] = [
  [
    { name: "full_name", label: "Full Name", required: true },
    { name: "email", label: "Email Address", type: "email", required: true },
    { name: "phone", label: "WhatsApp / Mobile Number", type: "tel", required: true },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
    { name: "country", label: "Country" },
  ],
  [
    { name: "category", label: "Primary Content Category", options: categories, required: true },
    { name: "audience_location", label: "Primary Audience Location" },
    { name: "language", label: "Content Language" },
    { name: "average_views", label: "Average Video / Reel Views", type: "number" },
    { name: "engagement", label: "Engagement Rate (%)", type: "number" },
  ],
  [
    {
      name: "collaboration",
      label: "Collaboration Type",
      options: ["Paid", "Barter", "Affiliate", "Open to All"],
      type: "radio",
      required: true,
    },
    { name: "previous_collaborations", label: "Previous Brand Collaborations", type: "textarea" },
    {
      name: "biography",
      label: "Short Bio / About Yourself",
      type: "textarea",
      help: "Up to 1,200 characters. Tell us about your content and creator journey.",
    },
  ],
];
const brandFields: Field[][] = [
  [
    { name: "company", label: "Company / Brand Name", required: true },
    { name: "contact_name", label: "Contact Person Name", required: true },
    { name: "email", label: "Business Email Address", type: "email", required: true },
    { name: "phone", label: "WhatsApp / Phone Number", type: "tel", required: true },
    {
      name: "company_website",
      label: "Company Website",
      type: "url",
      help: "Full https:// address",
    },
    { name: "industry", label: "Business Category / Industry" },
    { name: "location", label: "City / Country" },
  ],
  [
    { name: "objective", label: "Campaign Objective", options: objectives, required: true },
    {
      name: "category",
      label: "Preferred Influencer Category",
      options: categories,
      required: true,
    },
    { name: "audience_location", label: "Target Audience Location" },
    {
      name: "follower_range",
      label: "Preferred Influencer Follower Range",
      options: [
        "Under 10K",
        "10K–50K",
        "50K–100K",
        "100K–500K",
        "500K–1M",
        "1M+",
        "Open to suggestions",
      ],
    },
    { name: "influencer_count", label: "Number of Influencers Required", type: "number" },
    { name: "start_date", label: "Campaign Start Date", type: "date" },
  ],
  [
    {
      name: "budget",
      label: "Estimated Campaign Budget",
      options: budgets,
      type: "radio",
      required: true,
    },
    { name: "description", label: "Campaign Description / Special Requirements", type: "textarea" },
  ],
];
const control =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
function FormField({
  field: f,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
}) {
  const instanceId = useId();
  const id = `intake-${f.name}-${instanceId}`;
  const attrs = {
    id,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    required: f.required,
    placeholder: f.placeholder,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : f.help ? `${id}-help` : undefined,
  };
  if (f.type === "radio")
    return (
      <fieldset className="sm:col-span-2">
        <legend className="mb-3 text-sm font-medium">
          {f.label} <span className="text-primary">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {f.options?.map((o) => (
            <label
              key={o}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm focus-within:ring-2 focus-within:ring-primary ${value === o ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <input
                type="radio"
                name={f.name}
                value={o}
                checked={value === o}
                onChange={() => onChange(o)}
                required={f.required}
                aria-describedby={error ? `${id}-error` : undefined}
                className="accent-primary"
              />
              {o}
            </label>
          ))}
        </div>
        {error && (
          <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </fieldset>
    );
  return (
    <div className={f.type === "textarea" || f.wide ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {f.label}
        {f.required && <span className="text-primary"> *</span>}
        {!f.required && <span className="text-muted-foreground"> (Optional)</span>}
      </label>
      {f.options ? (
        <select {...attrs} className={control}>
          <option value="">Select an option</option>
          {f.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : f.type === "textarea" ? (
        <Textarea
          {...attrs}
          rows={4}
          maxLength={f.name === "description" ? 4000 : f.name === "biography" ? 1200 : 1500}
        />
      ) : (
        <Input
          {...attrs}
          type={f.type ?? "text"}
          min={f.type === "number" ? 0 : undefined}
          max={f.name === "engagement" ? 100 : undefined}
          step={f.name === "engagement" ? "any" : f.type === "number" ? 1 : undefined}
          maxLength={f.type === "number" ? undefined : 255}
          autoComplete={
            f.name === "email"
              ? "email"
              : f.name === "phone"
                ? "tel"
                : f.name === "full_name"
                  ? "name"
                  : undefined
          }
        />
      )}{" "}
      {f.help && (
        <p id={`${id}-help`} className="mt-2 text-xs text-muted-foreground">
          {f.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
function MultiChoice({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string | undefined;
}) {
  const instanceId = useId();
  const id = `${label.replace(/\W/g, "")}-${instanceId}`;
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 text-sm font-medium">
        {label} <span className="text-primary">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <label
            key={o}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm focus-within:ring-2 focus-within:ring-primary ${value.includes(o) ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <input
              type="checkbox"
              checked={value.includes(o)}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={() =>
                onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])
              }
              className="accent-primary"
            />
            {o}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
export function MarketingIntakeForm({
  kind,
  embedded = false,
  selectedCreator,
  onClearCreator,
}: {
  kind: "creator" | "brand";
  embedded?: boolean;
  selectedCreator?: CreatorListing | null;
  onClearCreator?: () => void;
}) {
  const creator = kind === "creator";
  const instanceId = useId();
  const privacyErrorId = `privacy-error-${instanceId}`;
  const trapId = `website-trap-${instanceId}`;
  const kitId = `media-kit-${instanceId}`;
  const kitHelpId = `kit-help-${instanceId}`;
  const [values, setValues] = useState<Record<string, string>>(
      creator
        ? {}
        : { platform_mode: "Instagram", objective: "Brand Awareness", budget: "Not Decided" },
    ),
    [selected, setSelected] = useState<string[]>(creator ? [] : ["Instagram"]),
    [types, setTypes] = useState<string[]>([]),
    [privacy, setPrivacy] = useState(false),
    [consent, setConsent] = useState(false),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [token, setToken] = useState("");
  const lock = useRef(false),
    startedAt = useRef(Date.now()),
    heading = useRef<HTMLHeadingElement>(null),
    visited = useRef(false);
  useEffect(() => setToken(crypto.randomUUID()), []);
  useEffect(() => {
    if (visited.current) heading.current?.focus();
    visited.current = true;
  }, [reference]);
  const update = (name: string, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((s) => ({ ...s, [name]: "" }));
  };
  const number = (name: string) => (values[name]?.trim() ? Number(values[name]) : null);
  const build = () => {
    const common = {
      ...values,
      email: values["email"] ?? "",
      phone: values["phone"] ?? "",
      privacy,
      startedAt: startedAt.current,
      token,
      website_trap: values["website_trap"] ?? "",
    };
    return creator
      ? {
          ...common,
          full_name: values["full_name"] ?? "",
          city: values["city"] ?? "",
          state: values["state"] ?? "",
          country: values["country"] ?? "",
          biography: values["biography"] ?? "",
          profiles: selected.map((platform) => ({
            platform,
            url: values[`url-${platform}`] ?? "",
            followers: number(`followers-${platform}`),
          })),
          average_views: number("average_views"),
          engagement: number("engagement"),
          publication_consent: consent,
        }
      : {
          ...common,
          company: values["company"] ?? "",
          contact_name: values["contact_name"] ?? "",
          industry: values["industry"] ?? "",
          location: values["location"] ?? "",
          platforms: selected,
          promotions: types,
          influencer_count: number("influencer_count"),
          ...(selectedCreator
            ? {
                creator: {
                  id: selectedCreator.id,
                  slug: selectedCreator.slug,
                  name: selectedCreator.display_name,
                },
              }
            : {}),
        };
  };
  const validate = () => {
    const parsed = (creator ? creatorIntakeSchema : brandIntakeSchema).safeParse(build());
    const found: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const root = String(issue.path[0]);
        const key =
          root === "profiles" && typeof issue.path[1] === "number"
            ? `${issue.path[2] === "followers" ? "followers" : "url"}-${selected[issue.path[1]]}`
            : root;
        found[key] = issue.message;
      }
    if (
      file &&
      (file.size > 5 * 1024 * 1024 ||
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type))
    )
      found["media_kit"] = "Use a PDF, JPG, PNG or WebP up to 5 MB";
    setErrors(found);
    return !Object.keys(found).length;
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (lock.current) return;
    setError("");
    if (!validate()) {
      setError("Please check the highlighted fields.");
      return;
    }
    lock.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify(build()));
      if (file && creator) form.set("media_kit", file);
      const result = await submitMarketingForm(kind, form);
      showMarketingSuccess();
      setReference(result.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit. Please try again.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  if (reference)
    return (
      <section
        id={embedded ? undefined : "apply"}
        className={embedded ? "min-w-0" : "mx-auto max-w-3xl scroll-mt-28 px-4 pb-24"}
      >
        <div className="surface-card border-primary/25 p-7 sm:p-12" role="status">
          <CheckCircle2 className="mb-6 size-12 text-primary" />
          <h2 ref={heading} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
            {creator ? "Application submitted" : "Campaign inquiry received"}
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {creator ? creatorSuccess : brandSuccess}
          </p>
          <p className="mt-6 break-all rounded-xl bg-secondary p-4 text-sm">
            Your reference: <strong>{reference}</strong>
          </p>
          <Button asChild className="mt-6">
            <Link href="/influencer-marketing">Explore influencer marketing</Link>
          </Button>
        </div>
      </section>
    );
  const field = (f: Field) => (
    <FormField
      key={f.name}
      field={f}
      value={values[f.name] ?? ""}
      error={errors[f.name]}
      onChange={(v) => update(f.name, v)}
    />
  );
  const primary = creator
    ? [
        { ...creatorFields[0]![0]!, wide: true, placeholder: "Enter your full name" },
        { ...creatorFields[0]![1]!, placeholder: "Email address" },
        { ...creatorFields[0]![2]!, label: "WhatsApp Number", placeholder: "+91" },
        { ...creatorFields[0]![3]!, placeholder: "e.g. Patna" },
        { ...creatorFields[0]![4]!, placeholder: "e.g. Bihar" },
        { ...creatorFields[0]![5]!, wide: true, placeholder: "Country" },
      ]
    : [
        { ...brandFields[0]![0]!, wide: true, placeholder: "Enter company name" },
        { ...brandFields[0]![1]!, label: "Contact Person", placeholder: "Your name" },
        { ...brandFields[0]![2]!, label: "Business Email", placeholder: "name@company.com" },
        {
          ...brandFields[0]![4]!,
          label: "Website / Social Media Link",
          wide: true,
          placeholder: "https://yourbrand.com",
          help: "",
        },
        { ...brandFields[0]![3]!, placeholder: "+91" },
        { ...brandFields[0]![5]!, placeholder: "e.g. Fashion, Technology" },
        { ...brandFields[0]![6]!, wide: true, placeholder: "e.g. Patna, India" },
      ];
  return (
    <section
      id={embedded ? undefined : "apply"}
      className={
        embedded
          ? "intake-reference-form min-w-0 w-full"
          : "intake-reference-form mx-auto max-w-[660px] scroll-mt-28 px-4 pb-16 sm:px-6"
      }
    >
      <div className="intake-reference-card">
        <div
          className={
            creator ? "intake-card-heading intake-card-heading-centered" : "intake-card-heading"
          }
        >
          {creator && <Users size={23} strokeWidth={1.7} aria-hidden="true" />}
          <h2>{creator ? "Join Our Influencer Network" : "Start Your Influencer Campaign"}</h2>
          <p>
            {creator
              ? "Collaborate with brands. Grow your influence."
              : "Tell us about your brand and campaign requirements."}
          </p>
        </div>
        <form
          noValidate
          onSubmit={submit}
          aria-label={creator ? "Influencer application" : "Brand campaign inquiry"}
        >
          <fieldset disabled={busy} className="min-w-0">
            {!creator && selectedCreator && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/20 p-3 text-sm">
                <p>
                  Selected creator: <strong>{selectedCreator.display_name}</strong>
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={onClearCreator}>
                  Remove creator
                </Button>
              </div>
            )}
            <div className="grid gap-x-3 gap-y-4 sm:grid-cols-2">{primary.map(field)}</div>
            <div className="mt-4 space-y-4">
              {creator ? (
                <>
                  <MultiChoice
                    label="Social Media Platforms"
                    options={platforms}
                    value={selected}
                    onChange={setSelected}
                    error={errors["profiles"]}
                  />
                  {field({ ...creatorFields[1]![0]!, label: "Content Category", wide: true })}
                  {selected.map((platform) => (
                    <div key={platform} className="space-y-3">
                      {field({
                        name: `url-${platform}`,
                        label:
                          selected.length === 1
                            ? "Social Media Profile URL"
                            : `${platform} Profile URL`,
                        type: "url",
                        required: true,
                        placeholder:
                          platform === "Instagram" ? "https://instagram.com/username" : "https://",
                      })}
                      {field({
                        name: `followers-${platform}`,
                        label: `${platform} Followers / Subscribers`,
                        type: "number",
                        placeholder: "Enter follower / subscriber count",
                      })}
                    </div>
                  ))}
                  {field({ ...creatorFields[2]![0]!, wide: true })}
                  {field({
                    ...creatorFields[2]![2]!,
                    label: "Tell Us About Yourself",
                    help: "",
                    placeholder: "Describe your content, audience and collaboration interests?",
                  })}
                  <details className="intake-additional">
                    <summary>Additional creator details (optional)</summary>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {creatorFields[1]!.slice(1).map(field)}
                      {field(creatorFields[2]![1]!)}
                      <div className="sm:col-span-2">
                        <label htmlFor={kitId}>Portfolio / Media Kit Upload</label>
                        <Input
                          id={kitId}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                          aria-describedby={kitHelpId}
                        />
                        <p id={kitHelpId} className="intake-help">
                          PDF, JPG, PNG or WebP, up to 5 MB. Private to authorized reviewers.
                        </p>
                        {errors["media_kit"] && (
                          <p role="alert" className="text-sm text-destructive">
                            {errors["media_kit"]}
                          </p>
                        )}
                      </div>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <fieldset>
                    <legend>Preferred Platform *</legend>
                    <div className="intake-choice-list">
                      {["Instagram", "YouTube", "Facebook", "Multiple Platforms"].map((p) => (
                        <label key={p}>
                          <input
                            type="radio"
                            name="preferred-platform"
                            checked={values["platform_mode"] === p}
                            onChange={() => {
                              update("platform_mode", p);
                              setSelected(p === "Multiple Platforms" ? [] : [p]);
                            }}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                    {errors["platforms"] && (
                      <p className="text-sm text-destructive">{errors["platforms"]}</p>
                    )}
                  </fieldset>
                  {values["platform_mode"] === "Multiple Platforms" && (
                    <MultiChoice
                      label="Preferred Social Media Platforms"
                      options={["Instagram", "YouTube", "Facebook", "Snapchat", "Other"]}
                      value={selected}
                      onChange={setSelected}
                      error={errors["platforms"]}
                    />
                  )}
                  {field({ ...brandFields[1]![0]!, wide: true })}
                  {field({ ...brandFields[1]![1]!, wide: true })}
                  {field({ ...brandFields[2]![0]!, wide: true })}
                  <MultiChoice
                    label="Type of Promotion"
                    options={promotions}
                    value={types}
                    onChange={setTypes}
                    error={errors["promotions"]}
                  />
                  {field({
                    ...brandFields[2]![1]!,
                    label: "Campaign Requirements",
                    placeholder:
                      "Tell us about your product, target audience, location and campaign?",
                  })}
                  <details className="intake-additional">
                    <summary>Additional campaign details (optional)</summary>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {brandFields[1]!.slice(2).map(field)}
                    </div>
                  </details>
                </>
              )}
            </div>
            <div className="intake-consents mt-5 space-y-3">
              <label>
                <input
                  type="checkbox"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                  required
                  aria-describedby={errors["privacy"] ? privacyErrorId : undefined}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>{" "}
                  and the processing of my {creator ? "application" : "inquiry"}. *
                </span>
              </label>
              {errors["privacy"] && (
                <p id={privacyErrorId} className="text-sm text-destructive">
                  {errors["privacy"]}
                </p>
              )}
              {creator && (
                <label>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I consent to displaying my public influencer profile if approved.{" "}
                    <span className="text-muted-foreground">(Optional)</span>
                  </span>
                </label>
              )}
            </div>
            <div className="hidden" aria-hidden="true">
              <label htmlFor={trapId}>Leave this field empty</label>
              <input
                id={trapId}
                tabIndex={-1}
                autoComplete="off"
                value={values["website_trap"] ?? ""}
                onChange={(e) => update("website_trap", e.target.value)}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy || !token} className="intake-submit mt-4 w-full">
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                  Submitting…
                </>
              ) : creator ? (
                "Submit Influencer Application"
              ) : (
                "Submit Campaign Inquiry"
              )}
            </Button>
            <p className="intake-help mt-3 text-center">
              {creator
                ? "Your application is reviewed privately. Public profiles require separate consent and approval."
                : "Our team will review your requirements and contact you to discuss your campaign."}
            </p>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
