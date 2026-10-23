import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Fingerprint,
  Globe2,
  Megaphone,
  Rocket,
  Smartphone,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const title = "Be The One — Personal Brand, Website, App & Social Identity | AA100XTech";
const description =
  "Be The One: one identity for one person on planet earth. We build your personal brand, website, mobile app, social media presence and the marketing that makes your entrance to the global stage unforgettable.";

export const Route = createFileRoute("/be-the-one")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aa100xtech.lovable.app/be-the-one" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aa100xtech.lovable.app/be-the-one" }],
  }),
  component: BeTheOnePage,
});

const pillars = [
  {
    icon: Fingerprint,
    title: "One identity, one person",
    body: "A single verified identity across every platform — same name, same handle, same face, same story. Nobody else on the planet gets to be you.",
  },
  {
    icon: Sparkles,
    title: "Personal brand system",
    body: "Positioning, narrative, colour, type, photography and voice — a complete brand book built around the person, not a logo.",
  },
  {
    icon: Globe2,
    title: "Your own website",
    body: "A fast, cinematic personal site: story, work, press, booking and a mailing list that you own forever.",
  },
  {
    icon: Smartphone,
    title: "Your own app",
    body: "A branded mobile app for your community — content drops, memberships, notifications and direct messaging.",
  },
  {
    icon: Megaphone,
    title: "Social media build-out",
    body: "Every profile set up, optimised and unified: Instagram, YouTube, LinkedIn, X, TikTok, Facebook and Threads.",
  },
  {
    icon: Rocket,
    title: "Grand entrance campaign",
    body: "A launch week engineered for reach — teaser films, a 30-day content bank, paid amplification and press outreach.",
  },
];

const phases = [
  {
    step: "01",
    name: "Discovery & identity lock",
    time: "Week 1",
    body: "Deep interview, audience mapping and identity audit. We secure your handles, domain and verified name everywhere.",
  },
  {
    step: "02",
    name: "Brand, website & app build",
    time: "Weeks 2–5",
    body: "Brand book, photo/video shoot, personal website and your branded app — designed, built and shipped.",
  },
  {
    step: "03",
    name: "Content engine",
    time: "Weeks 4–6",
    body: "30 days of ready-to-post content: films, reels, carousels, captions and a publishing calendar.",
  },
  {
    step: "04",
    name: "Grand entrance",
    time: "Week 7",
    body: "Coordinated launch across every channel with paid amplification, collaborations and PR placements.",
  },
  {
    step: "05",
    name: "Go global",
    time: "Ongoing",
    body: "Always-on management, growth reporting, brand deals and audience monetisation in new markets.",
  },
];

const deliverables = [
  "Verified handle set across 7+ platforms",
  "Complete personal brand book",
  "Personal website with booking & newsletter",
  "Branded mobile app (iOS + Android)",
  "Professional photo & video shoot",
  "30-day launch content bank",
  "AI avatar & voice clone for scale",
  "Paid social launch campaign",
  "Press & collaboration outreach",
  "Monthly growth & revenue reporting",
];

function BeTheOnePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-28">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-5">
            Be The One
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.06] sm:text-6xl">
            One identity for one person on{" "}
            <span className="text-gradient-ember">planet earth</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We build your personal brand, your website, your app and your entire social media
            presence — then market you, for you. A grand entrance to the social media world, made to
            travel globally from day one.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Claim your identity</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/consultation">Book a consultation</Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { k: "1 of 1", v: "Identity built for one person only" },
              { k: "7 weeks", v: "From discovery to grand entrance" },
              { k: "Global", v: "Multi-market launch and growth" },
            ].map((s) => (
              <div key={s.v} className="surface-card p-5">
                <p className="font-display text-2xl font-bold text-primary">{s.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we build"
            title="Everything that makes you unmistakable"
            description="Brand, product and marketing built as one system so every platform tells the same story."
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
            eyebrow="The journey"
            title="From unknown to unavoidable in 7 weeks"
            description="A staged rollout so your first impression on the world is fully produced."
          />
          <ol className="mt-12 space-y-4">
            {phases.map((p) => (
              <li key={p.step} className="surface-card flex flex-col gap-3 p-6 md:flex-row md:gap-8">
                <span className="font-display text-3xl font-bold text-primary">{p.step}</span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    <Badge variant="secondary">{p.time}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Deliverables"
            title="What lands in your hands"
            description="Owned assets, not rented attention — everything is yours."
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((d) => (
              <li key={d} className="surface-card flex items-start gap-3 p-5 text-sm">
                <UserRoundCheck className="mt-0.5 size-4 shrink-0 text-signal" />
                <span className="text-muted-foreground">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="font-display text-3xl font-bold">Be global. Be the one.</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                We take a limited number of Be The One clients each month so every launch gets a
                full production team.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">
                Start your grand entrance <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
