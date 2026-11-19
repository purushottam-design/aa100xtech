"use client";

import { Link } from "@/lib/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CurrencySelector } from "@/components/currency-selector";
import { ServicesMegaMenu } from "@/components/services-mega-menu";
import { MobileServicesMenu } from "@/components/mobile-services-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { showAuthButtons } from "@/data/site";
import { headerNavigation, headerLinkActive, type HeaderLink } from "@/data/header-navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/use-session";
import { authReturnPath } from "@/lib/auth-navigation";

const navClass =
  "site-nav-trigger relative whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const mobileClass =
  "rounded-lg px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const accountLinks: readonly HeaderLink[] = [
  { to: "/dashboard", label: "My account" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
  { to: "/notifications", label: "Notifications" },
  { to: "/admin/select", label: "Admin dashboards" },
];

function HeaderDropdown({
  label,
  items,
  hoverOpen = false,
}: {
  label: string;
  items: readonly HeaderLink[];
  hoverOpen?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedByHover = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function pointerEnter(event: React.PointerEvent) {
    if (!hoverOpen || event.pointerType !== "mouse") return;
    cancelClose();
    if (!open) openedByHover.current = true;
    setOpen(true);
  }
  function pointerLeave(event: React.PointerEvent) {
    if (!hoverOpen || event.pointerType !== "mouse") return;
    cancelClose();
    if (!openedByHover.current && contentRef.current?.contains(document.activeElement)) return;
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  }
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  useEffect(() => setOpen(false), [pathname]);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={!hoverOpen}>
      <DropdownMenuTrigger
        ref={triggerRef}
        onPointerEnter={pointerEnter}
        onPointerLeave={pointerLeave}
        onPointerDown={(event) => {
          if (hoverOpen && openedByHover.current && open && event.pointerType === "mouse")
            event.preventDefault();
        }}
        onKeyDown={(event) => {
          cancelClose();
          openedByHover.current = false;
          if (hoverOpen && ["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            const last = event.key === "ArrowUp";
            // Reopening during the exit animation retains the Radix content;
            // move focus explicitly because its mount effect will not rerun.
            requestAnimationFrame(() => {
              const links = contentRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
              (last ? links?.[links.length - 1] : links?.[0])?.focus();
            });
          }
        }}
        data-active={items.some((link) => headerLinkActive(link, pathname))}
        className={`${navClass} flex items-center gap-1`}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={contentRef}
        onPointerEnter={pointerEnter}
        onPointerLeave={pointerLeave}
        onKeyDown={() => {
          cancelClose();
          openedByHover.current = false;
        }}
        onCloseAutoFocus={(event) => {
          // Hover menus must not move focus after a delayed exit animation.
          if (hoverOpen) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (!hoverOpen) return;
          event.preventDefault();
          cancelClose();
          openedByHover.current = false;
          setOpen(false);
          triggerRef.current?.focus();
        }}
        align="end"
        sideOffset={12}
        className="site-nav-dropdown max-h-[calc(100dvh-7rem)] w-64 rounded-xl border-primary/15 bg-white p-2 text-foreground shadow-lg shadow-black/10 motion-reduce:animate-none"
      >
        {items.map((link) =>
          link.children ? (
            <DropdownMenuSub key={link.to}>
              <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-3 py-2.5 font-medium">
                {link.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-xl bg-background p-2">
                <DropdownMenuItem asChild>
                  <Link to={link.to} onClick={() => setOpen(false)}>
                    Influencer Marketing Overview
                  </Link>
                </DropdownMenuItem>
                {link.children.map((child) => (
                  <DropdownMenuItem key={child.to} asChild>
                    <Link to={child.to} onClick={() => setOpen(false)}>
                      {child.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              key={link.to}
              asChild
              className="cursor-pointer rounded-lg px-3 py-2.5 font-medium focus:bg-primary/8 focus:text-primary"
            >
              <Link
                to={link.to}
                params={link.params}
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-primary/8 text-primary" }}
                aria-current={headerLinkActive(link, pathname) ? "page" : undefined}
                className={
                  headerLinkActive(link, pathname) ? "bg-primary/8 text-primary" : undefined
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader({ accountSlot }: { accountSlot?: React.ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { session, loading } = useSession();
  const pathname = usePathname();
  const [authNext, setAuthNext] = useState<string | null>(null);
  useEffect(() => {
    setAuthNext(pathname === "/auth" ? authReturnPath(window.location.search) : null);
  }, [pathname]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 8);
    const desktop = window.matchMedia("(min-width: 1280px)");
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
              className="brand-logo h-8 w-auto lg:h-6 xl:h-9"
              width={1024}
              height={286}
            />
          </span>
        </Link>
        <nav aria-label="Main navigation" className="hidden min-w-0 items-center gap-0.5 xl:flex">
          {headerNavigation.map((item) =>
            item.kind === "services" ? (
              <ServicesMegaMenu key={item.label} />
            ) : item.kind === "dropdown" ? (
              <HeaderDropdown
                key={item.label}
                label={item.label}
                items={item.items}
                hoverOpen={item.label === "Marketing"}
              />
            ) : (
              <Link
                key={item.to}
                to={item.to}
                target={item.to.startsWith("https://") ? "_blank" : undefined}
                rel={item.to.startsWith("https://") ? "noopener noreferrer" : undefined}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-foreground bg-secondary" }}
                className={navClass}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <CurrencySelector className="hidden px-2 xl:inline-flex" />
          {accountSlot ??
            (showAuthButtons &&
              !loading &&
              (session ? (
                <div className="hidden sm:block">
                  <HeaderDropdown label="My account" items={accountLinks} />
                </div>
              ) : (
                <div className="hidden items-center gap-2 sm:flex">
                  <Button asChild variant="outline">
                    <Link to="/auth" hash="login" search={{ next: authNext }}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth" hash="signup" search={{ next: authNext }}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )))}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="xl:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(92vw,24rem)] overflow-y-auto overscroll-contain px-4"
            >
              <SheetTitle className="font-display">Menu</SheetTitle>
              <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-1">
                {session &&
                  accountLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={mobileClass}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                {headerNavigation.map((item) =>
                  item.kind === "services" ? (
                    <MobileServicesMenu key={item.label} onNavigate={() => setOpen(false)} />
                  ) : item.kind === "dropdown" ? (
                    <Accordion key={item.label} type="single" collapsible>
                      <AccordionItem value={item.label} className="border-0">
                        <AccordionTrigger
                          data-active={item.items.some((link) => headerLinkActive(link, pathname))}
                          className={`${mobileClass} site-nav-trigger relative hover:no-underline`}
                        >
                          {item.label}
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <div className="mx-3 space-y-1 rounded-xl border border-border/70 p-2">
                            {item.items.map((link) =>
                              link.children ? (
                                <Accordion key={link.to} type="single" collapsible>
                                  <AccordionItem value={link.to} className="border-0">
                                    <AccordionTrigger className="px-3 text-sm">
                                      {link.label}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <Link
                                        to={link.to}
                                        onClick={() => setOpen(false)}
                                        className="block rounded-lg px-3 py-2.5 text-sm"
                                      >
                                        Influencer Marketing Overview
                                      </Link>
                                      {link.children.map((child) => (
                                        <Link
                                          key={child.to}
                                          to={child.to}
                                          onClick={() => setOpen(false)}
                                          className="block rounded-lg px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-primary"
                                        >
                                          {child.label}
                                        </Link>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ) : (
                                <Link
                                  key={link.to}
                                  to={link.to}
                                  params={link.params}
                                  activeOptions={{ exact: true }}
                                  activeProps={{ className: "bg-primary/8 text-primary" }}
                                  aria-current={
                                    headerLinkActive(link, pathname) ? "page" : undefined
                                  }
                                  onClick={() => setOpen(false)}
                                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${headerLinkActive(link, pathname) ? "bg-primary/8 text-primary" : "text-muted-foreground"}`}
                                >
                                  {link.label}
                                </Link>
                              ),
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <Link
                      key={item.to}
                      to={item.to}
                      target={item.to.startsWith("https://") ? "_blank" : undefined}
                      rel={item.to.startsWith("https://") ? "noopener noreferrer" : undefined}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: item.to === "/" }}
                      activeProps={{ className: "bg-secondary text-foreground" }}
                      className={mobileClass}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
                <CurrencySelector className="mt-3 w-full justify-start" />
                {showAuthButtons && !loading && !session && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link
                        to="/auth"
                        hash="login"
                        search={{ next: authNext }}
                        onClick={() => setOpen(false)}
                      >
                        Login
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link
                        to="/auth"
                        hash="signup"
                        search={{ next: authNext }}
                        onClick={() => setOpen(false)}
                      >
                        Sign up
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
