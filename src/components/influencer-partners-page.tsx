"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Code2,
  Facebook,
  GraduationCap,
  Handshake,
  HeartPulse,
  Instagram,
  Linkedin,
  Megaphone,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  Users,
  Utensils,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { MarketingIntakeForm } from "./marketing-intake-form";
import { MarketingFaq } from "./marketing-service-faq";
import { clients } from "@/data/site";

const startingPrice = 6100;
const services = [
  {
    icon: Search,
    title: "Influencer Discovery & Shortlisting",
    text: "Find the right influencers based on your industry, target audience, budget and goals.",
  },
  {
    icon: Sparkles,
    title: "Campaign Strategy & Planning",
    text: "Design a customised influencer campaign with clear objectives, content ideas and deliverables.",
  },
  {
    icon: Camera,
    title: "Content Collaboration & Production",
    text: "Coordinate authentic, high-quality content creation that aligns with your brand message.",
  },
  {
    icon: Megaphone,
    title: "Campaign Execution & Management",
    text: "Manage communication, content approvals, posting schedules and campaign timelines.",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking & Reporting",
    text: "Review reach, engagement, clicks and available conversion data with clear, easy-to-understand reports.",
  },
  {
    icon: RefreshCw,
    title: "Ongoing Partnership & Scaling",
    text: "Build long-term influencer relationships and use campaign insights to plan your next collaboration.",
  },
];
const features = [
  {
    icon: Users,
    title: "Build Real Trust",
    text: "Build on the credibility and loyal audiences of relevant influencers.",
  },
  {
    icon: Target,
    title: "Reach the Right People",
    text: "Connect with audiences whose interests align with your brand and message.",
  },
  {
    icon: BarChart3,
    title: "Drive Measurable Results",
    text: "Track reach, engagement, leads and available conversions from your campaigns.",
  },
];
const reasons = [
  "Goal-Driven Influencer Selection",
  "Authentic & Brand-Safe Collaborations",
  "End-to-End Campaign Management",
  "Transparent Performance Reporting",
  "Focus on Real Business Outcomes",
];
const steps = [
  "Consultation & Goal Setting",
  "Strategy & Influencer Selection",
  "Content Planning & Approvals",
  "Campaign Launch & Management",
  "Reporting & Next Steps",
];
const industries = [
  { icon: ShoppingCart, title: "E-commerce Brands" },
  { icon: Store, title: "Retail & Local Businesses" },
  { icon: Building2, title: "Corporate Brands" },
  { icon: Code2, title: "Tech & SaaS Companies" },
  { icon: Utensils, title: "Food & Beverage" },
  { icon: HeartPulse, title: "Health & Wellness" },
  { icon: GraduationCap, title: "Education & EdTech" },
];
const faqs = [
  {
    question: "How do you find the right influencers for my brand?",
    answer:
      "We begin with your industry, campaign objectives, audience, location and budget. We review creator content, audience relevance and available engagement information, then discuss a shortlist and the proposed scope with you.",
  },
  {
    question: "What types of influencer campaigns can you run?",
    answer:
      "Depending on the agreed scope, campaigns can include product introductions, reviews, short-form videos, platform stories, brand integrations and longer-term collaborations. Content formats, usage rights and approvals are confirmed in the proposal.",
  },
  {
    question: "Do you work with micro, mid, and macro influencers?",
    answer:
      "We assess creators across different audience sizes. Selection depends on audience fit, content quality, availability and your campaign goals, rather than follower count alone.",
  },
  {
    question: "How do you track influencer campaign performance?",
    answer:
      "We agree on relevant metrics before launch. Reporting can include platform reach, views, engagement and tracked link actions, with leads or conversions included where suitable tracking and outcome data are available.",
  },
  {
    question: "Can you manage the complete campaign end-to-end?",
    answer:
      "Yes. The agreed management scope can cover creator discovery, coordination, content planning, approvals, campaign schedules and reporting. Responsibilities, deliverables and timelines are confirmed before work begins.",
  },
  {
    question: "What budget is required for an influencer campaign?",
    answer:
      "Campaign budgets depend on the creators, platforms, content formats, production, usage rights and duration. Share your requirements for a customised proposal. Consultation bookings follow the published plans and fees; campaign costs are quoted separately.",
  },
];
const programs = [
  {
    icon: Rocket,
    title: "Influencer Growth Program",
    text: "Build your personal brand with creative services, digital tools and tailored growth support.",
    cta: "Explore creator services",
    href: "#creative-services",
  },
  {
    icon: Sparkles,
    title: "Viral Influencer Marketing",
    text: "Bring a bold idea to life through coordinated creator content and multi-platform campaigns.",
    cta: "Plan a viral campaign",
    href: "/influencer-marketing#viral-influencer-marketing",
  },
  {
    icon: Handshake,
    title: "Long-Term Brand Partnerships",
    text: "Go beyond one campaign. Explore lasting relationships, referral opportunities and shared growth.",
    cta: "Explore partner benefits",
    href: "#partner-details",
  },
];

