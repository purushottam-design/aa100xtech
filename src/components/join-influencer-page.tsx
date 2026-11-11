import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Check,
  Clapperboard,
  CloudUpload,
  Gem,
  Globe2,
  Handshake,
  Heart,
  Images,
  Instagram,
  Mail,
  Megaphone,
  Monitor,
  PanelsTopLeft,
  Play,
  Server,
  Settings2,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  Video,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingFaq } from "@/components/marketing-service-faq";
import { InfluencerProgramPackages } from "@/components/influencer-program-packages";
import {
  creatorApplicationHref,
  joinInfluencerBenefits,
  joinInfluencerFaqs,
  joinInfluencerReasons,
  joinInfluencerSteps,
  joinInfluencerSupport,
} from "@/data/join-influencer";

const benefitIcons = [
  Monitor,
  PanelsTopLeft,
  Mail,
  Smartphone,
  Clapperboard,
  Images,
  Sparkles,
  Video,
  Server,
  CloudUpload,
  Globe2,
];
const supportIcons = [Gem, UsersRound, Megaphone, Settings2];
const highlights = [
  "Professional Brand Support",
  "Creator Portfolio Setup",
  "Website & Hosting Assistance",
  "Creative Content & Prompt Support",
];

function JoinActions() {
  return (
    <div className="ji-actions">
      <Button asChild size="lg">
        <Link href={creatorApplicationHref}>
          Join as Influencer <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/proposal">
          Get Customised Proposal <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function PartnershipIllustration() {
  return (
    <div className="ji-partnership-art" aria-hidden="true">
      <div className="ji-art-orb ji-art-growth">
        <TrendingUp />
      </div>
      <div className="ji-art-orb ji-art-handshake">
        <Handshake />
      </div>
      <div className="ji-art-orb ji-art-award">
        <Award />
      </div>
      <Target className="ji-art-target" />
    </div>
  );
}

export function JoinInfluencerPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: joinInfluencerFaqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <div className="join-influencer">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }}
      />
      <section className="ji-hero" aria-labelledby="ji-title">
        <div className="ji-container ji-hero-grid">
          <div className="ji-hero-copy">
            <p className="ji-label">Join Us – Influencer</p>
            <h1 id="ji-title">
              Join AA100XTech as an Influencer Partner.<span>Grow, Create, and Earn with Us.</span>
            </h1>
            <p className="ji-hero-intro">
              Creators and influencers can collaborate with Absolute Advancement 100X Tech to access
              professional digital support, personal branding solutions, creator-focused tools, and
              opportunities to expand their online presence.
            </p>
            <JoinActions />
            <ul className="ji-highlights">
              {highlights.map((highlight) => (
                <li key={highlight}>
                  <span>
                    <Check aria-hidden="true" />
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
          <figure className="ji-hero-visual">
            <Image
              src="/influencers/join-creator-hero.webp"
              alt="Illustrative creator in an orange sweater working at a laptop beside a smartphone and ring light in a bright studio"
              fill
              preload
              sizes="(min-width: 1280px) 650px, (min-width: 768px) 54vw, 100vw"
              className="ji-hero-photo"
            />
            <div className="ji-hero-float ji-float-growth" aria-hidden="true">
              <TrendingUp />
            </div>
            <div className="ji-hero-float ji-float-video" aria-hidden="true">
              <Youtube />
            </div>
            <div className="ji-hero-float ji-float-instagram" aria-hidden="true">
              <Instagram />
            </div>
            <div className="ji-hero-float ji-float-heart" aria-hidden="true">
              <Heart />
              <span />
              <span />
              <span />
            </div>
          </figure>
        </div>
      </section>

      <section
        className="ji-container ji-section ji-benefits-section"
        aria-labelledby="ji-benefits-title"
      >
        <div className="ji-section-heading">
          <p className="ji-label">What you get</p>
          <h2 id="ji-benefits-title">Everything We Provide When You Join Us.</h2>
          <p>
            Joining AA100XTech as an influencer partner gives you access to a range of digital
            services, creative resources, and professional support options designed to strengthen
            your personal brand and online presence.
          </p>
          <p>
            Depending on your approved partnership plan, our team can assist with portfolio
            development, digital branding, content creation resources, website infrastructure, and
            creator-focused technical solutions.
          </p>
        </div>
        <div className="ji-benefit-grid">
          {joinInfluencerBenefits.map((benefit, index) => {
            const Icon = benefitIcons[index]!;
            return (
              <article
                key={benefit.title}
                id={`ji-benefit-${index + 1}`}
                className="ji-benefit-card"
              >
                <Icon className="ji-benefit-icon" aria-hidden="true" strokeWidth={1.7} />
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                  <details className="ji-benefit-details">
                    <summary>
                      <span className="sr-only">{benefit.title}: </span>Explore support{" "}
                      <ArrowRight aria-hidden="true" />
                    </summary>
                    <p>{benefit.detail}</p>
                    <ul>
                      {benefit.features.map((feature) => (
                        <li key={feature}>
                          <Check aria-hidden="true" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
        <p className="ji-scope-note">
          <Check aria-hidden="true" /> Support options are subject to your approved partnership plan
          and written agreement. Scope, costs, ownership, and renewals are confirmed before setup.
        </p>
      </section>

      <InfluencerProgramPackages />

      <section
        className="ji-container ji-why-process ji-section"
        aria-label="Partnership approach and joining process"
      >
        <div className="ji-why" aria-labelledby="ji-why-title">
          <p className="ji-label">Why join AA100XTech</p>
          <h2 id="ji-why-title">A Strategic, Transparent, and Growth-Focused Partnership.</h2>
          <p className="ji-section-description">
            Building a successful creator identity requires more than publishing content. Our
            approach brings together technology, creative development, and practical support to help
            creators establish a stronger professional presence.
          </p>
          <div className="ji-why-content">
            <ul className="ji-reasons">
              {joinInfluencerReasons.map((reason) => (
                <li key={reason.title}>
                  <Check aria-hidden="true" />
                  <div>
                    <h3>{reason.title}</h3>
                    <p>{reason.description}</p>
                  </div>
                </li>
              ))}
            </ul>
            <PartnershipIllustration />
          </div>
        </div>
        <div className="ji-process" aria-labelledby="ji-process-title">
          <p className="ji-label">Our process</p>
          <h2 id="ji-process-title">A Clear Process to Join as an Influencer.</h2>
          <p className="ji-section-description">
            We follow a structured process to understand your creative background, assess
            partnership suitability, and identify the digital support or collaboration opportunities
            that may fit your goals.
          </p>
          <ol className="ji-process-steps">
            {joinInfluencerSteps.map((step, index) => (
              <li key={step.title}>
                <span className="ji-step-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {index < joinInfluencerSteps.length - 1 && (
                  <ArrowRight className="ji-step-arrow" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="ji-container ji-section ji-support-section"
        aria-labelledby="ji-support-title"
      >
        <div className="ji-section-heading">
          <p className="ji-label">Additional support</p>
          <h2 id="ji-support-title">More Than Just a Collaboration.</h2>
          <p>
            Our influencer partnership approach brings together digital tools, brand-building
            guidance, content resources, and practical technical support to help creators grow
            professionally.
          </p>
        </div>
        <div className="ji-support-grid">
          {joinInfluencerSupport.map((support, index) => {
            const Icon = supportIcons[index]!;
            return (
              <article className="ji-support-card" key={support.title}>
                <Icon aria-hidden="true" strokeWidth={1.7} />
                <div>
                  <h3>{support.title}</h3>
                  <p>{support.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ji-container ji-section ji-faq-section" aria-labelledby="ji-faq-title">
        <div className="ji-section-heading">
          <p className="ji-label">Frequently asked questions</p>
          <h2 id="ji-faq-title">Common Questions About Joining as an Influencer.</h2>
        </div>
        <MarketingFaq faqs={joinInfluencerFaqs} />
      </section>

      <section className="ji-container ji-final-cta" aria-labelledby="ji-cta-title">
        <div className="ji-laptop-art" aria-hidden="true">
          <div className="ji-laptop-glow" />
          <div className="ji-laptop-screen">
            <span className="ji-laptop-logo">
              <Image src="/logo.png" width={260} height={72} alt="" loading="eager" />
            </span>
          </div>
          <div className="ji-laptop-base" />
          <div className="ji-laptop-icon ji-laptop-image">
            <Images />
          </div>
          <div className="ji-laptop-icon ji-laptop-video">
            <Clapperboard />
            <Play />
          </div>
        </div>
        <div className="ji-final-copy">
          <p className="ji-label">Start your creator journey</p>
          <h2 id="ji-cta-title">Ready to Join AA100XTech as an Influencer?</h2>
          <p>
            Share your creator profile, content interests, and professional goals with our team.
            Explore a partnership designed to support your digital identity, content development,
            technical setup, and potential collaboration opportunities.
          </p>
          <JoinActions />
          <p className="ji-final-note">
            <Check aria-hidden="true" /> Start your partnership journey with professional branding
            guidance, creative resources, and digital support options.
          </p>
        </div>
      </section>
    </div>
  );
}
