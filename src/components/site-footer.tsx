import { Link } from "@/lib/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { services } from "@/data/services";
import { legalLinks, moreLinks, navLinks, site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:grid-cols-5 lg:px-8">
        <div className="md:col-span-2">
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
        </div>

        <div>
          <h3 className="text-sm font-semibold">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {services.slice(0, 6).map((s) => (
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
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {[...navLinks, ...moreLinks].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-sm font-semibold">Contact</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
              <a href={`mailto:${site.email}`} className="hover:text-foreground">
                {site.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
              <a href={site.phoneHref} className="hover:text-foreground">
                {site.phone}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{site.address}</span>
            </li>
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
