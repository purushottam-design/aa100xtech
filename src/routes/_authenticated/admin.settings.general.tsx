import { AdminNav } from "@/components/admin-nav";
import { SettingsForm } from "@/components/settings-form";

const title = "General settings — AA100XTech admin";
const description =
  "Control how AA100XTech behaves: default currency, timezone, sign-ups, bookings, careers and the affiliate program.";

export default () => (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">General settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Application behaviour: currency, timezone and which modules are open to the public.
      </p>
      <AdminNav className="mt-6" />
      <div className="mt-8">
        <SettingsForm group="general" />
      </div>
    </div>
  );
