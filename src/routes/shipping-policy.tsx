import { LegalPage } from "@/components/legal-page";
import { deliverySections, legalDates } from "@/data/legal";

const title = "Digital Delivery Policy — AA100XTech";
const description =
  "AA100XTech delivers digital services, not physical goods. This policy explains how deliverables and access are released, timelines, delays and re-delivery of files.";
const url = "https://aa100xtech.lovable.app/shipping-policy";

export default DeliveryPolicyPage;

function DeliveryPolicyPage() {
  return (
    <LegalPage
      title="Digital Delivery & Access Policy"
      intro="We deliver digital services and digital assets only — there is no physical shipping. This page explains how you receive your deliverables and access."
      effectiveDate={legalDates.effective}
      lastUpdated={legalDates.updated}
      sections={deliverySections}
    />
  );
}
