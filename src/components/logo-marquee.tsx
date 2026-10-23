import { clients } from "@/data/site";

export function LogoMarquee() {
  const row = [...clients, ...clients];

  return (
    <div className="relative overflow-hidden py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="marquee-track flex w-max items-center gap-4">
        {row.map((c, i) => (
          <a
            key={`${c.name}-${i}`}
            href={c.url}
            target="_blank"
            rel="noreferrer noopener"
            className="whitespace-nowrap rounded-xl border border-border/60 bg-surface/60 px-6 py-3 font-display text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {c.name}
          </a>
        ))}
      </div>
    </div>
  );
}
