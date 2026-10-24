"use client";

import { Link } from "@/lib/navigation";
import {
  ArrowRight,
  Bot,
  Brain,
  Building2,
  Check,
  Cloud,
  Code2,
  Compass,
  CreditCard,
  Globe,
  LineChart,
  Megaphone,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Price } from "@/components/currency-provider";
import { useConsultationBooking } from "@/components/consultation-booking";
import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { consultationPlans } from "@/data/consultations";

const title = "Book IT Consultation | Expert Technology Consulting";
const description =
  "Book a 1-on-1 consultation with our IT experts for website development, software, mobile apps, AI, cloud, architecture and digital transformation.";

export default ConsultationPage;

function scrollToPlans() {
  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ConsultationPage() {
  return (
    <div>
      <Hero />
      <Stats />
      <WhyConsult />
      <ServicesGrid />
      <Process />
      <StandardPlans />
      <PremiumPlans />
      <Comparison />
      <WhoFor />
      <Faq />
      <FinalCta />
      <StickyCta />
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
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-24 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
              <Sparkles className="size-3.5" /> Expert IT Consultation
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Book a 1-on-1 <span className="text-gradient-ember">Consultation</span> With Our IT
              Experts
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Get professional guidance for your website, software, mobile app, AI solution, cloud
              infrastructure, or digital transformation project.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="glow-ring" onClick={scrollToPlans}>
                Book Consultation <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={scrollToPlans}>
                Explore Consultation Plans
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="surface-card glow-ring relative overflow-hidden p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Consultation session
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">Strategy & Architecture</p>
                </div>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Compass className="size-5" />
                </span>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-3">
                {[Code2, Cloud, Brain, ShieldCheck, Smartphone, Workflow, Globe, LineChart].map(
                  (Icon, i) => (
                    <div
                      key={i}
                      className="flex aspect-square items-center justify-center rounded-xl bg-surface-2/70 text-primary"
                    >
                      <Icon className="size-5" />
                    </div>
                  ),
                )}
              </div>

              <div className="mt-6 space-y-3">
                {["Requirement analysis", "Technology roadmap", "Budget & timeline clarity"].map(
                  (t) => (
                    <div key={t} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-signal" />
                      <span className="text-muted-foreground">{t}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const stats = [
  { icon: Rocket, value: "200+", label: "Projects Completed" },
  { icon: Target, value: "98%", label: "Client Satisfaction" },
  { icon: Code2, value: "40+", label: "Technologies" },
  { icon: Users, value: "1+", label: "Years Experience" },
];

function Stats() {
  return (
    <section className="border-b border-border/60 py-12">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="surface-card flex items-center gap-3 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <s.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold">{s.value}</p>
              <p className="truncate text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const reasons = [
  {
    icon: Code2,
    title: "Technology Guidance",
    body: "Choose the right technologies and architecture for your project.",
  },
  {
    icon: Compass,
    title: "Project Planning",
    body: "Turn your idea into a clear development roadmap.",
  },
  {
    icon: CreditCard,
    title: "Cost Estimation",
    body: "Understand realistic development costs and infrastructure requirements.",
  },
  {
    icon: ShieldCheck,
    title: "Architecture Review",
    body: "Get expert feedback on scalability, performance and security.",
  },
  {
    icon: LineChart,
    title: "Business Strategy",
    body: "Align technology decisions with your business goals.",
  },
  {
    icon: Bot,
    title: "AI & Automation",
    body: "Identify opportunities to use AI and automation in your workflow.",
  },
];

function WhyConsult() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Value"
          title="Why Book a Consultation?"
          description="Get clarity before you invest time and money into development."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="surface-card group p-6 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform group-hover:scale-110">
                <r.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const helpItems = [
  {
    icon: Globe,
    title: "Website Development",
    body: "Plan, improve or scale a high-performance website tailored to your business.",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Development",
    body: "Build a conversion-focused store with payments, catalog and logistics.",
  },
  {
    icon: Smartphone,
    title: "Mobile App Development",
    body: "Ship native or cross-platform apps with a clear release plan.",
  },
  {
    icon: Code2,
    title: "Custom Software",
    body: "Design internal tools and platforms around your real workflows.",
  },
  {
    icon: Brain,
    title: "AI & Machine Learning",
    body: "Apply AI models, agents and automation where they create measurable value.",
  },
  {
    icon: Cloud,
    title: "Cloud & DevOps",
    body: "Get infrastructure, CI/CD and cost optimisation guidance.",
  },
  {
    icon: Palette,
    title: "UI/UX & Product Design",
    body: "Refine product experience, design systems and usability.",
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    body: "Plan campaigns that generate qualified pipeline, not just traffic.",
  },
  {
    icon: Search,
    title: "SEO & Growth",
    body: "Improve visibility, technical SEO and long-term organic growth.",
  },
  {
    icon: Workflow,
    title: "Business Automation",
    body: "Remove manual work with integrations and automated workflows.",
  },
];

function ServicesGrid() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Scope"
          title="What Can We Help You With?"
          description="Bring any technology challenge — we will help you choose the right direction."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {helpItems.map((s) => (
            <div
              key={s.title}
              className="surface-card group flex flex-col p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <button
                type="button"
                onClick={scrollToPlans}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Discuss this{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    n: "01",
    title: "Choose Your Plan",
    body: "Select the consultation duration that fits your requirements.",
  },
  {
    n: "02",
    title: "Share Your Requirements",
    body: "Tell us about your project, goals and challenges.",
  },
  {
    n: "03",
    title: "Meet Our Expert",
    body: "Discuss your project directly with our technical experts.",
  },
  {
    n: "04",
    title: "Get a Clear Direction",
    body: "Leave with actionable recommendations and next steps.",
  },
];

function Process() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Process" title="How It Works" />
        <div className="relative mt-12">
          <div
            className="absolute left-6 top-0 hidden h-px w-full bg-border/70 lg:block lg:left-0 lg:top-6"
            aria-hidden
          />
          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative flex gap-4 lg:block">
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-surface font-display text-sm font-bold text-primary">
                  {s.n}
                </span>
                <div className="lg:mt-5">
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  id,
  name,
  duration,
  price,
  features,
  buttonLabel,
  featured,
  badge,
  onBook,
}: {
  id: string;
  name: string;
  duration: string;
  price: number;
  features: string[];
  buttonLabel: string;
  featured?: boolean;
  badge?: string;
  onBook: (id: string) => void;
}) {
  return (
    <div
      className={`surface-card relative flex flex-col p-6 transition-all hover:-translate-y-1 ${
        featured ? "border-primary/50 glow-ring" : ""
      }`}
    >
      {badge ? <Badge className="absolute -top-2.5 left-5 text-[10px]">{badge}</Badge> : null}
      <h3 className="font-display text-xl font-semibold">{name}</h3>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{duration}</p>
      <p className="mt-4 font-display text-3xl font-bold text-primary">
        <Price value={`₹${price.toLocaleString("en-IN")}`} />
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-signal" />
            {f}
          </li>
        ))}
      </ul>
      <Button
        className="mt-6 w-full"
        variant={featured ? "default" : "outline"}
        onClick={() => onBook(id)}
      >
        {buttonLabel} <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function StandardPlans() {
  const { open } = useConsultationBooking();
  const plans = consultationPlans.filter((p) => p.category === "standard");

  return (
    <section id="plans" className="scroll-mt-20 border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Standard Consultation Plans"
          description="Choose the consultation that fits your project."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} {...p} onBook={open} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PremiumPlans() {
  const { open } = useConsultationBooking();
  const plans = consultationPlans.filter((p) => p.category === "premium");

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-surface-2/40 py-20">
      <div
        className="absolute -bottom-40 left-1/2 size-[560px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-ember)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Enterprise"
          title="Enterprise-Level Strategic Consultation"
          description="Designed for businesses, startups, enterprises, investors, and organizations looking for in-depth planning and senior-level technical consultation."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} {...p} onBook={open} />
          ))}
        </div>
      </div>
    </section>
  );
}

const comparisonRows: { label: string; values: string[] }[] = [
  { label: "Duration", values: ["15 min", "30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"] },
  {
    label: "Price",
    values: ["₹2,500", "₹5,000", "₹10,000", "₹20,000", "₹30,000", "₹50,000"],
  },
  {
    label: "Best For",
    values: [
      "Quick questions",
      "Small projects",
      "Full project scoping",
      "Startups & growth",
      "Enterprises",
      "Founders & investors",
    ],
  },
  {
    label: "Expert Level",
    values: ["Consultant", "Consultant", "Senior", "Senior expert", "Architect", "Expert team"],
  },
  { label: "Architecture Guidance", values: ["—", "—", "Yes", "Yes", "Yes", "Yes"] },
  { label: "Business Analysis", values: ["—", "Basic", "Yes", "Yes", "Yes", "Yes"] },
  { label: "Roadmap", values: ["—", "—", "Yes", "Yes", "Yes", "Long-term"] },
  { label: "AI Strategy", values: ["—", "—", "—", "Yes", "Yes", "Yes"] },
];

const comparisonCols = [
  "Quick",
  "Standard",
  "Professional",
  "Premium",
  "Enterprise",
  "Executive",
];

function Comparison() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Compare" title="Which Consultation Is Right For You?" />
        <div className="mt-12 overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface-2/60">
                <th className="p-4 text-left font-display font-semibold">Feature</th>
                {comparisonCols.map((c) => (
                  <th key={c} className="p-4 text-left font-display font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-t border-border/60">
                  <td className="p-4 font-medium">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="p-4 text-muted-foreground">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const audience = [
  { icon: Rocket, title: "Startups", body: "Validate your idea and plan an efficient MVP build." },
  { icon: Building2, title: "Businesses", body: "Modernise systems and improve digital presence." },
  {
    icon: ShieldCheck,
    title: "Enterprises",
    body: "Plan secure, scalable and compliant architecture.",
  },
  { icon: Users, title: "Founders", body: "Get honest technical direction before you commit." },
  { icon: LineChart, title: "Investors", body: "Assess technical feasibility and delivery risk." },
  { icon: Code2, title: "Developers", body: "Review architecture, stack choices and performance." },
  { icon: Workflow, title: "Product Teams", body: "Turn roadmaps into realistic delivery plans." },
  { icon: Globe, title: "Organizations", body: "Digitise operations with automation and AI." },
];

function WhoFor() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Audience" title="Who Is This Consultation For?" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audience.map((a) => (
            <div
              key={a.title}
              className="surface-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <a.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "What happens during the consultation?",
    a: "We discuss your goals, review your requirements and give you clear technical recommendations, scope and next steps.",
  },
  {
    q: "Can I discuss an existing website or application?",
    a: "Yes. Share the URL or access details in advance and we will review it during the session.",
  },
  {
    q: "Can you review my existing technology stack?",
    a: "Yes. We assess your stack for scalability, performance, security and cost efficiency.",
  },
  {
    q: "Can you provide development cost estimates?",
    a: "Yes. From the Standard plan upward we provide realistic cost and infrastructure estimates.",
  },
  {
    q: "Can I discuss an AI or automation project?",
    a: "Absolutely. We cover AI use cases, model selection, automation workflows and rollout planning.",
  },
  {
    q: "Can I book a consultation for an enterprise project?",
    a: "Yes. The Enterprise and Executive plans are designed for large-scale, multi-team initiatives.",
  },
  {
    q: "Which consultation plan should I choose?",
    a: "Pick Quick for a focused question, Standard or Professional for project scoping, and Premium and above for strategy and architecture.",
  },
  {
    q: "Can I change my consultation plan before payment?",
    a: "Yes. You can go back and select a different plan any time before completing payment.",
  },
  {
    q: "How will the consultation take place?",
    a: "Online, as a scheduled one-on-one video or phone session with our expert.",
  },
  {
    q: "Which meeting platforms are supported?",
    a: "Google Meet, Zoom, Microsoft Teams or a direct phone call — you choose while booking.",
  },
];

function Faq() {
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="FAQ" title="Consultation Questions" />
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="surface-card glow-ring relative overflow-hidden px-6 py-14 text-center sm:px-12">
          <div
            className="absolute inset-x-0 -top-24 mx-auto size-[420px] rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--gradient-ember)" }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">Have a Project in Mind?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Let's discuss your idea, challenges and technology requirements with an experienced IT
              expert.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={scrollToPlans}>
                Book Consultation <ArrowRight className="size-4" />
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Contact Our Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-border/60 bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="hidden min-w-0 truncate text-sm font-medium sm:block">
          Ready to Talk to an Expert?
        </p>
        <Button className="w-full sm:w-auto" onClick={scrollToPlans}>
          Book Consultation <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
