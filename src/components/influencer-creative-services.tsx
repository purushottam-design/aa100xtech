import Link from "next/link";
import {
  ArrowUpRight,
  Globe,
  Smartphone,
  Link as Domain,
  Mail,
  Image,
  Video,
  Music,
  Disc3,
  Clapperboard,
  Film,
} from "lucide-react";
import { influencerServices } from "@/data/business-plans";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/currency-provider";
const serviceIcons = [
  Globe,
  Smartphone,
  Domain,
  Mail,
  Image,
  Video,
  Music,
  Disc3,
  Clapperboard,
  Film,
];
export function InfluencerCreativeServices() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {influencerServices.map((service, index) => {
            const Icon = serviceIcons[index] ?? Globe;
            return (
              <article
                key={service.id}
                className="surface-card flex flex-col p-6 transition-transform motion-safe:hover:-translate-y-1"
              >
                <p className="flex items-center gap-3 text-sm font-semibold text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-xl font-semibold">{service.name}</h3>
                <p className="my-4 text-sm text-muted-foreground">{service.description}</p>
                {service.price !== undefined && (
                  <p className="font-semibold">
                    <Price value={`₹${service.price.toLocaleString("en-IN")}`} />
                  </p>
                )}
                {service.eligibility && (
                  <p className="mb-3 text-sm">Eligibility: {service.eligibility}</p>
                )}
                {service.deliverables && (
                  <ul className="mb-3 list-inside list-disc text-sm">
                    {service.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {service.addOns && (
                  <p className="mb-3 text-sm">Optional add-ons: {service.addOns.join(", ")}</p>
                )}
                {service.rights && (
                  <p className="mb-3 text-sm">Rights and licensing: {service.rights}</p>
                )}
                <p className="mb-6 text-xs text-muted-foreground">
                  Deliverables, eligibility, add-ons and price are agreed in a written proposal.
                  Licensing and usage rights are agreed separately where relevant.
                </p>
                <div className="mt-auto flex flex-wrap gap-3">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/proposal?kind=influencer&plan=${service.id}`}>
                      Inquire <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                  <Link href="/consultation" className="self-center text-sm text-primary underline">
                    Book Consultation
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
