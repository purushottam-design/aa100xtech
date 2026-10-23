import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  CalendarClock,
  Handshake,
  LineChart,
  Megaphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const title = "Influencer Success Program — Grow, Partner & Earn | AA100XTech";
const description =
  "The AA100XTech Influencer Success Program helps social media creators grow faster with strategy, brand collaborations, campaign support and real income milestones.";

export const Route = createFileRoute("/influencer-success-program")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aa100xtech.com/influencer-success-program" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aa100xtech.com/influencer-success-program" }],
  }),
  component: InfluencerSuccessProgramPage,
});

const pillars = [
  {
    icon: Target,
    title: "Personal brand strategy",
    body: "A clear niche, positioning and content pillars built around your voice — not a copy of someone else.",
  },
  {
    icon: CalendarClock,
    title: "Content calendar & support",
    body: "Monthly calendars, hook banks and editing guidance so posting never depends on mood or motivation.",
  },
  {
    icon: LineChart,
    title: "Growth analytics",
    body: "Weekly reviews of reach, retention and follower quality with clear next actions after every review.",
  },
  {
    icon: Handshake,
    title: "Brand collaboration access",
    body: "Get matched with campaigns from our client network once your profile meets partner standards.",
  },
  {
    icon: Megaphone,
    title: "Promotion boosts",
    body: "Selected creators get featured across AA100XTech channels and partner pages for extra reach.",
  },
  {
    icon: Wallet,
    title: "Monetisation roadmap",
    body: "From first affiliate link to retainer brand deals — a step-by-step income plan for your follower size.",
  },
];

const stages = [
  {
    stage: "Stage 1",
    name: "Starter",
    range: "0 – 5K followers",
    body: "Set up your profile, niche and first 30 days of content with weekly guidance.",
  },
  {
    stage: "Stage 2",
    name: "Rising",
    range: "5K – 25K followers",
    body: "Unlock campaign matching, promotion boosts and your first paid collaborations.",
  },
  {
    stage: "Stage 3",
    name: "Pro Creator",
    range: "25K+ followers",
    body: "Priority brand deals, retainer opportunities and a dedicated growth manager.",
  },
];

const benefits = [
  "Dedicated onboarding and profile audit",
  "Monthly 1-on-1 growth review call",
  "Access to brand campaign board",
  "Creator community and collab network",
  "Templates for pitches, rates and media kits",
  "Early access to AA100XTech creator events",
];

const faqs = [
  {
    q: "Who can join the Influencer Success Program?",
    a: "Any creator on Instagram, YouTube, TikTok, X or LinkedIn — from complete beginners to established influencers. Your stage decides your track.",
  },
  {
    q: "Is there a joining fee?",
    a: "Applying is free. Growth tracks and campaign terms are shared after your profile review, so you always know the commitment before joining.",
  },
  {
    q: "Do you guarantee brand deals?",
    a: "We match eligible creators with campaigns from our client network, but deals depend on brand fit, engagement quality and campaign availability.",
  },
  {
    q: "How is this different from Creator Moves 365?",
    a: "Creator Moves 365 is a self-paced daily learning program. The Influencer Success Program adds hands-on support, reviews and brand collaboration access.",
  },
];

function InfluencerSuccessProgramPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-28">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-5">
            Influencer Success Program
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.06] sm:text-6xl">
            From posting content to <span className="text-gradient-ember">building a career</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A guided program for social media influencers: strategy, growth reviews, promotion
            support and brand collaboration access — built to turn your audience into income.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Apply for the program</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/influencer-marketing">For brands: influencer marketing</Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { k: "3 growth stages", v: "From zero to pro creator" },
              { k: "1-on-1 reviews", v: "Monthly, with clear actions" },
              { k: "Brand board", v: "Campaign access for eligible creators" },
            ].map((m) => (
              <div key={m.k} className="surface-card p-5">
                <p className="font-display text-2xl font-bold text-primary">{m.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{m.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What you get"
            title="Six pillars of creator success"
            description="Everything an influencer needs beyond just posting regularly."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <article key={p.title} className="surface-card p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <p.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Your journey"
            title="Three stages, one clear path"
            description="You always know what stage you are in and what unlocks next."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {stages.map((s) => (
              <li key={s.stage} className="surface-card p-6">
                <Badge variant="secondary">{s.stage}</Badge>
                <h3 className="mt-4 font-display text-xl font-semibold">{s.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  {s.range}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Member benefits"
            title="Built for serious creators"
            description="Practical support you can use from week one."
          />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <li key={b} className="surface-card flex items-start gap-3 p-5">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <span className="text-sm font-medium text-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="What creators ask before applying."
          />
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <details key={f.q} className="surface-card group p-5">
                <summary className="cursor-pointer list-none font-display text-base font-semibold marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="font-display text-3xl font-bold">Ready to grow with us?</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Send us your profile and goals — we will review and reply with your stage and next
                steps.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">
                Apply now <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
