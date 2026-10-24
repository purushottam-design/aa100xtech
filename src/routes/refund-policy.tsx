import { LegalPage } from "@/components/legal-page";
import { legalDates, refundSections } from "@/data/legal";

const title = "Refund & Cancellation Policy — AA100XTech";
const description =
  "How cancellations and refunds work for AA100XTech engagements: eligibility, non-refundable costs, duplicate and failed payments, and how to raise a refund request.";
const url = "https://aa100xtech.lovable.app/refund-policy";

export default RefundPolicyPage;

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
