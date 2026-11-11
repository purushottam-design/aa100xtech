import Link from "next/link";
import { ArrowRight, Check, Clapperboard, Globe2, Music2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { influencerProgramPackages } from "@/data/influencer-program-packages";

const icons = [Globe2, Music2, Clapperboard];

export function InfluencerProgramPackages() {
  return (
    <section
      className="ji-container ji-section ji-program-section"
      aria-labelledby="ji-program-title"
    >
      <div className="ji-section-heading">
        <p className="ji-label">Influencer Program</p>
        <p className="ji-program-categories">
          Digital Presence | Content Production | Entertainment
        </p>
        <h2 id="ji-program-title">
          A Flexible Creator Ecosystem – From Personal Brand to Original IP.
        </h2>
        <p>
          Build your digital identity, create engaging content, and explore professional
          entertainment opportunities with Absolute Advancement 100X Tech.
        </p>
        <p>
          Our influencer program brings together website development, creator applications, branding
          tools, content production, music, microdramas, and digital distribution support within one
          flexible partnership ecosystem.
        </p>
        <p>
          Whether you are an emerging influencer, an experienced content creator, a musician, or an
          entertainment professional, explore services designed to support your creative journey.
        </p>
      </div>
      <div className="ji-section-heading ji-program-packages-heading">
        <p className="ji-label">Program Packages</p>
        <h2 id="ji-packages-title">Choose a Starting Package. Expand as You Grow.</h2>
        <p>
          Choose a starting package based on your current goals, content requirements, and
          professional needs. From building your personal brand to producing original entertainment
          content, our flexible packages help you explore services as your audience and creative
          projects develop.
        </p>
      </div>
      <div className="ji-program-grid" aria-labelledby="ji-packages-title">
        {influencerProgramPackages.map((program, index) => {
          const Icon = icons[index]!;
          return (
            <article className="ji-package-card" key={program.name}>
              <div className="ji-package-heading">
                <Icon className="ji-benefit-icon" aria-hidden="true" strokeWidth={1.7} />
                <span>Package {String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{program.name}</h3>
              <p className="ji-package-tagline">{program.tagline}</p>
              <p>{program.description}</p>
              <ul className="ji-package-services">
                {program.services.map((service) => (
                  <li key={service.label}>
                    <Check aria-hidden="true" />
                    {service.benefit ? (
                      <a href={`#ji-benefit-${service.benefit}`}>
                        {service.label}
                        <span className="sr-only">: view support details</span>
                      </a>
                    ) : (
                      service.label
                    )}
                  </li>
                ))}
              </ul>
              <details className="ji-package-details">
                <summary
                  className={buttonVariants({
                    variant: "outline",
                    size: "lg",
                    className: "ji-package-explore",
                  })}
                >
                  Explore {program.name}
                  <ArrowRight aria-hidden="true" />
                </summary>
                <div className="ji-package-detail-content">
                  {program.details.map((detail) => (
                    <div key={detail.title}>
                      <h4>{detail.title}</h4>
                      <ul>
                        {detail.features.map((feature) => (
                          <li key={feature}>
                            <Check aria-hidden="true" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <p>
                    These are support options, subject to an approved scope and availability.
                    Explore the linked services above for their support details. All services depend
                    on your approved plan and agreement.
                  </p>
                </div>
              </details>
            </article>
          );
        })}
      </div>
      <div className="ji-program-pricing" aria-labelledby="ji-pricing-title">
        <p className="ji-label">Flexible Pricing</p>
        <h2 id="ji-pricing-title">Custom Packages Built Around Your Creative Goals.</h2>
        <p>
          Pricing is provided through a custom quotation based on project scope, production
          requirements, service selection, complexity, and agreed deliverables. You can start with a
          suitable package and explore additional services as your creative needs develop.
        </p>
        <p>
          Domain registration, domain renewal, professional email subscriptions, website hosting,
          application hosting, platform fees, production expenses, music licenses, distribution
          charges, and advertising budgets may be billed separately.
        </p>
        <p>
          All applicable services, fees, timelines, deliverables, and ownership terms will be
          defined in the approved proposal or partnership agreement.
        </p>
        <p>
          Music, albums, microdramas, and original IP projects use original or properly licensed
          creative assets. Ownership, usage rights, and licensing are defined in the project
          agreement; copyright ownership is not automatically transferred. Production and
          distribution availability must be confirmed in your proposal. Platform acceptance,
          audience growth, earnings, and brand deals are not guaranteed.
        </p>
        <div className="ji-actions">
          <Button asChild size="lg" variant="outline">
            <Link href="/proposal">
              Get Customised Proposal
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
