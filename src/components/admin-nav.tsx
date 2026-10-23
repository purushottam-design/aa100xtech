import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PANEL_LABEL, PANEL_PATH } from "@/lib/admin-panels";
import { modulesForAccess } from "@/lib/permissions";
import { useMyAccess } from "@/components/admin-management";

type NavItem = { label: string; to: string; permission?: string; superOnly?: boolean };

const SYSTEM_ITEMS: NavItem[] = [
  { label: "Overview", to: "/admin" , superOnly: true },
  { label: "Super console", to: "/admin/super", superOnly: true },
  { label: "Admins", to: "/admin/admins", permission: "admins.view" },
  { label: "Security", to: "/admin/security", permission: "security.activity" },
  { label: "Website settings", to: "/admin/settings/website", permission: "settings.website", superOnly: true },
  { label: "General settings", to: "/admin/settings/general", permission: "settings.general", superOnly: true },
  { label: "Email settings", to: "/admin/settings/email", permission: "settings.email", superOnly: true },
  { label: "My dashboards", to: "/admin/select" },
  { label: "Account", to: "/dashboard" },
];



/**
 * Dynamic admin navigation: only the panels and modules the signed-in account
 * is allowed to open are rendered. The server re-checks every request.
 */
export function AdminNav({ className }: { className?: string }) {
  const access = useMyAccess();
  const isSuper = access.data?.isSuper ?? false;
  const permissions = access.data?.permissions ?? [];
  const panels = access.data?.panels ?? [];
  const roles = access.data?.roles ?? [];

  const allowed = SYSTEM_ITEMS.filter((item) => {
    if (item.superOnly && !isSuper) return false;
    if (item.permission && !isSuper && !permissions.includes(item.permission)) return false;
    return true;
  });

  // Modules the account's real roles own, filtered by its granted permissions.
  const modules = isSuper ? [] : modulesForAccess(roles, permissions, false);

  return (
    <nav className={cn("flex flex-wrap gap-2", className)} aria-label="Admin navigation">
      {panels
        .filter((p) => p !== "super")
        .map((p) => (
          <Button key={p} asChild size="sm" variant="outline">
            <Link to={PANEL_PATH[p] as never}>{PANEL_LABEL[p]}</Link>
          </Button>
        ))}
      {modules
        .filter((m) => !panels.some((p) => PANEL_PATH[p] === m.route))
        .map((m) => (
          <Button key={`${m.label}-${m.route}`} asChild size="sm" variant="outline">
            <Link to={m.route as never}>{m.label}</Link>
          </Button>
        ))}

      {allowed.map((item) => (
        <Button key={item.to} asChild size="sm" variant="outline">
          <Link to={item.to as never}>{item.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
