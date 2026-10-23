import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { affiliatePlatforms, partnerPlans, planCategories } from "@/data/partner-plans";

const title = "30 Influencer Partnership Plans — Affiliate to Global | AA100XTech";
const description =
  "Choose from 30 influencer partnership plans at AA100XTech — affiliate marketing, referrals, UGC, whitelisting, reselling, territory licences and global company partnership. Every signup is approved by the super admin.";

export const Route = createFileRoute("/partners/plans")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://aa100xtech.lovable.app/partners/plans" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://aa100xtech.lovable.app/partners/plans" }],
  }),
  component: PartnerPlansPage,
});

function PartnerPlansPage() {
  const [filter, setFilter] = useState<string>("All");
  const plans =
    filter === "All" ? partnerPlans : partnerPlans.filter((p) => p.category === filter);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Partnership plans
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            30 partnership plans — starting with{" "}
            <span className="text-gradient-ember">affiliate marketing</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Plan #1 is classic affiliate marketing. The other 29 cover referrals, content
            collaborations, UGC, whitelisting, reselling, academies, territories and full company
            partnership. Pick one, apply, and the super admin reviews and approves your account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/partners/apply">Sign up as an affiliate</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/partners">See the 30-level ladder</Link>
            </Button>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-signal" />
            Every partner account is manually approved by the super admin.
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="All 30 plans"
            title="One plan for every kind of influence"
            description="Filter by the way you want to earn — commissions, flat fees, retainers, margins or equity."
          />

          <div className="mt-8 flex flex-wrap gap-2">
            {["All", ...planCategories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  filter === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p) => (
              <article key={p.id} className="surface-card flex flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm font-bold text-primary">
                    Plan {p.no.toString().padStart(2, "0")}
                  </span>
                  <Badge variant="secondary">{p.category}</Badge>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{p.name}</h3>
                <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Payout</p>
                <p className="text-sm text-foreground">{p.payout}</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Best for
                </p>
                <p className="text-sm text-muted-foreground">{p.bestFor}</p>
                <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                  You deliver
                </p>
                <p className="text-sm text-muted-foreground">{p.deliverable}</p>
                <Button asChild variant="outline" size="sm" className="mt-5 w-fit">
                  <Link to="/partners/apply" search={{ plan: p.id }}>
                    Apply for this plan <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Sign-up platforms"
            title="Where you can register as our affiliate"
            description="Track and get paid through the network you already use, or join directly on our own partner dashboard."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {affiliatePlatforms.map((n) => (
              <a
                key={n.name}
                href={n.url}
                target={n.url.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="surface-card flex items-start gap-3 p-5 transition-colors hover:border-primary/60"
              >
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-signal" />
                <span>
                  <span className="block text-sm font-semibold">{n.name}</span>
                  <span className="block text-sm text-muted-foreground">{n.note}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="font-display text-3xl font-bold">Approval in 48 hours</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Submit your application, the super admin reviews it, and your partner credentials
                arrive on your approved email and phone number.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/partners/apply">
                Start your application <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
