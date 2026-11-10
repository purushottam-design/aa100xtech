"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { Link } from "@/lib/navigation";
import { serviceNavigation } from "@/data/service-navigation";
import { ServiceIcon, ServiceNavigationLinks } from "./service-navigation-links";
import { ServiceFeaturedLinks } from "./service-featured-links";
import { site } from "@/data/site";

export function ServicesMegaMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardOpen = useRef(false);
  const panelId = useId();
  const triggerId = useId();
  const pathname = usePathname();
  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const close = () => {
    cancelClose();
    setOpen(false);
  };

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!open) return;
    if (keyboardOpen.current) {
      root.current?.querySelector<HTMLAnchorElement>("[data-service-panel] a")?.focus();
      keyboardOpen.current = false;
    }
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (timer.current) clearTimeout(timer.current);
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
      trigger.current?.focus();
    } else if (event.target === trigger.current && event.key === "ArrowDown") {
      event.preventDefault();
      keyboardOpen.current = true;
      if (open) root.current?.querySelector<HTMLAnchorElement>("[data-service-panel] a")?.focus();
      else setOpen(true);
    } else if (open && ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const links = Array.from(
        root.current?.querySelectorAll<HTMLAnchorElement>("[data-service-panel] a") ?? [],
      );
      const index = links.indexOf(event.target as HTMLAnchorElement);
      if (index < 0) return;
      event.preventDefault();
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? links.length - 1
            : (index + (event.key === "ArrowUp" ? -1 : 1) + links.length) % links.length;
      links[next]?.focus();
    }
  }

  return (
    <div
      ref={root}
      onKeyDown={keyboard}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          cancelClose();
          setOpen(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse" || root.current?.contains(document.activeElement)) return;
        cancelClose();
        timer.current = setTimeout(() => setOpen(false), 220);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <Link
        ref={trigger}
        id={triggerId}
        to="/services"
        aria-expanded={open}
        aria-controls={panelId}
        data-active={pathname.startsWith("/services")}
        onClick={close}
        className={`site-nav-trigger relative flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${open || pathname.startsWith("/services") ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
      >
        Services{" "}
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Link>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          data-service-panel
          className="absolute inset-x-0 top-full z-50 px-4 pt-2 sm:px-6"
        >
          <div className="service-mega-panel max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-primary/15 bg-background p-5 shadow-2xl shadow-black/15">
            <ServiceFeaturedLinks onNavigate={close} prideHref={site.myNameMyPrideUrl} />
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Explore our expertise
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Technology, creativity and growth.
                </p>
              </div>
              <Link
                to="/services"
                onClick={close}
                className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                View all services <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-5 xl:grid-cols-5">
              {serviceNavigation.map((group) => (
                <section key={group.id} aria-labelledby={`${panelId}-${group.id}`}>
                  <h2
                    id={`${panelId}-${group.id}`}
                    className="mb-3 flex min-h-12 items-start gap-2 px-2 text-sm font-semibold leading-5"
                  >
                    <ServiceIcon
                      name={group.icon}
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    {group.title}
                  </h2>
                  <ServiceNavigationLinks items={group.items} onNavigate={close} />
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
