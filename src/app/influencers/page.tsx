import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  Check,
  Crown,
  Gift,
  Globe2,
  Handshake,
  HeartHandshake,
  Megaphone,
  MousePointer2,
  Network,
  Quote,
  Rocket,
  Search,
  Send,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  InfluencerPartnerLanding,
  InfluencerPartnerFinalCta,
} from "@/components/influencer-partner-landing";
import { creatorListing } from "@/lib/creator-discovery";
import { partnerLevels, primaryPlatform } from "@/lib/influencer-program";
import { getInfluencerProgram } from "@/lib/influencer-program.server";
import "./influencers.css";
import "./partner-landing.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Influencer Partner Program | Join AA100XTECH Creator Network",
  description:
    "Join the AA100XTECH Influencer Partner Program. Connect with brands, explore creator collaborations, and grow your influence through professional partnerships.",
  alternates: { canonical: "https://aa100xtech.com/influencers" },
  openGraph: {
    type: "website",
    title: "Influencer Partner Program | Join AA100XTECH Creator Network",
    description:
      "Join the AA100XTECH Influencer Partner Program. Connect with brands, explore creator collaborations, and grow your influence through professional partnerships.",
    url: "https://aa100xtech.com/influencers",
    images: [
      {
        url: "https://aa100xtech.com/influencer-marketing/creator-portrait.webp",
        width: 720,
        height: 900,
        alt: "Editorial creator portrait for the AA100XTECH Influencer Partner Program",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Influencer Partner Program | Join AA100XTECH Creator Network",
    description:
      "Join the AA100XTECH Influencer Partner Program. Connect with brands and explore creator collaborations.",
    images: ["https://aa100xtech.com/influencer-marketing/creator-portrait.webp"],
  },
};

const benefits = [
  [
    Globe2,
    "Personal Website Support",
    "A digital home for your personal brand.",
    "Professional portfolio or profile website support for eligible partners, with scope and costs agreed together.",
  ],
  [
    Smartphone,
    "Mobile App Solutions",
    "Bring your next idea closer.",
    "Explore professional app development support when your partnership and project call for it.",
  ],
  [
    Sparkles,
    "Personal Branding",
    "Show up with confidence.",
    "Build a stronger, more professional online identity that reflects your voice and your work.",
  ],
  [
    Megaphone,
    "Digital Marketing Support",
    "Give good ideas a wider audience.",
    "Marketing and campaign guidance for selected partners and agreed collaborations.",
  ],
  [
    Wrench,
    "Technical Support",
    "An experienced team in your corner.",
    "Access AA100XTech's technology expertise for the digital opportunities you are exploring.",
  ],
  [
    Handshake,
    "Business Collaboration",
    "Create something meaningful together.",
    "Collaborate on suitable client projects, campaigns and long-term opportunities.",
  ],
  [
    Gift,
    "Referral Rewards",
    "Real results deserve recognition.",
    "Earn eligible incentives or commissions for confirmed client conversions, under agreed written terms.",
  ],
  [
    Network,
    "Network Growth",
    "Good connections lead somewhere.",
    "Build relationships with businesses, brands and professionals beyond your current audience.",
  ],
] as const;
const steps = [
  [
    Send,
    "JOIN",
    "Introduce yourself.",
    "Apply to become an AA100XTech Influencer Partner. Our team reviews your profile and partnership fit.",
  ],
  [
    Users,
    "REFER",
    "Make a genuine connection.",
    "Introduce businesses that need websites, apps, e-commerce or digital growth services.",
  ],
  [
    BadgeCheck,
    "CLIENT CONVERTS",
    "Let our team take it forward.",
    "AA100XTech handles consultation, the proposal and project delivery. Only confirmed successful clients count.",
  ],
  [
    TrendingUp,
    "EARN & GROW",
    "Build on every success.",
    "Receive eligible rewards under your agreement and grow your partner ranking through real results.",
  ],
] as const;
const services = [
  [
    Globe2,
    "Website Development",
    "A professional online presence that helps a business make its next move.",
    "website-development",
  ],
  [
    ShoppingBag,
    "E-commerce Development",
    "Online stores built for products, payments and a better customer experience.",
    "ecommerce-development",
  ],
  [
    Smartphone,
    "Mobile App Development",
    "Android and iOS experiences that bring services closer to customers.",
    "mobile-app-development",
  ],
  [
    Search,
    "SEO",
    "Help the right customers discover a business when they are looking for it.",
    "seo",
  ],
  [
    Megaphone,
    "Social Media Marketing",
    "A consistent brand presence and content that connects with the right audience.",
    "social-media-marketing",
  ],
  [
    MousePointer2,
    "Advertising Management",
    "Focused campaigns designed around clear business goals and measurable results.",
    "advertising-management",
  ],
] as const;
const reasons = [
  "Professional company support",
  "Technology expertise",
  "Transparent client handling",
  "Dedicated partnership support",
  "Long-term collaboration opportunities",
  "Recognition for top performers",
  "Personal growth opportunities",
];
const faqs = [
  [
    "Who can become an AA100XTech influencer partner?",
    "Content creators, YouTubers, Instagram influencers and other digital personalities can apply. We look at authenticity, audience fit and the quality of the proposed collaboration, rather than promising automatic acceptance.",
  ],
  [
    "How do referrals work?",
    "After your partnership is agreed, introduce genuine businesses that need digital services through the agreed process. Our team handles discovery, consultation, proposals and delivery. Your agreement explains attribution and any eligible rewards.",
  ],
  [
    "When is a referral considered successful?",
    "A referral counts only after our team verifies a genuine client conversion and records its supporting reference. A lead, enquiry, click or submitted contact alone does not count. Rejected or reversed conversions do not increase your ranking.",
  ],
  [
    "How are influencer rankings calculated?",
    "Partners are ordered by confirmed successful client conversions, highest first. Follower counts and submitted leads do not decide rank. Ties use the earliest published profile creation date, then a stable profile ID, so the order stays consistent.",
  ],
  [
    "What services can I refer?",
    "You can introduce businesses seeking website development, e-commerce, mobile apps, SEO, digital marketing, advertising, social media marketing and other business digital solutions. Our team confirms the right scope with each client.",
  ],
  [
    "Do I need a minimum follower count?",
    "There is no universal minimum for applying. Relevant relationships, trust, audience quality and genuine business introductions matter. A specific campaign may have its own criteria.",
  ],
  [
    "What benefits do partners receive?",
    "Eligible partners may receive website or app support, branding and marketing guidance, technical expertise, collaboration opportunities and referral rewards. Eligibility, scope, costs and incentives are discussed individually and recorded in writing.",
  ],
  [
    "How can I become the featured influencer?",
    "The eligible published partner with the highest number of confirmed converted clients is recognised through verified program results. There is no manual paid placement in this ranking.",
  ],
  [
    "Is website or app development always free?",
    "No. Development is not automatically free or unlimited. Scope, eligibility, fees, promotional exchanges and support are agreed in writing before work begins.",
  ],
];

export default async function InfluencersPage() {
  const { profiles, unavailable, testimonials, testimonialsUnavailable } =
    await getInfluencerProgram();

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  return (
    <div className="influencer-program">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AA100XTech Influencer Partner Program",
            url: "https://aa100xtech.com/influencers",
          }).replace(/</g, "\\u003c"),
        }}
      />

      <InfluencerPartnerLanding profiles={profiles.map(creatorListing)} unavailable={unavailable} />

      <section id="benefits" className="ip-tinted ip-section" aria-labelledby="benefits-title">
        <div className="ip-container">
          <SectionIntro
            eyebrow="The partnership advantage"
            title="Everything You Need to Grow Your Digital Presence"
            id="benefits-title"
            description="More room for your ideas. More support for your next chapter. Benefits are tailored to each eligible partnership."
          />
          <div className="ip-benefit-grid">
            {benefits.map(([Icon, title, subtitle, description], index) => (
              <article className="ip-program-card ip-benefit" key={title}>
                <div className="flex items-center justify-between">
                  <span className="ip-icon">
                    <Icon className="size-5" />
                  </span>
                  <span className="ip-card-index">0{index + 1}</span>
                </div>
                <h3>{title}</h3>
                <p className="ip-card-subtitle">{subtitle}</p>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className="ip-section-note">
            Support, services and rewards depend on eligibility and a written agreement. Development
            is not automatically free or unlimited.
          </p>
        </div>
      </section>

      <section className="ip-container ip-section" aria-labelledby="steps-title">
        <SectionIntro
          eyebrow="A simple path forward"
          title="Good connections. Real outcomes."
          id="steps-title"
          description="You make the introduction. Our team brings the expertise. Every successful client becomes part of a shared growth story."
        />
        <div className="ip-process">
          {steps.map(([Icon, title, subtitle, description], index) => (
            <article key={title}>
              <div className="ip-step-top">
                <span className="ip-step-icon">
                  <Icon className="size-6" />
                </span>
                <span aria-hidden="true" className="ip-step-line" />
              </div>
              <p className="ip-overline">
                STEP 0{index + 1} / {title}
              </p>
              <h3>{subtitle}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ip-container ip-section" aria-labelledby="levels-title">
        <SectionIntro
          eyebrow="Your growth, recognised"
          title="Every introduction can be a step forward."
          id="levels-title"
          description="Four partner levels. One measure of progress: businesses you have successfully introduced."
        />
        <div className="ip-levels">
          {partnerLevels.map((level, index) => (
            <article
              key={level.name}
              className={`ip-program-card ${index === 3 ? "ip-elite-card" : ""}`}
            >
              <span className="ip-icon">
                {index === 3 ? (
                  <Crown className="size-6" />
                ) : index === 2 ? (
                  <Award className="size-6" />
                ) : index === 1 ? (
                  <TrendingUp className="size-6" />
                ) : (
                  <Rocket className="size-6" />
                )}
              </span>
              <h3>{level.name}</h3>
              <p className="ip-level-range">
                {level.range} <span>converted clients</span>
              </p>
              <p>{level.description}</p>
              {index === 3 && (
                <span className="ip-level-badge ip-level-elite mt-5">The gold standard</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="ip-tinted ip-section" aria-labelledby="services-title">
        <div className="ip-container">
          <SectionIntro
            eyebrow="Great introductions start here"
            title="Solutions You Can Introduce to Your Audience"
            id="services-title"
            description="From a local business taking its first digital step to a brand ready for its next stage of growth."
          />
          <div className="ip-service-grid">
            {services.map(([Icon, title, description, slug]) => (
              <article className="ip-program-card" key={slug}>
                <span className="ip-icon">
                  <Icon className="size-5" />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link className="ip-profile-link" href={`/services/${slug}`}>
                  Learn more <ArrowUpRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ip-container ip-section ip-why" aria-labelledby="why-title">
        <div>
          <p className="ip-eyebrow">
            <HeartHandshake className="size-3.5" /> Built for the long term
          </p>
          <h2 id="why-title" className="ip-heading mt-5">
            More Than a<br />
            <span className="ip-gradient-text">Referral Program.</span>
          </h2>
          <p className="mt-5 max-w-lg leading-7">
            Become part of a growing technology ecosystem. Connect your audience with a professional
            team, build stronger business relationships and create opportunities that can last
            beyond a single campaign.
          </p>
          <Button asChild variant="outline" size="lg" className="mt-7">
            <Link href="/about">
              Get to know AA100XTech <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="ip-reasons">
          {reasons.map((reason, index) => (
            <div key={reason}>
              <span>0{index + 1}</span>
              <p>{reason}</p>
              <Check className="size-4 text-primary" />
            </div>
          ))}
        </div>
      </section>

      <section className="ip-tinted ip-section" aria-labelledby="stories-title">
        <div className="ip-container">
          <SectionIntro
            eyebrow="The people behind the partnerships"
            title="Real voices. Shared possibilities."
            id="stories-title"
            description="Stories from our influencer partners, shared with their permission."
          />
          {testimonials.length > 0 ? (
            <div className="ip-service-grid">
              {testimonials.map((story) => {
                const profile = byId.get(story.profile_id)!;
                return (
                  <figure className="ip-testimonial" key={story.id}>
                    <Quote className="size-7 text-primary" aria-hidden="true" />
                    <blockquote>{story.quote}</blockquote>
                    <figcaption>
                      <div className="ip-story-avatar">
                        {profile.profile_image ? (
                          <img
                            src={`/api/influencers/media/${profile.profile_image}`}
                            alt={profile.display_name}
                            width={48}
                            height={48}
                          />
                        ) : (
                          profile.display_name[0]
                        )}
                      </div>
                      <div>
                        <strong>{profile.display_name}</strong>
                        <span>{primaryPlatform(profile)[1]}</span>
                      </div>
                      <BadgeCheck className="ml-auto size-5 text-primary" />
                    </figcaption>
                    <span className="ip-level-badge mt-4">Official Partner</span>
                  </figure>
                );
              })}
            </div>
          ) : (
            <div className="ip-stories-empty">
              <Quote className="size-8 text-primary" />
              <div>
                <h3>Every meaningful partnership starts with a first conversation.</h3>
                <p>
                  {testimonialsUnavailable
                    ? "Partner stories are temporarily unavailable. Explore the program and start a conversation with our team."
                    : "Approved partner stories will appear here as our collaborations grow. We share only real experiences, with permission."}
                </p>
              </div>
              <a href="#join" className="ip-profile-link">
                Start your story <ArrowUpRight className="size-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      <section className="ip-tinted ip-section" aria-labelledby="faq-title">
        <div className="ip-container ip-faq-layout">
          <div>
            <p className="ip-eyebrow">A little clarity</p>
            <h2 id="faq-title" className="ip-heading mt-5">
              Good questions.
              <br />
              Clear answers.
            </h2>
            <p className="mt-5 max-w-sm leading-7">
              A lasting partnership starts with shared expectations. Here’s what to know before you
              join.
            </p>
            <Link href="/contact" className="ip-profile-link mt-7">
              Have another question? <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="ip-faq">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group">
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <InfluencerPartnerFinalCta />
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="ip-section-intro">
      <p className="ip-eyebrow">{eyebrow}</p>
      <h2 id={id} className="ip-heading">
        {title}
      </h2>
      <p>{description}</p>
    </div>
  );
}
