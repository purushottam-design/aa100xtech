import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useConsultationBooking } from "@/components/consultation-booking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { consultationPlans } from "@/data/consultations";

const title = "Book a consultation — AA100XTech App";
const description =
  "Book a paid AA100XTech consultation from your phone. Secure payment runs through the existing AA100XTech checkout.";

export const Route = createFileRoute("/app/book-consultation")({
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
  component: AppBookConsultation,
});

function AppBookConsultation() {
  const { open } = useConsultationBooking();

  return (
    <AppShell title="Book">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Book a consultation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Same secure booking and payment flow used on aa100xtech.com.
      </p>

      <div className="mt-5 space-y-3">
        {consultationPlans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border bg-card p-4 ${
              plan.featured ? "border-primary/60" : "border-border/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-foreground">
                  ₹{plan.price.toLocaleString("en-IN")}
                </p>
                {plan.featured ? <Badge className="mt-1">Popular</Badge> : null}
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" onClick={() => open(plan.id)}>
              {plan.buttonLabel}
            </Button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
