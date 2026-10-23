import { createFileRoute } from "@tanstack/react-router";
import { CareersPage } from "@/components/careers-page";
import { londonCohort } from "@/data/careers";

const title = "London cohort — AA100XTech Careers | 12 UK seats";
const description =
  "AA100XTech is opening a London studio with 12 remote UK seats. No interview rounds — one real client brief, 10 days to ship it, decision on day 10.";

export const Route = createFileRoute("/careers/london")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <CareersPage cohort={londonCohort} />,
});
