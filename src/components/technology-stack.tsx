"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  techCategories,
  techStats,
  technologies,
  type TechCategoryId,
} from "@/data/technologies";

export function TechnologyStack() {
  const [active, setActive] = useState<TechCategoryId>("frontend");
  const items = technologies.filter((t) => t.category === active);

  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Technology & services"
          title="Our technology stack"
          description="Modern, production-grade tools we use to design, build, scale and market digital products."
        />

        <div className="mt-10 -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex min-w-max gap-3 sm:min-w-0 sm:flex-wrap sm:justify-center">
            {techCategories.map((c) => {
              const Icon = c.icon;
              const isActive = c.id === active;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "border-primary/60 bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]"
                      : "border-border/60 bg-surface text-foreground hover:border-primary/40 hover:bg-surface-2",
                  )}
                >
                  <Icon className={cn("size-4", isActive ? "" : "text-primary")} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          key={active}
          className="mt-10 grid animate-in gap-5 fade-in slide-in-from-bottom-2 duration-300 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.name}
                className="surface-card group flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/12 text-primary transition-transform duration-200 group-hover:scale-110">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                <span className="mt-4 inline-flex w-fit rounded-full border border-border/60 bg-surface-2/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {categoryLabel[t.category]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid gap-5 grid-cols-2 lg:grid-cols-4">
          {techStats.map((s) => (
            <div
              key={s.label}
              className="surface-card p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
            >
              <p className="font-display text-3xl font-bold text-gradient-ember">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
