"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ClipboardList,
  Dumbbell,
  Gamepad2,
  Handshake,
  Instagram,
  Layers3,
  Link2,
  MapPin,
  Megaphone,
  Music2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  UsersRound,
  Utensils,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfluencerProgramApplication } from "@/components/influencer-program-application";
import { CampaignEnquiryForm } from "@/components/campaign-enquiry-form";
import { InfluencerDirectory } from "@/components/influencer-directory";
import { creatorCategories } from "@/data/influencer-marketing";
import { applicationPath } from "@/lib/influencers";
import type { CreatorListing } from "@/lib/creator-discovery";

const highlights = [
  [Handshake, "Brand Collaborations", "Work with emerging and established brands."],
  [ShieldCheck, "Verified Opportunities", "Access curated collaboration opportunities."],
  [Megaphone, "Campaign Support", "Get campaign planning and collaboration assistance."],
  [
    ChartNoAxesCombined,
    "Earnings Growth",
    "Explore opportunities to monetize your creator content.",
  ],
] as const;
const paths = [
  [
    UserRound,
    "Influencer",
    "Content creators who want to collaborate on brand campaigns and grow their influence.",
    "Join as Influencer",
    "#join",
  ],
  [
    BriefcaseBusiness,
    "Brand Partner",
    "Brands looking to run impactful influencer campaigns with the right creators.",
    "Launch Campaign",
    "#brand-enquiry",
  ],
  [
    Link2,
    "Affiliate Partner",
    "Creators and partners who want to explore referral-based collaborations.",
    "Explore Affiliate Program",
    "/affiliates",
  ],
  [
    MapPin,
    "Regional Partner",
    "Help build regional business relationships and connect local creators and brands.",
    "Explore Partnerships",
    "/partners",
  ],
] as const;
const steps = [
  [ClipboardList, "Apply", "Share your creator profile and collaboration interests."],
  [ShieldCheck, "Get Verified", "Our team reviews your information and partnership fit."],
  [Layers3, "Match With Campaigns", "Eligible creators can receive relevant opportunities."],
  [ChartNoAxesCombined, "Grow Together", "Create, collaborate and build long-term value."],
] as const;
const categoryIcons = [ShoppingBag, Gamepad2, Utensils, Dumbbell];

