import { withSocialMetadata } from "@/lib/page-metadata";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { inquiryOptions } from "@/data/business-plans";
export const metadata: Metadata = withSocialMetadata({
  title: "Get a Customised Proposal | AA100XTech",
  description:
    "Share your business requirements for a personalised website, app, IT or marketing proposal.",
  alternates: { canonical: "https://aa100xtech.com/proposal" },
});
export default async function ProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const plan = inquiryOptions.some((p) => p.id === params.plan) ? params.plan! : "other";
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mx-auto mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Your next project</p>
        <h1 className="mt-4 text-4xl font-bold">Get Customised Proposal</h1>
        <p className="mt-5 text-muted-foreground">
          Tell us what you need. We will review your requirements and discuss a scope, deliverables
          and quotation with you.
        </p>
      </div>
      <InquiryForm
        kind={params.kind === "influencer" ? "influencer" : "proposal"}
        initialPlan={plan}
      />
    </section>
  );
}
