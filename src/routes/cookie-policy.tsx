import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { cookieSections, legalDates } from "@/data/legal";

const title = "Cookie Policy — AA100XTech";
const description =
  "Which cookies and browser storage AA100XTech uses, why they are needed for sign-in, how third-party embeds behave, and how you can manage cookies in your browser.";
const url = "https://aa100xtech.lovable.app/cookie-policy";

export const Route = createFileRoute("/cookie-policy")({
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
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="This page explains the cookies and similar technologies used on this website and how you can control them."
      effectiveDate={legalDates.effective}
      lastUpdated={legalDates.updated}
      sections={cookieSections}
    />
  );
}
