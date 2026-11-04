import { Link } from "@/lib/navigation";
import { ArrowRight, Check, Minus, Sparkles, Star, Zap } from "lucide-react";
import { LogoMarquee } from "@/components/logo-marquee";
import { SectionHeading } from "@/components/section-heading";
import { StatCounter } from "@/components/stat-counter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deliverables, marketingPlans, webPlans } from "@/data/pricing";
import { services } from "@/data/services";
import { heroStats, whyChooseUs } from "@/data/site";
import { Price } from "@/components/currency-provider";
import { TechnologyStack } from "@/components/technology-stack";
import { CmsSections } from "@/components/cms-sections";

const title = "AA100XTech — Web, App & Digital Marketing Studio in Patna";
const description =
  "Absolute Advancement 100X Tech builds high-performance websites, mobile apps, AI solutions and growth marketing for ambitious brands. Transparent INR pricing from ₹7,999.";

export default HomePage;

function HomePage() {
  return (
    <div>
      <Hero />
      <TrustedBy />
      <ServicesSection />
      <MarketingSection />
      <WebPlansSection />
      <DeliverablesSection />
      <TechnologyStack />
      <WhyUsSection />
      <CmsSections placement="home" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
      <div
        className="absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "var(--gradient-ember)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <Sparkles className="size-3.5" /> Premium digital agency
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Expert IT &amp; Digital Marketing Solutions for Your Business
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              From website development and mobile applications to digital marketing and influencer
              campaigns, AA100X TECH brings technology and creative expertise together to help
              businesses grow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="glow-ring">
                <Link to="/contact">
                  Start your project <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/portfolio">View our work</Link>
              </Button>
            </div>

            <div className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {heroStats.map((s) => (
                <StatCounter key={s.label} {...s} />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="surface-card glow-ring relative overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Combined team experience
                  </p>
                  <p className="mt-1 font-display text-4xl font-bold text-gradient-ember">
                    10+ Years
                  </p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Zap className="size-5" />
                </span>
              </div>

              <div className="mt-6 grid gap-2 text-sm text-muted-foreground">
                {[
                  "IT Experts",
                  "Marketing Specialists",
                  "Website Developers",
                  "App Developers",
                  "Digital Marketing Professionals",
                  "Game Developers",
                  "Creative & Media Specialists",
                ].map((role) => (
                  <p key={role} className="rounded-lg border border-border/60 px-3 py-2">
                    {role}
                  </p>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                10+ Years of Team Experience refers to combined team experience, not the age of the
                company.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2/70 p-4">
                  <p className="text-xs text-muted-foreground">IT Experts</p>
                  <p className="mt-1 font-display text-2xl font-bold">Technology</p>
                </div>
                <div className="rounded-xl bg-surface-2/70 p-4">
                  <p className="text-xs text-muted-foreground">Marketing Specialists</p>
                  <p className="mt-1 font-display text-2xl font-bold">Creativity</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-lg sm:flex">
              <Star className="size-4 fill-primary text-primary" />
              <span className="text-sm font-medium">Enterprise security ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="border-b border-border/60 py-12">
      <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        Trusted by innovative companies
      </p>
      <div className="mt-6">
        <LogoMarquee />
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our technology expertise"
          title="Comprehensive technology solutions"
          description="From concept to deployment, we provide end-to-end services tailored to your needs."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((s) => (
            <Link
              key={s.slug}
              to="/services/$slug"
              params={{ slug: s.slug }}
              className="surface-card group flex flex-col p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <h3 className="font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.short}</p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Starting from
                </span>
                <span className="font-display text-xl font-bold text-primary">
                  <Price value={s.startingFrom} />
                </span>
              </div>

              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {s.highlights.slice(0, 4).map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    {h}
                  </li>
                ))}
              </ul>

              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Explore service
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/services">See all services & pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function MarketingSection() {
  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Performance & brand growth"
          title="Digital marketing solutions"
          description="Goal-driven marketing strategies engineered to boost visibility, engagement and revenue."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {marketingPlans.map((p) => (
            <div
              key={p.name}
              className={`surface-card relative flex flex-col p-7 ${
                p.featured ? "border-primary/50 glow-ring lg:-mt-4 lg:mb-4" : ""
              }`}
            >
              {p.featured ? (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most recommended
                </span>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {p.eyebrow}
              </p>
              <h3 className="mt-3 font-display text-2xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.audience}</p>
              <p className="mt-5 font-display text-3xl font-bold">
                <Price value={p.price} />
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Core objective: <span className="text-foreground">{p.objective}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button asChild className="mt-7" variant={p.featured ? "default" : "outline"}>
                <Link to="/contact">{p.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WebPlansSection() {
  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tailored web solutions"
          title="Select your project scope"
          description="High-performance website development plans crafted for business growth and scalability."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {webPlans.map((p) => (
            <div
              key={p.name}
              className={`surface-card flex flex-col p-7 ${p.featured ? "border-primary/50 glow-ring" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {p.tier}
                </span>
                {p.featured ? <Badge>Recommended</Badge> : null}
              </div>
              <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
                {p.badge}
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>

              <p className="mt-5 font-display text-3xl font-bold">
                <Price value={p.price} />
                <span className="ml-1 text-sm font-normal text-muted-foreground">starting</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Est. delivery: <span className="font-semibold text-foreground">{p.delivery}</span>
              </p>

              <dl className="mt-6 flex-1 space-y-3 text-sm">
                {p.specs.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between border-b border-border/50 pb-2"
                  >
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <Button asChild className="mt-7" variant={p.featured ? "default" : "outline"}>
                <Link to="/proposal">Get Customised Proposal</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Detailed technical deliverables"
          title="What's included in each tier"
          description="Inspect the tech stack and feature inclusions before you commit."
        />

        <Accordion type="single" collapsible className="mt-12" defaultValue="Essential foundation">
          {deliverables.map((group) => (
            <AccordionItem key={group.group} value={group.group}>
              <AccordionTrigger className="font-display text-lg">{group.group}</AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 font-medium">Deliverable feature</th>
                        <th className="pb-3 text-center font-medium">Startup</th>
                        <th className="pb-3 text-center font-medium">Business</th>
                        <th className="pb-3 text-center font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr key={row.feature} className="border-t border-border/50">
                          <td className="py-3 pr-4 text-muted-foreground">{row.feature}</td>
                          {row.tiers.map((ok, i) => (
                            <td key={i} className="py-3 text-center">
                              {ok ? (
                                <Check className="mx-auto size-4 text-signal" />
                              ) : (
                                <Minus className="mx-auto size-4 text-muted-foreground/50" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="surface-card mt-12 flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">Have a specific custom requirement?</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Looking for complex API integrations, custom Web3/AI workflows, or bespoke designs? We
              can build a solution tailored precisely to your scope.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/proposal">Get Customised Proposal</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function WhyUsSection() {
  const pillars = [
    {
      title: "Result-driven",
      body: "We focus on delivering measurable business outcomes and ROI.",
    },
    {
      title: "Innovation first",
      body: "Cutting-edge technologies and creative problem-solving.",
    },
    {
      title: "Expert team",
      body: "Skilled professionals across engineering, design and growth.",
    },
    {
      title: "Always available",
      body: "24/7 technical support and proactive maintenance.",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <SectionHeading
            align="left"
            eyebrow="The AA100XTech advantage"
            title="Why choose us"
            description="We combine technical expertise with business understanding to deliver solutions that drive real results for your organization."
          />

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {whyChooseUs.map((w) => (
              <li key={w} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                {w}
              </li>
            ))}
          </ul>

          <Button asChild className="mt-8" variant="outline">
            <Link to="/about">Learn more about us</Link>
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="surface-card p-6">
              <h3 className="font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
