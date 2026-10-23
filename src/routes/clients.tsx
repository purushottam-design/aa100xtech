import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectCategories, projects } from "@/data/portfolio";
import { clients } from "@/data/site";

const title = "Our Top Clients — Brands Built & Scaled by AA100XTech";
const description =
  "Meet the brands we build for: real-estate platforms, AI products, e-commerce storefronts and lifestyle labels engineered and scaled by AA100XTech.";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const [filter, setFilter] = useState("All");
  const list = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Trusted partnerships
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Our <span className="text-gradient-ember">top clients</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Long-term partners across real estate, retail, AI and hospitality — each one shipped,
            supported and scaled by our team.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Featured clients"
            description="A selection of brands that run their digital operations with us."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <a
                key={c.name}
                href={c.url}
                target="_blank"
                rel="noreferrer noopener"
                className="surface-card flex items-center justify-between gap-4 p-6 transition-colors hover:border-primary/50"
              >
                <span className="font-display text-lg font-semibold">{c.name}</span>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Client work"
            description="Platforms we've designed, engineered and scaled."
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {projectCategories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  filter === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <article key={p.slug} className="surface-card group overflow-hidden">
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={p.image}
                    alt={`${p.name} project screenshot`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <Badge variant="secondary">{p.category}</Badge>
                  <h2 className="mt-3 font-display text-xl font-semibold">{p.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-surface-2 px-2 py-1 text-xs text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-5">
                    <a href={p.url} target="_blank" rel="noreferrer noopener">
                      Visit site <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <div className="surface-card mt-16 p-10 text-center">
            <SectionHeading
              title="Ready to join the list?"
              description="Tell us about your product, timeline and budget — we'll come back with a scoped proposal."
            />
            <Button asChild size="lg" className="mt-8">
              <Link to="/contact">Start your project</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
