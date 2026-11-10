"use client";

import { Link } from "@/lib/navigation";
import {
  Apple,
  AudioLines,
  Bot,
  CalendarRange,
  Clapperboard,
  ClipboardCheck,
  Cloud,
  Code2,
  Film,
  Globe,
  Globe2,
  Megaphone,
  Mic,
  Music,
  PenTool,
  Radar,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  ShoppingCart,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { ServiceNavigationItem } from "@/data/service-navigation";

const icons = {
  Apple,
  AudioLines,
  Bot,
  CalendarRange,
  Clapperboard,
  ClipboardCheck,
  Cloud,
  Code2,
  Film,
  Globe,
  Globe2,
  Megaphone,
  Mic,
  Music,
  PenTool,
  Radar,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  ShoppingCart,
  UserRound,
  Users,
  Video,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? Sparkles;
  return <Icon aria-hidden="true" className={className} />;
}

export function ServiceNavigationLinks({
  items,
  onNavigate,
}: {
  items: readonly ServiceNavigationItem[];
  onNavigate: () => void;
}) {
  const [prefetchTarget, setPrefetchTarget] = useState<string | null>(null);
  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li
          key={item.href}
          style={{ "--service-delay": `${Math.min(index, 7) * 20}ms` } as CSSProperties}
        >
          <Link
            to={item.href}
            prefetch={prefetchTarget === item.href}
            onMouseEnter={() => setPrefetchTarget(item.href)}
            onFocus={() => setPrefetchTarget(item.href)}
            onTouchStart={() => setPrefetchTarget(item.href)}
            onClick={onNavigate}
            className="service-menu-link group flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] leading-5 text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary/8 text-foreground", "aria-current": "page" }}
          >
            <ServiceIcon
              name={item.icon}
              className="mt-0.5 size-4 shrink-0 text-primary transition-transform motion-safe:group-hover:-translate-y-0.5"
            />
            <span>{item.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
