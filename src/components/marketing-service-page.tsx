import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Palette,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Store,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { marketingLinks, site } from "@/data/site";
import { marketingServiceHref, type MarketingService } from "@/data/marketing-services";
import { MarketingFaq } from "./marketing-service-faq";
import { MarketingHeroSlider } from "./marketing-hero-slider";
import { marketingHeroSlides } from "@/data/marketing-hero-slides";

const offeringIcons = [Target, Palette, Megaphone, MousePointerClick, BarChart3, ClipboardList];
const reasonIcons = [Lightbulb, Target, HeartHandshake, ShieldCheck];
const steps = [
  "Consultation",
  "Strategy & Planning",
  "Campaign Execution",
  "Monitoring & Optimization",
  "Reporting",
];
const audiences = [
  { title: "Startups", icon: Rocket },
  { title: "Small Businesses", icon: Store },
  { title: "Corporate Businesses", icon: Building2 },
  { title: "E-commerce Brands", icon: ShoppingBag },
  { title: "Local Businesses", icon: MapPin },
];

function CampaignActions({ copy }: { copy: MarketingService["copy"] }) {
  return (
    <div className="marketing-actions">
      <Button asChild size="lg">
        <Link href="/contact">
          {copy?.primaryButton ?? "Get a Free Consultation"} <ArrowUpRight aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/proposal">
          {copy?.secondaryButton ?? "Get Customised Proposal"} <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

export function MarketingServicePage({ service }: { service: MarketingService }) {
  const copy = service.copy;
  const href = marketingServiceHref(service);
  const url = `${site.origin}${href}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: service.label,
        serviceType: service.label,
        description: service.description,
        url,
        image: `${site.origin}${service.image}`,
        provider: { "@type": "Organization", name: site.legalName, url: site.origin },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: site.origin },
          { "@type": "ListItem", position: 2, name: service.label, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: service.faqs.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <div className="marketing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <section className="marketing-hero" aria-labelledby="marketing-title">
        <div className="marketing-container">
          <nav aria-label="Breadcrumb" className="marketing-breadcrumb">
            <ol>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li>
                <span aria-current="page">{service.label}</span>
              </li>
            </ol>
          </nav>
          <div className="marketing-hero-grid">
            <div className="marketing-hero-copy">
              <p className="marketing-eyebrow">
                <span aria-hidden="true" /> {copy?.heroTag ?? service.label}
              </p>
              <h1 id="marketing-title">
                {service.heading}
                <br />
                <span className="text-gradient-ember">{service.highlight}</span>
              </h1>
              <p className="marketing-intro">{service.intro}</p>
              <CampaignActions copy={copy} />
              <p className="marketing-hero-note">
                <MessageCircle className="size-4" aria-hidden="true" />{" "}
                {copy?.heroNote ?? "Start with your brief. We will help shape the next step."}
              </p>
            </div>
            <figure className="marketing-hero-visual">
              <MarketingHeroSlider slides={marketingHeroSlides(service)} label={service.label} />
              <figcaption>
                <span aria-hidden="true" className="marketing-caption-line" />
                {service.imageCaption}
              </figcaption>
            </figure>
          </div>
          <a className="marketing-explore" href="#about-service">
            Explore the service <ArrowDown className="size-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <section
        id="about-service"
        className="marketing-section marketing-container marketing-about"
        aria-labelledby="marketing-about-title"
      >
        <div>
          <p className="marketing-eyebrow">The bigger picture</p>
          <h2 id="marketing-about-title">{service.aboutHeading}</h2>
        </div>
        <div className="marketing-about-copy">
          {service.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul className="marketing-benefit-list">
            {service.benefits.map((benefit) => (
              <li key={benefit}>
                <Check className="size-4" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="marketing-tinted marketing-section"
        aria-labelledby="marketing-offerings-title"
      >
        <div className="marketing-container">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">{copy?.offerings.label ?? "From idea to execution"}</p>
            <h2 id="marketing-offerings-title">
              {copy?.offerings.heading ?? "Our Marketing Services"}
            </h2>
            <p>
              {copy?.offerings.intro ??
                `Thoughtful planning, purposeful creative and practical support for your ${service.label.toLowerCase()} campaign.`}
            </p>
          </div>
          <div className="marketing-offerings-grid">
            {service.offerings.map((offering, index) => {
              const Icon = offeringIcons[index] ?? Megaphone;
              return (
                <article className="surface-card marketing-offering" key={offering.title}>
                  <div className="marketing-card-top">
                    <span className="marketing-icon">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="marketing-card-number" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </div>
                  <h3>{offering.title}</h3>
                  <p>{offering.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="marketing-section marketing-container"
        aria-labelledby="marketing-why-title"
      >
        <div className="marketing-section-heading">
          <p className="marketing-eyebrow">{copy?.why.label ?? "A considered approach"}</p>
          <h2 id="marketing-why-title">{copy?.why.heading ?? "Why Choose Us"}</h2>
          <p>
            {copy?.why.intro ??
              "A clear scope, a collaborative process and a team that connects your marketing with the wider business."}
          </p>
        </div>
        <div className="marketing-reasons-grid">
          {service.reasons.map((reason, index) => {
            const Icon = reasonIcons[index] ?? ShieldCheck;
            return (
              <article key={reason.title} className="marketing-reason">
                <Icon className="size-6" aria-hidden="true" />
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="marketing-tinted marketing-section"
        aria-labelledby="marketing-process-title"
      >
        <div className="marketing-container">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">{copy?.process.label ?? "Clarity at every stage"}</p>
            <h2 id="marketing-process-title">{copy?.process.heading ?? "How It Works"}</h2>
            <p>
              {copy?.process.intro ??
                "One shared plan, from the first conversation to the campaign review."}
            </p>
          </div>
          <ol className="marketing-process">
            {steps.map((step, index) => (
              <li key={step}>
                <span className="marketing-step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step}</h3>
                <p>{service.process[index]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="marketing-section marketing-container"
        aria-labelledby="marketing-audience-title"
      >
        <div className="marketing-section-heading">
          <p className="marketing-eyebrow">
            {copy?.audiences.label ?? "Built around your business"}
          </p>
          <h2 id="marketing-audience-title">{copy?.audiences.heading ?? "Who Can Benefit"}</h2>
          <p>
            {copy?.audiences.intro ??
              "Your stage, your market and your priorities shape the campaign."}
          </p>
        </div>
        <div className="marketing-audiences">
          {audiences.map(({ title, icon: Icon }, index) => (
            <article key={title}>
              <Icon className="size-6" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{service.audiences[index]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-tinted marketing-section" aria-labelledby="marketing-faq-title">
        <div className="marketing-container marketing-faq-layout">
          <div>
            <p className="marketing-eyebrow">{copy?.faq.label ?? "Before we begin"}</p>
            <h2 id="marketing-faq-title">
              {copy?.faq.heading[0] ?? "Good questions."}
              <br />
              {copy?.faq.heading[1] ?? "Clear answers."}
            </h2>
            <p className="marketing-faq-intro">
              A few things to know about {service.label.toLowerCase()}.
            </p>
            <Link href="/contact" className="marketing-text-link">
              Talk to our team <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <MarketingFaq faqs={service.faqs} />
        </div>
      </section>

      <section
        id="marketing-consultation"
        className="marketing-section marketing-container"
        aria-labelledby="marketing-cta-title"
      >
        <div className="marketing-cta">
          <span className="marketing-icon">
            <MessageCircle className="size-6" aria-hidden="true" />
          </span>
          <p className="marketing-eyebrow">{copy?.cta.label ?? "Your next move starts here"}</p>
          <h2 id="marketing-cta-title">{service.ctaHeading}</h2>
          <p>{service.ctaDescription}</p>
          <CampaignActions copy={copy} />
          <p className="marketing-cta-note">
            {copy?.cta.note ??
              "Send a consultation enquiry or share your requirements for a tailored proposal."}
          </p>
        </div>
      </section>

      <section
        className="marketing-related marketing-container"
        aria-labelledby="marketing-related-title"
      >
        <p className="marketing-eyebrow">Keep exploring</p>
        <h2 id="marketing-related-title">More ways to reach your audience.</h2>
        <nav aria-label="Related marketing services">
          {marketingLinks
            .filter((link) => link.to !== href)
            .map((link) => (
              <Link href={link.to} key={link.to}>
                {link.label}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            ))}
        </nav>
      </section>
    </div>
  );
}
