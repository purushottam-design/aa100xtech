import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  BadgeCheck,
  Code2,
  Globe2,
  Instagram,
  Youtube,
  Facebook,
  Mic2,
  MoveUpRight,
  ScanFace,
  Send,
  Smartphone,
  Sparkles,
  Users,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InfluencerCard, InfluencerDirectory } from "@/components/influencer-directory";
import { applicationPath } from "@/lib/influencers";
import { listPublishedInfluencers } from "@/lib/influencers.server";
import "./influencers.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Influencer Partnership Program | AA100X TECH",
  description:
    "Promote AA100X TECH and grow your brand. Explore creator partnerships, website and mobile app development opportunities, and our official influencer directory.",
  alternates: { canonical: "https://aa100xtech.com/influencers" },
  openGraph: {
    type: "website",
    title: "Become an AA100X TECH Influencer Partner",
    description: "Promote our brand. Build your digital future.",
    url: "https://aa100xtech.com/influencers",
    images: [
      {
        url: "https://aa100xtech.com/influencers/creator-filmmaker.webp",
        width: 1200,
        height: 1067,
        alt: "A filmmaker recording with a professional video camera",
      },
    ],
  },
};
const benefits = [
  [
    Globe2,
    "Professional Website Development",
    "A digital home that’s unmistakably you.",
    "Eligible partners can collaborate on a responsive website for their personal brand, portfolio or business, within an agreed scope.",
  ],
  [
    Smartphone,
    "Mobile App Development",
    "Take your community a little further.",
    "Explore Android or iOS development opportunities based on your partnership agreement, business needs and project scope.",
  ],
  [
    ScanFace,
    "Professional Online Presence",
    "Your influence deserves a home.",
    "Build your digital identity with an approved AA100X TECH partner profile and opportunities to showcase your work.",
  ],
  [
    Handshake,
    "Long-Term Collaboration",
    "More than a single post.",
    "Discover potential future campaigns, co-branding activities and opportunities to build something meaningful together.",
  ],
] as const;
const steps = [
  [Send, "Apply to Join", "Share your story, social profiles and your vision for collaboration."],
  [
    ScanFace,
    "Profile Verification",
    "Our team reviews your content, audience and partnership fit.",
  ],
  [
    Handshake,
    "Partnership Agreement",
    "Together, we agree on deliverables, development scope, timelines and terms.",
  ],
  [
    BadgeCheck,
    "Become an Official Partner",
    "Begin the approved collaboration. Your profile goes live only with consent and admin publication.",
  ],
] as const;
const faqs = [
  [
    "Who can become an influencer partner?",
    "Content creators, YouTubers, Instagram influencers and digital personalities can apply. We review content quality, audience fit and the proposed collaboration individually. Acceptance is not guaranteed.",
  ],
  [
    "Is there a minimum follower requirement?",
    "There is no universal follower threshold published for this program. Audience relevance, authenticity, engagement and content quality matter; individual campaigns may have specific criteria.",
  ],
  [
    "What kind of promotions are required?",
    "Promotions may include videos, posts, tutorials or other agreed formats. Platforms, frequency, approvals, usage rights and disclosure requirements are agreed in writing before work begins.",
  ],
  [
    "Will AA100X TECH develop my website?",
    "Eligible partners may receive professional website development as part of a written collaboration agreement. Scope, eligibility, costs, deliverables and timelines are discussed individually.",
  ],
  [
    "Can I receive mobile app development services?",
    "Yes, Android or iOS development can be considered where it fits the partnership. Features, technical scope, ongoing support and costs must be agreed before development starts.",
  ],
  [
    "Is website or app development always free?",
    "No. Development is not automatically free or unlimited. Services may involve fees, a promotional exchange or another compensation arrangement, depending on the written agreement.",
  ],
  [
    "How will my public influencer profile appear?",
    "After review and approval, an admin confirms your publication consent and publishes a curated profile. Only approved public details appear. Private contact information and contract terms stay private; publication consent can be withdrawn.",
  ],
  [
    "How long does approval take?",
    "Review times vary with application volume and verification needs. Our team may contact you for more information. There is no guaranteed approval deadline or guaranteed collaboration.",
  ],
];
export default async function InfluencersPage() {
  const { profiles, unavailable } = await listPublishedInfluencers();
  const featured = profiles.filter((p) => p.featured);
  return (
    <div className="influencer-program">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AA100X TECH Influencer Partners",
            url: "https://aa100xtech.com/influencers",
            description: "Official approved and published AA100X TECH influencer partners",
            mainEntity: {
              "@type": "ItemList",
              itemListElement: profiles.map((profile, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: profile.display_name,
                url: `https://aa100xtech.com/influencers/${profile.slug}`,
              })),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section className="ip-hero relative isolate overflow-hidden border-b border-border/60">
        <div className="ip-hero-glow" aria-hidden="true" />
        <div className="ip-container relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-28">
          <div className="ip-enter">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary sm:text-xs">
              <span className="size-1.5 rounded-full bg-primary" /> Creators. Collaborators. What’s
              next.
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-[4.2rem]">
              Become an
              <br />
              AA100X TECH
              <br />
              <span className="ip-gradient-text">Influencer Partner.</span>
            </h1>
            <p className="mt-6 font-display text-lg font-medium sm:text-xl">
              Promote AA100X TECH. Build Your Digital Future.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Are you a content creator, YouTuber, Instagram influencer, or digital personality?
              Partner with AA100X TECH, promote our company, and unlock opportunities to get a
              professional website or mobile application developed for your brand or business.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="ip-cta">
                <Link href={applicationPath}>
                  Become an Influencer Partner <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#directory">
                  Explore Our Influencers <ArrowDown className="size-4" />
                </a>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <BadgeCheck className="size-4 text-primary" /> Real partnerships. Individually agreed.
              Built for growth.
            </p>
          </div>
          <div
            className="ip-editorial relative mx-auto w-full max-w-xl"
            aria-label="Editorial photographs of content creators at work"
          >
            <div className="ip-photo-main">
              <img
                src="/influencers/creator-podcast.webp"
                alt="A creator recording a podcast in a soundproof studio"
                width={1200}
                height={1500}
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5 pt-20">
                <span className="text-[10px] uppercase tracking-[0.25em] text-white/70">
                  Your voice. Your vision.
                </span>
                <p className="mt-1 font-display text-2xl font-semibold text-white">
                  A bigger digital future.
                </p>
              </div>
            </div>
            <div className="ip-photo-small">
              <img
                src="/influencers/creator-filmmaker.webp"
                alt="A filmmaker recording with a professional video camera"
                width={1200}
                height={1067}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="ip-social ip-social-one" aria-hidden="true">
              <Instagram className="size-6" />
            </span>
            <span className="ip-social ip-social-two" aria-hidden="true">
              <Youtube className="size-6" />
            </span>
            <span className="ip-social ip-social-three" aria-hidden="true">
              <Facebook className="size-5" />
            </span>
            <div className="ip-note">
              <Code2 className="size-8 shrink-0 text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  You create the impact.
                </p>
                <p className="mt-1 text-sm font-semibold">Let’s build what comes next.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="border-b border-border/60 bg-card/30">
        <div className="ip-container flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-6 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-2">
            <Mic2 className="size-4 text-primary" /> Creator-first collaborations
          </span>
          <span className="flex items-center gap-2">
            <Code2 className="size-4 text-primary" /> Websites & mobile apps
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-4 text-primary" /> Built for your next chapter
          </span>
        </div>
      </div>
      <section className="ip-container py-20 sm:py-24" aria-labelledby="benefits-title">
        <p className="ip-eyebrow">Influence meets opportunity</p>
        <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 id="benefits-title" className="ip-heading">
            Promote Our Brand.
            <br />
            <span className="text-primary">Grow Your Own.</span>
          </h2>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">
            You’ve built a voice people connect with. Let’s explore how your influence and our
            technology can open doors for both of us.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([Icon, title, subtitle, description], i) => (
            <article
              key={title}
              className="ip-benefit rounded-2xl border border-border/70 bg-card/60 p-6"
            >
              <div className="mb-9 flex items-center justify-between">
                <span className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-xs text-muted-foreground/60">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold leading-snug">{title}</h3>
              <p className="mt-3 text-sm text-foreground/90">{subtitle}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-8 text-center">
          <Sparkles className="mx-auto mb-4 size-6 text-primary" />
          <p className="mx-auto max-w-3xl font-display text-xl font-medium leading-relaxed sm:text-2xl">
            “You promote AA100X TECH through your content. We support your digital growth through
            website and app development.”
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-muted-foreground">
            Services, deliverables, eligibility, timelines and costs are agreed individually.
            Development is not automatically free or unlimited. Every collaboration depends on a
            written agreement.
          </p>
        </div>
      </section>
      <section
        className="border-y border-border/60 bg-card/25 py-20 sm:py-24"
        aria-labelledby="steps-title"
      >
        <div className="ip-container">
          <p className="ip-eyebrow">From first hello to official partner</p>
          <h2 id="steps-title" className="ip-heading mt-4">
            How Our Influencer
            <br />
            Partnership Works
          </h2>
          <div className="relative mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([Icon, title, description], i) => (
              <article key={title} className="relative">
                <div className="mb-6 flex items-center gap-4">
                  <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-background text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span
                    className="h-px w-full bg-gradient-to-r from-primary/35 to-transparent"
                    aria-hidden="true"
                  />
                </div>
                <p className="ip-eyebrow text-[10px]">Step 0{i + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      {featured.length > 0 && (
        <section className="ip-container py-20" aria-labelledby="featured-title">
          <p className="ip-eyebrow">In the spotlight</p>
          <h2 id="featured-title" className="ip-heading mt-4">
            Featured Partners
          </h2>
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((profile) => (
              <InfluencerCard key={profile.id} profile={profile} />
            ))}
          </div>
        </section>
      )}
      <section
        id="directory"
        className="ip-container scroll-mt-24 py-20 sm:py-24"
        aria-labelledby="directory-title"
      >
        <div className="mb-9">
          <p className="ip-eyebrow">Real people. Shared ambition.</p>
          <h2 id="directory-title" className="ip-heading mt-4">
            Meet Our Influencer Partners
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            Discover the creators collaborating with AA100X TECH. Every profile here is approved,
            consented and published by our team.
          </p>
        </div>
        <InfluencerDirectory profiles={profiles} unavailable={unavailable} />
      </section>
      <section
        className="border-t border-border/60 bg-card/20 py-20 sm:py-24"
        aria-labelledby="faq-title"
      >
        <div className="ip-container grid gap-10 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="ip-eyebrow">A little clarity, before we begin</p>
            <h2 id="faq-title" className="ip-heading mt-4">
              Good questions.
              <br />
              Clear answers.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
              A strong partnership starts with shared expectations. Here’s what to know before
              applying.
            </p>
          </div>
          <div className="divide-y divide-border/70">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer list-none pr-6 font-medium marker:hidden focus-visible:outline-primary">
                  {question}
                  <span
                    className="float-right ml-2 text-primary transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="ip-container py-16 sm:py-24">
        <div className="ip-final-cta relative overflow-hidden rounded-3xl border border-primary/25 p-8 sm:p-14">
          <MoveUpRight
            className="absolute right-10 top-10 size-28 text-primary/10"
            aria-hidden="true"
          />
          <p className="ip-eyebrow">Your influence. Our technology.</p>
          <h2 className="ip-heading relative mt-5 max-w-2xl">
            You bring the story.
            <br />
            <span className="text-primary">Let’s build the next chapter.</span>
          </h2>
          <p className="relative mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
            Promote AA100X TECH and grow your brand. Collaborate with us for professional website
            and mobile app development opportunities.
          </p>
          <Button asChild size="lg" className="relative mt-7 ip-cta">
            <Link href={applicationPath}>
              Become an Influencer Partner <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
