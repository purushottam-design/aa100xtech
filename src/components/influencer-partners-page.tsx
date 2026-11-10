"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Check,
  Handshake,
  Instagram,
  Megaphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Youtube,
} from "lucide-react";
import { MarketingIntakeForm } from "./marketing-intake-form";
import { InfluencerDirectory } from "./influencer-directory";
import type { CreatorListing } from "@/lib/creator-discovery";
import { clients } from "@/data/site";

const creatorBenefits = [
  "Paid brand collaborations",
  "Creator growth opportunities",
  "Exclusive influencer programs",
  "Social media promotion support",
  "Personal branding and technology guidance",
];
const brandBenefits = [
  "Influencer campaign management",
  "Verified creator discovery",
  "Brand awareness campaigns",
  "Viral influencer marketing",
  "Engagement and performance tracking",
];
const features = [
  [
    ShieldCheck,
    "Verified Creators",
    "Discover published creator profiles reviewed for partnership fit.",
  ],
  [
    Megaphone,
    "Viral Campaigns",
    "Original ideas, the right creators and content built to spark conversation.",
  ],
  [
    BarChart3,
    "Measurable Results",
    "Plan around clear goals and track reach, engagement and campaign outcomes.",
  ],
  [
    Handshake,
    "End-to-End Support",
    "One team alongside you, from the first brief to the final campaign review.",
  ],
] as const;
const programs = [
  [
    Rocket,
    "Influencer Growth Program",
    "Build your personal brand with creative services, digital tools and tailored growth support.",
    "Explore creator services",
    "#creative-services",
  ],
  [
    Sparkles,
    "Viral Influencer Marketing",
    "Bring a bold idea to life through coordinated creator content and multi-platform campaigns.",
    "Plan a viral campaign",
    "/influencer-marketing#viral-influencer-marketing",
  ],
  [
    Handshake,
    "Long-Term Brand Partnerships",
    "Go beyond one campaign. Build lasting relationships, referral opportunities and shared growth.",
    "Explore partner benefits",
    "#partner-details",
  ],
] as const;

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduced ? {} : { opacity: [0.65, 1], y: [16, 0] }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Actions() {
  return (
    <div className="uip-actions">
      <Link className="uip-button" href="/influencer-marketing/for-influencers">
        Join as Influencer <ArrowRight size={17} aria-hidden />
      </Link>
      <a className="uip-button uip-button-secondary" href="#brand-enquiry">
        Partner as a Brand <ArrowUpRight size={17} aria-hidden />
      </a>
    </div>
  );
}

