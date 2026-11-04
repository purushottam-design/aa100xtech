import { Skeleton } from "@/components/ui/skeleton";

export default function InfluencerMarketingLoading() {
  return (
    <div
      role="status"
      aria-label="Loading influencer marketing page"
      className="mx-auto max-w-7xl space-y-8 px-4 py-16"
    >
      <span className="sr-only">Loading the page and approved creator directory…</span>
      <Skeleton className="h-10 w-52" />
      <Skeleton className="h-28 max-w-2xl" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-64" />
        ))}
      </div>
    </div>
  );
}
