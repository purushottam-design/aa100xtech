import { joinUsLinks, marketingLinks } from "./site";

export type HeaderLink = {
  to: string;
  label: string;
  params?: Readonly<Record<string, string>>;
  children?: readonly HeaderLink[];
};

export function headerHref(link: HeaderLink) {
  return link.to.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (segment, key: string) =>
    link.params?.[key] ? encodeURIComponent(link.params[key]) : segment,
  );
}

export function headerLinkActive(link: HeaderLink, pathname: string) {
  const target = headerHref(link);
  return pathname === target || (target !== "/" && pathname.startsWith(`${target}/`));
}

const joinItems: readonly HeaderLink[] = [
  ...joinUsLinks,
  { to: "/request-access", label: "Request an Account" },
];

const moreItems: readonly HeaderLink[] = [
  { to: "/about", label: "About Us" },
  // { to: "/portfolio", label: "Portfolio" },
  { to: "/consultation", label: "Consultation" },
  { to: "/contact", label: "Contact Us" },
  { to: "/catalog", label: "Service Catalogue" },
  // { to: "/creator-moves-365", label: "Creator Moves 365" },
  // { to: "/partners", label: "Partners" },
  // { to: "/affiliates", label: "Affiliates" },
  // { to: "/business-plans", label: "Business Plans" },
  // { to: "/proposal", label: "Get Customised Proposal" },
  // { to: "/blog", label: "Insights" },
  // { to: "/real-estate", label: "Real Estate Solutions" },
  // { to: "/services/explore", label: "Explore Service Types" },
  // { to: "/partners/plans", label: "Partner Plans" },
  // { to: "/partners/apply", label: "Become a Partner" },
];

// Header-only configuration: footer navigation and every existing route stay intact.
export const headerNavigation = [
  { kind: "link", to: "/", label: "Home" },
  { kind: "services", label: "Services" },
  { kind: "link", to: "/clients", label: "Our Top Clients" },
  { kind: "link", to: "/be-the-one", label: "Be The One" },
  { kind: "link", to: "https://theamanlife.com/", label: "Founder" },
  { kind: "dropdown", label: "Join Us", items: joinItems },
  { kind: "dropdown", label: "Marketing", items: marketingLinks as readonly HeaderLink[] },
  { kind: "dropdown", label: "More", items: moreItems },
] as const;
