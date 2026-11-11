import Link from "next/link";
import { MarketingIntakeForm } from "./marketing-intake-form";
export function MarketingIntakePage({
  kind,
  partnership = false,
}: {
  kind: "creator" | "brand";
  partnership?: boolean;
}) {
  const creator = kind === "creator";
  return (
    <div className="intake-reference-page">
      <div className="mx-auto max-w-[660px] px-4 pb-5 pt-8 sm:px-6 sm:pt-12">
        <Link
          href={partnership ? "/partnership-for-influencers" : "/influencer-marketing"}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {partnership
            ? "Partnership for Influencers / Apply"
            : `Influencer Marketing / ${creator ? "For Influencers" : "For Brands"}`}
        </Link>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          {partnership
            ? "Apply for Influencer Partnership"
            : creator
              ? "Become an Influencer Partner"
              : "Grow Your Brand With the Right Influencers"}
        </h1>
      </div>
      <MarketingIntakeForm kind={kind} partnership={partnership} />
    </div>
  );
}
