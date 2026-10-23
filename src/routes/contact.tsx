import { createFileRoute } from "@tanstack/react-router";
import { Clock, FileText, Mail, MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { services } from "@/data/services";
import { site } from "@/data/site";

const title = "Contact AA100XTech — Patna IT & Digital Agency";
const description =
  "Talk to AA100XTech about your website, app, AI or marketing project. Email customer.care@aa100xtech.com, call +91 90318 38342, or visit our Kidwaipuri, Patna office.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ContactPage,
});

const faqs = [
  {
    q: "How long does a typical project take?",
    a: "Timelines vary with scope. A focused website usually takes 10 days to 3 weeks, while complex platforms can run several months. You get a detailed timeline during the initial consultation.",
  },
  {
    q: "What is your development process?",
    a: "We work in agile sprints with regular demos, continuous feedback and iterative improvements — so you always know where the project stands.",
  },
  {
    q: "Do you provide support after launch?",
    a: "Yes. Every website plan includes three months of free maintenance, and we offer ongoing AMC and 24/7 technical support beyond that.",
  },
  {
    q: "Can you work with our existing website or app?",
    a: "Absolutely. We regularly take over existing codebases for redesigns, performance work, SEO fixes and feature development.",
  },
  {
    q: "How does pricing work?",
    a: "Websites and apps are priced per project, while SEO, ads and social media run as monthly retainers. Starting prices are published on the services page.",
  },
];

function ContactPage() {
  const [service, setService] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);

    const { error } = await supabase.from("contact_messages").insert({
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim() || null,
      company: String(data.get("company") ?? "").trim() || null,
      service: service || null,
      message: String(data.get("message") ?? "").trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error("Message not sent", {
        description: "Something went wrong. Please try again or email us directly.",
      });
      return;
    }

    setService("");
    form.reset();
    toast.success("Message sent", {
      description: "Thanks for reaching out — we typically respond within 24 hours.",
    });
  };


  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-24">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Let's connect
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Get in <span className="text-gradient-ember">touch</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Have a project in mind? Let's discuss how we can help bring your ideas to life with
            cutting-edge solutions.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div className="space-y-4">
            <InfoCard icon={<Mail className="size-5" />} label="Email">
              <a href={`mailto:${site.email}`} className="hover:text-primary">
                {site.email}
              </a>
            </InfoCard>
            <InfoCard icon={<Phone className="size-5" />} label="Phone">
              <a href={site.phoneHref} className="hover:text-primary">
                {site.phone}
              </a>
            </InfoCard>
            <InfoCard icon={<MapPin className="size-5" />} label="Address">
              <a
                href={site.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-primary"
              >
                {site.address}
              </a>
            </InfoCard>
            <InfoCard icon={<Clock className="size-5" />} label="Business hours">
              {site.hours}
            </InfoCard>
            <InfoCard icon={<FileText className="size-5" />} label="GSTIN">
              {site.gstin}
            </InfoCard>
          </div>

          <div className="surface-card p-7 md:p-9">
            <h2 className="font-display text-2xl font-bold">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Fill out the form below and we'll get back to you as soon as possible. We typically
              respond within 24 hours.
            </p>

            <form onSubmit={onSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" name="name" required placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input id="email" name="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" name="phone" placeholder="+91 00000 00000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company name</Label>
                <Input id="company" name="company" placeholder="Your company" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="service">Service interested in *</Label>
                <Select value={service} onValueChange={setService} required>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.slug} value={s.slug}>
                        {s.title}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your project, timeline and budget."
                />
              </div>
              <Button type="submit" size="lg" className="sm:col-span-2" disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Common questions"
            title="Frequently asked questions"
            description="Answers to what clients ask us most about services, timelines and process."
          />
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left font-display text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card flex items-start gap-4 p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
