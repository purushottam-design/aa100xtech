"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Check,
  ClipboardCheck,
  Clapperboard,
  Crosshair,
  Dumbbell,
  FileSearch,
  Gamepad2,
  GraduationCap,
  Handshake,
  House,
  Instagram,
  MapPin,
  Megaphone,
  Play,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Users,
  Utensils,
  Video,
  Youtube,
} from "lucide-react";
import { CampaignOffers } from "@/components/campaign-offers";
import { CampaignEnquiryForm } from "@/components/campaign-enquiry-form";
import { InfluencerDirectory, InfluencerCard } from "@/components/influencer-directory";
import { Price } from "@/components/currency-provider";
import { SectionHeading } from "@/components/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  creatorCategories,
  campaignServices,
  campaignPackages,
  campaignFaqs,
} from "@/data/influencer-marketing";
import { site } from "@/data/site";
import type { CreatorListing } from "@/lib/creator-discovery";

const categoryIcons = [
  Shirt,
  Gamepad2,
  Utensils,
  Dumbbell,
  GraduationCap,
  Briefcase,
  House,
  Clapperboard,
];
const serviceIcons = { Users, Sparkles, Video, ClipboardCheck, MapPin, Megaphone };
const registrationHref = "/influencers#join";
const features = [
  { icon: Search, name: "Creator Discovery", text: "Find the right influencers for your brand." },
  {
    icon: Crosshair,
    name: "Campaign Strategy",
    text: "Data-driven and creative campaign planning.",
  },
  {
    icon: Handshake,
    name: "Brand Partnerships",
    text: "Build authentic long-term collaborations.",
  },
  {
    icon: BarChart3,
    name: "Performance Analytics",
    text: "Track reach, engagement and campaign results.",
  },
];
const steps = [
  {
    icon: FileSearch,
    title: "Share Your Requirements",
    text: "Tell us your goals, budget and target audience.",
  },
  {
    icon: Search,
    title: "Discover & Select Creators",
    text: "Review a shortlist built around your campaign brief.",
  },
  {
    icon: Megaphone,
    title: "Launch the Campaign",
    text: "Approve the content, coordinate creators and publish.",
  },
  {
    icon: BarChart3,
    title: "Track Results",
    text: "Review agreed deliverables and campaign performance.",
  },
];
const formats = [
  {
    title: "Product launches",
    text: "Coordinated creator storytelling around a new product.",
    icon: Sparkles,
  },
  {
    title: "Reviews & tutorials",
    text: "Product demonstrations built around useful, honest content.",
    icon: Play,
  },
  {
    title: "Giveaways & contests",
    text: "Clear participation rules, content plans and reporting.",
    icon: Users,
  },
  {
    title: "Long-term ambassadors",
    text: "Ongoing creator collaborations with an agreed scope.",
    icon: Handshake,
  },
  {
    title: "Affiliate campaigns",
    text: "Trackable links, codes and an agreed attribution plan.",
    icon: BarChart3,
  },
  {
    title: "Local & regional reach",
    text: "City and language-specific briefs for relevant audiences.",
    icon: MapPin,
  },
];

function jumpTo(id: string) {
  const target = document.getElementById(id);
  target?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
}

