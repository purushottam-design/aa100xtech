import { Link } from "@/lib/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ServiceDemos } from "@/components/service-demos";
import { Button } from "@/components/ui/button";
import { demosForSlug } from "@/data/demos";
import { serviceBySlug, services } from "@/data/services";
import { serviceDetails } from "@/data/service-details";
import { Price } from "@/components/currency-provider";

export default ServiceDetail;

function ServiceDetail({ service }: { service: NonNullable<ReturnType<typeof serviceBySlug>> }) {
  const demos = demosForSlug(service.slug);
  const details = serviceDetails(service);
  const others = services
    .filter((s) => s.slug !== service.slug)
    .sort(
      (a, b) =>
        Number(b.navigationGroup === service.navigationGroup) -
        Number(a.navigationGroup === service.navigationGroup),
    )
    .slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-16 md:py-20">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          >
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/services">Services</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{service.title}</span>
          </nav>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All services
          </Link>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            {service.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {service.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-border/60 bg-surface px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Starting from
              </p>
              <p className="font-display text-2xl font-bold text-primary">
                <Price value={service.startingFrom} />
              </p>
              <p className="text-xs text-muted-foreground">{service.priceNote}</p>
            </div>
            <Button asChild size="lg">
              <Link to="/proposal">Get Customised Proposal</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/consultation">Book Consultation</Link>
            </Button>
          </div>
        </div>
      </section>

      <ServiceDemos demos={demos} />

      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Key benefits</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {details.benefits.map((benefit) => (
              <li key={benefit} className="surface-card p-5 text-muted-foreground">
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-bold">What's included</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {service.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">Offerings & pricing</h2>
            <div className="surface-card mt-6 divide-y divide-border/60">
              {service.offerings.map((o) => (
                <div key={o.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <span className="text-sm text-muted-foreground">{o.name}</span>
                  <span className="font-display text-sm font-bold">
                    <Price value={o.price} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Technologies & tools</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            The final toolset is selected for your agreed scope and existing environment.
          </p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {details.stack.map((tool) => (
              <li key={tool} className="rounded-full border border-border/60 px-4 py-2 text-sm">
                {tool}
              </li>
            ))}
          </ul>
          <h2 className="mt-12 font-display text-2xl font-bold">How the engagement works</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {details.process.map((step, index) => (
              <li key={step.step} className="surface-card p-5">
                <p className="text-sm font-semibold text-primary">
                  {index + 1}. {step.step}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{step.detail}</p>
              </li>
            ))}
          </ol>
          {service.navigationGroup === "marketing" && (
            <div className="surface-card mt-8 p-6">
              <h3 className="font-semibold">Campaign objectives & reporting</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Agree the audience, channels, objectives and reporting cadence before launch.
                Depending on scope, reports can cover search visibility, engagement, leads,
                conversions and paid campaign spend. Results depend on your market and budget; no
                ranking or revenue outcome is guaranteed.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-primary">
                <Link to="/services/advertising-management">
                  Google Ads, Meta Ads & performance marketing
                </Link>
                <Link to="/services/ai-solutions">Marketing automation</Link>
                <Link to="/services/social-content-strategy">Content strategy</Link>
              </div>
            </div>
          )}
          {details.types.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl font-bold">Explore detailed deliverables</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {details.types.map((type) => (
                  <Link
                    key={type.slug}
                    to="/services/explore/$slug"
                    params={{ slug: type.slug }}
                    className="surface-card p-5 hover:border-primary/40"
                  >
                    <h3 className="font-semibold">{type.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{type.tagline}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-border/60">
            {details.faqs.map((faq) => (
              <details key={faq.q} className="py-4">
                <summary className="cursor-pointer rounded p-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {faq.q}
                </summary>
                <p className="px-2 pt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Other services</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <Link
                key={s.slug}
                to="/services/$slug"
                params={{ slug: s.slug }}
                className="surface-card p-5 transition-colors hover:border-primary/40"
              >
                <h3 className="font-display font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  <Price value={s.startingFrom} /> onwards
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
