import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Crosshair,
  Facebook,
  Globe2,
  GraduationCap,
  Heart,
  Instagram,
  Layers3,
  Linkedin,
  Megaphone,
  MousePointerClick,
  Pencil,
  Play,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Youtube,
  Zap,
  type LucideIcon,
} from "lucide-react";
import socialAds from "@/data/social-ads";
import { site } from "@/data/site";
import { MarketingFaq } from "@/components/marketing-service-faq";
import { SocialAdProposalForm } from "@/components/social-ad-proposal-form";
import { SocialAdProposalPanel } from "@/components/social-ad-proposal-panel";
import { SocialAdsHeroSlider } from "@/components/social-ads-hero-slider";
import "./social-ads.css";

const serviceIcons = [Target, Crosshair, Pencil, Users, BarChart3, TrendingUp];
const serviceNames = [
  "Ad Strategy & Planning",
  "Audience Targeting & Research",
  "Creative Ad Development",
  "Lead Generation Campaigns",
  "Conversion Tracking & Analytics",
  "Campaign Management & Optimization",
];
const whyNames = [
  "Business-First Strategy",
  "Platform-Specific Campaigns",
  "Connected Execution",
  "Transparent Reporting",
  "Creative Testing",
  "Tailored Campaigns",
];
const audienceNames = [
  "Startups & Brands",
  "Growing Businesses",
  "Corporate Businesses",
  "E-commerce Brands",
  "Local & Service Businesses",
  "B2B Companies",
];
const audienceSummaries = [
  "Build awareness, test messages and explore paid advertising with clear goals.",
  "Promote your services and encourage relevant customer enquiries.",
  "Coordinate campaigns across products, audiences and geographic markets.",
  "Support product discovery and online purchases with relevant ad formats.",
  "Reach local customers and encourage calls, appointments and enquiries.",
  "Connect with relevant professional audiences and decision-makers.",
];
const serviceSummaries = [
  "A clear advertising roadmap built around your objectives, audience and budget.",
  "Reach the right people with relevant audience segments and customer insights.",
  "Attention-worthy visuals, video concepts and copy that inspire the next step.",
  "Connect interested audiences with lead forms, landing pages and enquiry channels.",
  "Understand customer actions with validated conversion events and campaign analytics.",
  "Test, monitor and refine campaigns using meaningful performance signals.",
];
const processTitles = [
  "Discover & Align",
  "Strategize",
  "Create & Launch",
  "Optimize & Scale",
  "Measure & Grow",
];
const processIcons = [Search, Target, Play, BarChart3, Trophy];
const processSummaries = [
  "Understand your business, goals and target audience.",
  "Build a tailored advertising and creative plan.",
  "Prepare your assets and submit campaigns for review.",
  "Review performance and improve what works.",
  "Report outcomes and plan your next move.",
];
const whyIcons = [Target, Rocket, Layers3, ShieldCheck, Sparkles, Users];
const audienceIcons = [Rocket, Building2, BriefcaseBusiness, ShoppingCart, Heart, GraduationCap];

function Copy({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="ads-copy">
      {paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </div>
  );
}
function Heading({ label, title, id }: { label: string; title: string; id: string }) {
  return (
    <div className="ads-section-heading">
      <p className="ads-eyebrow">{label}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}
function Details({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="ads-details">
      <summary>
        {label}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </summary>
      <div className="ads-details-body">{children}</div>
    </details>
  );
}
function GoldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="ads-icon">
      <Icon aria-hidden="true" />
    </span>
  );
}

