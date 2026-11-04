import { services, type Service } from "./services";
import { marketingLinks } from "./site";

export type ServiceNavigationItem = {
  title: string;
  href: string;
  icon: string;
};
export type ServiceNavigationGroup = {
  id: string;
  title: string;
  icon: string;
  items: ServiceNavigationItem[];
};

const categories = [
  { id: "development", title: "Website & App Development", icon: "Code2" },
  { id: "marketing", title: "Digital Marketing & Creative Services", icon: "Megaphone" },
  { id: "automation", title: "AI & Automation", icon: "Bot" },
  { id: "media", title: "Real Estate & Video Production", icon: "Film" },
  { id: "infrastructure", title: "Cloud, Security & Digital Identity", icon: "ShieldCheck" },
  { id: "other", title: "More Services", icon: "Sparkles" },
] as const;

// Titles, icons and destinations come from the same catalog as /services.
// Uncategorized future entries remain discoverable without changing this menu.
export function buildServiceNavigation(
  catalog: readonly Service[] = services,
): ServiceNavigationGroup[] {
  const groups: ServiceNavigationGroup[] = categories.map((category) => ({
    ...category,
    items: [],
  }));
  const other = groups.find((group) => group.id === "other")!;
  for (const service of catalog) {
    const group = groups.find((candidate) => candidate.id === service.navigationGroup) ?? other;
    group.items.push({
      title: service.title,
      icon: service.icon,
      href: `/services/${encodeURIComponent(service.slug)}`,
    });
  }
  // These approved pages are outside the priced services catalog.
  const marketing = groups.find((group) => group.id === "marketing")!;
  for (const link of marketingLinks) {
    if ("params" in link) continue; // Social Media Marketing is already in the catalog.
    marketing.items.push({ title: link.label, href: link.to, icon: "Megaphone" });
    if (link.to === "/influencer-marketing")
      marketing.items.push({
        title: "Viral Influencer Marketing",
        href: "/influencer-marketing#viral-influencer-marketing",
        icon: "Sparkles",
      });
  }
  return groups.filter((group) => group.items.length);
}

export const serviceNavigation = buildServiceNavigation();
