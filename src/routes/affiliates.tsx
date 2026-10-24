"use client";

import { Link } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Coins, Link2, Rocket, ShieldCheck, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listCatalogItems } from "@/lib/affiliate.functions";
import { useSession } from "@/hooks/use-session";

const title = "Affiliate & Partner Program — Promote everything | AA100XTech";
const description =
  "One affiliate account to promote every AA100XTech website, app, product and service. Unique links, personal coupon codes, unified dashboard and fast payouts.";

export default AffiliatesPage;

const perks = [
  { icon: Link2, title: "One account, every product", body: "Sign up once and promote every website, app, product and service in the catalog — no separate registration per item." },
  { icon: Ticket, title: "Personal coupon codes", body: "Get a sitewide code like AA100-JOHN25 plus per-product codes. Customers get a discount, you get credited even without a click." },
  { icon: BarChart3, title: "One unified dashboard", body: "Clicks, signups, sales, conversion rate and earnings across everything you promote — in a single view." },
  { icon: Coins, title: "Recurring commissions", body: "Subscription products keep paying you on every renewal, not just the first sale." },
  { icon: ShieldCheck, title: "Fair, fraud-checked tracking", body: "Hashed IPs, duplicate-click detection and self-referral blocks keep the numbers honest for everyone." },
  { icon: Rocket, title: "Fast payouts", body: "Request payouts by UPI, bank transfer, PayPal, Stripe or Razorpay once your balance clears the threshold." },
];

function AffiliatesPage() {
  const { session } = useSession();
  const { data: catalog } = useQuery({
    queryKey: ["public-catalog"],
    queryFn: () => listCatalogItems(),
  });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge variant="outline">Unified affiliate & partner program</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
            Promote everything AA100XTech builds — from one account.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Individuals, creators, influencers and companies use the same program. One affiliate ID,
            auto-generated referral links per product, personal coupon codes and a single dashboard
            for every click, sale and payout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={session ? "/affiliate" : "/auth"}>
                {session ? "Open affiliate portal" : "Join the program"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/partners">See the 30-level partner ladder</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Why one program beats five</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {perks.map((p) => (
              <div key={p.title} className="surface-card p-6">
                <p.icon className="size-6 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">What you can promote today</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every item below is live in the catalog. New websites, apps, products and services appear
            here automatically the moment the admin adds them — nothing to re-apply for.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(catalog ?? []).map((item) => (
              <div key={item.id} className="surface-card flex flex-col p-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="uppercase">{item.type}</Badge>
                  {item.recurring ? <Badge variant="outline">Recurring</Badge> : null}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-4 text-sm font-medium text-primary">
                  {item.default_commission_type === "flat"
                    ? `Flat ${item.default_commission_value} per sale`
                    : `${item.default_commission_value}% commission`}{" "}
                  · {item.cookie_duration_days}-day cookie
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Start earning in three steps</h2>
          <ol className="mt-8 grid gap-4 text-left">
            {[
              "Create your account and submit payout + KYC details.",
              "Get approved by the AA100XTech team (usually within 48 hours).",
              "Copy your link or coupon for any product and start promoting.",
            ].map((step, i) => (
              <li key={step} className="surface-card flex gap-4 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <Button asChild size="lg" className="mt-8">
            <Link to={session ? "/affiliate" : "/auth"}>
              {session ? "Open affiliate portal" : "Create your affiliate account"}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
