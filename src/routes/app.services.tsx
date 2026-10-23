import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { AppEmpty, AppError, AppLoading, AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { listCatalogItems } from "@/lib/affiliate.functions";

const title = "Services — AA100XTech App";
const description =
  "Browse the live AA100XTech service catalogue from the app: web, mobile, AI, cloud and growth marketing offerings.";

export const Route = createFileRoute("/app/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppServices,
});

function AppServices() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", "catalog"],
    queryFn: () => listCatalogItems(),
  });

  return (
    <AppShell title="Services">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Service catalogue</h1>
      <p className="mt-1 text-sm text-muted-foreground">Live data from your AA100XTech backend.</p>

      <div className="mt-5 space-y-3">
        {isLoading ? <AppLoading label="Loading services…" /> : null}
        {error ? <AppError message={(error as Error).message} /> : null}
        {!isLoading && !error && (data?.length ?? 0) === 0 ? (
          <AppEmpty
            title="No services published yet"
            hint="Active catalogue items will appear here automatically."
          />
        ) : null}
        {(data ?? []).map((item) => (
          <Link
            key={item.id}
            to="/app/service/$id"
            params={{ id: item.id }}
            className="block rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                {item.category ? (
                  <Badge variant="secondary" className="mt-1.5">
                    {item.category}
                  </Badge>
                ) : null}
                {item.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
