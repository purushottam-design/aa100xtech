import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Globe, Music, PenTool, Share2, Smartphone, Sparkles } from "lucide-react";
import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/currency-provider";
import { cn } from "@/lib/utils";
import {
  serviceCategories,
  serviceTypes,
  type ServiceTypeCategory,
} from "@/data/service-types";

const title = "Explore Every Service Type — Websites, Apps, Design, AI & Content | AA100XTech";
const description =
  "Browse every type of website, mobile app, graphic design, music, AI automation and social media service we deliver — open any type to see the full working, modules, process, timeline and pricing.";

export const Route = createFileRoute("/services/explore/")({
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
  component: ExploreServices,
});

const icons: Record<string, typeof Globe> = {
  Globe,
  Smartphone,
  PenTool,
  Music,
  Sparkles,
  Share2,
};

function ExploreServices() {
  const [active, setActive] = useState<ServiceTypeCategory | "all">("all");
  const visible = active === "all" ? serviceTypes : serviceTypes.filter((t) => t.category === active);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Full service catalogue
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Every type of <span className="text-gradient-ember">website, app, design, AI and content</span> we build
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Pick a category, choose the exact type you need, and open it to see the complete
            working — the modules we build, how the project runs, the technology, timeline,
            deliverables and price.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Get free consultation</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/services">See pricing catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCategories.map((c) => {
              const Icon = icons[c.icon] ?? Globe;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "surface-card flex gap-4 p-5 text-left transition-colors hover:border-primary/40",
                    active === c.id && "border-primary/60",
                  )}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-display font-semibold">{c.label}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                      {c.blurb}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="left"
            eyebrow="Service types"
            title="Click any type to see how it actually works"
            description="Each type opens its own page with the full module breakdown, delivery process, tech stack, FAQs and what you receive at handover."
          />

          <div className="mt-8 flex flex-wrap gap-2">
            <FilterChip label="All" active={active === "all"} onClick={() => setActive("all")} />
            {serviceCategories.map((c) => (
              <FilterChip
                key={c.id}
                label={c.label}
                active={active === c.id}
                onClick={() => setActive(c.id)}
              />
            ))}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((t) => (
              <Link
                key={t.slug}
                to="/services/explore/$slug"
                params={{ slug: t.slug }}
                className="surface-card flex flex-col p-6 transition-colors hover:border-primary/40"
              >
                <Badge variant="secondary" className="w-fit">
                  {serviceCategories.find((c) => c.id === t.category)?.label}
                </Badge>
                <h3 className="mt-4 font-display text-xl font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.tagline}</p>

                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
                  {t.modules.slice(0, 3).map((m) => (
                    <li key={m.name} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal" />
                      {m.name}
                    </li>
                  ))}
                  {t.modules.length > 3 ? (
                    <li className="pl-3.5 text-xs">+{t.modules.length - 3} more modules</li>
                  ) : null}
                </ul>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-border/60 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
                    <p className="font-display text-lg font-bold text-primary">
                      <Price value={t.startingFrom} />
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {t.timeline}
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  See full working <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border border-border/60 px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
