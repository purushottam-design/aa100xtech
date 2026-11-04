/**
 * Client-safe permission catalogue for the admin system.
 * Permissions are granular ("module.action") and are ALWAYS re-checked on the
 * server — the UI only uses them to hide what the account may not use.
 */
export const PERMISSION_GROUPS = [
  {
    module: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", label: "View dashboard" }],
  },
  {
    module: "users",
    label: "Users & members",
    permissions: [
      { key: "users.view", label: "View" },
      { key: "users.create", label: "Create" },
      { key: "users.edit", label: "Edit" },
      { key: "users.delete", label: "Delete" },
      { key: "users.export", label: "Export" },
    ],
  },
  {
    module: "customers",
    label: "Customers",
    permissions: [
      { key: "customers.view", label: "View" },
      { key: "customers.edit", label: "Edit" },
      { key: "customers.export", label: "Export" },
    ],
  },
  {
    module: "admins",
    label: "Admin management",
    permissions: [
      { key: "admins.view", label: "View" },
      { key: "admins.create", label: "Create" },
      { key: "admins.edit", label: "Edit" },
      { key: "admins.delete", label: "Delete" },
      { key: "admins.permissions", label: "Manage permissions" },
      { key: "admins.impersonate", label: "View as admin" },
    ],
  },
  {
    module: "roles",
    label: "Roles",
    permissions: [
      { key: "roles.view", label: "View" },
      { key: "roles.create", label: "Create" },
      { key: "roles.edit", label: "Edit" },
      { key: "roles.delete", label: "Delete" },
    ],
  },
  {
    module: "requests",
    label: "Access requests",
    permissions: [
      { key: "requests.view", label: "View" },
      { key: "requests.review", label: "Approve / reject" },
    ],
  },
  {
    module: "candidates",
    label: "Candidates & interviews",
    permissions: [
      { key: "candidates.view", label: "View" },
      { key: "candidates.edit", label: "Edit" },
    ],
  },
  {
    module: "partners",
    label: "Partners & affiliates",
    permissions: [
      { key: "partners.view", label: "View" },
      { key: "partners.review", label: "Approve / reject" },
      { key: "affiliates.view", label: "View affiliates" },
    ],
  },
  {
    module: "products",
    label: "Products & courses",
    permissions: [
      { key: "products.view", label: "View" },
      { key: "products.create", label: "Create" },
      { key: "products.edit", label: "Edit" },
      { key: "products.delete", label: "Delete" },
      { key: "products.publish", label: "Publish" },
    ],
  },
  {
    module: "categories",
    label: "Categories",
    permissions: [
      { key: "categories.view", label: "View" },
      { key: "categories.manage", label: "Manage" },
    ],
  },
  {
    module: "orders",
    label: "Orders",
    permissions: [
      { key: "orders.view", label: "View" },
      { key: "orders.edit", label: "Edit" },
      { key: "orders.approve", label: "Approve" },
      { key: "orders.export", label: "Export" },
    ],
  },
  {
    module: "bookings",
    label: "Bookings",
    permissions: [
      { key: "bookings.view", label: "View" },
      { key: "bookings.edit", label: "Edit" },
    ],
  },
  {
    module: "payments",
    label: "Payments & transactions",
    permissions: [
      { key: "payments.view", label: "View" },
      { key: "payments.refund", label: "Refund" },
      { key: "payments.export", label: "Export" },
    ],
  },
  {
    module: "leads",
    label: "Leads",
    permissions: [
      { key: "leads.view", label: "View" },
      { key: "leads.create", label: "Create" },
      { key: "leads.edit", label: "Edit" },
      { key: "leads.delete", label: "Delete" },
      { key: "leads.export", label: "Export" },
    ],
  },
  {
    module: "marketing",
    label: "Marketing & campaigns",
    permissions: [{ key: "marketing.manage", label: "Manage" }],
  },
  {
    module: "support",
    label: "Support tickets",
    permissions: [
      { key: "support.view", label: "View tickets" },
      { key: "support.reply", label: "Reply & update" },
    ],
  },
  {
    module: "notifications",
    label: "Notifications",
    permissions: [
      { key: "notifications.view", label: "View" },
      { key: "notifications.send", label: "Create & send" },
    ],
  },
  {
    module: "content",
    label: "Content & banners",
    permissions: [
      { key: "content.view", label: "View" },
      { key: "content.edit", label: "Create & edit" },
      { key: "content.publish", label: "Publish" },
    ],
  },
  {
    module: "faqs",
    label: "FAQs",
    permissions: [
      { key: "faqs.view", label: "View" },
      { key: "faqs.manage", label: "Manage" },
    ],
  },
  {
    module: "reviews",
    label: "Reviews",
    permissions: [
      { key: "reviews.view", label: "View" },
      { key: "reviews.approve", label: "Approve / reject" },
      { key: "reviews.delete", label: "Delete" },
    ],
  },
  {
    module: "reports",
    label: "Reports & analytics",
    permissions: [
      { key: "reports.view", label: "View" },
      { key: "reports.export", label: "Export" },
    ],
  },
  {
    module: "app",
    label: "App management",
    permissions: [
      { key: "app.view", label: "View" },
      { key: "app.manage", label: "Manage" },
    ],
  },
  {
    module: "website",
    label: "Website management",
    permissions: [
      { key: "website.view", label: "View" },
      { key: "website.manage", label: "Manage" },
    ],
  },
  {
    module: "security",
    label: "Security",
    permissions: [
      { key: "security.activity", label: "Admin activity log" },
      { key: "security.logins", label: "Login history" },
      { key: "security.sessions", label: "Active sessions" },
      { key: "security.permissions", label: "Manage permissions" },
    ],
  },
  {
    module: "settings",
    label: "Settings",
    permissions: [
      { key: "settings.view", label: "View" },
      { key: "settings.edit", label: "Edit" },
      { key: "settings.website", label: "Website settings" },
      { key: "settings.general", label: "General settings" },
      { key: "settings.email", label: "Email settings" },
    ],
  },
] as const;

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

