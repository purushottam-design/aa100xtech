import { Link } from "@/lib/navigation";
import { ArrowRight, Check, Trophy } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { partnerBenefits, partnerFaqs, partnerTiers } from "@/data/partnership";

const title = "Influencer Partnership Program — 30 Levels | AA100XTech";
const description =
  "Join the AA100XTech Influencer Partnership Program: 30 levels from basic affiliate to full global company partnership, with commissions, overrides, territory rights and an academy track.";

export default PartnersPage;

function PartnersPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Influencer partnership program
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            30 levels — from your first referral to a{" "}
            <span className="text-gradient-ember">global company partnership</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Start as a basic affiliate and climb a transparent ladder: higher commissions, team
            overrides, territory rights, your own academy of global students, and finally a full
            partnership where you build companies with us.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/partners/apply">Apply to the program</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/partners/plans">See the 30 partnership plans</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <a href="#levels">See all 30 levels</a>
            </Button>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { k: "30", v: "Partnership levels" },
              { k: "Up to 35%", v: "Commission + overrides" },
              { k: "Global", v: "Open worldwide" },
            ].map((s) => (
              <div key={s.v} className="surface-card p-5">
                <p className="font-display text-2xl font-bold text-primary">{s.k}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What you get"
            title="Built for creators who want to own something"
            description="Every partner gets the tooling, creatives and support to sell confidently — and keeps lifetime credit on every client they introduce."
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partnerBenefits.map((b) => (
              <li key={b} className="surface-card flex items-start gap-3 p-5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                <span className="text-muted-foreground">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="levels" className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The ladder"
            title="All 30 levels, in six tiers"
            description="Each level has one clear requirement. Meet it and you're promoted — levels never expire once earned."
          />

          <div className="mt-12 space-y-12">
            {partnerTiers.map((tier, i) => (
              <div key={tier.name}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Trophy className="size-4" />
                  </span>
                  <h3 className="font-display text-2xl font-bold">
                    Tier {i + 1} · {tier.name}
                  </h3>
                  <Badge variant="secondary">{tier.range}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.summary}</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {tier.levels.map((l) => (
                    <article key={l.level} className="surface-card flex flex-col p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-display text-sm font-bold text-primary">
                          Level {l.level}
                        </span>
                        <span className="rounded-full bg-surface-2/70 px-3 py-1 text-xs font-medium">
                          {l.commission}
                        </span>
                      </div>
                      <h4 className="mt-3 font-display text-lg font-semibold">{l.name}</h4>
                      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                        Requirement
                      </p>
                      <p className="text-sm text-muted-foreground">{l.requirement}</p>
                      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                        Unlocks
                      </p>
                      <p className="text-sm text-muted-foreground">{l.unlocks}</p>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Partnership questions"
            description="Everything creators ask before joining."
          />
          <Accordion type="single" collapsible className="mt-10">
            {partnerFaqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="surface-card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="font-display text-3xl font-bold">Start at Level 1 today</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                No joining fee. Get your tracking link, creative kit and partner dashboard within 48
                hours of approval.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/partners/apply">
                Apply now <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
