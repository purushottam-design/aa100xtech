import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "@/lib/navigation";

export function BeTheOneNavLink({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Link
      to="/be-the-one"
      onClick={onNavigate}
      className="mb-3 flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3 text-base font-bold text-primary shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <Sparkles className="size-5 shrink-0" aria-hidden="true" />
      Be The One
      <ArrowUpRight className="ml-auto size-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
