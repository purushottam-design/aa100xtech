"use client";
import { Link } from "@/lib/navigation";
import { usePublicSite } from "@/hooks/use-public-site";
import { Mail, MapPin, Phone } from "lucide-react";
import { services } from "@/data/services";
import { legalLinks, moreLinks, navLinks, programLinks } from "@/data/site";
import { moreItems } from "@/data/header-navigation";

const footerServices = [
  "website-development",
  "ecommerce-development",
  "mobile-app-development",
  "seo",
  "social-media-marketing",
  "advertising-management",
  "ai-solutions",
];
const companyLinks = [...navLinks, ...moreLinks, { to: "https://theamanlife.com/", label: "Founder" }].filter(
  (link) => !programLinks.some((program) => program.to === link.to),
);

export function SiteFooter() {
  const site = usePublicSite();
  return (
    <footer className="border-t border-border/60 bg-surface/40 pb-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8 xl:grid-cols-7">
        <div className="sm:col-span-2">
          <div className="flex items-center">
            <span className="brand-logo-wrap">
              <span aria-hidden className="brand-logo-wrap-glow" />
              <img
                src="/logo.png"
                alt="Absolute Advancement 100X Tech logo"
                className="brand-logo h-10 w-auto md:h-12"
                width={1024}
                height={286}
              />
            </span>
          </div>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            An Indian IT services company in Patna delivering website development, mobile apps,
            digital marketing, design and cloud solutions engineered for 100x growth.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">GSTIN: {site.gstin}</p>
          <h3 className="mt-8 text-sm font-semibold">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <a href={`mailto:${site.email}`} className="whitespace-nowrap hover:text-foreground">
                {site.email}
              </a>
            </li>
            {site.phone && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <a href={site.phoneHref} className="hover:text-foreground">
                  {site.phone}
                </a>
              </li>
            )}
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{site.address}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {services
              .filter((service) => footerServices.includes(service.slug))
              .map((s) => (
                <li key={s.slug}>
                  <Link
                    to="/services/$slug"
                    params={{ slug: s.slug }}
                    className="transition-colors hover:text-foreground"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            <li>
              <Link to="/services" className="transition-colors hover:text-foreground">
                All Services
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {companyLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.to === "/founders" ? "Founder — Aman" : l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Programs</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {programLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">More</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {moreItems.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Legal</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {legalLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <p>{site.hours}</p>
        </div>
      </div>
    </footer>
  );
}
