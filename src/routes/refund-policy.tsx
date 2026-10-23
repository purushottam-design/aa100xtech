import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { legalDates, refundSections } from "@/data/legal";

const title = "Refund & Cancellation Policy — AA100XTech";
const description =
  "How cancellations and refunds work for AA100XTech engagements: eligibility, non-refundable costs, duplicate and failed payments, and how to raise a refund request.";
const url = "https://aa100xtech.lovable.app/refund-policy";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro="Our services are delivered as custom professional engagements. This page explains how cancellations and refund requests are handled."
      effectiveDate={legalDates.effective}
      lastUpdated={legalDates.updated}
      sections={refundSections}
    />
  );
}
