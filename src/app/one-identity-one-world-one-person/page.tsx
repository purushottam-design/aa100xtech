import Page from "@/routes/one-identity-one-world-one-person";
import { withSocialMetadata } from "@/lib/page-metadata";

export const metadata = withSocialMetadata({
  title: "One Identity One World One Person | AA100XTech",
  description:
    "One person. One consistent identity. A world of possibilities. Bring your story, personal brand, website and social presence together with AA100XTech.",
  alternates: { canonical: "/one-identity-one-world-one-person" },
});

export default Page;
