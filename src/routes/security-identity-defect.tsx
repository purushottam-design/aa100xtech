import {
  ArrowRight,
  BellRing,
  Check,
  ClipboardCheck,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "@/lib/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import { SecurityDefectWorkspace } from "@/components/security-defect-workspace";

const services = [
  {
    icon: UserRoundCheck,
    title: "Identity Verification",
    description: "Bring clarity to identity checks and account details.",
    items: [
      "Identity verification issues",
      "Profile mismatches",
      "Verification failures",
      "Identity-related security concerns",
    ],
  },
  {
    icon: LockKeyhole,
    title: "Access Control",
    description: "Report problems with who can access what.",
    items: [
      "User access management",
      "Roles and permissions",
      "Unauthorized access",
      "Account restrictions",
    ],
  },
  {
    icon: KeyRound,
    title: "Authentication Issues",
    description: "Get sign-in and account recovery issues reviewed.",
    items: [
      "Login failures",
      "OTP verification problems",
      "Multi-factor authentication issues",
      "Account recovery issues",
    ],
  },
  {
    icon: BellRing,
    title: "Security Monitoring",
    description: "Flag unusual activity and potential weaknesses.",
    items: [
      "Suspicious activity reporting",
      "Security vulnerabilities",
      "Account protection",
      "Security incident monitoring",
    ],
  },
];
const steps = [
  {
    icon: ScanSearch,
    title: "Identify",
    description:
      "Spot a security or identity-related problem and submit a report with the relevant details.",
  },
  {
    icon: ClipboardCheck,
    title: "Verify",
    description:
      "The authorized team reviews the issue, verifies the details and determines the appropriate action.",
  },
  {
    icon: ShieldCheck,
    title: "Resolve",
    description:
      "The issue is addressed and its status is updated. Follow progress in your private ticket list.",
  },
];
const overview = [
  {
    icon: Fingerprint,
    title: "Identity Verification",
    description: "Report mismatched details and verification failures for review.",
  },
  {
    icon: LockKeyhole,
    title: "Access Security",
    description: "Raise concerns about permissions, restrictions and unexpected access.",
  },
  {
    icon: KeyRound,
    title: "Authentication Protection",
    description: "Document sign-in, multi-factor authentication and recovery problems.",
  },
  {
    icon: BellRing,
    title: "Security Alerts",
    description: "Share suspicious activity through a private, trackable report.",
  },
];

export default function SecurityIdentityDefectPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-br from-surface via-background to-secondary/60 py-16 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-8">
          <div>
            <Badge variant="secondary" className="mb-5 gap-2">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Security & identity support
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] sm:text-5xl xl:text-6xl">
              Security &amp; <br />
              <span className="text-gradient-ember">Identity Defect</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Identify, report, track, and resolve security, identity verification, authentication,
              and access-related issues with a structured and reliable process.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="min-h-11">
                <a href="#report-issue">
                  Report an Issue <ArrowRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-11">
                <Link to="/consultation">Talk to an Expert</Link>
              </Button>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="size-4 text-primary" aria-hidden="true" />
              Private reports. Clear progress. One place.
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
            <div className="absolute inset-5 rounded-full border border-primary/20 bg-primary/5" />
            <div className="surface-card relative p-7 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Your security workspace
                </span>
                <span className="size-2 rounded-full bg-primary" />
              </div>
              <div className="relative mx-auto my-8 flex size-40 items-center justify-center rounded-full border border-primary/20 bg-secondary/60">
                <ShieldCheck className="size-24 text-primary" strokeWidth={1.2} />
                <span className="absolute -right-1 bottom-2 rounded-xl border border-primary/20 bg-background p-3 shadow-sm">
                  <Fingerprint className="size-7 text-primary" />
                </span>
              </div>
              <p className="text-center text-xl font-semibold text-foreground">
                A safer way to report.
              </p>
              <div className="mt-6 space-y-3">
                {["Share the issue securely", "Follow the review", "Track the resolution"].map(
                  (text, i) => (
                    <div
                      key={text}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      {text}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we help with"
            title="The right support for every issue"
            description="From verification to account access, give each concern a clear route to review."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <article
                key={service.title}
                className="surface-card p-6 transition-transform motion-safe:hover:-translate-y-1 motion-reduce:transition-none"
              >
                <span className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-secondary text-primary">
                  <service.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
                <ul className="mt-5 space-y-3">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works" title="From the first report to resolution" />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="relative border-l-2 border-primary/25 pl-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">0{index + 1}</span>
                  <step.icon className="size-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SecurityDefectWorkspace />

      <section className="border-t border-border/60 bg-surface py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Security overview"
            title="Understand what you can report"
            description="Know where to raise concerns about your identity, sign-in and account access."
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {overview.map((item) => (
              <div key={item.title}>
                <item.icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
