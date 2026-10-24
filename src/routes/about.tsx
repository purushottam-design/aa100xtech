import { Link } from "@/lib/navigation";
import { SectionHeading } from "@/components/section-heading";
import { StatCounter } from "@/components/stat-counter";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

const title = "About AA100XTech — IT Services Company in Patna";
const description =
  "Absolute Advancement 100X Tech is an Indian IT services company in Patna delivering websites, mobile apps, AI, cloud and digital marketing for 100x business growth.";

export default AboutPage;

const stats = [
  { value: 2, suffix: "+", label: "Years in business" },
  { value: 200, suffix: "+", label: "Projects completed" },
  { value: 150, suffix: "+", label: "Happy clients" },
  { value: 20, suffix: "+", label: "Team members" },
];

const timeline = [
  {
    year: "2025",
    title: "Company founded",
    body: "Started with a vision to transform businesses through technology and 100x scale.",
  },
  {
    year: "2025 Q2",
    title: "Expanded digital suite",
    body: "Added mobile app development, cloud DevOps and AI solutions to our core portfolio.",
  },
  {
    year: "2025 Q4",
    title: "Enterprise partnerships",
    body: "Delivered high-converting platforms for retail, real estate and fintech clients.",
  },
  {
    year: "2026",
    title: "AI & next-gen tech focus",
    body: "Integrated agentic AI, high-frequency automation and modern MERN stack architectures.",
  },
];

const values = [
  {
    title: "Innovation",
    body: "We embrace cutting-edge technologies and creative solutions to stay ahead of the curve.",
  },
  {
    title: "Client-centric",
    body: "Your success is our priority. We build lasting partnerships based on trust and results.",
  },
  {
    title: "Integrity",
    body: "We maintain the highest standards of honesty, transparency and ethical practices.",
  },
  {
    title: "Excellence",
    body: "We hold every deliverable to a standard we would happily put our own name on.",
  },
];

function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/60 py-20 md:py-28">
        <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            About {site.legalName}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl">
            Transforming businesses through <span className="text-gradient-ember">technology</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {site.legalName} (AA100XTech) is an Indian IT services company in Patna providing
            website development, mobile apps, digital marketing, design, cloud solutions and paid
            consultations. GSTIN: {site.gstin}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Work with us</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/portfolio">View our work</Link>
            </Button>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-8 border-t border-border/60 pt-10 md:grid-cols-4">
            {stats.map((s) => (
              <StatCounter key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Our journey"
              title="Building the digital future, step by step"
              description="Founded in 2025, AA100XTech began with a focused mission: to help businesses harness technology for 100x growth. What started as an agile engineering team has evolved into a powerhouse digital partner."
            />

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="surface-card p-6">
                <h3 className="font-display text-lg font-semibold">Our mission</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  To empower global businesses with agile, high-scale software and AI-driven
                  solutions.
                </p>
              </div>
              <div className="surface-card p-6">
                <h3 className="font-display text-lg font-semibold">Our vision</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  To be the most trusted technology partner driving exponential innovation globally.
                </p>
              </div>
            </div>
          </div>

          <ol className="relative space-y-8 border-l border-border pl-8">
            {timeline.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[41px] top-1.5 size-3 rounded-full bg-primary ring-4 ring-background" />
                <p className="font-display text-sm font-bold text-primary">{t.year}</p>
                <h3 className="mt-1 font-display text-lg font-semibold">{t.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Driven by purpose"
            title="Our core values"
            description="The principles that guide every line of code we write and every solution we engineer."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="surface-card p-6">
                <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
