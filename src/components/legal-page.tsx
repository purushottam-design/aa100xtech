import { Link } from "@/lib/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/data/site";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "sub"; heading: string; blocks: LegalBlock[] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

function Blocks({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        if (block.type === "p") {
          return (
            <p key={i} className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {block.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <div key={i} className="mt-6">
            <h3 className="text-base font-semibold text-foreground">{block.heading}</h3>
            <Blocks blocks={block.blocks} />
          </div>
        );
      })}
    </>
  );
}

export function LegalPage({
  title,
  intro,
  effectiveDate,
  lastUpdated,
  sections,
}: {
  title: string;
  intro: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-16 md:py-20">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Legal</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>Effective date: {effectiveDate}</span>
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-14 lg:px-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              On this page
            </p>
            <nav className="mt-4 space-y-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          </aside>

          <div className="max-w-3xl">
            {sections.map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-24 border-b border-border/60 py-8 first:pt-0 last:border-b-0"
              >
                <h2 className="text-xl font-semibold sm:text-2xl">{s.heading}</h2>
                <Blocks blocks={s.blocks} />
              </article>
            ))}

            <div className="mt-10 rounded-xl border border-border/60 bg-surface/40 p-6">
              <h2 className="text-lg font-semibold">Contact us</h2>
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
              <p className="mt-4 text-xs text-muted-foreground">
                {site.legalName} · GSTIN: {site.gstin} · {site.hours}
              </p>
              <Link
                to="/contact"
                className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to contact page
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