export const PERMISSION_LABEL: Record<string, string> = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, `${g.label}: ${p.label}`])),
);

/**
 * Every permission is wired to the real page it unlocks. The route is the
 * same path used by the router; the server re-checks the permission on each
 * request, the mapping only drives navigation and the permission editor.
 */
export const PERMISSION_ROUTES: Record<string, string> = {
  "dashboard.view": "/admin/select",
  "users.view": "/admin/company",
  "users.create": "/admin/company",
  "users.edit": "/admin/company",
  "users.delete": "/admin/company",
  "users.export": "/admin/company",
  "customers.view": "/admin/company",
  "customers.edit": "/admin/company",
  "customers.export": "/admin/company",
  "admins.view": "/admin/admins",
  "admins.create": "/admin/admins",
  "admins.edit": "/admin/admins",
  "admins.delete": "/admin/admins",
  "admins.permissions": "/admin/admins",
  "admins.impersonate": "/admin/admins",
  "roles.view": "/admin/roles",
  "roles.create": "/admin/roles",
  "roles.edit": "/admin/roles",
  "roles.delete": "/admin/roles",
  "requests.view": "/admin/company",
  "requests.review": "/admin/company",
  "candidates.view": "/admin/interview",
  "candidates.edit": "/admin/interview",
  "partners.view": "/admin/marketing",
  "partners.review": "/admin/marketing",
  "affiliates.view": "/admin/marketing",
  "products.view": "/admin/super",
  "products.create": "/admin/super",
  "products.edit": "/admin/super",
  "products.delete": "/admin/super",
  "products.publish": "/admin/super",
  "categories.view": "/admin/super",
  "categories.manage": "/admin/super",
  "orders.view": "/admin/super",
  "orders.edit": "/admin/super",
  "orders.approve": "/admin/super",
  "orders.export": "/admin/super",
  "bookings.view": "/admin/business",
  "bookings.edit": "/admin/business",
  "payments.view": "/admin/super",
  "payments.refund": "/admin/super",
  "payments.export": "/admin/super",
  "leads.view": "/admin/super",
  "leads.create": "/admin/super",
  "leads.edit": "/admin/super",
  "leads.delete": "/admin/super",
  "leads.export": "/admin/super",
  "marketing.manage": "/admin/marketing",
  "support.view": "/admin/super",
  "support.reply": "/admin/super",
  "notifications.view": "/admin/super",
  "notifications.send": "/admin/super",
  "content.view": "/admin/super",
  "content.edit": "/admin/super",
  "content.publish": "/admin/super",
  "faqs.view": "/admin/super",
  "faqs.manage": "/admin/super",
  "reviews.view": "/admin/super",
  "reviews.approve": "/admin/super",
  "reviews.delete": "/admin/super",
  "reports.view": "/admin/select",
  "reports.export": "/admin/select",
  "app.view": "/admin/settings/general",
  "app.manage": "/admin/settings/general",
  "website.view": "/admin/settings/website",
  "website.manage": "/admin/settings/website",
  "security.activity": "/admin/security",
  "security.logins": "/admin/security",
  "security.sessions": "/admin/security",
  "security.permissions": "/admin/admins",
  "settings.view": "/admin/settings/general",
  "settings.edit": "/admin/settings/general",
  "settings.website": "/admin/settings/website",
  "settings.general": "/admin/settings/general",
  "settings.email": "/admin/settings/email",
};

