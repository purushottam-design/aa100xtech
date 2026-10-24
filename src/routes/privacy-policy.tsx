import { LegalPage } from "@/components/legal-page";
import { legalDates, privacySections } from "@/data/legal";

const title = "Privacy Policy — AA100XTech";
const description =
  "How AA100XTech collects, uses, stores and shares information submitted through aa100xtech.com, including account data, form submissions, cookies and your privacy rights.";
const url = "https://aa100xtech.lovable.app/privacy-policy";

export default PrivacyPolicyPage;

function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="This policy explains what information we collect through this website, why we collect it, how it is stored and the choices available to you."
      effectiveDate={legalDates.effective}
      lastUpdated={legalDates.updated}
      sections={privacySections}
    />
  );
}
