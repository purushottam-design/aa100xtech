"use client";
import { Link } from "@/lib/navigation";
import {
  Briefcase,
  Code2,
  Compass,
  Cpu,
  Globe,
  Heart,
  Layers,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Quote,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Twitter,
  Users,
  Zap,
} from "lucide-react";
import founderAsset from "@/assets/founder-aman.png.asset.json";
import { SectionHeading } from "@/components/section-heading";
import { StatCounter } from "@/components/stat-counter";
import { Button } from "@/components/ui/button";
import { usePublicSite } from "@/hooks/use-public-site";

const title = "Founder of AA100XTech — Aman, Absolute Advancement 100X Tech";
const description =
  "Meet the founder and lead developer of Absolute Advancement 100X Tech — his work, projects delivered, company details and social profiles.";

export default FoundersPage;

const companyStats = [
  { value: 200, suffix: "+", label: "Projects completed" },
  { value: 150, suffix: "+", label: "Happy clients" },
  { value: 20, suffix: "+", label: "Team members" },
  { value: 98, suffix: "%", label: "Client satisfaction" },
];

const founderProjects = [
  {
    name: "Worldwide Prominent Properties",
    detail: "Global real-estate platform",
    url: "https://worldwideprominentproperties.com/",
  },
  {
    name: "EcoBlossom Creations",
    detail: "E-commerce brand storefront",
    url: "https://ecoblossomcreations.com/",
  },
  {
    name: "Tasty Foods Delights",
    detail: "Food & restaurant brand site",
    url: "https://tastyfoodsdelights.com/",
  },
  {
    name: "CreatorsMove365.ai",
    detail: "AI image SaaS product",
    url: "https://creatormoves365.ai/",
  },
  {
    name: "Shakti Sphere Lifestyle",
    detail: "Lifestyle & wellness brand",
    url: "https://shaktispherelifestyle.com/",
  },
];

const expertise = [
  {
    icon: Code2,
    label: "Game Developer",
    desc: "Game development expertise covering interactive experiences, gameplay systems, and engaging digital products.",
  },
  {
    icon: Code2,
    label: "Full-stack engineering",
    desc: "Web & mobile apps built with MERN, Next.js, React Native and modern cloud stacks.",
  },
  {
    icon: Cpu,
    label: "AI & automation",
    desc: "Agentic workflows, LLM integrations, computer vision and process automation.",
  },
  {
    icon: CloudLightning,
    label: "Cloud & DevOps",
    desc: "Scalable architecture, CI/CD pipelines and production-grade infrastructure.",
  },
  {
    icon: Palette,
    label: "UI/UX & brand design",
    desc: "Conversion-focused interfaces, design systems and brand engineering.",
  },
  {
    icon: TrendingUp,
    label: "Digital growth",
    desc: "SEO, paid campaigns, content strategy and data-driven marketing.",
  },
  {
    icon: ShoppingCart,
    label: "E-commerce & SaaS",
    desc: "End-to-end product builds from storefront to subscription platforms.",
  },
];

const journey = [
  {
    year: "2025",
    title: "The beginning",
    desc: "Founded AA100XTech with a mission to deliver 100x growth through technology.",
  },
  {
    year: "2025 Q2",
    title: "Digital suite expansion",
    desc: "Added mobile apps, AI solutions, cloud DevOps and digital marketing.",
  },
  {
    year: "2025 Q4",
    title: "Global client wins",
    desc: "Delivered platforms for real estate, retail, fintech and lifestyle brands.",
  },
  {
    year: "2026",
    title: "AI-first studio",
    desc: "Pivoted to agentic AI, automation engines and high-frequency product delivery.",
  },
];

const values = [
  {
    icon: Heart,
    title: "Passion",
    desc: "Every project is built with genuine care for the client's outcome.",
  },
  {
    icon: Target,
    title: "Precision",
    desc: "Engineering decisions are driven by metrics, not assumptions.",
  },
  {
    icon: Zap,
    title: "Velocity",
    desc: "Rapid iteration without sacrificing quality or long-term scalability.",
  },
  {
    icon: Trophy,
    title: "Ownership",
    desc: "The founder remains hands-on across architecture, code review and delivery.",
  },
];

