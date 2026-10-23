import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Clapperboard,
  Flame,
  Handshake,
  Lightbulb,
  LineChart,
  MessagesSquare,
  Rocket,
  Search,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const title = "Creator Moves 365 — Learn How to Grow on Social Media | AA100XTech";
const description =
  "Creator Moves 365 is a daily learning program for social media creators: content strategy, hooks, editing, analytics and monetisation — one actionable move every day for 365 days.";

export const Route = createFileRoute("/creator-moves-365")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aa100xtech.com/creator-moves-365" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aa100xtech.com/creator-moves-365" }],
  }),
  component: CreatorMoves365Page,
});

const skills = [
  {
    icon: Target,
    title: "Find your niche",
    body: "Pick one clear topic and one clear audience. Learn how to position yourself so the right people follow you from day one.",
  },
  {
    icon: Lightbulb,
    title: "Hooks & storytelling",
    body: "The first 3 seconds decide everything. Master hooks, open loops and stories that make people watch till the end.",
  },
  {
    icon: Clapperboard,
    title: "Shooting & editing",
    body: "Phone-friendly filming, lighting, captions, cuts and sound — make content that looks premium without a studio.",
  },
  {
    icon: CalendarClock,
    title: "Consistency systems",
    body: "Batch filming, content calendars and a 30-day bank so you never run out of ideas or miss a posting day.",
  },
  {
    icon: Search,
    title: "Algorithm & SEO",
    body: "How Instagram, YouTube, TikTok and LinkedIn rank content — keywords, watch time, saves and shares that push reach.",
  },
  {
    icon: LineChart,
    title: "Read your analytics",
    body: "Turn views, retention and follower graphs into decisions. Double down on what works, kill what does not.",
  },
  {
    icon: Users,
    title: "Community building",
    body: "Replies, DMs, lives and collaborations — turn followers into a loyal community that shares your work for you.",
  },
  {
    icon: Wallet,
    title: "Monetisation",
    body: "Brand deals, affiliates, digital products and services — real income streams explained step by step.",
  },
];

const weeklyRhythm = [
  { day: "Mon", focus: "Strategy", body: "Plan the week: topics, formats and one growth experiment." },
  { day: "Tue", focus: "Script", body: "Write hooks and scripts for 3–5 pieces of content." },
  { day: "Wed", focus: "Shoot", body: "Batch-record everything in one focused session." },
  { day: "Thu", focus: "Edit", body: "Cut, caption and schedule the full week." },
  { day: "Fri", focus: "Engage", body: "Reply to every comment and DM; start 5 new conversations." },
  { day: "Sat", focus: "Analyse", body: "Review analytics, save winning posts, note lessons." },
  { day: "Sun", focus: "Learn", body: "Study 3 top creators in your niche and one new skill." },
];

const milestones = [
  { k: "Day 30", v: "A posting habit you can keep forever" },
  { k: "Day 90", v: "A recognisable style and loyal audience" },
  { k: "Day 180", v: "Consistent reach and collaboration offers" },
  { k: "Day 365", v: "A creator business, not just an account" },
];

const faqs = [
  {
    q: "Who is Creator Moves 365 for?",
    a: "Beginners starting from zero, and growing creators stuck at a plateau. The daily moves scale with your level.",
  },
  {
    q: "How much time does it take daily?",
    a: "20–40 minutes a day. One lesson, one action. The weekly rhythm keeps everything organised.",
  },
  {
    q: "Which platforms does it cover?",
    a: "Instagram, YouTube, TikTok, X, LinkedIn and Facebook — with platform-specific playbooks for each.",
  },
  {
    q: "Do I need expensive equipment?",
    a: "No. A phone, natural light and free editing apps are enough for the entire program.",
  },
];

function CreatorMoves365Page() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-28">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-5">
            Creator Moves 365
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.06] sm:text-6xl">
            One move a day. <span className="text-gradient-ember">365 days</span> to a growing
            creator brand.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Creator Moves 365 teaches social media creators how to grow — content strategy, hooks,
            editing, analytics and monetisation — through one clear, actionable move every single
            day of the year.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Join the program</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/be-the-one">Explore Be The One</Link>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => (
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
            eyebrow="What you will learn"
            title="Every skill a creator needs"
            description="From your first post to your first pay cheque — the complete growth curriculum."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {skills.map((s) => (
              <article key={s.title} className="surface-card p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The weekly rhythm"
            title="A creator week that actually works"
            description="A simple repeating schedule so growth never depends on motivation."
          />
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {weeklyRhythm.map((d) => (
              <li key={d.day} className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{d.day}</Badge>
                  <h3 className="font-display text-lg font-semibold">{d.focus}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why it works"
            title="Built on habits, not hacks"
            description="Trends fade. Systems compound."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Flame,
                title: "Daily momentum",
                body: "Small daily actions beat random viral attempts. The streak keeps you moving even on low-energy days.",
              },
              {
                icon: BarChart3,
                title: "Data over guessing",
                body: "Every week ends with an analytics review, so your next move is always based on evidence.",
              },
              {
                icon: Handshake,
                title: "Community first",
                body: "Growth comes from relationships — with your audience and with other creators in your niche.",
              },
              {
                icon: TrendingUp,
                title: "Compounding reach",
                body: "Each post trains the algorithm and your audience. Month three is always easier than month one.",
              },
              {
                icon: MessagesSquare,
                title: "Feedback loops",
                body: "Comments, DMs and saves tell you exactly what to make next — if you know how to listen.",
              },
              {
                icon: Rocket,
                title: "Monetise early",
                body: "You do not need a million followers. Learn offers, affiliates and services from month one.",
              },
            ].map((f) => (
              <article key={f.title} className="surface-card p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions"
            description="Everything creators ask before starting."
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
              <h2 className="font-display text-3xl font-bold">Start your 365 today.</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Tell us where you are and where you want to be — we will map your first 30 days.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">
                Get my growth plan <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
