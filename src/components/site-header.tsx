"use client";

import { Link } from "@/lib/navigation";
import { ChevronDown, Megaphone, Menu } from "lucide-react";
import { useState } from "react";
import { CurrencySelector } from "@/components/currency-selector";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  joinUsLinks,
  marketingLinks,
  moreLinks,
  headerNavLinks as navLinks,
  showAuthButtons,
} from "@/data/site";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session, loading } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="AA100XTech home" className="flex items-center">
          <span className="brand-logo-wrap">
            <span aria-hidden className="brand-logo-wrap-glow" />

            <img
              src="/logo.png"
              alt="Absolute Advancement 100X Tech logo"
              className="brand-logo h-8 w-auto md:h-10"
              width={1024}
              height={286}
            />
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((l) =>
            "href" in l && l.href ? (
              <a
                key={l.to}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-foreground bg-secondary" }}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ),
          )}

          <HeaderDropdown label="Join Us" links={joinUsLinks} />
          <HeaderDropdown label="Marketing" links={marketingLinks} />
        </nav>

        <div className="flex items-center gap-2">
          <CurrencySelector className="hidden xl:inline-flex" />
          {showAuthButtons &&
            !loading &&
            (session ? (
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/dashboard">My account</Link>
              </Button>
            ) : (
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/auth">Sign in / Sign up</Link>
              </Button>
            ))}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto">
              <SheetTitle className="font-display">Menu</SheetTitle>
              <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-1">
                {navLinks.map((l) =>
                  "href" in l && l.href ? (
                    <a
                      key={l.to}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: l.to === "/" }}
                      activeProps={{ className: "bg-secondary text-foreground" }}
                      className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  ),
                )}
                <HeaderDropdown
                  label="Join Us"
                  links={joinUsLinks}
                  mobile
                  onNavigate={() => setOpen(false)}
                />
                <HeaderDropdown
                  label="Marketing"
                  links={marketingLinks}
                  mobile
                  onNavigate={() => setOpen(false)}
                />
                <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  More
                </p>
                {moreLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    activeProps={{ className: "bg-secondary text-foreground" }}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
                <CurrencySelector className="mt-4 w-full justify-start" />
                {showAuthButtons && !loading && (
                  <Button asChild className="mt-2">
                    <Link to={session ? "/dashboard" : "/auth"} onClick={() => setOpen(false)}>
                      {session ? "My account" : "Sign in / Sign up"}
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

type HeaderDropdownProps = {
  label: string;
  links: readonly ((typeof joinUsLinks)[number] | (typeof marketingLinks)[number])[];
  mobile?: boolean;
  onNavigate?: () => void;
};

function HeaderDropdown({ label, links, mobile, onNavigate }: HeaderDropdownProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1 rounded-lg py-3 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-foreground [&[data-state=open]>svg]:rotate-180 ${mobile ? "w-full justify-between px-3 text-base" : "px-2.5 py-2 text-sm"}`}
        >
          {label}
          <ChevronDown aria-hidden className="size-3.5 transition-transform" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={mobile ? "start" : "end"}
        className="w-64 rounded-xl border-border/60 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
      >
        {links.map(({ label: itemLabel, ...target }) => (
          <DropdownMenuItem
            key={itemLabel}
            asChild
            className="rounded-lg px-3 py-3 font-medium text-muted-foreground focus:bg-secondary focus:text-foreground"
          >
            <Link {...target} onClick={onNavigate}>
              {label === "Marketing" && (
                <Megaphone aria-hidden className="size-4 shrink-0 text-primary" />
              )}
              {itemLabel}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
