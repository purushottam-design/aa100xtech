import { withSocialMetadata } from "@/lib/page-metadata";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { inquiryOptions } from "@/data/business-plans";
import { partnershipPackages } from "@/data/influencer-partnership";
export const metadata: Metadata = withSocialMetadata({
  title: "Get a Customised Proposal | AA100XTech",
  description:
    "Share your business requirements for a personalised website, app, IT or marketing proposal.",
  alternates: { canonical: "https://aa100xtech.com/proposal" },
});
export default async function ProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; kind?: string; package?: string }>;
}) {
  const params = await searchParams;
  const plan = inquiryOptions.some((p) => p.id === params.plan) ? params.plan! : "other";
  const partnership = params.kind === "partnership" || params.plan === "influencer-partnership";
  const selectedPackage = partnershipPackages.some((p) => p.id === params.package)
    ? params.package!
    : "expert-guidance";
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Your next project</p>
        <h1 className="mt-4 text-4xl font-bold">
          {partnership ? "Get Customised Partnership Proposal" : "Get Customised Proposal"}
        </h1>
        <p className="mt-5 text-muted-foreground">
          {partnership
            ? "Tell us about your creator goals and selected services. We will review your requirements and discuss a scope, deliverables and custom quotation with you."
            : "Tell us what you need. We will review your requirements and discuss a scope, deliverables and quotation with you."}
        </p>
      </div>
      <InquiryForm
        kind={partnership || params.kind === "influencer" ? "influencer" : "proposal"}
        initialPlan={partnership ? "influencer-partnership" : plan}
        partnership={partnership}
        initialPackage={selectedPackage}
      />
    </section>
  );
}