function Chart({ id, large = false }: { id: string; large?: boolean }) {
  return (
    <svg
      className={large ? "ads-chart ads-chart-large" : "ads-chart"}
      viewBox="0 0 500 170"
      role="img"
      aria-label="Illustrative campaign measurement chart, not actual performance data"
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity=".45" />
          <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-line`} x1="0" x2="1">
          <stop stopColor="var(--brand-gold)" />
          <stop offset="100%" stopColor="var(--brand-deep-orange)" />
        </linearGradient>
      </defs>
      {[30, 65, 100, 135].map((y) => (
        <line key={y} x1="12" y1={y} x2="488" y2={y} stroke="currentColor" opacity=".1" />
      ))}
      <path
        d="M14 140 L76 125 L139 129 L202 95 L266 102 L329 61 L392 77 L456 31 L486 20 L486 155 L14 155Z"
        fill={`url(#${id}-fill)`}
      />
      <path
        d="M14 140 L76 125 L139 129 L202 95 L266 102 L329 61 L392 77 L456 31 L486 20"
        stroke={`url(#${id}-line)`}
        strokeWidth="4"
        fill="none"
        strokeLinejoin="round"
      />
      {[
        [14, 140],
        [76, 125],
        [139, 129],
        [202, 95],
        [266, 102],
        [329, 61],
        [392, 77],
        [456, 31],
        [486, 20],
      ].map(([x, y]) => (
        <circle
          key={x}
          cx={x}
          cy={y}
          r="4"
          fill="var(--brand-deep-orange)"
          stroke="white"
          strokeWidth="2"
        />
      ))}
      {large && (
        <path
          d="M14 149 Q90 132 139 141 T266 121 T392 104 T486 73"
          stroke="var(--brand-gold)"
          strokeWidth="3"
          fill="none"
        />
      )}
    </svg>
  );
}

export function SocialAdsPage() {
  const { hero, bigger, expertise, platforms, why, process, audiences, metrics, faq, cta, form } =
    socialAds;
  const platformCards = [
    {
      title: "Facebook Ads",
      icon: Facebook,
      className: "facebook",
      description: "Build awareness and encourage relevant leads through Facebook advertising.",
      detail: platforms.cards[0]!,
    },
    {
      title: "Instagram Ads",
      icon: Instagram,
      className: "instagram",
      description:
        "Connect with visual audiences through Reels, Stories and engaging ad creatives.",
      detail: platforms.cards[0]!,
    },
    {
      title: "YouTube Ads",
      icon: Youtube,
      className: "youtube",
      description: "Tell your story and introduce your brand to relevant video audiences.",
      detail: platforms.cards[1]!,
    },
    {
      title: "LinkedIn Ads",
      icon: Linkedin,
      className: "linkedin",
      description: "Reach professional audiences and support meaningful B2B enquiries.",
      detail: platforms.cards[2]!,
    },
    {
      title: "X (Twitter) Ads",
      icon: Megaphone,
      className: "x-platform",
      description: "Explore relevant audiences, visibility and traffic opportunities on X.",
      detail: platforms.cards[3]!,
    },
    {
      title: "Platform Planning",
      icon: Globe2,
      className: "planning",
      description: "Choose a channel mix around your audience, objectives and budget.",
      detail: {
        paragraphs: platforms.intro,
        objectives: "Recommendations tailored to your business goals.",
      },
    },
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Social Media Ads Marketing",
    serviceType: "Paid social media advertising",
    url: `${site.origin}/social-media-ads-marketing`,
    provider: { "@type": "Organization", name: "Absolute Advancement 100X Tech", url: site.origin },
    description:
      "Campaign strategy, audience research, ad creative development, lead generation, conversion tracking and campaign optimization.",
  };
  return (
    <div className="ads-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
      />
      <section className="ads-hero" aria-labelledby="ads-title">
        <div className="ads-container ads-hero-grid">
          <div className="ads-hero-copy">
            <p className="ads-eyebrow">{hero.label}</p>
            <h1 id="ads-title">
              Turn Social Media
              <br />
              Attention Into
              <br />
              <span>Real Business Growth.</span>
            </h1>
            <p className="ads-hero-lede">
              Strategically planned social media advertising that reaches relevant audiences. From
              audience research and creative development to tracking and optimization, every
              decision starts with your business goals.
            </p>
            <div className="ads-actions">
              <Link className="ads-button ads-button-primary" href="/consultation">
                Book a Social Media Consultation <ArrowRight aria-hidden="true" />
              </Link>
              <a className="ads-button ads-button-secondary" href="#ad-process">
                <Play aria-hidden="true" />
                See How It Works
              </a>
            </div>
            <a className="ads-hero-proposal" href="#ad-proposal">
              Get Customised Ad Proposal <ArrowUpRight aria-hidden="true" />
            </a>
            <ul className="ads-trust">
              {[
                { Icon: BarChart3, title: "Business-focused", text: "Advertising strategy" },
                { Icon: Target, title: "Relevant audiences", text: "Thoughtful targeting" },
                { Icon: Zap, title: "Continuous", text: "Campaign optimization" },
                { Icon: ShieldCheck, title: "Transparent", text: "Performance insights" },
              ].map(({ Icon, title, text }) => (
                <li key={title}>
                  <Icon aria-hidden="true" />
                  <span>
                    <strong>{title}</strong>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <SocialAdsHeroSlider />
        </div>
      </section>

      <section
        id="advertising-strategy"
        className="ads-section ads-container ads-bigger"
        aria-labelledby="ads-bigger-heading"
      >
        <div>
          <Heading
            id="ads-bigger-heading"
            label={bigger.label}
            title="A Strategic Social Media Advertising Strategy Behind Every Impression."
          />
          <p className="ads-section-lede">
            We connect audience insights, creative strategy and campaign optimization to help your
            business reach relevant people and encourage meaningful customer actions.
          </p>
        </div>
        <div className="ads-strategy-callout">
          <TrendingUp aria-hidden="true" />
          <div>
            <strong>
              Every campaign.
              <br />
              <span>One clear direction.</span>
            </strong>
            <p>Strategy, creativity and measurement—working together.</p>
          </div>
        </div>
        <div className="ads-wide">
          <Details label="Explore our advertising approach">
            <Copy paragraphs={hero.intro} />
            <Copy paragraphs={bigger.intro} />
            <div className="ads-detail-grid">
              {bigger.cards.map((c) => (
                <article key={c.title}>
                  <h3>{c.title}</h3>
                  <Copy paragraphs={c.paragraphs} />
                </article>
              ))}
            </div>
            <p>{bigger.closing}</p>
          </Details>
        </div>
      </section>

      <section
        id="ad-services"
        className="ads-section ads-container"
        aria-labelledby="ads-expertise-heading"
      >
        <Heading
          id="ads-expertise-heading"
          label="OUR SOCIAL MEDIA ADS SERVICES"
          title="Complete Social Media Ads Solutions for Ambitious Businesses."
        />
        <div className="ads-service-grid">
          {expertise.cards.map((c, i) => (
            <article className="ads-card ads-service-card" key={c.title}>
              <GoldIcon icon={serviceIcons[i]!} />
              <div className="ads-card-copy">
                <h3>{serviceNames[i]}</h3>
                <p>{serviceSummaries[i]}</p>
              </div>
              <Details label="Scope & deliverables">
                <h4>{c.category}</h4>
                <p>{c.title}</p>
                <Copy paragraphs={c.paragraphs} />
                <h4>Key deliverables</h4>
                <ul className="ads-deliverables">
                  {c.deliverables.map((d) => (
                    <li key={d}>
                      <Check aria-hidden="true" />
                      {d}
                    </li>
                  ))}
                </ul>
              </Details>
            </article>
          ))}
        </div>
        <Details label="Our connected advertising services">
          <Copy paragraphs={expertise.intro} />
          <p>{expertise.closing}</p>
        </Details>
      </section>

      <section
        id="ad-platforms"
        className="ads-section ads-container"
        aria-labelledby="ads-platforms-heading"
      >
        <Heading
          id="ads-platforms-heading"
          label="ADVERTISING PLATFORMS WE WORK WITH"
          title="Reach, Engage and Connect Across the Platforms That Matter."
        />
        <div className="ads-platform-grid">
          {platformCards.map(({ title, icon: Icon, className, description, detail }) => (
            <article className="ads-card ads-platform-card" key={title}>
              <span className={`ads-social-icon ${className}`}>
                <Icon aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
              <Details label={`Explore ${title}`}>
                <Copy paragraphs={detail.paragraphs} />
                <h4>Suitable objectives</h4>
                <p>{detail.objectives}</p>
              </Details>
            </article>
          ))}
        </div>
      </section>

      <section className="ads-section ads-container ads-why" aria-labelledby="ads-why-heading">
        <Heading
          id="ads-why-heading"
          label="WHY CHOOSE AA100XTECH"
          title="Your Social Media Ads Partner. Focused on Your Business."
        />
        <div className="ads-why-grid">
          {why.cards.map((c, i) => (
            <article className="ads-why-card" key={c.title}>
              <GoldIcon icon={whyIcons[i]!} />
              <h3>{whyNames[i]}</h3>
              <p>{c.paragraphs[0]}</p>
            </article>
          ))}
        </div>
        <Details label="What our approach means for your business">
          <Copy paragraphs={why.intro} />
          <div className="ads-detail-grid">
            {why.cards.map((c) => (
              <article key={c.title}>
                <h3>{c.title}</h3>
                <Copy paragraphs={c.paragraphs} />
              </article>
            ))}
          </div>
          <p>{why.closing}</p>
        </Details>
      </section>

      <section
        id="ad-process"
        className="ads-section ads-container"
        aria-labelledby="ads-process-heading"
      >
        <Heading
          id="ads-process-heading"
          label={process.label}
          title="A Clear, Collaborative Process. From Strategy to Improvement."
        />
        <ol className="ads-timeline">
          {process.cards.map((c, i) => (
            <li key={c.title}>
              <GoldIcon icon={processIcons[i]!} />
              <h3>
                {i + 1}. {processTitles[i]}
              </h3>
              <p>{processSummaries[i]}</p>
              {i < 4 && <ArrowRight className="ads-process-arrow" aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <Details label="View our complete advertising process">
          <Copy paragraphs={process.intro} />
          <div className="ads-detail-grid">
            {process.cards.map((c) => (
              <article key={c.title}>
                <h3>{c.title}</h3>
                <Copy paragraphs={c.paragraphs} />
                <p className="ads-outcome">
                  <CheckCircle2 aria-hidden="true" />
                  <span>
                    <strong>Outcome:</strong> {c.outcome}
                  </span>
                </p>
              </article>
            ))}
          </div>
          <p>{process.closing}</p>
        </Details>
      </section>

      <section className="ads-section ads-container" aria-labelledby="ads-audiences-heading">
        <Heading
          id="ads-audiences-heading"
          label={audiences.label}
          title="Social Media Advertising for Different Business Goals."
        />
        <div className="ads-audience-grid">
          {audiences.cards.map((c, i) => (
            <article className="ads-card ads-audience-card" key={c.title}>
              <GoldIcon icon={audienceIcons[i]!} />
              <h3>{audienceNames[i]}</h3>
              <p>{audienceSummaries[i]}</p>
              <Details label="Explore the approach">
                <h4>{c.title}</h4>
                <Copy paragraphs={c.paragraphs} />
              </Details>
            </article>
          ))}
        </div>
        <Details label="An approach shaped around your business">
          <Copy paragraphs={audiences.intro} />
          <p>{audiences.closing}</p>
        </Details>
      </section>

      <section
        id="ad-metrics"
        className="ads-section ads-container"
        aria-labelledby="ads-metrics-heading"
      >
        <div className="ads-measurement-layout">
          <div>
            <Heading
              id="ads-metrics-heading"
              label={metrics.label}
              title="Clear Metrics. Meaningful Insights. Better Decisions."
            />
            <div className="ads-result-cards">
              {[
                {
                  Icon: Users,
                  title: "Relevant reach",
                  body: "Understand who your advertising reaches.",
                },
                {
                  Icon: MousePointerClick,
                  title: "Tracked actions",
                  body: "Measure enquiries and defined conversions.",
                },
                {
                  Icon: TrendingUp,
                  title: "Useful insights",
                  body: "Guide your next campaign decision.",
                },
              ].map(({ Icon, title, body }) => (
                <article key={title}>
                  <Icon aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
          <figure className="ads-performance-chart">
            <div>
              <h3>Campaign Measurement</h3>
              <span className="ads-sample-label">Illustrative only</span>
            </div>
            <div className="ads-chart-legend">
              <span>Audience signals</span>
              <span>Conversion signals</span>
            </div>
            <Chart id="measurement-performance" large />
            <figcaption>
              Discovery → Engagement → Enquiry. A sample visual, not a performance claim.
            </figcaption>
          </figure>
        </div>
        <Details label="Explore the metrics we measure">
          <Copy paragraphs={metrics.intro} />
          <div className="ads-metrics-grid">
            {metrics.cards.map((c) => (
              <article key={c.title}>
                <h3>{c.title}</h3>
                <p>{c.description}</p>
              </article>
            ))}
          </div>
          <p>{metrics.closing}</p>
        </Details>
      </section>

      <section
        id="ad-faq"
        className="ads-section ads-container ads-faq-layout"
        aria-labelledby="ads-faq-heading"
      >
        <div>
          <Heading
            id="ads-faq-heading"
            label={faq.label}
            title="Have Questions? We’ve Got You Covered."
          />
          <div className="ads-question-art" aria-hidden="true">
            <span>?</span>
            <span>•••</span>
          </div>
          <p className="ads-faq-note">
            <ShieldCheck aria-hidden="true" />
            Clear scope. Transparent fees. Realistic expectations.
          </p>
        </div>
        <MarketingFaq faqs={faq.cards} />
      </section>

      <section className="ads-section ads-container" aria-labelledby="ads-cta-heading">
        <div className="ads-final-cta">
          <div>
            <h2 id="ads-cta-heading">Ready to Grow Your Business with Social Media Ads?</h2>
            <p>
              Let’s build a focused advertising approach that connects your business with the right
              audience.
            </p>
          </div>
          <Link href="/consultation" className="ads-button ads-button-light">
            Book a Social Media Consultation <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="ads-cta-footnote">
          <span>Consultations follow our published booking plans and fees.</span>
          <a href="#ad-proposal">
            Prefer a customised proposal? <ArrowUpRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <SocialAdProposalPanel>
        <section className="ads-proposal-layout" aria-labelledby="ads-proposal-heading">
          <div className="ads-proposal-intro">
            <p className="ads-eyebrow">Your next campaign starts here</p>
            <h2 id="ads-proposal-heading">{form.heading}</h2>
            <p>{form.description}</p>
            <Details label="Give your campaign a clear direction">
              <Copy paragraphs={cta.intro} />
              <p>{cta.support}</p>
            </Details>
            <p className="ads-budget-disclosure">
              Advertising platform spend is separate from agency fees unless an approved written
              proposal states otherwise.
            </p>
            <Link href="/privacy-policy" className="ads-text-link">
              Read our Privacy Policy <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <SocialAdProposalForm />
        </section>
      </SocialAdProposalPanel>
    </div>
  );
}
