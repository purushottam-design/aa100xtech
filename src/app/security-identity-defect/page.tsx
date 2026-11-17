import Page from "@/routes/security-identity-defect";
import { withSocialMetadata } from "@/lib/page-metadata";

export const metadata = withSocialMetadata({
  title: "Security & Identity Defect | AA100XTech",
  description:
    "Report security, identity verification, authentication and access issues. Track your private security tickets with AA100XTech.",
  alternates: { canonical: "/security-identity-defect" },
});

export default Page;
