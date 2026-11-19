"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CircleHelp,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
  UserRound,
  Settings,
  UsersRound,
  House,
  Gamepad2,
  ShieldCheck,
  Megaphone,
  Layers,
  Package,
  Truck,
  Sparkles,
  ChartNoAxesCombined,
  ContactRound,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import {
  base,
  canOpen,
  moduleTitles,
  workspaceHome,
  type AccessState,
} from "@/lib/partner-workspace/domain";
import { workspaceApi, WorkspaceError } from "@/lib/partner-workspace/api";
import { loginHref } from "@/lib/auth-navigation";

const WorkspaceContext = createContext<AccessState | null>(null);
export function useWorkspace() {
  const access = useContext(WorkspaceContext);
  if (!access) throw new Error("Workspace membership required");
  return access;
}
export function WorkspaceEntry() {
  const access = useWorkspace(),
    router = useRouter();
  useEffect(() => router.replace(workspaceHome(access)), [access, router]);
  return <p role="status">Opening your workspace…</p>;
}
const navigation = [
  ["overview", House],
  ["creators", ContactRound],
  ["lead-dashboard", UsersRound],
  ["gamer-leads", Gamepad2],
  ["imtm", UsersRound],
  ["deal-approvals", ShieldCheck],
  ["campaigns", Megaphone],
  ["projects", Layers],
  ["inventory", Package],
  ["shipments", Truck],
  ["matchmaker", Sparkles],
  ["reports", ChartNoAxesCombined],
] as const;
const secondary = [
  "admin",
  "companies",
  "products",
  "allocations",
  "follow-ups",
  "lead-overview",
  "lead-team",
  "team-accounts",
  "influencer-logins",
  "ownership",
  "duplicates",
  "submissions",
  "contact",
  "permissions",
  "activity",
  "import",
];
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AccessState | null>(null);
  const [failure, setFailure] = useState<{ message: string; code: string } | null>(null);
  const [attempt, setAttempt] = useState(0),
    [collapsed, setCollapsed] = useState(false),
    [mobile, setMobile] = useState(false);
  const pathname = usePathname(),
    router = useRouter();
  useEffect(() => {
    let active = true,
      generation = 0;
    const controller = new AbortController();
    async function check() {
      const current = ++generation;
      setAccess(null);
      setFailure(null);
      try {
        const result = await workspaceApi<AccessState>("access-state", {}, controller.signal);
        if (active && current === generation) setAccess(result);
      } catch (error) {
        if (!active || current !== generation) return;
        if (error instanceof WorkspaceError && error.status === 401) {
          router.replace(loginHref(pathname));
          return;
        }
        setFailure({
          message:
            error instanceof Error ? error.message : "Unable to reach the workspace. Please retry.",
          code: error instanceof WorkspaceError ? error.code : "NETWORK_UNAVAILABLE",
        });
      }
    }
    void check();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "INITIAL_SESSION") {
        ++generation;
        setAccess(null);
        queueMicrotask(() => {
          if (active) void check();
        });
      }
    });
    return () => {
      active = false;
      controller.abort();
      data.subscription.unsubscribe();
    };
  }, [attempt, pathname, router]);
  useEffect(() => setMobile(false), [pathname]);
  const module = pathname.split("/")[2] ?? "";
  if (!access || access.state !== "approved")
    return (
      <div className="pw pw-access">
        <Link href="/" aria-label="AA100XTech home">
          <img src="/logo.png" width="216" height="60" alt="Absolute Advancement 100X Tech" />
        </Link>
        <div className="pw-access-card">
          <span className="pw-brand-icon">
            <ShieldCheck size={30} />
          </span>
          <span className="pw-eyebrow">CREATOR MOVES 365</span>
          <h1>
            {failure
              ? "Workspace temporarily unavailable"
              : access
                ? {
                    pending: "Your membership is pending",
                    disabled: "Workspace access is disabled",
                    missing: "Partners membership required",
                    approved: "Partner Workspace",
                  }[access.state]
                : "Opening Partner Workspace"}
          </h1>
          <p>
            {failure?.message ??
              (access
                ? "An authorized Partners Admin must approve an active membership linked to your existing AA100XTech account. Contact your workspace administrator for access."
                : "Checking your AA100XTech session and authorized Partners membership…")}
          </p>
          {failure && (
            <>
              <p className="pw-code">{failure.code}</p>
              <button className="pw-button" onClick={() => setAttempt((a) => a + 1)}>
                Retry connection
              </button>
            </>
          )}
          {!failure && !access && (
            <div className="pw-loading" role="status" aria-label="Checking workspace access" />
          )}
          <Link className="pw-text-link" href={loginHref(pathname)}>
            AA100XTech login <ChevronRight size={16} />
          </Link>
          <Link className="pw-text-link" href="/contact">
            Contact support <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  const roleLabel =
    access.role === "admin"
      ? "Partners Admin"
      : access.role === "imtm"
        ? "IMTM"
        : access.role === "lead_team"
          ? `${access.domain === "gamer" ? "Gamer" : "Influencer"} Lead Team`
          : "Creator";
  const sidebar = (
    <>
      <div className="pw-sidebar-brand">
        <UsersRound size={34} />
        <div>
          <strong>Partner Workspace</strong>
          <span>Creator Moves 365</span>
        </div>
      </div>
      <nav aria-label="Workspace navigation">
        {navigation
          .filter(([key]) => canOpen(access, key))
          .map(([key, Icon]) => (
            <Link
              key={key}
              title={moduleTitles[key]}
              aria-current={module === key ? "page" : undefined}
              className={module === key ? "active" : ""}
              href={`${base}/${key}`}
            >
              <Icon size={21} />
              <span>{moduleTitles[key]}</span>
              {["creators", "lead-dashboard", "gamer-leads", "imtm"].includes(key) && (
                <ChevronRight size={15} className="pw-nav-chevron" />
              )}
            </Link>
          ))}
        {[
          "my-influencers",
          "my-leads",
          "lead-add",
          "lead-import",
          "follow-ups",
          "creator",
          "my-collaborations",
          "my-notifications",
          "my-shipments",
        ]
          .filter((k) => canOpen(access, k) && access.role !== "admin")
          .map((k) => (
            <Link
              key={k}
              aria-current={module === k ? "page" : undefined}
              className={module === k ? "active" : ""}
              href={`${base}/${k}`}
            >
              <ContactRound size={21} />
              <span>{moduleTitles[k]}</span>
            </Link>
          ))}
        {access.role === "admin" && (
          <details className="pw-admin-menu">
            <summary>
              <Layers size={21} />
              <span>Admin Hub</span>
              <ChevronDown size={15} />
            </summary>
            {secondary.map((k) => (
              <Link
                key={k}
                href={`${base}/${k}`}
                aria-current={module === k ? "page" : undefined}
                className={module === k ? "active" : ""}
              >
                {moduleTitles[k]}
              </Link>
            ))}
          </details>
        )}
        <div className="pw-sidebar-bottom">
          {canOpen(access, "settings") && (
            <Link href={`${base}/settings`} className={module === "settings" ? "active" : ""}>
              <Settings size={21} />
              <span>Settings</span>
            </Link>
          )}
          <Link href={`${base}/me`}>
            <UserRound size={21} />
            <span>My profile</span>
          </Link>
        </div>
      </nav>
      <button
        className="pw-collapse"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen size={20} />
        ) : (
          <>
            <PanelLeftClose size={20} />
            <span>Collapse sidebar</span>
          </>
        )}
      </button>
    </>
  );
  const account = (
    <div className="pw-header-account">
      <Link
        className="pw-icon-button"
        href={`${base}/${access.role === "admin" || access.role === "imtm" ? "follow-ups" : "me"}`}
        aria-label="Follow-ups and reminders"
      >
        <Bell size={21} />
      </Link>
      <Link className="pw-icon-button" href="/contact" aria-label="Help and support">
        <CircleHelp size={22} />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger className="pw-profile-trigger">
          <span className="pw-avatar">{access.user.name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{access.user.name}</strong>
            <small>{roleLabel}</small>
          </span>
          <ChevronDown size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`${base}/me`}>My profile</Link>
          </DropdownMenuItem>
          {canOpen(access, "settings") && (
            <DropdownMenuItem asChild>
              <Link href={`${base}/settings`}>Workspace settings</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={async () => {
              const result = await supabase.auth.signOut();
              if (result.error)
                setFailure({ message: "Sign out failed. Please retry.", code: "SIGN_OUT_FAILED" });
              else {
                setAccess(null);
                router.replace(loginHref(base));
              }
            }}
          >
            <LogOut size={16} /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  return (
    <WorkspaceContext.Provider value={access}>
      <div className={`pw ${collapsed ? "pw-collapsed" : ""}`}>
        <SiteHeader accountSlot={account} />
        <div className="pw-frame">
          <aside className="pw-sidebar">{sidebar}</aside>
          <Sheet open={mobile} onOpenChange={setMobile}>
            <SheetContent side="left" className="pw pw-mobile-sidebar">
              <SheetTitle className="sr-only">Partner Workspace navigation</SheetTitle>
              {sidebar}
            </SheetContent>
          </Sheet>
          <section
            className="pw-main"
            key={`${access.user.id}:${access.role}:${access.domain}:${pathname}`}
          >
            <div className="pw-breadcrumb">
              <button
                className="pw-icon-button pw-mobile-toggle"
                aria-label="Open workspace navigation"
                onClick={() => setMobile(true)}
              >
                <Menu size={22} />
              </button>
              <Link href={workspaceHome(access)} aria-label="Workspace home">
                <House size={17} />
              </Link>
              <ChevronRight size={12} />
              <Link href={workspaceHome(access)}>Partner Workspace</Link>
              <span>/</span>
              <span>{moduleTitles[module] ?? "Welcome"}</span>
            </div>
            {failure && (
              <div role="alert" className="pw-error">
                {failure.message}
                <button onClick={() => setFailure(null)} aria-label="Dismiss error">
                  <X size={16} />
                </button>
              </div>
            )}
            {module && !canOpen(access, module) ? (
              <div className="pw-card pw-restricted">
                <ShieldCheck size={36} />
                <h1>Access restricted</h1>
                <p>This feature is not available for your approved Partners role.</p>
                <Link className="pw-button" href={workspaceHome(access)}>
                  Return to my workspace
                </Link>
              </div>
            ) : (
              children
            )}
          </section>
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
