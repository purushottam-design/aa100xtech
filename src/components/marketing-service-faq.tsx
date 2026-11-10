"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { MarketingService } from "@/data/marketing-services";

export function MarketingFaq({ faqs }: { faqs: MarketingService["faqs"] }) {
  return (
    <Accordion type="single" collapsible className="marketing-faq">
      {faqs.map(({ question, answer }, index) => (
        <AccordionItem key={question} value={`question-${index}`}>
          <AccordionTrigger>{question}</AccordionTrigger>
          <AccordionContent>{answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
