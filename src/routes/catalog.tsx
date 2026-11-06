"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { ArrowRight } from "lucide-react";

import { PageEmpty, PageError, PageLoading, WebPageShell } from "@/components/web-page-shell";
import { Badge } from "@/components/ui/badge";
import { listCatalogItems } from "@/lib/affiliate.functions";

export default CatalogPage;

function CatalogPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", "catalog"],
    queryFn: () => listCatalogItems(),
  });

  return (
    <WebPageShell>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
        Service catalogue
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse our services and book a consultation to discuss your project.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <PageLoading label="Loading services…" /> : null}
        {error ? <PageError message={(error as Error).message} /> : null}
        {!isLoading && !error && (data?.length ?? 0) === 0 ? (
          <PageEmpty
            title="No services published yet"
            hint="Active catalogue items will appear here automatically."
          />
        ) : null}
        {(data ?? []).map((item) => (
          <Link
            key={item.id}
            to="/catalog/$id"
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
    </WebPageShell>
  );
}
