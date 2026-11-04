"use client";

import { Link } from "@/lib/navigation";
import { serviceNavigation } from "@/data/service-navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { ServiceIcon, ServiceNavigationLinks } from "./service-navigation-links";

export function MobileServicesMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="services" className="border-0">
        <AccordionTrigger className="rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary hover:no-underline">
          Services
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <Link
            to="/services"
            onClick={onNavigate}
            className="mx-3 mb-2 block rounded-lg bg-primary/8 px-3 py-3 text-sm font-semibold text-primary"
          >
            View all services
          </Link>
          <Accordion
            type="single"
            collapsible
            className="mx-3 rounded-xl border border-border/70 px-3"
          >
            {serviceNavigation.map((group) => (
              <AccordionItem key={group.id} value={group.id} className="last:border-0">
                <AccordionTrigger className="gap-2 text-left hover:no-underline">
                  <span className="flex items-start gap-2">
                    <ServiceIcon
                      name={group.icon}
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    {group.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ServiceNavigationLinks items={group.items} onNavigate={onNavigate} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