function FoundersPage() {
  const site = usePublicSite();
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 py-16 md:py-24 lg:py-32">
        <div className="grid-lines absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute -right-32 -top-32 size-[36rem] rounded-full bg-primary/10 blur-[120px]"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-32 size-[28rem] rounded-full bg-primary-glow/10 blur-[100px]"
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Founder & Lead Developer
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
              Aman — Founder of <span className="text-gradient-ember">AA100XTech</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Founder, CEO & Lead Developer of {site.legalName}. Aman architects the products, leads
              the engineering team and personally drives every major delivery from idea to launch.
            </p>

            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4 text-primary" /> aman@aa100xtech.com
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 text-primary" /> {site.phone}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="size-4 text-primary" /> Patna, Bihar, India
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Globe className="size-4 text-primary" /> {site.domain}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg">
                <Link to="/consultation">Work with Aman</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/portfolio">See portfolio</Link>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Connect
              </span>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Linkedin className="size-4" />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Twitter className="size-4" />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Globe className="size-4" />
              </a>
            </div>
          </div>

          <div className="order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-lg">
            <div className="relative">
              <div
                className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/25 via-primary-glow/10 to-transparent blur-2xl"
                aria-hidden
              />
              <div className="surface-card relative overflow-hidden p-2">
                <img
                  src={founderAsset.url}
                  alt="Aman — Founder and lead developer of AA100XTech"
                  className="aspect-[4/5] w-full rounded-[2rem] object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-border/60 bg-background/80 p-4 backdrop-blur-xl">
                  <p className="font-display text-base font-semibold">Aman</p>
                  <p className="text-xs text-muted-foreground">
                    Founder, CEO & Lead Developer — {site.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote / vision */}
      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Quote className="mx-auto size-10 text-primary/60" />
          <blockquote className="mt-6 text-2xl font-medium leading-snug sm:text-3xl">
            “I started AA100XTech to prove that a team in Patna can build world-class technology for
            clients across the globe — with speed, precision and real business impact.”
          </blockquote>
          <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-primary">
            — Aman, Founder
          </p>
        </div>
      </section>

      {/* Company numbers */}
      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Company at a glance"
            title="Projects the company has delivered"
            description="Under Aman's leadership, Absolute Advancement 100X Tech has grown into a full-service digital & IT engineering studio serving India and global markets."
          />
          <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            {companyStats.map((s) => (
              <StatCounter key={s.label} {...s} />
            ))}
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            <div className="surface-card p-6">
              <Rocket className="size-7 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Company</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {site.legalName} — registered in India, GSTIN {site.gstin}. HQ at {site.address}.
              </p>
            </div>
            <div className="surface-card p-6">
              <Briefcase className="size-7 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Focus areas</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Web & app development, AI solutions, cloud & DevOps, digital marketing, real-estate
                media, and consultation services.
              </p>
            </div>
            <div className="surface-card p-6">
              <Users className="size-7 text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">Team</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                A 20+ member team of developers, designers and marketers led directly by the founder
                with hands-on engineering involvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise bento */}
      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Team expertise"
            title="The team behind your project"
            description="Technology, marketing and creative expertise for your next digital product."
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expertise.map((e) => {
              const Icon = e.icon;
              return (
                <div
                  key={e.label}
                  className="surface-card group transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start gap-4 p-6">
                    <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-primary transition-colors group-hover:border-primary/40">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{e.label}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {e.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey timeline */}
      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Our journey"
                title="Building the AA100XTech story"
                description="The milestones that shaped the company from a single founder's vision into a full-service technology studio."
              />
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {values.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.title} className="surface-card p-5">
                      <Icon className="size-6 text-primary" />
                      <h3 className="mt-3 font-display text-base font-semibold">{v.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {v.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <ol className="relative space-y-10 border-l border-border pl-8">
              {journey.map((t) => (
                <li key={t.year} className="relative">
                  <span className="absolute -left-[41px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background" />
                  <p className="font-display text-sm font-bold text-primary">{t.year}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{t.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Featured work */}
      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Founder's work"
            title="Flagship projects led by Aman"
            description="A selection of live client platforms built under the founder's direction."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {founderProjects.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="surface-card group flex flex-col p-6 transition-colors hover:border-primary/60"
              >
                <div className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-primary transition-colors group-hover:border-primary/40">
                  <Globe className="size-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold group-hover:text-primary">
                  {p.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.detail}</p>
                <p className="mt-auto pt-4 text-xs font-semibold uppercase tracking-widest text-primary">
                  Visit live site →
                </p>
              </a>
            ))}
            <div className="surface-card flex flex-col justify-center p-6">
              <div className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
                <Layers className="size-5" />
              </div>
              <p className="mt-5 font-display text-lg font-semibold">+195 more projects</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Across retail, fintech, real estate, education, healthcare and SaaS.
              </p>
              <Button asChild variant="outline" className="mt-5 w-fit">
                <Link to="/portfolio">View full portfolio</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card relative overflow-hidden px-6 py-12 text-center md:px-12 md:py-16">
            <div
              className="absolute -right-20 -top-20 size-80 rounded-full bg-primary/15 blur-[100px]"
              aria-hidden
            />
            <div
              className="absolute -bottom-20 -left-20 size-80 rounded-full bg-primary-glow/10 blur-[100px]"
              aria-hidden
            />
            <div className="relative">
              <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl border border-border bg-secondary text-primary">
                <Compass className="size-7" />
              </div>
              <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold sm:text-4xl">
                Ready to build your next project with{" "}
                <span className="text-gradient-ember">Aman</span>?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Book a free consultation and discuss how AA100XTech can accelerate your product,
                brand or digital transformation.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/consultation">Book a consultation</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Local icon aliases to keep the expertise data declarative.
function CloudLightning(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  );
}

function Palette(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function ShoppingCart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}
