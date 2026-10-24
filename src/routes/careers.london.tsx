import { CareersPage } from "@/components/careers-page";
import { londonCohort } from "@/data/careers";

const title = "London cohort — AA100XTech Careers | 12 UK seats";
const description =
  "AA100XTech is opening a London studio with 12 remote UK seats. No interview rounds — one real client brief, 10 days to ship it, decision on day 10.";

export default () => <CareersPage cohort={londonCohort} />;
