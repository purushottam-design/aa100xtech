import type { Service } from "./services";
import { serviceTypes } from "./service-types";

type Group = NonNullable<Service["navigationGroup"]>;
type Guidance = {
  benefits: string[];
  stack: string[];
  process: { step: string; detail: string }[];
};

// Editorial guidance describes the engagement, not additional package entitlements.
const guidance: Record<Group, Guidance> = {
  development: {
    benefits: [
      "A responsive experience for your customers",
      "A maintainable foundation for future features",
      "A scope aligned with your business workflows",
    ],
    stack: ["React", "Next.js", "TypeScript", "PostgreSQL", "Flutter", "React Native"],
    process: [
      {
        step: "Discover",
        detail: "Review your users, existing systems and required integrations.",
      },
      {
        step: "Design",
        detail: "Agree the user journeys, screens and scope before implementation.",
      },
      {
        step: "Build and review",
        detail: "Implement the agreed features with regular reviews and integration checks.",
      },
      {
        step: "Validate and hand over",
        detail: "Check responsive behavior, accessibility and deployment requirements together.",
      },
    ],
  },
  marketing: {
    benefits: [
      "A clear audience and campaign objective",
      "Consistent creative direction across selected channels",
      "Reporting tied to the metrics agreed for your campaign",
    ],
    stack: ["Google Analytics 4", "Google Search Console", "Google Ads", "Meta Ads Manager"],
    process: [
      {
        step: "Audit",
        detail: "Review your audience, existing content, channels and measurement setup.",
      },
      {
        step: "Plan",
        detail: "Agree objectives, content, approval steps and any separate media budget.",
      },
      {
        step: "Execute",
        detail: "Publish or launch approved assets on the channels included in your scope.",
      },
      {
        step: "Measure and refine",
        detail: "Review the agreed metrics and recommend the next improvements.",
      },
    ],
  },
  automation: {
    benefits: [
      "Less repetitive work in the selected workflow",
      "Integrations designed around your existing tools",
      "Clear human review and escalation points",
    ],
    stack: [
      "API integrations",
      "Workflow automation",
      "Language models",
      "Speech and avatar platforms",
    ],
    process: [
      {
        step: "Map the workflow",
        detail: "Identify inputs, permissions, exceptions and human decision points.",
      },
      {
        step: "Prototype",
        detail: "Review a representative example before agreeing the final scope.",
      },
      {
        step: "Integrate",
        detail: "Connect the approved tools with access controls and error handling.",
      },
      {
        step: "Evaluate",
        detail: "Check output quality and hand over the agreed operating guidance.",
      },
    ],
  },
  media: {
    benefits: [
      "A clear narrative around your existing material",
      "Formats suited to your chosen publishing channels",
      "Brand consistency across the agreed exports",
    ],
    stack: [
      "Video editing",
      "AI video generation",
      "Audio production",
      "Captioning and compositing",
    ],
    process: [
      {
        step: "Brief",
        detail: "Review your source material, audience, format and usage permissions.",
      },
      { step: "Storyboard", detail: "Agree the script, creative direction and deliverables." },
      {
        step: "Produce",
        detail: "Create the edit, narration and visual treatment within the approved scope.",
      },
      {
        step: "Review and deliver",
        detail: "Review the agreed revisions and export the approved formats.",
      },
    ],
  },
  infrastructure: {
    benefits: [
      "Better visibility into operational risks",
      "An implementation plan that fits your environment",
      "Clear access, ownership and handover requirements",
    ],
    stack: ["Cloud platforms", "CI/CD", "Monitoring", "Identity and access management"],
    process: [
      {
        step: "Assess",
        detail: "Review the authorized environment, access boundaries and business requirements.",
      },
      {
        step: "Plan",
        detail: "Agree priorities, acceptance criteria and any maintenance windows.",
      },
      {
        step: "Implement",
        detail: "Apply scoped improvements with appropriate review and recovery plans.",
      },
      {
        step: "Verify",
        detail: "Validate the agreed changes and document operating responsibilities.",
      },
    ],
  },
};

export function serviceDetails(service: Service) {
  const group = guidance[service.navigationGroup ?? "development"];
  const types = serviceTypes.filter(
    (type) => type.serviceSlug === service.slug || type.slug === service.slug,
  );
  return {
    ...group,
    types,
    // Existing detailed specifications are the source of truth where available.
    stack: types.length ? [...new Set(types.flatMap((type) => type.stack))] : group.stack,
    faqs: [
      {
        q: `What is included in ${service.title}?`,
        a: "The inclusions and offerings on this page describe the available scope. Your proposal confirms the deliverables, exclusions and acceptance criteria for your project.",
      },
      {
        q: "How are the price and timeline confirmed?",
        a: "Published starting prices are retained below. The final quotation and timeline depend on scope, integrations, source material and review requirements; request a customised proposal before proceeding.",
      },
      {
        q: "Can you work with our existing systems or assets?",
        a: "Share your current setup during consultation. We will review compatibility, access requirements and any permissions needed before agreeing the work.",
      },
      {
        q: "What happens after delivery?",
        a: "Your proposal defines handover, revisions, support and any ongoing fees. Third-party subscriptions, usage fees and advertising spend should be confirmed separately.",
      },
    ],
  };
}