export default function InfluencerMarketingPage({
  profiles = [],
  unavailable = false,
}: {
  profiles?: CreatorListing[];
  unavailable?: boolean;
}) {
  const [category, setCategory] = useState("");
  const [creator, setCreator] = useState<CreatorListing | null>(null);
  const [packageChoice, setPackageChoice] = useState("");
  const collaborate = (profile: CreatorListing) => {
    setCreator(profile);
    jumpTo("campaign-enquiry");
  };
  const choosePackage = (name: string) => {
    setPackageChoice(name);
    jumpTo("campaign-enquiry");
  };
  const featured = profiles.filter((profile) => profile.featured).slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Influencer Marketing",
        serviceType: "Influencer campaign planning and management",
        url: `${site.origin}/influencer-marketing`,
        provider: { "@type": "Organization", name: site.legalName, url: site.origin },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: site.origin },
          {
            "@type": "ListItem",
            position: 2,
            name: "Influencer Marketing",
            item: `${site.origin}/influencer-marketing`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: campaignFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };
  return (
    <div className="im-landing">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <section className="im-hero">
        <div aria-hidden="true" className="im-hero-glow" />
        <div className="im-container im-hero-layout">
          <div className="im-hero-copy">
            <Badge variant="secondary" className="im-eyebrow">
              <Sparkles aria-hidden="true" className="size-3.5" /> INFLUENCER MARKETING
            </Badge>
            <h1>
              Turn <span className="text-gradient-ember">Influence</span>
              <br /> Into Impact.
            </h1>
            <p className="im-hero-description">
              Connect your brand with the right creators. Build authentic campaigns that drive real
              growth.
            </p>
            <div className="im-hero-actions">
              <Button asChild size="lg">
                <a href="#creators">
                  Find Influencers <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to={registrationHref}>Become an Influencer</Link>
              </Button>
            </div>
            <div className="im-hero-note">
              <span className="im-note-icon">
                <ShieldCheck aria-hidden="true" className="size-4" />
              </span>
              <span>Real stories. Relevant audiences. A clear campaign plan.</span>
            </div>
            <p className="mt-6 text-sm font-semibold text-primary">
              Starting at <Price value="₹500" />
            </p>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              Existing service starting price. Your campaign scope, deliverables and quotation are
              agreed separately. Outcomes are not guaranteed.
            </p>
          </div>
          <figure className="im-hero-art" aria-label="Editorial creator photography">
            <div className="im-orbit im-orbit-one" aria-hidden="true" />
            <div className="im-orbit im-orbit-two" aria-hidden="true" />
            <span className="im-art-spark im-art-spark-one" aria-hidden="true">
              <Sparkles />
            </span>
            <span className="im-art-dot" aria-hidden="true" />
            <div className="im-portrait im-portrait-left" style={{ position: "absolute" }}>
              <Image
                src="/influencers/creator-podcast.webp"
                alt="Editorial portrait of a woman recording a podcast"
                fill
                sizes="(max-width: 640px) 32vw, 185px"
                loading="eager"
                className="object-cover"
              />
              <span className="im-photo-label">
                <Instagram className="size-3.5" /> Share your story
              </span>
            </div>
            <div className="im-portrait im-portrait-center" style={{ position: "absolute" }}>
              <Image
                src="/influencer-marketing/creator-portrait.webp"
                alt="Editorial portrait of a woman creating at her laptop"
                fill
                sizes="(max-width: 640px) 55vw, 280px"
                preload
                className="object-cover"
              />
              <span className="im-photo-label">
                <Sparkles className="size-3.5" /> Creativity that connects
              </span>
            </div>
            <div className="im-portrait im-portrait-right" style={{ position: "absolute" }}>
              <Image
                src="/influencers/creator-filmmaker.webp"
                alt="Editorial portrait of a filmmaker with a camera"
                fill
                sizes="(max-width: 640px) 32vw, 185px"
                loading="eager"
                className="object-cover"
              />
              <span className="im-photo-label">
                <Youtube className="size-3.5" /> Made to inspire
              </span>
            </div>
            <div className="im-floating-card im-floating-card-top">
              <span className="im-floating-icon">
                <Handshake className="size-5" />
              </span>
              <div>
                <strong>Authentic connections</strong>
                <span>Creators × brands</span>
              </div>
            </div>
            <div className="im-floating-card im-floating-card-bottom">
              <span className="im-floating-icon">
                <Megaphone className="size-5" />
              </span>
              <div>
                <strong>Your story. Their voice.</strong>
                <span>A campaign with purpose</span>
              </div>
              <ArrowUpRight className="size-4 text-primary" />
            </div>
            <figcaption>
              Editorial imagery. People pictured are not listed as registered partners.
            </figcaption>
          </figure>
        </div>
      </section>

      <section
        className="im-container im-feature-section"
        aria-label="Influencer marketing capabilities"
      >
        <div className="im-feature-strip">
          {features.map((feature) => (
            <article key={feature.name}>
              <span className="im-icon-box">
                <feature.icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2>{feature.name}</h2>
                <p>{feature.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="im-section im-container" id="creator-categories">
        <SectionHeading
          eyebrow="Find your people"
          title="Explore Creators by Category"
          description="Work with creators across diverse niches to reach your ideal audience."
        />
        <div className="im-category-grid">
          {creatorCategories.map((item, index) => {
            const Icon = categoryIcons[index]!;
            return (
              <button
                type="button"
                key={item.id}
                aria-pressed={category === item.id}
                onClick={() => {
                  setCategory(item.id);
                  jumpTo("creators");
                }}
                className="surface-card im-category-card group"
              >
                <div className="im-category-image" style={{ position: "relative" }}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 280px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="im-category-icon">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                </div>
                <div className="im-category-copy">
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <span className="im-category-link">
                    Explore creators <ArrowUpRight aria-hidden="true" className="size-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Category images are editorial illustrations, not registered creator profiles.
        </p>
      </section>

      <section id="creators" className="im-section im-tinted">
        <div className="im-container">
          <SectionHeading
            eyebrow="Discover a better fit"
            title="Find the Right Creator"
            description="Search and filter our creator network to find the perfect match for your campaign."
          />
          <div className="mt-9">
            <InfluencerDirectory
              profiles={profiles}
              unavailable={unavailable}
              marketing
              selectedCategory={category}
              onCategoryChange={setCategory}
              onCollaborate={collaborate}
              registrationHref={registrationHref}
            />
          </div>
        </div>
      </section>

      <section className="im-section im-container" id="featured-creators">
        <SectionHeading
          eyebrow="Creative voices"
          title="Featured Influencers"
          description="Explore approved public profiles and start a conversation about your next collaboration."
        />
        {featured.length ? (
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((profile) => (
              <InfluencerCard
                key={profile.id}
                profile={profile}
                onCollaborate={collaborate}
                showAudienceCounts={false}
              />
            ))}
          </div>
        ) : (
          <div className="im-featured-empty mt-9">
            <Users aria-hidden="true" className="size-7 text-primary" />
            <div>
              <h3>
                {unavailable
                  ? "Creator profiles are temporarily unavailable."
                  : "The next great partnership starts with an introduction."}
              </h3>
              <p>
                {unavailable
                  ? "Please retry the directory shortly. You can still share your brief with our team."
                  : "Featured profiles will appear here when approved creators opt in. Tell us your campaign goals while the network grows."}
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="#campaign-enquiry">
                Share your brief <ArrowUpRight />
              </a>
            </Button>
          </div>
        )}
      </section>

      <section className="im-section im-tinted">
        <div className="im-container im-audience-grid">
          <article className="surface-card im-audience-card">
            <Badge variant="secondary">FOR BRANDS</Badge>
            <h2>
              Grow Your Brand With the{" "}
              <span className="text-gradient-ember">Right Influencers</span>
            </h2>
            <p>
              Discover relevant creators, launch effective campaigns and reach your ideal audience.
            </p>
            <ul>
              {[
                "Creator discovery",
                "Campaign planning",
                "Content collaboration",
                "Brand promotions",
                "Performance reporting",
              ].map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" className="size-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild size="lg">
              <a href="#campaign-enquiry">
                Launch Your Campaign <ArrowUpRight />
              </a>
            </Button>
            <p className="im-fine-print">
              Shortlisting, rights, content approvals and reporting are scoped in your proposal.
            </p>
          </article>
          <article className="surface-card im-audience-card im-audience-creator">
            <Badge variant="secondary">FOR INFLUENCERS</Badge>
            <h2>
              Turn Your Creativity Into <span className="text-gradient-ember">Opportunities</span>
            </h2>
            <p>
              Join our creator network and connect with brands looking for authentic content
              creators.
            </p>
            <ul>
              {[
                "Brand collaboration opportunities",
                "Creator partnerships",
                "Campaign assignments",
                "Portfolio visibility",
                "Partnership support",
              ].map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" className="size-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="outline">
              <Link to={registrationHref}>
                Join Our Creator Network <ArrowUpRight />
              </Link>
            </Button>
            <p className="im-fine-print">
              Existing application, consent and approval rules apply. Opportunities are subject to a
              suitable brief.
            </p>
          </article>
        </div>
      </section>

      <section className="im-section im-container">
        <SectionHeading
          eyebrow="From the first brief to the final report"
          title="Influencer Marketing Services"
          description="Choose the support your campaign needs, with a clear scope and relevant creator partnerships."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaignServices.map((service) => {
            const Icon = serviceIcons[service.icon];
            return (
              <article key={service.name} className="surface-card im-service-card">
                <span className="im-icon-box">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <Link to={service.href} className="im-text-link">
                  Learn more <ArrowUpRight className="size-4" />
                </Link>
              </article>
            );
          })}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-5 text-sm">
          <Link to="/influencer-programs" className="im-text-link">
            Explore Influencer Programs <ArrowUpRight className="size-4" />
          </Link>
          <Link to="/contact" className="im-text-link">
            Talk to our team <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
      <CampaignOffers />

      <section id="campaign-packages" className="im-section im-tinted">
        <div className="im-container">
          <SectionHeading
            eyebrow="A scope that fits your goals"
            title="Your Campaign. Your Next Chapter."
            description="Start focused, grow your presence or plan a broader creative campaign. Every package receives a customised proposal."
          />
          <div className="im-package-grid">
            {campaignPackages.map((plan, index) => (
              <article
                key={plan.name}
                className={`surface-card im-package ${index === 1 ? "im-package-featured" : ""}`}
              >
                <span className="im-package-tag">{plan.tag}</span>
                <h3>{plan.name}</h3>
                <p className="im-package-audience">{plan.audience}</p>
                <p>{plan.description}</p>
                <p className="im-custom-price">Customised proposal</p>
                <ul>
                  {plan.features.map((item) => (
                    <li key={item}>
                      <Check aria-hidden="true" className="size-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant={index === 1 ? "default" : "outline"}
                  onClick={() => choosePackage(plan.name)}
                >
                  Get Customised Proposal <ArrowUpRight />
                </Button>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Final deliverables and fees are agreed before work begins. No guaranteed reach,
            virality, followers or revenue.
          </p>
        </div>
      </section>

      <section className="im-section im-container">
        <SectionHeading
          eyebrow="A simple, collaborative process"
          title="How It Works"
          description="One clear brief. The right creator fit. A campaign you can follow from start to finish."
        />
        <ol className="im-process-grid">
          {steps.map((step, index) => (
            <li key={step.title} className="surface-card im-process-card">
              <div className="im-step-number">
                <step.icon aria-hidden="true" className="size-5" />
                <span>0{index + 1}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="im-section im-tinted" id="campaign-enquiry">
        <div className="im-container im-enquiry-layout">
          <div>
            <Badge variant="secondary">LET'S BUILD SOMETHING RELEVANT</Badge>
            <h2>
              A good campaign starts with <span className="text-gradient-ember">your story.</span>
            </h2>
            <p>
              Tell us who you want to reach and what you want them to remember. We’ll review the
              brief and discuss the creator fit, deliverables and next steps.
            </p>
            <ul className="im-enquiry-points">
              {[
                "A brief built around your business",
                "Creator selection with audience fit in mind",
                "Agreed scope, usage rights and timelines",
                "Reporting aligned with your objectives",
              ].map((item) => (
                <li key={item}>
                  <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/consultation" className="im-text-link mt-7">
              Prefer a conversation? Book Consultation <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <CampaignEnquiryForm
            creator={creator}
            categoryChoice={category}
            packageChoice={packageChoice}
            onPackageChange={setPackageChoice}
            onClearCreator={() => setCreator(null)}
          />
        </div>
      </section>

      <section className="im-section im-container">
        <SectionHeading
          eyebrow="Ideas for your next brief"
          title="Campaigns That Create Impact"
          description="Explore the formats we can plan with you. These are campaign concepts, not completed client campaigns or reported results."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formats.map((format) => (
            <article key={format.title} className="surface-card im-concept-card">
              <format.icon aria-hidden="true" className="size-6 text-primary" />
              <span className="im-concept-label">Campaign concept</span>
              <h3>{format.title}</h3>
              <p>{format.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="im-section im-tinted">
        <div className="im-container im-faq-layout">
          <SectionHeading
            align="left"
            eyebrow="A little clarity"
            title="Good questions. Clear answers."
            description="What brands and creators ask before their first collaboration."
          />
          <Accordion type="single" collapsible>
            {campaignFaqs.map((faq, index) => (
              <AccordionItem key={faq.q} value={`question-${index}`}>
                <AccordionTrigger className="gap-4 py-5 text-base">{faq.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="im-section im-container">
        <div className="im-final-cta">
          <span className="im-icon-box">
            <Megaphone aria-hidden="true" className="size-6" />
          </span>
          <h2>
            Ready to Grow With
            <br />
            <span className="text-gradient-ember">Influencer Marketing?</span>
          </h2>
          <p>
            Connect with our team to plan an influencer campaign that fits your brand and business
            goals.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="#campaign-enquiry">
                Get Customised Proposal <ArrowUpRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/consultation">Book Consultation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
