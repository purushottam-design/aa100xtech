import { AdminNav } from "@/components/admin-nav";
import { SettingsForm } from "@/components/settings-form";
import { site } from "@/data/site";

const title = "Website settings — AA100XTech admin";
const description =
  "Manage the public identity of AA100XTech: site name, contact details, business hours and site-wide announcements.";

export default () => (
  <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <h1 className="font-display text-3xl font-bold tracking-tight">Website settings</h1>
    <p className="mt-2 text-sm text-muted-foreground">
      Public identity of the website, stored in the application settings.
    </p>
    <AdminNav className="mt-6" />
    <p className="mt-5 text-sm text-muted-foreground">
      Approved business and consultation hours: {site.hours}. The booking policy uses the same
      hours.
    </p>
    <div className="mt-8">
      <SettingsForm group="website" />
    </div>
  </div>
);
