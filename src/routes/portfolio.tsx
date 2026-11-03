"use client";

import { Link } from "@/lib/navigation";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CmsSections } from "@/components/cms-sections";
import { projectCategories, projects } from "@/data/portfolio";

const title = "Portfolio — Websites, Apps & Platforms by AA100XTech";
const description =
  "Selected work from AA100XTech: real-estate platforms, AI products, e-commerce storefronts and growth campaigns built with MERN, Next.js and TypeScript.";

export default PortfolioPage;

function PortfolioPage() {
  const [filter, setFilter] = useState("All");
  const list = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Selected work
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Our <span className="text-gradient-ember">portfolio</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Platforms we've designed, engineered and scaled for clients across real estate, retail,
            AI and hospitality.
          </p>
        </div>
      </section>

      <CmsSections placement="portfolio" />
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
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
              <article
                key={p.slug}
                className="surface-card group overflow-hidden transition-transform motion-safe:hover:-translate-y-1"
              >
                <div className="aspect-[3/2] overflow-hidden">
                  <img
                    src={p.image}
                    alt={`${p.name} project illustration`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="mb-3 text-xs text-muted-foreground">
                    Illustrative cover · use Visit site to view the actual project
                  </p>
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
              title="Ready to build the next one?"
              description="Tell us about your product, timeline and budget — we'll come back with a scoped proposal."
            />
            <Button asChild size="lg" className="mt-8">
              <Link to="/proposal">Get Customised Proposal</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
