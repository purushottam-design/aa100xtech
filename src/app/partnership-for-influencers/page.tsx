import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clapperboard,
  ClipboardCheck,
  CloudUpload,
  Globe2,
  Handshake,
  ImageIcon,
  Instagram,
  Layers3,
  Lightbulb,
  Mail,
  Megaphone,
  Monitor,
  Music2,
  PanelsTopLeft,
  Play,
  Server,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Theater,
  UserRound,
  UsersRound,
  Video,
  Youtube,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { MarketingFaq } from "@/components/marketing-service-faq";
import { withSocialMetadata } from "@/lib/page-metadata";
import {
  partnershipApplicationHref,
  partnershipAudiences,
  partnershipBenefits,
  partnershipFaqs,
  partnershipPrograms,
  partnershipProposalHref,
  partnershipReasons,
  partnershipSteps,
  partnershipSupport,
} from "@/data/influencer-partnership";
import "./partnership-for-influencers.css";

export const metadata: Metadata = withSocialMetadata({
  title: "Partnership for Influencers | Creator Program – AA100XTech",
  description:
    "Explore partnership opportunities for influencers at AA100XTech. Discover creator websites, apps, professional branding, content production, music, microdramas, and digital support.",
  keywords: [
    "Partnership for Influencers",
    "Influencer Partnership Program",
    "Join Influencer Partnership",
    "Creator Partnership Program",
    "Influencer Collaboration",
    "Content Creator Partnership",
    "Influencer Branding Support",
    "Influencer Portfolio Website",
    "Creator Website Development",
    "Influencer App Development",
    "Content Creator Services",
    "Music Production for Creators",
    "Microdrama Production",
    "Influencer Digital Support",
  ],
  alternates: { canonical: "https://aa100xtech.com/partnership-for-influencers" },
  openGraph: {
    images: [
      {
        url: "/influencers/partnership-creator-hero.webp",
        width: 1200,
        height: 1200,
        alt: "Creator recording content with a smartphone, ring light and laptop in a warm studio",
      },
    ],
  },
  twitter: { images: ["/influencers/partnership-creator-hero.webp"] },
});

const benefitIcons = [
  Monitor,
  PanelsTopLeft,
  Smartphone,
  Mail,
  Globe2,
  Server,
  CloudUpload,
  ImageIcon,
  Video,
  Sparkles,
  Play,
  Music2,
];
const programIcons = [Monitor, Music2, Clapperboard];
const audienceIcons = [UserRound, Star, Youtube, Instagram, Music2, Theater];
const supportIcons = [Megaphone, Lightbulb, Layers3, Video];

