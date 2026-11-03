import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

export function ExpertCta() {
  return (
    <section className="border-t border-border/60 bg-surface/40 py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          IT & Marketing Experts
        </p>
        <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
          Ready to Talk to an Expert?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Have a project in mind? Connect with our IT and Marketing Experts to discuss the right
          solution for your business.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={site.consultationUrl}>Book Consultation</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/proposal">Get Customised Proposal</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
