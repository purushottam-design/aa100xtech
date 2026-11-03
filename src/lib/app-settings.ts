/**
 * Client-safe description of the application settings stored in `app_settings`.
 * The server validates every submitted key against this same definition.
 */
export type SettingField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "email" | "number" | "boolean";
  help?: string;
};

export type SettingGroup = {
  key: "website" | "general" | "email";
  label: string;
  description: string;
  permission: string;
  route: string;
  fields: SettingField[];
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    key: "website",
    label: "Website settings",
    description: "Public identity of the website: names, contact details and site-wide notices.",
    permission: "settings.website",
    route: "/admin/settings/website",
    fields: [
      { key: "siteName", label: "Site name", type: "text" },
      { key: "legalName", label: "Legal entity name", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "domain", label: "Primary domain", type: "text" },
      { key: "supportEmail", label: "Support email", type: "email" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Registered address", type: "textarea" },
      { key: "gstin", label: "GSTIN", type: "text" },
      {
        key: "announcement",
        label: "Site announcement",
        type: "textarea",
        help: "Shown as a banner when filled in.",
      },
      {
        key: "maintenanceMode",
        label: "Maintenance mode",
        type: "boolean",
        help: "Warns visitors that the site is being updated.",
      },
    ],
  },
  {
    key: "general",
    label: "General settings",
    description: "How the application behaves: currency, timezone and which modules are open.",
    permission: "settings.general",
    route: "/admin/settings/general",
    fields: [
      { key: "defaultCurrency", label: "Default currency", type: "text" },
      { key: "timezone", label: "Timezone", type: "text" },
      { key: "allowSignups", label: "Allow new sign-ups", type: "boolean" },
      { key: "requireApproval", label: "Require super admin approval", type: "boolean" },
      { key: "bookingsEnabled", label: "Consultation bookings enabled", type: "boolean" },
      { key: "affiliateProgramEnabled", label: "Affiliate program enabled", type: "boolean" },
      { key: "careersEnabled", label: "Careers applications enabled", type: "boolean" },
      { key: "minPayoutThreshold", label: "Minimum affiliate payout", type: "number" },
    ],
  },
  {
    key: "email",
    label: "Email settings",
    description: "Sender identity and which events trigger an internal notification.",
    permission: "settings.email",
    route: "/admin/settings/email",
    fields: [
      { key: "fromName", label: "From name", type: "text" },
      { key: "fromEmail", label: "From email", type: "email" },
      { key: "replyTo", label: "Reply-to email", type: "email" },
      { key: "notifyBookings", label: "Notify on new bookings", type: "boolean" },
      { key: "notifyAccessRequests", label: "Notify on access requests", type: "boolean" },
      {
        key: "notifyPartnerApplications",
        label: "Notify on partner applications",
        type: "boolean",
      },
      { key: "notifyCandidates", label: "Notify on candidate submissions", type: "boolean" },
      { key: "signature", label: "Email signature", type: "textarea" },
    ],
  },
];

export const SETTING_GROUP_KEYS = SETTING_GROUPS.map((g) => g.key);

export function findSettingGroup(key: string): SettingGroup | undefined {
  return SETTING_GROUPS.find((g) => g.key === key);
}
