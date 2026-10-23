import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";

import { Price } from "@/components/currency-provider";

const title = "IT Services & Transparent Pricing — AA100XTech";
const description =
  "Websites, e-commerce, mobile apps, AI, cloud, cybersecurity, SEO and marketing with transparent starting prices in INR — from ₹1,499 design work to full enterprise platforms.";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div>
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our services & pricing"
            title="Clear prices for every IT service"
            description="Transparent starting prices in INR for websites, apps, AI, cloud, marketing and more — so you know what we charge before you inquire."
          />

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <article key={s.slug} className="surface-card flex flex-col p-6">
                <Badge variant="secondary" className="w-fit">
                  {s.offerings.length} offerings
                </Badge>
                <h2 className="mt-4 font-display text-xl font-semibold">{s.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.short}</p>

                <div className="mt-5 rounded-xl bg-surface-2/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Starting from
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">
                    <Price value={s.startingFrom} />
                  </p>
                  <p className="text-xs text-muted-foreground">{s.priceNote}</p>
                </div>

                <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                  {s.offerings.slice(0, 6).map((o) => (
                    <li key={o.name} className="flex items-center justify-between gap-3">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                        {o.name}
                      </span>
                      <span className="shrink-0 font-medium text-foreground">
                        <Price value={o.price} />
                      </span>
                    </li>
                  ))}
                  {s.offerings.length > 6 ? (
                    <li className="pl-6 text-xs text-muted-foreground">
                      +{s.offerings.length - 6} more offerings
                    </li>
                  ) : null}
                </ul>

                <Button asChild variant="outline" className="mt-6">
                  <Link to="/services/$slug" params={{ slug: s.slug }}>
                    Explore service <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
