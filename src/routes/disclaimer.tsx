import { LegalPage } from "@/components/legal-page";
import { disclaimerSections, legalDates } from "@/data/legal";

const title = "Disclaimer — AA100XTech";
const description =
  "General, informational and no-guarantee-of-results disclaimers for the AA100XTech website, including accuracy of information and third-party links.";
const url = "https://aa100xtech.lovable.app/disclaimer";

export default DisclaimerPage;

function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      intro="Information published on this website is general in nature. This page sets out the limits of what it represents."
      effectiveDate={legalDates.effective}
      lastUpdated={legalDates.updated}
      sections={disclaimerSections}
    />
  );
}
