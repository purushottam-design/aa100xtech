import { createFileRoute } from "@tanstack/react-router";
import { CareersPage } from "@/components/careers-page";
import { globalCohort } from "@/data/careers";

const title = "Careers — AA100XTech | 30 remote seats, one real brief";
const description =
  "AA100XTech is hiring 30 remote builders across 11 product lines. No interview rounds — one real client brief, 10 days to ship it, decision on day 10.";

export const Route = createFileRoute("/careers/")({
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
  component: () => <CareersPage cohort={globalCohort} />,
});
