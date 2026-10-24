import { Link } from "@/lib/navigation";
import { ArrowRight, Check, Film, Home, UserRound, Video } from "lucide-react";
import { ServiceDemos } from "@/components/service-demos";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/currency-provider";
import { demosForSlug } from "@/data/demos";
import { serviceBySlug } from "@/data/services";

const title = "Real Estate AI Video & Avatar Walkthroughs — AA100XTech";
const description =
  "Turn property photos into cinematic listing videos and AI avatar walkthroughs. Real estate marketing that sells listings faster — from ₹4,999.";

const realEstateSlugs = ["real-estate-photo-to-video", "ai-avatar-property-walkthrough"] as const;

export default RealEstatePage;

function RealEstatePage() {
  const services = realEstateSlugs.map((slug) => serviceBySlug(slug)).filter(Boolean);
  return (
    <div>
      <Hero />
      <ServicesOverview services={services} />
      <DetailSections />
      <ProcessSection />
      <CTASection />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
      <div
        className="absolute -right-40 -top-40 size-[560px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--gradient-ember)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Real estate marketing
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
              Listings that move. <span className="text-gradient-ember">Literally.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Convert property photos into cinematic video tours and AI avatar walkthroughs. Sell
              more listings, book more site visits, and stand out in every portal and feed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/contact">
                  Request a sample video <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/services/$slug" params={{ slug: "real-estate-photo-to-video" }}>
                  See service details
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card glow-ring p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Film className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">Photos to Video</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cinematic tours, reels and pitch films from still photos — no reshoot required.
              </p>
              <p className="mt-4 font-display text-2xl font-bold text-primary">
                <Price value="₹4,999" />
                <span className="ml-1 text-xs font-normal text-muted-foreground">onwards</span>
              </p>
            </div>
            <div className="surface-card glow-ring p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <UserRound className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">AI Avatar Walkthrough</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A photoreal AI host walks buyers through the property in any language.
              </p>
              <p className="mt-4 font-display text-2xl font-bold text-primary">
                <Price value="₹7,999" />
                <span className="ml-1 text-xs font-normal text-muted-foreground">onwards</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesOverview({ services }: { services: ReturnType<typeof serviceBySlug>[] }) {
  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Two services, one goal"
          title="Sell the property before the visit"
          description="Every real estate listing needs motion. We produce two proven formats that turn passive browsers into active buyers."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {services.map((s) => {
            if (!s) return null;
            const Icon = s.icon === "Film" ? Film : s.icon === "UserRound" ? UserRound : Home;
            return (
              <article key={s.slug} className="surface-card flex flex-col p-7">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>

                <div className="mt-6 rounded-xl bg-surface-2/70 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Starting from
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-primary">
                    <Price value={s.startingFrom} />
                  </p>
                  <p className="text-xs text-muted-foreground">{s.priceNote}</p>
                </div>

                <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {s.highlights.slice(0, 5).map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                      {h}
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="mt-7">
                  <Link to="/services/$slug" params={{ slug: s.slug }}>
                    Explore {s.title} <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DetailSections() {
  const photoToVideo = serviceBySlug("real-estate-photo-to-video");
  const avatar = serviceBySlug("ai-avatar-property-walkthrough");

  return (
    <div>
      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Film className="size-4" />
                </span>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  Service #1: Photos to cinematic video
                </h2>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                We take your existing property photos and turn them into scroll-stopping videos:
                parallax camera moves, room-to-room transitions, licensed music, on-screen specs
                and your agency branding. Delivered in vertical reels, landscape tours and pitch
                formats.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {photoToVideo?.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8">
                <Link to="/services/$slug" params={{ slug: "real-estate-photo-to-video" }}>
                  View pricing & formats <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ServiceDemos demos={demosForSlug("real-estate-photo-to-video")} />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <ServiceDemos demos={demosForSlug("ai-avatar-property-walkthrough")} />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <UserRound className="size-4" />
                </span>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  Service #2: AI avatar property walkthrough
                </h2>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                A photoreal AI presenter walks buyers through the property room by room —
                scripted from your listing, lip-synced, and branded to your agency. Generate the
                same tour in multiple languages without reshoots or presenter fees.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {avatar?.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-signal" />
                    {h}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8">
                <Link to="/services/$slug" params={{ slug: "ai-avatar-property-walkthrough" }}>
                  View avatar pricing <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProcessSection() {
  const steps = [
    {
      title: "Send photos",
      body: "Share the property photos, floor plan and key selling points via WhatsApp or email.",
      icon: Home,
    },
    {
      title: "We produce",
      body: "Our team builds the cinematic edit or AI avatar walkthrough with music, captions and branding.",
      icon: Video,
    },
    {
      title: "Review & publish",
      body: "You get vertical reels, landscape tours and portal-ready cuts in 48–72 hours.",
      icon: Film,
    },
  ];

  return (
    <section className="border-b border-border/60 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From stills to selling in three steps"
          description="No on-site shoot, no expensive crew. Just your photos and our production pipeline."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="surface-card p-7">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary font-display text-sm font-bold">
                  {i + 1}
                </span>
                <step.icon className="size-5 text-muted-foreground" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="surface-card glow-ring relative overflow-hidden p-8 md:p-12">
          <div
            className="absolute -right-20 -top-20 size-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--gradient-ember)" }}
            aria-hidden
          />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">
                Ready to make your listings move?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Send us your photos today and get a sample video for your next property. Bulk
                retainers available for agencies and portals.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
              <Button asChild size="lg">
                <Link to="/contact">Request a real estate quote</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/services">Browse all services</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
