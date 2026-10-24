import { Link } from "@/lib/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { ServiceDemos } from "@/components/service-demos";
import { Button } from "@/components/ui/button";
import { demosForSlug } from "@/data/demos";
import { serviceBySlug, services } from "@/data/services";
import { Price } from "@/components/currency-provider";

export default ServiceDetail;

function ServiceDetail({ service }: { service: NonNullable<ReturnType<typeof serviceBySlug>> }) {
  const demos = demosForSlug(service.slug);
  const others = services.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-16 md:py-20">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Starting from</p>
              <p className="font-display text-2xl font-bold text-primary">
                <Price value={service.startingFrom} />
              </p>
              <p className="text-xs text-muted-foreground">{service.priceNote}</p>
            </div>
            <Button asChild size="lg">
              <Link to="/contact">Request a quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <ServiceDemos demos={demos} />

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
                  <span className="font-display text-sm font-bold"><Price value={o.price} /></span>
                </div>
              ))}
            </div>
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
