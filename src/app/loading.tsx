import { Skeleton } from "@/components/ui/skeleton";

export default function PageLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto w-full max-w-7xl space-y-8 px-4 py-12 sm:px-6 sm:py-16"
    >
      <span className="sr-only">Loading your page…</span>
      <div className="space-y-5">
        <Skeleton className="h-4 w-32 motion-reduce:animate-none" />
        <Skeleton className="h-12 w-full max-w-lg motion-reduce:animate-none" />
        <Skeleton className="h-5 w-full max-w-2xl motion-reduce:animate-none" />
        <Skeleton className="h-5 w-2/3 max-w-md motion-reduce:animate-none" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-44 rounded-2xl motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
