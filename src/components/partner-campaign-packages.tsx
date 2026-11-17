import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FileCheck2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import {
  partnerCampaignPackages,
  partnerCampaignHref,
  partnerCampaignQualification,
} from "@/data/partner-campaign-packages";

const steps = [
  {
    icon: ClipboardList,
    title: "Share your brief",
    text: "Tell us your audience, goals, preferred content and timeline.",
  },
  {
    icon: FileCheck2,
    title: "Confirm the scope",
    text: "Review creator availability, deliverables and the written quotation.",
  },
  {
    icon: Users,
    title: "Coordinate your campaign",
    text: "Agree the content plan, publishing schedule and reporting requirements.",
  },
];

export function PartnerCampaignPackages() {
  return (
    <section
      id="campaign-packages"
      aria-label="Creator Moves365 campaign packages"
      className="scroll-mt-28 border-y border-border bg-secondary/30 px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Creator Moves365 · Brand campaigns"
          title="A campaign that fits your next move"
          description="Choose an indicative campaign scope, then share your brief. Our team will help confirm the right creators, deliverables and quotation."
        />
        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {partnerCampaignPackages.map((offer) => (
            <article
              key={offer.id}
              className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold">{offer.name}</h3>
              <p className="mt-3 text-2xl font-bold tracking-tight text-primary">
                {offer.priceLabel}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{offer.summary}</p>
              <ul className="my-6 space-y-3 text-sm">
                {offer.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-auto w-full">
                <Link
                  href={partnerCampaignHref(offer.id)}
                  aria-label={`Enquire about ${offer.name}`}
                >
                  Enquire about {offer.name}
                  <ArrowRight aria-hidden="true" className="ml-2 size-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
        <p
          className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed"
          role="note"
        >
          {partnerCampaignQualification}
        </p>
        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold">
                  {index + 1}. {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-card px-5">
          <details className="py-4">
            <summary className="cursor-pointer font-medium">
              Are the content quantities per creator?
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              All listed reels, stories and static posts are totals across the whole campaign. Final
              creator selection and deliverables are confirmed in writing.
            </p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-medium">How do I confirm a package?</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Choose a package and submit the enquiry form below. Our team will review your brief
              and confirm availability, scope and a written quotation before the campaign starts.
            </p>
          </details>
          <details className="py-4">
            <summary className="cursor-pointer font-medium">
              Can I request a different scope?
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Yes. Share your requirements in the form or choose Enterprise for a custom quotation.
              You can also explore our{" "}
              <Link
                href="/influencer-marketing"
                className="font-medium text-primary underline underline-offset-4"
              >
                other influencer marketing options
              </Link>
              .
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}
