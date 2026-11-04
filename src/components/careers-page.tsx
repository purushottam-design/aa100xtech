"use client";

import { Link } from "@/lib/navigation";
import { ArrowRight, Check } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/section-heading";
import { CandidateApplicationForm } from "@/components/candidate-application-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitWebsiteRequest } from "@/lib/website-requests";
import type { CareersCohort } from "@/data/careers";

export function CareersPage({ cohort }: { cohort: CareersCohort }) {
  const [submitting, setSubmitting] = useState(false);
  const openedAt = useRef(Date.now());
  const requestId = useRef<string | null>(null);

  const [selectedRole, setSelectedRole] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const value = (key: string) => String(fd.get(key) ?? "").trim();
    setSubmitting(true);
    try {
      const extra = cohort.extraFields
        ?.map((field) => field.label + ": " + value(field.name))
        .join("\n");
      requestId.current ??= crypto.randomUUID();
      await submitWebsiteRequest({
        id: requestId.current,
        startedAt: openedAt.current,
        kind: "career",
        name: value("name"),
        email: value("email"),
        phone: value("phone"),
        role: value("role"),
        requirements: "Job application (" + cohort.slug + ")",
        hours: value("hours"),
        availability: "Earliest start: " + value("start") + "\n" + (extra ?? ""),
        portfolio: value("portfolio"),
        experience: value("experience"),
        message: value("shipped"),
      });
      toast.success("Application received", {
        description: "Your application has been saved for review.",
      });
      form.reset();
      setSelectedRole("");
      requestId.current = null;
      openedAt.current = Date.now();
    } catch {
      toast.error(
        "Could not save your application. Please try again or email " + cohort.email + ".",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.16),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              {cohort.eyebrow}
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {cohort.headline}
              <br />
              <span className="text-gradient">{cohort.headlineAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {cohort.lede}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#roles">
                  Pick your brief <ArrowRight className="size-4" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link
                  to={cohort.slug === "global" ? "/careers#task-application" : "/careers/apply"}
                >
                  Submit your task plan
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <a href="#trial">See how the 10 days run</a>
              </Button>
            </div>
            {cohort.kicker ? (
              <p className="mt-6 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
                {cohort.kicker}
              </p>
            ) : null}
          </div>

          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
              Trial brief · sample
            </p>
            <h2 className="mt-4 font-display text-xl font-bold">{cohort.sampleBrief.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {cohort.sampleBrief.body}
            </p>
            <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-5 text-center">
              {[
                { k: "Window", v: "10 days" },
                { k: "Updates", v: "daily, 1 line" },
                { k: "Decision", v: "day 10" },
              ].map((i) => (
                <div key={i.k}>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {i.k}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">{i.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 pb-14 sm:px-6 lg:grid-cols-4 lg:px-8">
          {cohort.stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card/60 p-5">
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product lines */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What we build"
          title="Eleven product lines. One studio."
          description={cohort.linesIntro}
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohort.lines.map((l) => (
            <div
              key={l.n}
              className="rounded-xl border border-border/60 bg-card/50 p-5 transition-colors hover:border-primary/40"
            >
              <span className="font-mono text-xs text-primary">{l.n}</span>
              <h3 className="mt-2 font-display text-base font-semibold">{l.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.body}</p>
            </div>
          ))}
        </div>

        <div className="glass-card mt-6 rounded-2xl p-6 sm:p-8">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
            {cohort.flagship.label}
          </span>
          <h3 className="mt-3 font-display text-2xl font-bold">{cohort.flagship.title}</h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {cohort.flagship.body}
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-5">
            {cohort.flagship.pipeline.map((step) => (
              <li
                key={step}
                className="rounded-lg border border-border/60 bg-background/40 p-3 text-xs leading-relaxed text-muted-foreground"
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="border-y border-border/60 bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow={`Open roles · ${cohort.seats} seats`}
            title="Open a role. Read the brief you'd be given."
            description={cohort.rolesIntro}
          />
          <div className="mt-12 space-y-3">
            {cohort.roles.map((r) => (
              <details
                key={r.title}
                className="group rounded-xl border border-border/60 bg-background/50 p-5 open:border-primary/40"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
                  <h3 className="font-display text-base font-semibold sm:text-lg">{r.title}</h3>
                  <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {r.line}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {r.seats} {r.seats === 1 ? "seat" : "seats"}
                  </span>
                  <ArrowRight className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="mt-5 grid gap-5 border-t border-border/60 pt-5 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      Your {r.briefDays}-day brief
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.brief}</p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">
                      You deliver
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {r.deliver}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      Tools
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {r.tools.map((t) => (
                        <li
                          key={t}
                          className="rounded-md border border-border/60 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" size="sm" className="mt-5">
                      <a href="#apply" onClick={() => setSelectedRole(r.title)}>
                        Apply to this role
                      </a>
                    </Button>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Trial timeline */}
      <section id="trial" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The trial"
          title="Ten days, run to the day."
          description={cohort.timelineIntro}
        />
        <ol className="mt-12 space-y-4 border-l border-border/60 pl-6">
          {cohort.timeline.map((t) => (
            <li key={t.day} className="relative">
              <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full bg-primary" />
              <div className="rounded-xl border border-border/60 bg-card/40 p-5">
                <span className="font-mono text-xs text-primary">{t.day}</span>
                <h3 className="mt-1 font-display text-base font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Scorecard */}
      <section className="border-y border-border/60 bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How we decide"
            title="The same scorecard for everyone."
            description={cohort.scorecardIntro}
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {cohort.scorecard.map((s) => (
              <div key={s.name} className="rounded-xl border border-border/60 bg-background/50 p-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-base font-semibold">{s.name}</h3>
                  <span className="font-mono text-sm text-primary">{s.pts} pts</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border/60">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.pts}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-5 text-sm leading-relaxed text-muted-foreground">
            <span className="font-display text-lg font-bold text-primary">70+</span> — score seventy
            or more and the seat is confirmed on day ten. Below that, you get your scorecard back
            with the exact reasons, and you're welcome to take a different brief next cycle.
          </p>
        </div>
      </section>

      {/* Offer */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="On confirmation" title={cohort.offerTitle} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cohort.offer.map((o) => (
            <div key={o.title} className="rounded-xl border border-border/60 bg-card/50 p-5">
              <Check className="size-4 text-primary" />
              <h3 className="mt-3 font-display text-base font-semibold">{o.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="border-y border-border/60 bg-card/30 py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionHeading eyebrow="Apply" title="Pick one role. Get your brief." align="left" />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We review applications twice a week. If your portfolio fits the line, the brief lands
              in your inbox with a start date. From there it's on you.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Write to{" "}
              <a href={`mailto:${cohort.email}`} className="text-primary hover:underline">
                {cohort.email}
              </a>{" "}
              with the role in the subject line.
            </p>
          </div>

          {cohort.slug === "global" ? (
            <div id="task-application" className="scroll-mt-24">
              <CandidateApplicationForm
                idPrefix="candidate-"
                initialRole={selectedRole}
                onSubmitted={() => setSelectedRole("")}
              />
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="glass-card grid gap-4 rounded-2xl p-6 sm:grid-cols-2"
            >
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor={`${cohort.slug}-experience`}>Experience</Label>
                <Textarea
                  id={`${cohort.slug}-experience`}
                  name="experience"
                  maxLength={1000}
                  rows={3}
                  placeholder="Your relevant experience"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">WhatsApp number</Label>
                <Input id="phone" name="phone" required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role you want</Label>
                <select
                  id="role"
                  name="role"
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value)}
                  required
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choose one</option>
                  {cohort.roles.map((r) => (
                    <option key={r.title} value={r.title}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hours">Hours a day you can give</Label>
                <select
                  id="hours"
                  name="hours"
                  required
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choose one</option>
                  {cohort.hoursOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              {cohort.extraFields?.map((f) => (
                <div key={f.name} className="grid gap-2">
                  <Label htmlFor={f.name}>{f.label}</Label>
                  {f.options ? (
                    <select
                      id={f.name}
                      name={f.name}
                      required
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Choose one</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input id={f.name} name={f.name} />
                  )}
                </div>
              ))}
              <div className="grid gap-2">
                <Label htmlFor="portfolio">Portfolio or work link</Label>
                <Input id="portfolio" name="portfolio" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start">Earliest start date</Label>
                <Input id="start" name="start" type="date" />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="shipped">One thing you've shipped that you're proud of</Label>
                <Textarea id="shipped" name="shipped" rows={4} required />
              </div>
              <Button type="submit" disabled={submitting} className="sm:col-span-2">
                {submitting ? "Sending…" : "Send application"}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Before you ask" title="Straight answers." />
        <Accordion type="single" collapsible className="mt-10">
          {cohort.faq.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left font-display text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {cohort.slug !== "global" && (
          <div className="mt-10 rounded-xl border border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
            Outside the UK?{" "}
            <Link to="/careers" className="text-primary hover:underline">
              See the global cohort — 30 remote seats →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