export type AdminModule = {
  label: string;
  route: string;
  permission: string;
  superOnly?: boolean;
};

/**
 * Modules keyed by the permission that unlocks them. Custom roles built in the
 * Roles screen automatically inherit the right modules through this map, so no
 * code change is needed when a new role is created.
 */
export const MODULE_CATALOGUE: AdminModule[] = [
  { label: "Dashboard", route: "/admin/select", permission: "dashboard.view" },
  {
    label: "Users & members",
    route: "/admin/company",
    permission: "users.view",
  },
  { label: "Customers", route: "/admin/company", permission: "customers.view" },
  {
    label: "Access requests",
    route: "/admin/company",
    permission: "requests.view",
  },
  {
    label: "Candidates",
    route: "/admin/interview",
    permission: "candidates.view",
  },
  {
    label: "Partner applications",
    route: "/admin/marketing",
    permission: "partners.view",
  },
  {
    label: "Affiliates",
    route: "/admin/marketing",
    permission: "affiliates.view",
  },
  {
    label: "Products & courses",
    route: "/admin/super",
    permission: "products.view",
  },
  { label: "Categories", route: "/admin/super", permission: "categories.view" },
  { label: "Orders", route: "/admin/super", permission: "orders.view" },
  {
    label: "Consultation bookings",
    route: "/admin/business",
    permission: "bookings.view",
  },
  {
    label: "Payments & refunds",
    route: "/admin/super",
    permission: "payments.view",
  },
  { label: "Leads", route: "/admin/super", permission: "leads.view" },
  {
    label: "Support tickets",
    route: "/admin/super",
    permission: "support.view",
  },
  {
    label: "Notifications",
    route: "/admin/super",
    permission: "notifications.view",
  },
  {
    label: "Website requests",
    route: "/admin/requests",
    permission: "leads.view",
  },
  {
    label: "Content & banners",
    route: "/admin/super",
    permission: "content.view",
  },
  { label: "FAQs", route: "/admin/super", permission: "faqs.view" },
  { label: "Reviews", route: "/admin/super", permission: "reviews.view" },
  { label: "Reports", route: "/admin/select", permission: "reports.view" },
  {
    label: "Admins & permissions",
    route: "/admin/admins",
    permission: "admins.view",
  },
  { label: "Roles", route: "/admin/roles", permission: "roles.view" },
  {
    label: "Security",
    route: "/admin/security",
    permission: "security.activity",
  },
  {
    label: "Active sessions",
    route: "/admin/security",
    permission: "security.sessions",
  },
  {
    label: "Website settings",
    route: "/admin/settings/website",
    permission: "settings.website",
  },
  {
    label: "General settings",
    route: "/admin/settings/general",
    permission: "settings.general",
  },
  {
    label: "Email settings",
    route: "/admin/settings/email",
    permission: "settings.email",
  },
];

/**
 * The built-in admin roles of this business and the modules each one owns.
 * Custom roles resolve their modules from MODULE_CATALOGUE instead.
 */
