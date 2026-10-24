import { LegalPage } from "@/components/legal-page";
import { legalDates, termsSections } from "@/data/legal";

const title = "Terms & Conditions — AA100XTech";
const description =
  "The terms governing use of the AA100XTech website and services: eligibility, company-issued accounts, pricing, intellectual property, liability and governing law.";
const url = "https://aa100xtech.lovable.app/terms-and-conditions";

export default TermsPage;

function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="These terms set out the rules for using this website and the basis on which we provide our services."
      effectiveDate={legalDates.effective}
      lastUpdated={legalDates.updated}
      sections={termsSections}
    />
  );
}