export function InfluencerPartnerLanding({
  profiles,
  unavailable,
}: {
  profiles: CreatorListing[];
  unavailable: boolean;
}) {
  const [category, setCategory] = useState("");
  const [campaignPackage, setCampaignPackage] = useState("");
  const [creator, setCreator] = useState<CreatorListing | null>(null);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window)) return;
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animations.push(
            entry.target.animate(
              [
                { opacity: 0.5, transform: "translateY(10px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 350, easing: "ease-out" },
            ),
          );
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 },
    );
    document
      .querySelectorAll(
        ".influencer-program .ipp-path, .influencer-program .ipp-process li, .influencer-program .ipp-category",
      )
      .forEach((node) => observer.observe(node));
    const stop = () => {
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
    motion.addEventListener("change", stop);
    return () => {
      stop();
      motion.removeEventListener("change", stop);
    };
  }, []);
  function chooseCreator(profile: CreatorListing) {
    setCreator(profile);
    document.getElementById("brand-enquiry")?.scrollIntoView({ block: "start" });
  }
  return (
    <>
      <section className="ipp-hero-shell" aria-labelledby="program-title">
        <div className="ip-container ipp-hero">
          <div className="ipp-hero-copy">
            <p className="ipp-badge">
              <UsersRound size={17} /> Influencer Partner Program
            </p>
            <h1 id="program-title">
              Partner With Influence.
              <br />
              Grow With <span className="ip-gradient-text">Impact.</span>
            </h1>
            <p className="ipp-hero-description">
              Join the AA100XTECH Influencer Partner Program and collaborate with leading brands,
              unlock curated opportunities, and turn your influence into meaningful growth.
            </p>
            <div className="ipp-actions">
              <Button asChild size="lg">
                <a href="#join">
                  Join as Influencer <ArrowRight />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#brand-enquiry">Launch Brand Campaign</a>
              </Button>
            </div>
          </div>
          <figure className="ipp-collage" aria-label="Editorial creator photography">
            <div className="ipp-collage-glow" aria-hidden="true" />
            <div className="ipp-orbit ipp-orbit-one" aria-hidden="true" />
            <div className="ipp-orbit ipp-orbit-two" aria-hidden="true" />
            <div className="ipp-portrait ipp-portrait-left" style={{ position: "absolute" }}>
              <Image
                src="/influencers/creator-podcast.webp"
                alt="Editorial photograph of a podcaster recording her story"
                fill
                sizes="(max-width: 767px) 30vw, 180px"
                loading="eager"
              />
            </div>
            <div className="ipp-portrait ipp-portrait-back" style={{ position: "absolute" }}>
              <Image
                src="/influencers/creator-filmmaker.webp"
                alt="Editorial photograph of a filmmaker at work"
                fill
                sizes="(max-width: 767px) 30vw, 180px"
                loading="eager"
              />
            </div>
            <div className="ipp-portrait ipp-portrait-main" style={{ position: "absolute" }}>
              <Image
                src="/influencer-marketing/creator-portrait.webp"
                alt="Editorial portrait of a creator at her laptop"
                fill
                sizes="(max-width: 767px) 48vw, 280px"
                preload
              />
            </div>
            <div className="ipp-portrait ipp-portrait-right" style={{ position: "absolute" }}>
              <Image
                src="/influencer-marketing/fashion.webp"
                alt="Editorial fashion and lifestyle photography"
                fill
                sizes="(max-width: 767px) 28vw, 170px"
                loading="eager"
              />
            </div>
            <div className="ipp-social-card ipp-social-instagram">
              <Instagram />
              <div>
                <strong>Your unique voice</strong>
                <span>Instagram stories</span>
              </div>
            </div>
            <div className="ipp-social-card ipp-social-youtube">
              <Youtube />
              <div>
                <strong>Ideas in motion</strong>
                <span>YouTube creators</span>
              </div>
            </div>
            <div className="ipp-social-card ipp-social-video">
              <Music2 />
              <div>
                <strong>Create. Connect.</strong>
                <span>Short-form storytelling</span>
              </div>
              <ArrowRight size={14} />
            </div>
            <figcaption>
              Editorial imagery. People pictured are not listed as registered partners.
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="ip-container">
        <section className="ipp-highlights" aria-label="Partnership benefits">
          {highlights.map(([Icon, title, text]) => (
            <article key={title}>
              <span className="ipp-icon">
                <Icon />
              </span>
              <div>
                <h2>{title}</h2>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="ipp-section" aria-labelledby="partnership-paths-title">
          <div className="ipp-section-heading">
            <h2 id="partnership-paths-title">
              Choose Your <span className="ip-gradient-text">Partnership Path</span>
            </h2>
            <p>Multiple ways to collaborate and grow with AA100XTECH, based on your goals.</p>
          </div>
          <div className="ipp-paths">
            {paths.map(([Icon, title, text, cta, href]) => (
              <Link href={href} key={title} className="ipp-path" aria-label={`${title}: ${cta}`}>
                <span className="ipp-icon">
                  <Icon />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                <span className="ipp-arrow">
                  <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="ipp-section" aria-labelledby="partner-process-title">
          <div className="ipp-section-heading">
            <h2 id="partner-process-title">
              How <span className="ip-gradient-text">It Works</span>
            </h2>
            <p>A simple and transparent process to get you started.</p>
          </div>
          <ol className="ipp-process">
            {steps.map(([Icon, title, text], index) => (
              <li key={title}>
                <span className="ipp-step-number">{index + 1}</span>
                <span className="ipp-icon">
                  <Icon />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
                {index < 3 && (
                  <ArrowRight className="ipp-step-connector" size={19} aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="ipp-section" aria-labelledby="partner-categories-title">
          <div className="ipp-section-heading">
            <h2 id="partner-categories-title">
              Featured <span className="ip-gradient-text">Creator Categories</span>
            </h2>
            <p>Collaborate across diverse niches and campaigns.</p>
          </div>
          <div className="ipp-categories">
            {creatorCategories.slice(0, 4).map((item, index) => {
              const Icon = categoryIcons[index]!;
              return (
                <a
                  href="#directory"
                  key={item.id}
                  className="ipp-category"
                  onClick={() => setCategory(item.id)}
                  style={{ position: "relative" }}
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 540px) 100vw, (max-width: 1023px) 50vw, 300px"
                  />
                  <div>
                    <Icon size={22} />
                    <h3>{item.name}</h3>
                    <span className="ipp-arrow">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="ipp-section ipp-forms" aria-label="Join our creator and brand network">
          <div id="join" className="ipp-form-panel" aria-labelledby="join-title">
            <div className="ipp-panel-heading">
              <span className="ipp-icon">
                <UserRound />
              </span>
              <div>
                <h2 id="join-title">For Influencers</h2>
                <p>
                  Apply to join our creator network and explore brand collaboration opportunities.
                </p>
              </div>
            </div>
            <InfluencerProgramApplication
              heading="Your creator profile"
              submitLabel="Apply as Influencer"
            />
            <Link
              href={applicationPath}
              className="ipp-detailed-link"
              aria-label="Become an Influencer Partner"
            >
              Prefer to include images or work samples? Use the detailed application{" "}
              <ArrowRight size={14} />
            </Link>
          </div>
          <div id="brand-enquiry" className="ipp-form-panel" aria-labelledby="brand-enquiry-title">
            <div className="ipp-panel-heading">
              <span className="ipp-icon">
                <BriefcaseBusiness />
              </span>
              <div>
                <h2 id="brand-enquiry-title">For Brands</h2>
                <p>
                  Tell us about your campaign and we’ll help you connect with relevant creators.
                </p>
              </div>
            </div>
            <CampaignEnquiryForm
              creator={creator}
              categoryChoice={category}
              packageChoice={campaignPackage}
              onPackageChange={setCampaignPackage}
              onClearCreator={() => setCreator(null)}
              submitLabel="Enquire as Brand Partner"
              includeAudience
            />
          </div>
        </section>

        <section className="ipp-network" aria-label="AA100XTECH creator network">
          <div>
            <strong>AA100XTECH</strong>
            <span>Influencer Network</span>
          </div>
          <div>
            <UsersRound />
            <p>
              <strong>Creator Community</strong>
              <span>Authentic connections</span>
            </p>
          </div>
          <div>
            <Layers3 />
            <p>
              <strong>Campaign Support</strong>
              <span>From brief to collaboration</span>
            </p>
          </div>
          <div>
            <Handshake />
            <p>
              <strong>Multi-Platform</strong>
              <span>Instagram, YouTube & more</span>
            </p>
          </div>
        </section>

        <section
          id="directory"
          className="ipp-section ipp-directory"
          aria-labelledby="partner-directory-title"
        >
          <div className="ipp-section-heading">
            <h2 id="partner-directory-title">
              Meet Our <span className="ip-gradient-text">Creator Network</span>
            </h2>
            <p>Explore published creator profiles across every supported category.</p>
          </div>
          <InfluencerDirectory
            profiles={profiles}
            unavailable={unavailable}
            marketing
            selectedCategory={category}
            onCategoryChange={setCategory}
            onCollaborate={chooseCreator}
            registrationHref="#join"
          />
        </section>
        <p className="ipp-program-note">
          <Check size={14} /> Applications are reviewed individually. Verification, campaign
          selection and earnings depend on eligibility and agreed terms.
        </p>
      </div>
    </>
  );
}

export function InfluencerPartnerFinalCta() {
  return (
    <section className="ip-container ipp-final-wrap">
      <div className="ipp-final">
        <div>
          <span className="ipp-final-eyebrow">
            <Sparkles size={14} /> YOUR NEXT CHAPTER
          </span>
          <h2>Ready to Create Bigger Impact Together?</h2>
          <p>
            Join the AA100XTECH Influencer Partner Program and become part of a growing
            creator-brand ecosystem.
          </p>
        </div>
        <div className="ipp-actions">
          <Button asChild size="lg">
            <a href="#join">
              Join as Influencer <ArrowRight />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#brand-enquiry">Launch Brand Campaign</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
