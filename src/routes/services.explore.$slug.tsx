import { Link } from "@/lib/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, Layers } from "lucide-react";
import { ServiceDemos } from "@/components/service-demos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/currency-provider";
import { demosForSlug } from "@/data/demos";
import {
  serviceCategories,
  serviceTypeBySlug,
  serviceTypes,
} from "@/data/service-types";

export default ServiceTypeDetail;

function ServiceTypeDetail({ type }: { type: NonNullable<ReturnType<typeof serviceTypeBySlug>> }) {
  const category = serviceCategories.find((c) => c.id === type.category);
  const demos = demosForSlug(type.demoKey ?? type.serviceSlug ?? type.slug);
  const related = serviceTypes
    .filter((t) => t.category === type.category && t.slug !== type.slug)
    .slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-16 md:py-20">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/services/explore"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All service types
          </Link>
          {category ? (
            <Badge variant="secondary" className="mt-6 w-fit">
              {category.label}
            </Badge>
          ) : null}
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            {type.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary">{type.tagline}</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {type.description}
          </p>

          <div className="mt-8 flex flex-wrap items-stretch gap-4">
            <div className="rounded-xl border border-border/60 bg-surface px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Starting from</p>
              <p className="font-display text-2xl font-bold text-primary">
                <Price value={type.startingFrom} />
              </p>
              <p className="text-xs text-muted-foreground">{type.priceNote}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-surface px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Timeline</p>
              <p className="font-display text-2xl font-bold">{type.timeline}</p>
              <p className="text-xs text-muted-foreground">typical delivery</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild size="lg">
                <Link to="/contact">Request a quote</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/consultation">Book consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ServiceDemos demos={demos} />

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            The full working
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            Every module we build for you
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {type.modules.map((m, i) => (
              <article key={m.name} className="surface-card p-6">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <Layers className="size-4 text-signal" /> {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">{m.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-bold">How the project runs</h2>
            <ol className="mt-6 space-y-5">
              {type.process.map((p, i) => (
                <li key={p.step} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-sm font-bold text-primary ring-1 ring-primary/25">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-display font-semibold">{p.step}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {p.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <h3 className="mt-10 font-display text-lg font-semibold">Technology & tools</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {type.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-border/60 bg-surface-2/70 px-3 py-1 text-xs text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">What you receive</h2>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {type.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                  {d}
                </li>
              ))}
            </ul>

            <div className="surface-card mt-8 flex items-center gap-3 p-5">
              <Clock className="size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Typical delivery <span className="font-semibold text-foreground">{type.timeline}</span>{" "}
                from approved brief. Rush delivery is available on request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {type.faqs.length > 0 ? (
        <section className="border-b border-border/60 py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold">Frequently asked</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {type.faqs.map((f) => (
                <article key={f.q} className="surface-card p-6">
                  <h3 className="font-display font-semibold">{f.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-bold">Related service types</h2>
            {type.serviceSlug ? (
              <Button asChild variant="outline">
                <Link to="/services/$slug" params={{ slug: type.serviceSlug }}>
                  Full pricing for this category <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/services/explore/$slug"
                params={{ slug: r.slug }}
                className="surface-card p-5 transition-colors hover:border-primary/40"
              >
                <h3 className="font-display font-semibold">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.tagline}</p>
                <p className="mt-3 text-sm font-medium text-primary">
                  <Price value={r.startingFrom} /> onwards
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
