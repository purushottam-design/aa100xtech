import { ArrowUpRight, Fingerprint, Globe2, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/navigation";

export function ServiceFeaturedLinks({
  onNavigate,
  prideHref,
}: {
  onNavigate: () => void;
  prideHref: string;
}) {
  const external = /^https?:\/\//.test(prideHref);

  return (
    <div className="mb-3 grid gap-3 sm:grid-cols-2 [&>a]:min-h-16 [&>a]:min-w-0">
      <Link
        to="/one-identity-one-world-one-person"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl border border-amber-300/70 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3 text-base font-bold text-amber-900 shadow-sm transition-all hover:border-orange-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/60 bg-white/80 text-amber-700">
          <Globe2 className="size-5" aria-hidden="true" />
        </span>
        <span>One Identity One World One Person</span>
        <ArrowUpRight className="ml-auto size-4 shrink-0 text-amber-700" aria-hidden="true" />
      </Link>
      <Link
        to={prideHref}
        onClick={onNavigate}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="group flex items-center gap-3 rounded-xl border border-amber-300/70 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3 text-base font-bold text-amber-900 shadow-sm transition-all hover:border-orange-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-amber-300/60 bg-white/80 text-amber-700">
          <Fingerprint className="size-5" aria-hidden="true" />
        </span>
        <span>My Name My Pride - Be The One</span>
        <ArrowUpRight className="ml-auto size-4 shrink-0 text-amber-700" aria-hidden="true" />
      </Link>
      <Link
        to="/security-identity-defect"
        onClick={onNavigate}
        className="group flex items-center gap-3 rounded-xl border border-primary/30 bg-linear-to-r from-secondary to-surface px-4 py-3 text-base font-bold text-foreground shadow-sm transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none sm:col-span-2"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-background text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <span>Security &amp; Identity Defect - AI Fake &amp; Deepfake Content Removal</span>
        <ArrowUpRight className="ml-auto size-4 shrink-0 text-primary" aria-hidden="true" />
      </Link>
    </div>
  );
}
