import { ArrowRight, Fingerprint, Globe2, UserRound } from "lucide-react";
import { Link } from "@/lib/navigation";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const principles = [
  {
    icon: Fingerprint,
    title: "One Identity",
    description:
      "Your name, your story and your values, expressed consistently. Build a recognisable personal brand across your website and social profiles.",
  },
  {
    icon: Globe2,
    title: "One World",
    description:
      "Let your work travel beyond your location. Bring your story, portfolio and ways to connect into one digital home that people can find from anywhere.",
  },
  {
    icon: UserRound,
    title: "One Person",
    description:
      "You are the starting point. Your experience, ambitions and voice shape a presence that feels personal and represents who you are.",
  },
];

const steps = [
  {
    title: "Define your story",
    description: "Start with who you are, what you do and the people you want to reach.",
  },
  {
    title: "Bring your presence together",
    description:
      "Connect your visual identity, personal website and social profiles around the same story.",
  },
  {
    title: "Share it with the world",
    description:
      "Create a clear launch plan and content that introduces your work in your own voice.",
  },
];

export default function OneIdentityOneWorldOnePersonPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 bg-linear-to-br from-amber-50 via-background to-orange-50 py-16 md:py-24">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <div>
            <Badge variant="secondary" className="mb-5">
              Your story. Your place in the world.
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.1] sm:text-6xl">
              <span className="block">One Identity</span>{" "}
              <span className="block text-gradient-ember">One World</span>{" "}
              <span className="block">One Person</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Your name carries your story. Give it a consistent digital presence that connects who
              you are with the work you want the world to see.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/consultation">
                  Build your identity <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/be-the-one">Explore Be The One</Link>
              </Button>
            </div>
          </div>
          <div
            className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center"
            aria-hidden="true"
          >
            <div className="absolute inset-0 rounded-full border border-amber-300/70 bg-white/50" />
            <div className="absolute inset-7 rounded-full border border-dashed border-amber-400/60" />
            <Globe2 className="absolute size-64 max-w-[75%] text-amber-500/20" strokeWidth={0.7} />
            <div className="relative flex size-32 items-center justify-center rounded-full border border-amber-300 bg-white shadow-xl shadow-amber-600/10">
              <Fingerprint className="size-20 text-amber-700" strokeWidth={1.3} />
            </div>
            <span className="absolute bottom-7 rounded-full border border-amber-200 bg-white px-5 py-2 text-sm font-semibold text-amber-900">
              It starts with you.
            </span>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The idea"
            title="A connected presence, built around you"
            description="Three simple principles to guide how you introduce yourself online."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.title} className="surface-card p-6 md:p-8">
                <span className="flex size-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700">
                  <principle.icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold">{principle.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <div>
            <SectionHeading
              eyebrow="From idea to presence"
              title="Make your next introduction count"
              description="Turn the idea into a personal brand, website and social presence with our Be The One service."
              align="left"
            />
            <Button asChild className="mt-6" variant="outline">
              <Link to="/be-the-one">
                Discover the full package <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <ol className="space-y-6">
            {steps.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-900">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