export function InfluencerPartnersPage({
  profiles,
  unavailable,
  programDetails,
  creativeServices,
}: {
  profiles: CreatorListing[];
  unavailable: boolean;
  programDetails: ReactNode;
  creativeServices: ReactNode;
}) {
  const [creator, setCreator] = useState<CreatorListing | null>(null);
  useEffect(() => {
    function revealHash() {
      let id: string;
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(id);
      const disclosure = target?.closest("details");
      if (disclosure) {
        disclosure.open = true;
        target?.scrollIntoView({ block: "start" });
      }
    }
    revealHash();
    window.addEventListener("hashchange", revealHash);
    return () => window.removeEventListener("hashchange", revealHash);
  }, []);
  function collaborate(profile: CreatorListing) {
    setCreator(profile);
    document.getElementById("brand-enquiry")?.scrollIntoView({ block: "start" });
  }
  return (
    <div className="uip-page">
      <section className="uip-hero" aria-labelledby="uip-title">
        <div className="uip-hero-glow" aria-hidden />
        <div className="uip-container uip-hero-grid">
          <figure className="uip-portrait uip-portrait-left">
            <Image
              src="/influencers/creator-podcast.webp"
              alt="Editorial photograph of a creator recording a podcast"
              fill
              sizes="(max-width: 767px) 38vw, 240px"
              priority
            />
            <figcaption>
              <Instagram size={16} aria-hidden /> Create. Connect. Grow.
            </figcaption>
          </figure>
          <Reveal className="uip-hero-copy">
            <p className="uip-eyebrow">
              <Sparkles size={15} aria-hidden /> AA100XTECH CREATOR NETWORK
            </p>
            <h1 id="uip-title">
              Influencer Programs <span>&amp; Influencer Marketing</span>
            </h1>
            <p className="uip-subtitle">
              A unified platform for creators and brands to collaborate, grow, and create
              high-impact campaigns.
            </p>
            <Actions />
            <p className="uip-hero-note">
              <ShieldCheck size={14} aria-hidden /> Real connections. Creative possibilities.
            </p>
          </Reveal>
          <figure className="uip-portrait uip-portrait-right">
            <Image
              src="/influencers/creator-filmmaker.webp"
              alt="Editorial photograph of a filmmaker creating video content"
              fill
              sizes="(max-width: 767px) 38vw, 240px"
              priority
            />
            <figcaption>
              <Youtube size={17} aria-hidden /> Stories with impact.
            </figcaption>
          </figure>
          <span className="uip-social uip-social-one" aria-hidden>
            <Instagram />
          </span>
          <span className="uip-social uip-social-two" aria-hidden>
            <Youtube />
          </span>
          <span className="uip-social uip-social-three" aria-hidden>
            <Megaphone />
          </span>
        </div>
      </section>

      <nav className="uip-tabs" aria-label="Explore the partner program">
        <a href="#for-influencers">For Influencers</a>
        <a href="#for-brands">For Brands</a>
        <a href="#how-it-works">How It Works</a>
      </nav>

      <div className="uip-container">
        <section className="uip-section" aria-labelledby="uip-paths-title">
          <div className="uip-heading">
            <p className="uip-eyebrow">TWO SIDES. ONE SHARED VISION.</p>
            <h2 id="uip-paths-title">
              Your next opportunity <span>starts here.</span>
            </h2>
            <p>Bring your voice. Bring your vision. Let’s build the right collaboration.</p>
          </div>
          <div className="uip-two-col">
            {[
              {
                id: "for-influencers",
                icon: Users,
                label: "FOR THE CREATORS",
                title: "Turn your influence into opportunity.",
                benefits: creatorBenefits,
                cta: "Apply as Influencer Partner",
                href: "/influencer-marketing/for-influencers",
                tone: "purple",
              },
              {
                id: "for-brands",
                icon: Megaphone,
                label: "FOR THE BRANDS",
                title: "Find the voices that move your brand.",
                benefits: brandBenefits,
                cta: "Start a Brand Collaboration",
                href: "#brand-enquiry",
                tone: "blue",
              },
            ].map(({ id, icon: Icon, label, title, benefits, cta, href, tone }) => (
              <Reveal key={id}>
                <article id={id} className={`uip-card uip-path uip-${tone}`}>
                  {id === "for-influencers" && <span id="join" aria-hidden="true" />}
                  <span className="uip-icon">
                    <Icon aria-hidden />
                  </span>
                  <p className="uip-eyebrow">{label}</p>
                  <h3>{title}</h3>
                  <ul>
                    {benefits.map((benefit) => (
                      <li key={benefit}>
                        <Check size={17} aria-hidden />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <a className="uip-button" href={href}>
                    {cta}
                    <ArrowRight size={17} aria-hidden />
                  </a>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="uip-note">
            Applications are reviewed individually. Campaign selection, paid opportunities, benefits
            and rewards depend on eligibility and written terms.
          </p>
        </section>

        <section className="uip-section" aria-labelledby="uip-why-title">
          <div className="uip-heading">
            <p className="uip-eyebrow">BUILT FOR MEANINGFUL IMPACT</p>
            <h2 id="uip-why-title">
              Why Partner <span>With Us?</span>
            </h2>
          </div>
          <div className="uip-four-col">
            {features.map(([Icon, title, text]) => (
              <Reveal key={title}>
                <article className="uip-card uip-feature">
                  <span className="uip-icon">
                    <Icon aria-hidden />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="uip-section" aria-labelledby="uip-how-title">
          <div className="uip-heading">
            <p className="uip-eyebrow">FROM HELLO TO WHAT’S NEXT</p>
            <h2 id="uip-how-title">
              Good connections. <span>Great possibilities.</span>
            </h2>
          </div>
          <ol className="uip-steps">
            {[
              [
                "Introduce yourself",
                "Creators share their profile. Brands share their goals, audience and brief.",
              ],
              [
                "Find the right fit",
                "Our team reviews eligibility, matches creators and agrees the scope together.",
              ],
              [
                "Create & collaborate",
                "Plan content, confirm deliverables and launch the agreed campaign.",
              ],
              ["Measure & grow", "Review campaign outcomes and explore your next collaboration."],
            ].map(([title, text], index) => (
              <li key={title}>
                <span className="uip-step-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="uip-section" aria-labelledby="uip-programs-title">
          <div className="uip-heading">
            <p className="uip-eyebrow">MORE WAYS TO MOVE FORWARD</p>
            <h2 id="uip-programs-title">
              Our Influencer <span>Programs</span>
            </h2>
            <p>Choose the path that fits your next chapter.</p>
          </div>
          <div className="uip-three-col">
            {programs.map(([Icon, title, text, cta, href]) => (
              <Reveal key={title}>
                <article className="uip-card uip-program">
                  <span className="uip-icon">
                    <Icon aria-hidden />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <Link
                    href={href}
                    onClick={() => {
                      if (href.startsWith("#")) {
                        const target = document.getElementById(href.slice(1));
                        if (target instanceof HTMLDetailsElement) target.open = true;
                      }
                    }}
                  >
                    {cta}
                    <ArrowUpRight size={16} aria-hidden />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
          <details id="creative-services" className="uip-disclosure">
            <summary>
              All creator services &amp; pricing <span aria-hidden>+</span>
            </summary>
            {creativeServices}
          </details>
          <details id="partner-details" className="uip-disclosure">
            <summary>
              Partner benefits, referral process, levels &amp; FAQs <span aria-hidden>+</span>
            </summary>
            {programDetails}
          </details>
          <div className="uip-more-paths">
            <Link href="/affiliates">
              Explore Affiliate Program <ArrowUpRight size={14} aria-hidden />
            </Link>
            <Link href="/partners">
              Explore Regional Partnerships <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        </section>

        <section className="uip-section uip-brands" aria-labelledby="uip-brands-title">
          <p className="uip-eyebrow">BRANDS WE HAVE BUILT FOR</p>
          <h2 id="uip-brands-title">Trusted by our clients.</h2>
          <p>Existing AA100XTECH clients across technology, lifestyle and beyond.</p>
          <div className="uip-brand-strip" aria-label="Existing AA100XTECH clients">
            {clients.map((client) => (
              <a href={client.url} key={client.name} target="_blank" rel="noopener noreferrer">
                {client.name}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            ))}
          </div>
        </section>

        <section id="creators" className="uip-section" aria-labelledby="uip-creators-title">
          <span id="directory" />
          <div className="uip-heading">
            <p className="uip-eyebrow">THE PEOPLE BEHIND THE POSSIBILITIES</p>
            <h2 id="uip-creators-title">
              Meet our <span>creator network.</span>
            </h2>
            <p>Explore published partner profiles and find your next collaborator.</p>
          </div>
          <InfluencerDirectory
            profiles={profiles}
            unavailable={unavailable}
            marketing
            onCollaborate={collaborate}
            registrationHref="/influencer-marketing/for-influencers"
          />
        </section>

        <section className="uip-section" aria-labelledby="uip-apply-title">
          <div className="uip-heading">
            <p className="uip-eyebrow">LET’S MAKE THE INTRODUCTION</p>
            <h2 id="uip-apply-title">
              One connection. <span>A world of opportunity.</span>
            </h2>
            <p>Tell us about the campaign you have in mind.</p>
          </div>
          <div className="uip-forms">
            <section
              id="brand-enquiry"
              className="uip-form-panel uip-blue"
              aria-labelledby="uip-brand-form-title"
            >
              <h3 id="uip-brand-form-title">Start a Brand Collaboration</h3>
              <p>Share your vision. We’ll help shape the campaign.</p>
              <MarketingIntakeForm
                kind="brand"
                embedded
                selectedCreator={creator}
                onClearCreator={() => setCreator(null)}
              />
            </section>
          </div>
        </section>

        <Reveal>
          <section className="uip-final" aria-labelledby="uip-final-title">
            <span className="uip-icon">
              <Handshake aria-hidden />
            </span>
            <p className="uip-eyebrow">BETTER TOGETHER</p>
            <h2 id="uip-final-title">
              Ready to <span>Collaborate?</span>
            </h2>
            <p>Whether you’re a creator or a brand, let’s create something big together.</p>
            <Actions />
          </section>
        </Reveal>
      </div>
    </div>
  );
}
