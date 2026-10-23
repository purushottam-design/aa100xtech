/**
 * Client-safe registry of every data module the Super Admin console can manage.
 * The server re-validates every table / column against this same registry, so the
 * console can never touch a table that is not listed here.
 */

export type ModuleColumn = { key: string; label: string };

export type ModuleDef = {
  key: string;
  label: string;
  table: string;
  columns: ModuleColumn[];
  searchColumns: string[];
  orderBy: string;
  statusColumn?: string;
  statusOptions?: string[];
  extraStatus?: { column: string; label: string; options: string[] };
  deletable: boolean;
};

export type ModuleGroup = { label: string; modules: ModuleDef[] };

const ts = { key: "created_at", label: "Created" };

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    label: "Business",
    modules: [
      {
        key: "access-requests",
        label: "Access requests",
        table: "access_requests",
        columns: [
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "requested_role", label: "Role" },
          { key: "company", label: "Company" },
          { key: "status", label: "Status" },
          ts,
        ],
        searchColumns: ["full_name", "email", "company"],
        orderBy: "created_at",
        statusColumn: "status",
        statusOptions: ["pending", "approved", "rejected"],
        deletable: true,
      },
      {
        key: "bookings",
        label: "Consultation bookings",
        table: "consultation_bookings",
        columns: [
          { key: "booking_id", label: "Booking" },
          { key: "customer_name", label: "Customer" },
          { key: "email", label: "Email" },
          { key: "service", label: "Service" },
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "payment_status", label: "Payment" },
          { key: "booking_status", label: "Status" },
          { key: "preferred_date", label: "Date" },
          ts,
        ],
        searchColumns: ["booking_id", "customer_name", "email", "service"],
        orderBy: "created_at",
        statusColumn: "booking_status",
        statusOptions: ["pending", "confirmed", "completed", "cancelled"],
        extraStatus: {
          column: "payment_status",
          label: "Payment status",
          options: ["pending", "paid", "failed", "refunded"],
        },
        deletable: true,
      },
      {
        key: "candidates",
        label: "Candidate submissions",
        table: "candidate_submissions",
        columns: [
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "role_applied", label: "Role" },
          { key: "availability", label: "Availability" },
          { key: "portfolio_url", label: "Portfolio" },
          ts,
        ],
        searchColumns: ["full_name", "email", "role_applied"],
        orderBy: "created_at",
        deletable: true,
      },
      {
        key: "partner-applications",
        label: "Partner applications",
        table: "partner_applications",
        columns: [
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "country", label: "Country" },
          { key: "plan_name", label: "Plan" },
          { key: "followers", label: "Followers" },
          { key: "status", label: "Status" },
          ts,
        ],
        searchColumns: ["full_name", "email", "plan_name"],
        orderBy: "created_at",
        statusColumn: "status",
        statusOptions: ["pending", "approved", "rejected"],
        deletable: true,
      },
    ],
  },
  {
    label: "Affiliates",
    modules: [
      {
        key: "affiliates",
        label: "Affiliates",
        table: "affiliates",
        columns: [
          { key: "affiliate_code", label: "Code" },
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "tier", label: "Tier" },
          { key: "status", label: "Status" },
          ts,
        ],
        searchColumns: ["affiliate_code", "full_name", "email"],
        orderBy: "created_at",
        statusColumn: "status",
        statusOptions: ["pending", "approved", "rejected", "suspended"],
        deletable: false,
      },
      {
        key: "catalog",
        label: "Catalog items",
        table: "catalog_items",
        columns: [
          { key: "name", label: "Name" },
          { key: "type", label: "Type" },
          { key: "category", label: "Category" },
          { key: "default_commission_type", label: "Commission" },
          { key: "default_commission_value", label: "Value" },
          { key: "active", label: "Active" },
          ts,
        ],
        searchColumns: ["name", "slug", "category"],
        orderBy: "created_at",
        deletable: false,
      },
      {
        key: "conversions",
        label: "Conversions",
        table: "conversions",
        columns: [
          { key: "order_id", label: "Order" },
          { key: "event_type", label: "Event" },
          { key: "order_value", label: "Order value" },
          { key: "commission_earned", label: "Commission" },
          { key: "currency", label: "Currency" },
          { key: "status", label: "Status" },
          ts,
        ],
        searchColumns: ["order_id", "event_type"],
        orderBy: "created_at",
        statusColumn: "status",
        statusOptions: ["pending", "approved", "rejected", "paid"],
        deletable: false,
      },
      {
        key: "payouts",
        label: "Payouts",
        table: "payouts",
        columns: [
          { key: "amount", label: "Amount" },
          { key: "currency", label: "Currency" },
          { key: "method", label: "Method" },
          { key: "reference", label: "Reference" },
          { key: "status", label: "Status" },
          { key: "requested_at", label: "Requested" },
        ],
        searchColumns: ["reference", "method"],
        orderBy: "created_at",
        statusColumn: "status",
        statusOptions: ["requested", "processing", "paid", "rejected"],
        deletable: false,
      },
      {
        key: "coupons",
        label: "Coupon codes",
        table: "coupon_codes",
        columns: [
          { key: "code", label: "Code" },
          { key: "discount_type", label: "Type" },
          { key: "discount_value", label: "Value" },
          { key: "active", label: "Active" },
          ts,
        ],
        searchColumns: ["code"],
        orderBy: "created_at",
        deletable: false,
      },
      {
        key: "referral-links",
        label: "Referral links",
        table: "referral_links",
        columns: [
          { key: "unique_slug", label: "Slug" },
          { key: "active", label: "Active" },
          ts,
        ],
        searchColumns: ["unique_slug"],
        orderBy: "created_at",
        deletable: false,
      },
      {
        key: "clicks",
        label: "Clicks",
        table: "affiliate_clicks",
        columns: [
          { key: "source", label: "Source" },
          { key: "device", label: "Device" },
          { key: "is_duplicate", label: "Duplicate" },
          ts,
        ],
        searchColumns: ["source", "device"],
        orderBy: "created_at",
        deletable: false,
      },
    ],
  },
  {
    label: "Security",
    modules: [
      {
        key: "activity",
        label: "Activity log",
        table: "admin_activity_log",
        columns: [
          { key: "actor_email", label: "Admin" },
          { key: "action", label: "Action" },
          { key: "module", label: "Module" },
          { key: "description", label: "Description" },
          { key: "ip_address", label: "IP" },
          ts,
        ],
        searchColumns: ["actor_email", "action", "module"],
        orderBy: "created_at",
        deletable: false,
      },
      {
        key: "logins",
        label: "Login history",
        table: "admin_login_history",
        columns: [
          { key: "email", label: "Email" },
          { key: "status", label: "Status" },
          { key: "ip_address", label: "IP" },
          { key: "user_agent", label: "Device" },
          { key: "logged_in_at", label: "Signed in" },
        ],
        searchColumns: ["email", "status"],
        orderBy: "logged_in_at",
        deletable: false,
      },
      {
        key: "role-grants",
        label: "Role grants",
        table: "user_roles",
        columns: [
          { key: "user_id", label: "User" },
          { key: "role", label: "Role" },
          ts,
        ],
        searchColumns: ["role"],
        orderBy: "created_at",
        deletable: false,
      },
    ],
  },
];

export const ALL_MODULES: ModuleDef[] = MODULE_GROUPS.flatMap((g) => g.modules);

export function findModule(key: string): ModuleDef | undefined {
  return ALL_MODULES.find((m) => m.key === key);
}
