import Link from "next/link";
import type { Metadata } from "next";
import { Check, Layers, Mail } from "lucide-react";
import { businessPlans, emailEntitlements } from "@/data/business-plans";
import { Button } from "@/components/ui/button";
import { ExpertCta } from "@/components/expert-cta";
import { Price } from "@/components/currency-provider";
export const metadata: Metadata = {
  title: "Business & Business+ Plans | AA100XTech",
  description:
    "Explore professional websites, content management and tailored business solutions. Request an approved scope and personalised quotation.",
  alternates: { canonical: "https://aa100xtech.com/business-plans" },
};
export default function BusinessPlansPage() {
  return (
    <div>
      <section className="border-b border-border/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Built around your business
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold sm:text-5xl">
            A stronger digital foundation.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Professional websites, manageable content and a clear scope. Discuss your requirements
            before choosing a package.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {businessPlans.map((plan) => (
            <article
              key={plan.id}
              className="surface-card flex flex-col p-7 transition-transform motion-safe:hover:-translate-y-1 sm:p-9"
            >
              <Layers className="size-7 text-primary" />
              <h2 className="mt-5 text-3xl font-bold">{plan.name}</h2>
              <p className="mt-3 text-muted-foreground">{plan.description}</p>
              <p className="mt-7 text-2xl font-semibold">
                {plan.price === null ? (
                  "Custom quotation"
                ) : (
                  <Price value={`₹${plan.price.toLocaleString("en-IN")}`} />
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Final price and deliverables are agreed in your proposal.
              </p>
              <ul className="my-7 space-y-3">
                {plan.features.map((feature) => (
                  <li className="flex gap-2 text-sm" key={feature}>
                    <Check className="size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/proposal?plan=${plan.id}`}>Get Customised Proposal</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/consultation">Book Consultation</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className="surface-card mt-10 p-7">
          <h2 className="text-2xl font-semibold">Business email entitlements</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            These package names have separate approved email counts. Their relationship to Business
            and Business+ will be confirmed in your proposal. Accounts are not provisioned by
            submitting an inquiry.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {emailEntitlements.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border p-5">
                <Mail className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{plan.name}</h3>
                <p className="mt-1 text-muted-foreground">
                  {plan.accounts} business email accounts
                </p>
                <Link
                  className="mt-4 inline-block text-sm text-primary underline"
                  href={`/proposal?plan=${plan.id}`}
                >
                  Request this package
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ExpertCta />
    </div>
  );
}