function Actions() {
  return (
    <div className="pfi-actions">
      <Button asChild size="lg">
        <Link href={partnershipApplicationHref}>
          <UsersRound aria-hidden="true" /> Apply for Influencer Partnership{" "}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href={partnershipProposalHref()}>
          Get Customised Partnership Proposal <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function Heading({ label, title, id }: { label: string; title: string; id: string }) {
  return (
    <div className="pfi-heading">
      <p className="pfi-label">{label}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

export default function PartnershipForInfluencersPage() {
  return (
    <div className="pfi-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: partnershipFaqs.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: { "@type": "Answer", text: answer },
            })),
          }).replace(/</g, "\\u003c"),
        }}
      />

      <section className="pfi-hero" aria-labelledby="pfi-title">
        <div className="pfi-container pfi-hero-grid">
          <div className="pfi-hero-copy">
            <p className="pfi-label">Partnership for Influencers</p>
            <h1 id="pfi-title">
              Create Your Identity.<span>Grow Your Influence.</span>Build Your Future with
              AA100XTech.
            </h1>
            <p className="pfi-hero-intro">
              Take your creator journey beyond social media with a professional partnership designed
              around your digital identity, creative ambitions, and long-term growth.
            </p>
            <p className="pfi-hero-detail">
              At Absolute Advancement 100X Tech, we bring technology, digital branding, content
              production, and entertainment support together. From portfolio websites and creator
              applications to original content, music projects, microdramas, and digital publishing
              support, explore services that can help turn your creative ideas into meaningful
              opportunities.
            </p>
            <p className="pfi-hero-statement">
              Your Creativity. Our Technology. One Powerful Partnership.
            </p>
            <Actions />
            <ul className="pfi-highlights">
              {[
                "Professional Creator Branding",
                "Digital Presence & Technology",
                "Creative Content Production",
                "Entertainment & Growth Support",
              ].map((text) => (
                <li key={text}>
                  <CheckCircle2 aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <figure className="pfi-hero-visual">
            <Image
              src="/influencers/partnership-creator-hero.webp"
              alt="Illustrative Indian content creator recording a video on a smartphone beside a ring light and laptop in a bright, golden-toned studio"
              width={1200}
              height={1200}
              preload
              sizes="(min-width: 1280px) 600px, (min-width: 900px) 48vw, 100vw"
            />
            <span className="pfi-social pfi-social-instagram" aria-hidden="true">
              <Instagram />
            </span>
            <span className="pfi-social pfi-social-youtube" aria-hidden="true">
              <Youtube />
            </span>
            <span className="pfi-visual-note">
              <span className="pfi-note-icon">
                <Sparkles aria-hidden="true" />
              </span>
              <span>
                Your next chapter.<strong>Created together.</strong>
              </span>
            </span>
          </figure>
        </div>
      </section>

      <div className="pfi-container">
        <section className="pfi-section pfi-about" aria-labelledby="pfi-about-title">
          <div>
            <Heading
              label="About the program"
              title="More Than a Collaboration. A Complete Creator Growth Ecosystem."
              id="pfi-about-title"
            />
            <p>
              Being an influencer today involves more than creating and publishing social media
              content. Creators need professional portfolios, branded communication channels,
              original content strategies, reliable digital tools, and meaningful collaboration
              opportunities.
            </p>
            <p>
              Our Partnership for Influencers program brings digital presence, creative production,
              entertainment services, and technical support together in a flexible collaboration
              framework. Explore solutions suited to your goals.
            </p>
          </div>
          <div className="pfi-about-cards">
            {[
              {
                icon: Monitor,
                title: "Build Your Digital Identity",
                text: "Develop a professional online presence through websites, portfolios, domains, branding and creator tools.",
              },
              {
                icon: Camera,
                title: "Create Meaningful Content",
                text: "Explore professional image, video, music and AI-assisted creative resources for your content journey.",
              },
              {
                icon: Clapperboard,
                title: "Explore Bigger Opportunities",
                text: "Develop original projects, entertainment concepts and potential collaboration opportunities.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <article className="pfi-card pfi-about-card" key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pfi-section" aria-labelledby="pfi-benefits-title">
          <div className="pfi-section-top">
            <Heading
              label="Partnership benefits"
              title="Everything You Need to Build a Stronger Creator Presence."
              id="pfi-benefits-title"
            />
            <p>
              Explore connected digital tools, branding services, creative resources and technical
              support for your creator journey.
            </p>
          </div>
          <div className="pfi-benefit-grid">
            {partnershipBenefits.map((benefit, index) => {
              const Icon = benefitIcons[index]!;
              return (
                <article className="pfi-card pfi-benefit" key={benefit.title}>
                  <Icon aria-hidden="true" />
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                    <details>
                      <summary>
                        View details <span className="sr-only">for {benefit.title}</span>
                        <ArrowRight aria-hidden="true" />
                      </summary>
                      <p>{benefit.detail}</p>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="pfi-scope-note">
            <CheckCircle2 aria-hidden="true" /> Benefits depend on your approved partnership scope
            and agreement. Services are not automatically free, unlimited or guaranteed upon
            application.
          </p>
        </section>

        <section className="pfi-section" aria-labelledby="pfi-program-title">
          <div className="pfi-section-top">
            <Heading
              label="Our program packages"
              title="Choose Your Starting Point. Expand Your Creative Possibilities."
              id="pfi-program-title"
            />
            <p>
              Every creator has different ambitions, audiences and content requirements. Explore
              three flexible service categories.
            </p>
          </div>
          <div className="pfi-program-grid">
            {partnershipPrograms.map((program, index) => {
              const Icon = programIcons[index]!;
              return (
                <article className="pfi-card pfi-package" id={`pfi-${program.id}`} key={program.id}>
                  <div className="pfi-package-top">
                    <span className="pfi-package-icon">
                      <Icon aria-hidden="true" />
                    </span>
                    <div>
                      <span className="pfi-number">0{index + 1}</span>
                      <h3>{program.name}</h3>
                      <p>{program.tagline}</p>
                    </div>
                  </div>
                  <p className="pfi-package-intro">{program.description}</p>
                  <ul className="pfi-package-services">
                    {program.services.map((service) => (
                      <li key={service.title}>
                        <CheckCircle2 aria-hidden="true" />
                        <span>
                          <strong>{service.title}</strong> <span>({service.short})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <details className="pfi-package-details">
                    <summary className={buttonVariants({ size: "lg", className: "pfi-explore" })}>
                      Explore {program.name}
                      <ArrowRight aria-hidden="true" />
                    </summary>
                    <div className="pfi-package-expanded">
                      {program.services.map((service) => (
                        <div key={service.title}>
                          <h4>{service.title}</h4>
                          <ul>
                            {service.features.map((feature) => (
                              <li key={feature}>
                                <Check aria-hidden="true" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <p>
                        Services, availability, ownership and licensing are confirmed in your
                        approved proposal.
                      </p>
                      <Button asChild variant="outline">
                        <Link href={partnershipProposalHref(program.id)}>
                          Request a proposal for {program.name} <ArrowRight aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="pfi-section pfi-why-process"
          aria-label="Why partner with us and how it works"
        >
          <div className="pfi-why">
            <Heading
              label="Why choose us"
              title="A Strategic, Transparent, and Creator-Focused Partnership."
              id="pfi-why-title"
            />
            <p>
              Your creative identity deserves more than a temporary promotional opportunity. We
              combine technology, branding, creative resources and practical project coordination.
            </p>
            <div className="pfi-why-content">
              <ul className="pfi-check-list">
                {partnershipReasons.map(([title, text]) => (
                  <li key={title}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pfi-partnership-art" aria-hidden="true">
                <Target />
                <Handshake />
              </div>
            </div>
          </div>
          <div className="pfi-process">
            <Heading
              label="Our process"
              title="A Simple, Transparent Process to Become an Influencer Partner."
              id="pfi-process-title"
            />
            <ol className="pfi-timeline">
              {partnershipSteps.map(([title, description], index) => (
                <li key={title}>
                  <span className="pfi-step-number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  {index < 4 && <ArrowRight className="pfi-step-arrow" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="pfi-section pfi-audience-support"
          aria-label="Who can join and creator support"
        >
          <div>
            <Heading
              label="Who can join"
              title="A Creator Partnership Program for Different Creative Ambitions."
              id="pfi-audience-title"
            />
            <p>
              Starting your digital journey or expanding an established brand? Explore support
              aligned with your goals.
            </p>
            <div className="pfi-audience-grid">
              {partnershipAudiences.map(([title, text], index) => {
                const Icon = audienceIcons[index]!;
                return (
                  <article className="pfi-card pfi-small-card" key={title}>
                    <Icon aria-hidden="true" />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="pfi-support">
            <Heading
              label="Creator support"
              title="The Digital Tools and Creative Support Behind Your Growth."
              id="pfi-support-title"
            />
            <p>
              Technology, organisation and creative resources working together to help you manage
              your identity, produce content and develop new projects.
            </p>
            <div className="pfi-support-grid">
              {partnershipSupport.map(([title, text], index) => {
                const Icon = supportIcons[index]!;
                return (
                  <article className="pfi-card pfi-small-card" key={title}>
                    <Icon aria-hidden="true" />
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="pfi-section pfi-pricing-faq"
          aria-label="Partnership plans and common questions"
        >
          <div className="pfi-pricing">
            <Heading
              label="Flexible partnership plans"
              title="Customised Partnership Packages for Your Creative Goals."
              id="pfi-pricing-title"
            />
            <div className="pfi-pricing-copy">
              <div>
                <p className="pfi-quotation">Pricing: Custom Quotation</p>
                <p>
                  Pricing is based on selected services, website or app complexity, production
                  requirements, creative quantities, hosting, third-party costs, timelines and
                  agreed deliverables.
                </p>
                <ul className="pfi-check-list">
                  <li>
                    <CheckCircle2 aria-hidden="true" />
                    <span>
                      Domain registration, renewals, email subscriptions, hosting, platform fees,
                      licenses, advertising, music production and distribution expenses may be
                      billed separately.
                    </span>
                  </li>
                  <li>
                    <CheckCircle2 aria-hidden="true" />
                    <span>
                      All services, fees, timelines, deliverables, ownership and licensing terms are
                      defined in your approved agreement.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="pfi-clipboard" aria-hidden="true">
                <ClipboardCheck />
              </div>
            </div>
            <Button asChild size="lg" variant="outline">
              <Link href={partnershipProposalHref()}>
                Get Customised Partnership Proposal <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="pfi-faq">
            <Heading
              label="Frequently asked questions"
              title="Everything You Need to Know About Influencer Partnerships."
              id="pfi-faq-title"
            />
            <MarketingFaq faqs={partnershipFaqs} />
          </div>
        </section>

        <section className="pfi-final" aria-labelledby="pfi-final-title">
          <div>
            <p className="pfi-label">Start your creator partnership journey</p>
            <h2 id="pfi-final-title">
              Your Creativity Deserves a Bigger Platform.<span>Let’s Build It Together.</span>
            </h2>
          </div>
          <div>
            <p>
              Build your professional digital identity, explore creative tools, develop original
              content, and discover suitable collaboration opportunities through AA100XTech. Tell us
              about your content, your audience, and your creative ambitions.
            </p>
            <Actions />
          </div>
          <Clapperboard className="pfi-final-art" aria-hidden="true" />
        </section>
      </div>
    </div>
  );
}
