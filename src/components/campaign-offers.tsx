import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/currency-provider";
export function CampaignOffers() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            id: "influencer-marketing",
            name: "Influencer Marketing",
            body: "Creator collaborations, product promotions and social media campaigns aligned with your brief.",
          },
          {
            id: "viral-influencer-marketing",
            name: "Viral Influencer Marketing",
            body: "Creative campaign strategy, short-form video and content production designed for shareable storytelling.",
          },
        ].map((offer) => (
          <article key={offer.id} id={offer.id} className="surface-card scroll-mt-28 p-7">
            <h2 className="text-2xl font-semibold">{offer.name}</h2>
            <p className="mt-4 text-muted-foreground">{offer.body}</p>
            <p className="mt-6 text-xl font-semibold text-primary">
              Starting at <Price value="₹500" />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Final pricing depends on the campaign scope and approved quotation. No guaranteed
              views, followers, virality, leads or revenue.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/proposal?kind=influencer&plan=${offer.id}`}>Campaign inquiry</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/consultation">Book Consultation</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