function Heading({ label, title, id }: { label: string; title: string; id: string }) {
  return (
    <div className="uip-heading">
      <p className="uip-eyebrow">{label}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 2h-3.2v13.3a2.8 2.8 0 1 1-2.4-2.8V9.2a6 6 0 1 0 5.6 6V8.5a8.2 8.2 0 0 0 4.8 1.5V6.8A5 5 0 0 1 16.4 2Z" />
    </svg>
  );
}
function Actions() {
  return (
    <div className="uip-actions">
      <Link className="uip-button" href="/consultation">
        <CalendarDays aria-hidden="true" />
        <span>
          Book an Influencer Consultation
          <small>Starting at ₹{startingPrice.toLocaleString("en-IN")}</small>
        </span>
      </Link>
      <a
        className="uip-button uip-button-secondary"
        href="https://influencermoves365.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>Influencer Moves 365</span>
        <ArrowUpRight aria-hidden="true" />
      </a>
    </div>
  );
}
function GoldArt({ icon: Icon, className = "" }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={`uip-gold-art ${className}`} aria-hidden="true">
      <Icon />
    </span>
  );
}

export function InfluencerPartnersPage({
  programDetails,
  creativeServices,
}: {
  programDetails: ReactNode;
  creativeServices: ReactNode;
}) {
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
  const platforms = [
    { name: "Instagram", icon: Instagram, note: "Reels, Posts, Stories", tone: "instagram" },
    {
      name: "YouTube",
      icon: Youtube,
      note: "Reviews, Integrations, Brand Videos",
      tone: "youtube",
    },
    { name: "TikTok", icon: TikTokIcon, note: "Short & Viral Content", tone: "tiktok" },
    { name: "Facebook", icon: Facebook, note: "Posts, Reels, Live", tone: "facebook" },
    { name: "LinkedIn", icon: Linkedin, note: "B2B & Professional Campaigns", tone: "linkedin" },
  ];
  return (
    <div className="uip-page">
      <section className="uip-hero" aria-labelledby="uip-title">
        <div className="uip-container uip-hero-grid">
          <div className="uip-hero-copy">
            <p className="uip-eyebrow">INFLUENCER PARTNERS</p>
            <h1 id="uip-title">
              Partner with the Right Influencers. Grow Your Brand with <span>Real Influence.</span>
            </h1>
            <p className="uip-subtitle">
              Connect your brand with trusted content creators who genuinely engage, inspire, and
              influence your target audience. We help you find the right influencers, plan impactful
              campaigns, and deliver measurable results.
            </p>
            <Actions />
            <ul className="uip-hero-benefits">
              {[
                "Right Influencer Match",
                "Campaign Planning & Execution",
                "Authentic Content Collaboration",
                "Performance Tracking & Reporting",
              ].map((text) => (
                <li key={text}>
                  <CheckCircle2 aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <figure className="uip-creator-collage">
            <Image
              src="/influencers/partner-hero-collage.png"
              alt="Illustrative collage of three content creators: a woman filming with a smartphone, a male podcaster and a lifestyle creator"
              fill
              sizes="(min-width: 1280px) 570px, (min-width: 801px) 47vw, 100vw"
              priority
              className="object-contain"
            />
            <span className="uip-floating-platform uip-instagram">
              <Instagram aria-label="Instagram" />
            </span>
            <span className="uip-floating-platform uip-youtube">
              <Youtube aria-label="YouTube" />
            </span>
            <span className="uip-floating-platform uip-tiktok">
              <TikTokIcon />
            </span>
            <span className="uip-hero-badge">
              <BarChart3 aria-hidden="true" />
              <span>
                Authentic connections.<strong>Built around your audience.</strong>
              </span>
            </span>
            <figcaption>Illustrative creator portraits.</figcaption>
          </figure>
        </div>
      </section>

      <div className="uip-container">
        <section className="uip-section uip-bigger" aria-labelledby="uip-bigger-title">
          <div>
            <Heading
              label="THE BIGGER PICTURE"
              title="Turn Trusted Influence into Business Growth."
              id="uip-bigger-title"
            />
            <p>
              People trust real recommendations from the creators they follow. Influencer marketing
              helps your brand reach the right audience, build credibility and encourage meaningful
              actions—from brand awareness and product discovery to website visits and enquiries.
            </p>
          </div>
          <div className="uip-feature-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article className="uip-card uip-feature" key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="uip-section" aria-labelledby="uip-services-title">
          <Heading
            label="OUR INFLUENCER PARTNERSHIP SERVICES"
            title="End-to-End Influencer Marketing for Your Brand."
            id="uip-services-title"
          />
          <p className="uip-section-intro">
            From influencer discovery to campaign execution and performance tracking, we manage each
            agreed stage for a connected campaign experience.
          </p>
          <div className="uip-services">
            {services.map(({ icon: Icon, title, text }, i) => (
              <article className="uip-card uip-service" key={title}>
                <Icon aria-hidden="true" />
                <span className="uip-service-number">0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="uip-section uip-why-process"
          aria-label="Our approach and campaign process"
        >
          <div className="uip-why">
            <Heading
              label="WHY CHOOSE US"
              title="A Strategic, Transparent, and Results-Focused Approach."
              id="uip-why-title"
            />
            <ul>
              {reasons.map((text) => (
                <li key={text}>
                  <Check aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
            <div className="uip-partnership-art" aria-hidden="true">
              <GoldArt icon={Target} />
              <GoldArt icon={Handshake} />
            </div>
          </div>
          <div id="how-it-works" className="uip-process">
            <Heading
              label="OUR PROCESS"
              title="A Clear Process for Successful Influencer Campaigns."
              id="uip-how-title"
            />
            <ol className="uip-steps">
              {steps.map((text, i) => (
                <li key={text}>
                  <span className="uip-step-number">0{i + 1}</span>
                  <h3>{text}</h3>
                  {i < steps.length - 1 && <ArrowRight aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="uip-section uip-strip-layout" aria-labelledby="uip-platforms-title">
          <div>
            <Heading
              label="PLATFORMS WE WORK WITH"
              title="Run Influencer Campaigns Across Leading Platforms."
              id="uip-platforms-title"
            />
            <p>We plan around the platforms where your audience is most active and engaged.</p>
          </div>
          <div>
            <div className="uip-platform-grid">
              {platforms.map(({ name, icon: Icon, note, tone }) => (
                <article className="uip-platform" key={name}>
                  <span className={`uip-platform-icon uip-${tone}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <h3>{name}</h3>
                  <p>({note})</p>
                </article>
              ))}
            </div>
            <p className="uip-platform-note">
              Platform selection depends on audience fit, market availability and the agreed
              campaign scope.
            </p>
          </div>
        </section>

        <section
          className="uip-section uip-strip-layout uip-industry-layout"
          aria-labelledby="uip-industries-title"
        >
          <div>
            <Heading
              label="WHO WE HELP"
              title="Influencer Marketing for Different Business Needs."
              id="uip-industries-title"
            />
            <p>
              We create influencer campaigns that fit your industry, audience and growth objectives.
            </p>
          </div>
          <div className="uip-industries">
            {industries.map(({ icon: Icon, title }) => (
              <article className="uip-card" key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="uip-section uip-faq-cta" aria-label="Common questions and next steps">
          <div>
            <Heading
              label="FREQUENTLY ASKED QUESTIONS"
              title="Influencer Partners: Common Questions."
              id="uip-faq-title"
            />
            <MarketingFaq faqs={faqs} />
          </div>
          <div className="uip-final" aria-labelledby="uip-final-title">
            <p className="uip-eyebrow">LET’S CREATE REAL IMPACT</p>
            <h2 id="uip-final-title">Ready to Partner with Influencers for Your Brand?</h2>
            <p>
              Share your campaign goals, target audience, and product or service. We’ll help you
              build the right influencer partnership for real business growth.
            </p>
            <GoldArt icon={Megaphone} className="uip-cta-art" />
            <Actions />
          </div>
        </section>

        <section className="uip-section uip-opportunities" aria-labelledby="uip-paths-title">
          <Heading
            label="CREATORS & LONG-TERM PARTNERS"
            title="More ways to collaborate and grow."
            id="uip-paths-title"
          />
          <div className="uip-two-col">
            <article id="for-influencers" className="uip-card uip-path">
              <span id="join" />
              <Users aria-hidden="true" />
              <h3>Turn your influence into opportunity.</h3>
              <p>
                Explore creator growth support, digital services and brand collaboration
                opportunities.
              </p>
              <Link className="uip-text-link" href="/influencer-marketing/for-influencers">
                Apply as Influencer Partner <ArrowUpRight aria-hidden="true" />
              </Link>
            </article>
            <article id="for-brands" className="uip-card uip-path">
              <Megaphone aria-hidden="true" />
              <h3>Find the voices that move your brand.</h3>
              <p>Share your brand, target audience and campaign goals with our team.</p>
              <a className="uip-text-link" href="#brand-enquiry">
                Start a Brand Collaboration <ArrowUpRight aria-hidden="true" />
              </a>
            </article>
          </div>
          <div className="uip-three-col">
            {programs.map(({ icon: Icon, title, text, cta, href }) => (
              <article className="uip-card uip-program" key={title}>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
                <Link
                  className="uip-text-link"
                  href={href}
                  onClick={() => {
                    if (href.startsWith("#")) {
                      const target = document.getElementById(href.slice(1));
                      if (target instanceof HTMLDetailsElement) target.open = true;
                    }
                  }}
                >
                  {cta}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <details id="creative-services" className="uip-disclosure">
            <summary>
              All creator services &amp; pricing <span aria-hidden="true">+</span>
            </summary>
            {creativeServices}
          </details>
          <details id="partner-details" className="uip-disclosure">
            <summary>
              Partner benefits, referral process, levels &amp; FAQs{" "}
              <span aria-hidden="true">+</span>
            </summary>
            {programDetails}
          </details>
          <div className="uip-more-paths">
            <Link href="/affiliates">
              Explore Affiliate Program <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/partners">
              Explore Regional Partnerships <ArrowUpRight aria-hidden="true" />
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
                <ArrowUpRight aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        <section className="uip-section" aria-labelledby="uip-apply-title">
          <Heading
            label="LET’S MAKE THE INTRODUCTION"
            title="Tell us about your next collaboration."
            id="uip-apply-title"
          />
          <p className="uip-section-intro">
            Share your campaign requirements using the existing brand enquiry form.
          </p>
          <div className="uip-forms">
            <section
              id="brand-enquiry"
              className="uip-form-panel"
              aria-labelledby="uip-brand-form-title"
            >
              <h3 id="uip-brand-form-title">Start a Brand Collaboration</h3>
              <p>Share your vision. We’ll help shape the campaign.</p>
              <MarketingIntakeForm kind="brand" embedded />
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