export const ADMIN_ROLE_MODULES: Record<string, AdminModule[]> = {
  company_admin: [
    {
      label: "Company dashboard",
      route: "/admin/company",
      permission: "dashboard.view",
    },
    {
      label: "Users & members",
      route: "/admin/company",
      permission: "users.view",
    },
    {
      label: "Customers",
      route: "/admin/company",
      permission: "customers.view",
    },
    {
      label: "Access requests",
      route: "/admin/company",
      permission: "requests.view",
    },
    { label: "Reports", route: "/admin/select", permission: "reports.view" },
  ],
  interview_admin: [
    {
      label: "Interview dashboard",
      route: "/admin/interview",
      permission: "dashboard.view",
    },
    {
      label: "Candidates",
      route: "/admin/interview",
      permission: "candidates.view",
    },
    { label: "Reports", route: "/admin/select", permission: "reports.view" },
  ],
  marketing_admin: [
    {
      label: "Marketing dashboard",
      route: "/admin/marketing",
      permission: "dashboard.view",
    },
    {
      label: "Partner applications",
      route: "/admin/marketing",
      permission: "partners.view",
    },
    {
      label: "Affiliates",
      route: "/admin/marketing",
      permission: "affiliates.view",
    },
    { label: "Leads", route: "/admin/super", permission: "leads.view" },
    { label: "Reports", route: "/admin/select", permission: "reports.view" },
  ],
  business_admin: [
    {
      label: "Business dashboard",
      route: "/admin/business",
      permission: "dashboard.view",
    },
    {
      label: "Consultation bookings",
      route: "/admin/business",
      permission: "bookings.view",
    },
    { label: "Orders", route: "/admin/super", permission: "orders.view" },
    {
      label: "Payments & refunds",
      route: "/admin/super",
      permission: "payments.view",
    },
    { label: "Reports", route: "/admin/select", permission: "reports.view" },
  ],
  manager: [
    {
      label: "Support tickets",
      route: "/admin/super",
      permission: "support.view",
    },
    {
      label: "Notifications",
      route: "/admin/super",
      permission: "notifications.view",
    },
    {
      label: "Content & banners",
      route: "/admin/super",
      permission: "content.view",
    },
  ],
  supreme_admin: [
    {
      label: "Super console",
      route: "/admin/super",
      permission: "dashboard.view",
      superOnly: true,
    },
    {
      label: "Admins & permissions",
      route: "/admin/admins",
      permission: "admins.view",
    },
    { label: "Roles", route: "/admin/roles", permission: "roles.view" },
    {
      label: "Security",
      route: "/admin/security",
      permission: "security.activity",
    },
    {
      label: "Website settings",
      route: "/admin/settings/website",
      permission: "settings.website",
    },
    {
      label: "General settings",
      route: "/admin/settings/general",
      permission: "settings.general",
    },
    {
      label: "Email settings",
      route: "/admin/settings/email",
      permission: "settings.email",
    },
  ],
};

/** Default permission bundle proposed for each built-in admin role. */
export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  company_admin: [
    "dashboard.view",
    "users.view",
    "users.create",
    "users.edit",
    "users.export",
    "customers.view",
    "customers.edit",
    "requests.view",
    "requests.review",
    "reports.view",
    "reports.export",
    "settings.view",
  ],
  interview_admin: [
    "dashboard.view",
    "candidates.view",
    "candidates.edit",
    "reports.view",
    "reports.export",
  ],
  marketing_admin: [
    "dashboard.view",
    "partners.view",
    "partners.review",
    "affiliates.view",
    "leads.view",
    "leads.create",
    "leads.edit",
    "marketing.manage",
    "content.view",
    "reports.view",
    "reports.export",
  ],
  business_admin: [
    "dashboard.view",
    "bookings.view",
    "bookings.edit",
    "orders.view",
    "orders.edit",
    "payments.view",
    "payments.export",
    "reports.view",
    "reports.export",
  ],
  manager: [
    "dashboard.view",
    "support.view",
    "support.reply",
    "notifications.view",
    "content.view",
    "faqs.view",
    "reports.view",
  ],
};

/** Permissions only the super admin may ever hold. */
export const SUPER_ONLY_PERMISSIONS = [
  "settings.edit",
  "settings.website",
  "settings.general",
  "settings.email",
  "admins.delete",
  "admins.permissions",
  "admins.impersonate",
  "roles.create",
  "roles.edit",
  "roles.delete",
  "users.delete",
  "security.permissions",
  "security.sessions",
];

export const ADMIN_STATUSES = ["active", "inactive", "suspended", "pending", "locked"] as const;
export type AdminStatus = (typeof ADMIN_STATUSES)[number];

export function can(permissions: string[], permission: string, isSuper = false): boolean {
  return isSuper || permissions.includes(permission);
}

/** Modules a signed-in admin can actually open, given roles + permissions. */
export function modulesForAccess(
  roles: string[],
  permissions: string[],
  isSuper = false,
): AdminModule[] {
  const known = new Set(Object.keys(ADMIN_ROLE_MODULES));
  const hasCustomRole = roles.some((r) => !known.has(r));
  const source = isSuper
    ? Object.values(ADMIN_ROLE_MODULES).flat()
    : [
        ...roles.flatMap((r) => ADMIN_ROLE_MODULES[r] ?? []),
        // Custom roles get every module their permissions unlock.
        ...(hasCustomRole ? MODULE_CATALOGUE : []),
      ];
  const seen = new Set<string>();
  return source.filter((m) => {
    if (m.superOnly && !isSuper) return false;
    if (!can(permissions, m.permission, isSuper)) return false;
    const id = `${m.label}|${m.route}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
