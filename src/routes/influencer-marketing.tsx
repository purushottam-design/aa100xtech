import { Link } from "@/lib/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Crosshair,
  FileSearch,
  Handshake,
  Megaphone,
  Rocket,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { CampaignOffers } from "@/components/campaign-offers";
import { Price } from "@/components/currency-provider";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const title = "Influencer Marketing Services for Brands | AA100XTech";
const description =
  "AA100XTech runs end-to-end influencer marketing campaigns: creator discovery, vetting, campaign management, content rights and transparent performance reporting.";

export default InfluencerMarketingPage;

const services = [
  {
    icon: Search,
    title: "Creator discovery & vetting",
    body: "We shortlist influencers by niche, audience quality, engagement rate and brand safety — never by follower count alone.",
  },
  {
    icon: Crosshair,
    title: "Campaign strategy",
    body: "Goals, platforms, formats, hooks and posting schedule — a full campaign plan built around your budget and KPIs.",
  },
  {
    icon: Handshake,
    title: "Outreach & negotiation",
    body: "We handle pricing, contracts, deliverables and timelines so you get fair rates and zero back-and-forth.",
  },
  {
    icon: Megaphone,
    title: "Campaign management",
    body: "Briefs, approvals, posting checks and live coordination — the campaign runs without eating your team's time.",
  },
  {
    icon: FileSearch,
    title: "Content & usage rights",
    body: "Clear agreements for reposting, ads usage and whitelisting, so great creator content keeps working for you.",
  },
  {
    icon: BarChart3,
    title: "Reporting & ROI",
    body: "Reach, engagement, clicks, conversions and cost per result — one clean report after every campaign.",
  },
];

const process = [
  { k: "Step 1", v: "Tell us your goal, audience and budget" },
  { k: "Step 2", v: "Get a vetted creator shortlist in days" },
  { k: "Step 3", v: "We launch and manage the campaign" },
  { k: "Step 4", v: "You get one clear performance report" },
];

const campaignTypes = [
  {
    title: "Product launches",
    body: "Coordinated creator posts on launch day for maximum first-week impact.",
  },
  {
    title: "Reviews & tutorials",
    body: "Honest demos that show your product working in real life.",
  },
  {
    title: "Giveaways & contests",
    body: "Campaigns with clear entry rules, content plans and reporting.",
  },
  {
    title: "Long-term ambassadors",
    body: "Monthly retainer creators who become the trusted face of your brand.",
  },
  {
    title: "Affiliate campaigns",
    body: "Trackable links and codes — you pay for performance, not promises.",
  },
  {
    title: "Local & regional reach",
    body: "City and language-specific creators for hyper-local campaigns across India.",
  },
];

const faqs = [
  {
    q: "What budget do I need for influencer marketing?",
    a: "Micro-influencer campaigns can start small; larger multi-creator launches scale with your goals. Share your budget and we will recommend the right mix.",
  },
  {
    q: "How do you avoid fake followers?",
    a: "Every shortlisted creator passes audience-quality checks: engagement rate, comment authenticity, follower growth patterns and past brand work.",
  },
  {
    q: "Which platforms do you run campaigns on?",
    a: "Instagram, YouTube, TikTok, X, LinkedIn and Facebook — chosen based on where your customers actually are.",
  },
  {
    q: "Can I reuse the content creators make?",
    a: "Yes — we negotiate usage and whitelisting rights upfront so top-performing content can power your ads and pages.",
  },
];

function InfluencerMarketingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-28">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="mb-5">
            Influencer Marketing
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-[1.06] sm:text-6xl">
            Influencer campaigns with{" "}
            <span className="text-gradient-ember">purpose and creativity</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We plan, run and report influencer marketing campaigns for brands — vetted creators,
            managed execution and transparent ROI, end to end.
          </p>
          <p className="mt-6 text-xl font-semibold text-primary">
            Starting at <Price value="₹500" />
          </p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Final campaign pricing depends on scope and an approved quotation. Views, followers,
            virality, leads and revenue are not guaranteed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/proposal?kind=influencer&plan=influencer-marketing">Start a campaign</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/influencer-programs">Explore Influencer Programs</Link>
            </Button>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p) => (
              <li key={p.k} className="surface-card p-5">
                <p className="font-display text-2xl font-bold text-primary">{p.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CampaignOffers />
      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we handle"
            title="Full-service influencer marketing"
            description="You approve the plan and the report — we do everything in between."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
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
            eyebrow="Campaign types"
            title="Pick the play that fits your goal"
            description="Every format is available — here are the ones that work most often."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaignTypes.map((c) => (
              <article key={c.title} className="surface-card p-6">
                <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why AA100XTech"
            title="Managed like an agency, measured like an investment"
            description="No vanity metrics — only numbers your finance team would accept."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Vetted creators only",
                body: "Audience-quality checks before any creator reaches your shortlist.",
              },
              {
                icon: ShieldCheck,
                title: "Contracts & rights handled",
                body: "Deliverables, timelines, usage rights and payments — all on paper.",
              },
              {
                icon: Wallet,
                title: "ROI-first reporting",
                body: "Cost per reach, click and conversion — so the next campaign is always smarter.",
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
            description="What brands ask before their first campaign."
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
              <h2 className="font-display text-3xl font-bold">
                <Rocket className="mr-2 inline size-6 text-primary" /> Launch your first campaign.
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Tell us your product, audience and budget — we will send a creator shortlist and
                campaign plan.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">
                Get a campaign plan <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
