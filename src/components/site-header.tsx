"use client";

import { Link } from "@/lib/navigation";
import { ArrowUpRight, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CurrencySelector } from "@/components/currency-selector";
import { ServicesMegaMenu } from "@/components/services-mega-menu";
import { MobileServicesMenu } from "@/components/mobile-services-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { moreLinks, headerNavLinks, showAuthButtons } from "@/data/site";
import { serviceNavigation } from "@/data/service-navigation";
import { useSession } from "@/hooks/use-session";

const about = moreLinks.find((link) => link.to === "/about")!;
const desktopLinks = [...headerNavLinks.filter((link) => link.to !== "/consultation"), about];
const mobileLinks = [...headerNavLinks, about];
const servicePaths = new Set(
  serviceNavigation.flatMap((group) => group.items.map((item) => item.href.split("#")[0])),
);
const remainingLinks = moreLinks.filter(
  (link) => !mobileLinks.some((item) => item.to === link.to) && !servicePaths.has(link.to),
);
const navClass =
  "rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session, loading } = useSession();
  const pathname = usePathname();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 8);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const resize = () => {
      if (desktop.matches) setOpen(false);
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    desktop.addEventListener("change", resize);
    return () => {
      window.removeEventListener("scroll", scroll);
      desktop.removeEventListener("change", resize);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-xl transition-shadow ${scrolled ? "shadow-md shadow-black/5" : ""}`}
    >
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6 lg:px-5">
        <Link to="/" aria-label="AA100XTech home" className="flex shrink-0 items-center">
          <span className="brand-logo-wrap">
            <span aria-hidden className="brand-logo-wrap-glow" />
            <img
              src="/logo.png"
              alt="Absolute Advancement 100X Tech logo"
              className="brand-logo h-8 w-auto xl:h-9"
              width={1024}
              height={286}
            />
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-0.5 lg:flex">
          {desktopLinks.map((link) =>
            link.to === "/services" ? (
              <ServicesMegaMenu key={link.to} />
            ) : (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "text-foreground bg-secondary" }}
                className={navClass}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <CurrencySelector className="hidden px-2 lg:inline-flex [&>span:not(:last-child)]:hidden" />
          <Button
            asChild
            className="hidden lg:inline-flex"
            aria-label="Ready to Talk to an Expert?"
          >
            <Link to="/consultation">
              <span className="hidden xl:inline">Ready to Talk to an Expert?</span>
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
          {showAuthButtons && !loading && (
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to={session ? "/dashboard" : "/auth"}>
                {session ? "My account" : "Sign in / Sign up"}
              </Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(92vw,24rem)] overflow-y-auto overscroll-contain px-4"
            >
              <SheetTitle className="font-display">Menu</SheetTitle>
              <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-1">
                {mobileLinks.map((link) =>
                  link.to === "/services" ? (
                    <MobileServicesMenu key={link.to} onNavigate={() => setOpen(false)} />
                  ) : (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: link.to === "/" }}
                      activeProps={{ className: "bg-secondary text-foreground" }}
                      className="rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
                <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  More
                </p>
                {remainingLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button asChild className="mt-4">
                  <Link to="/consultation" onClick={() => setOpen(false)}>
                    Ready to Talk to an Expert?
                  </Link>
                </Button>
                <CurrencySelector className="mt-3 w-full justify-start" />
                {showAuthButtons && !loading && (
                  <Button asChild variant="outline" className="mt-2">
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
