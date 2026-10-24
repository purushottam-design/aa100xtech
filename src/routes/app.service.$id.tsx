"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";

import { AppEmpty, AppError, AppLoading, AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCatalogItems } from "@/lib/affiliate.functions";

const title = "Service details — AA100XTech App";
const description =
  "View full details for an AA100XTech service, including category, description and how to book a consultation.";

export default AppServiceDetail;

function AppServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["app", "catalog"],
    queryFn: () => listCatalogItems(),
  });

  const item = (data ?? []).find((s) => s.id === id);

  return (
    <AppShell title="Service">
      {isLoading ? <AppLoading label="Loading service…" /> : null}
      {error ? <AppError message={(error as Error).message} /> : null}
      {!isLoading && !error && !item ? (
        <AppEmpty title="Service not found" hint="It may have been deactivated." />
      ) : null}

      {item ? (
        <article className="space-y-4">
          <header>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{item.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.category ? <Badge variant="secondary">{item.category}</Badge> : null}
              <Badge variant="outline">{item.type}</Badge>
              {item.recurring ? <Badge variant="outline">Recurring</Badge> : null}
            </div>
          </header>

          {item.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          ) : null}

          <dl className="grid grid-cols-2 gap-3">
            <Detail label="Slug" value={item.slug} />
            <Detail label="Cookie window" value={`${item.cookie_duration_days} days`} />
            <Detail
              label="Partner commission"
              value={
                item.default_commission_type === "percent"
                  ? `${item.default_commission_value}%`
                  : `₹${item.default_commission_value}`
              }
            />
            <Detail label="Status" value={item.active ? "Active" : "Inactive"} />
          </dl>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link to="/app/book-consultation">Book a consultation</Link>
            </Button>
            {item.landing_url ? (
              <Button asChild variant="outline" className="w-full">
                <a href={item.landing_url} target="_blank" rel="noreferrer">
                  View full details
                </a>
              </Button>
            ) : null}
          </div>
        </article>
      ) : null}
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
