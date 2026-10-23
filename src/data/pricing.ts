export type MarketingPlan = {
  eyebrow: string;
  name: string;
  audience: string;
  price: string;
  objective: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

export const marketingPlans: MarketingPlan[] = [
  {
    eyebrow: "Foundational Growth",
    name: "Starter Presence",
    audience: "Ideal for local brands & new startups",
    price: "₹9,999/mo",
    objective: "Brand visibility & organic reach",
    features: [
      "Social media management (2 platforms)",
      "Content creation (8 high-quality posts/mo)",
      "Basic on-page & local SEO optimisation",
      "Monthly growth & engagement analytics",
      "Standard email & chat support",
    ],
    cta: "Request strategy call",
  },
  {
    eyebrow: "Scale & Performance",
    name: "Growth Accelerator",
    audience: "Ideal for expanding businesses needing consistent leads",
    price: "₹24,999/mo",
    objective: "Lead generation & paid ROAS",
    features: [
      "Social media management (4 platforms)",
      "Content creation (20 posts + reels/mo)",
      "Advanced technical SEO & SEM suite",
      "Google & Meta Ads performance setup",
      "Email marketing & automated funnels",
      "Weekly analytics & strategy reviews",
    ],
    cta: "Get custom proposal",
    featured: true,
  },
  {
    eyebrow: "Omnichannel Suite",
    name: "Enterprise Dominance",
    audience: "Tailored for large organisations & established brands",
    price: "₹49,999/mo",
    objective: "Full market share & automation",
    features: [
      "Omnichannel social media execution",
      "Custom video & motion content strategy",
      "Full-scale SEO, paid search & programmatic ads",
      "Advanced CRM & marketing automation",
      "Dedicated senior strategist & account manager",
      "24/7 priority SLA support",
    ],
    cta: "Consult marketing team",
  },
];

export type WebPlan = {
  tier: string;
  badge: string;
  name: string;
  subtitle: string;
  price: string;
  delivery: string;
  specs: { label: string; value: string }[];
  featured?: boolean;
};

export const webPlans: WebPlan[] = [
  {
    tier: "Startup Tier",
    badge: "SEO ready structure",
    name: "Business Essentials",
    subtitle: "Foundational corporate site",
    price: "₹29,999",
    delivery: "10–14 days",
    specs: [
      { label: "Scope capacity", value: "5 pages" },
      { label: "Business emails", value: "2 emails" },
      { label: "Revisions included", value: "2 rounds" },
      { label: "Content support", value: "Advanced" },
      { label: "Maintenance", value: "3 months free" },
    ],
  },
  {
    tier: "Business Tier",
    badge: "Integrations & chat",
    name: "Business Scaler",
    subtitle: "Feature-rich business portal",
    price: "₹49,999",
    delivery: "2–3 weeks",
    specs: [
      { label: "Scope capacity", value: "Up to 15 pages" },
      { label: "Business emails", value: "2 emails" },
      { label: "Revisions included", value: "Unlimited" },
      { label: "Content support", value: "Advanced" },
      { label: "Maintenance", value: "3 months free" },
    ],
    featured: true,
  },
  {
    tier: "Enterprise Tier",
    badge: "Custom workflows",
    name: "Corporate Custom",
    subtitle: "Extensive multi-service site",
    price: "₹79,999",
    delivery: "3–4 weeks",
    specs: [
      { label: "Scope capacity", value: "Up to 50 pages" },
      { label: "Business emails", value: "2 emails" },
      { label: "Revisions included", value: "Unlimited" },
      { label: "Content support", value: "Advanced" },
      { label: "Maintenance", value: "3 months free" },
    ],
  },
];

export type DeliverableGroup = {
  group: string;
  rows: { feature: string; tiers: [boolean, boolean, boolean] }[];
};

export const deliverables: DeliverableGroup[] = [
  {
    group: "Essential foundation",
    rows: [
      { feature: "Domain & secure hosting", tiers: [true, true, true] },
      { feature: "SSL certificate integration", tiers: [true, true, true] },
      { feature: "Mobile responsive layouts", tiers: [true, true, true] },
      { feature: "Website colour & brand customization", tiers: [true, true, true] },
      { feature: "Social media profiles sync", tiers: [true, true, true] },
    ],
  },
  {
    group: "Advanced functionality",
    rows: [
      { feature: "SEO friendly structure & meta", tiers: [true, true, true] },
      { feature: "Live chat & instant messaging", tiers: [false, true, true] },
      { feature: "WhatsApp Business integration", tiers: [false, true, true] },
      { feature: "Interactive Google Maps", tiers: [true, true, true] },
      { feature: "Tailored UX/UI layouts", tiers: [false, true, true] },
    ],
  },
  {
    group: "Technical, admin & control",
    rows: [
      { feature: "Headless / custom CMS integration", tiers: [false, false, true] },
      { feature: "Editor & admin dashboard access", tiers: [false, true, true] },
      { feature: "Google Analytics & heatmaps setup", tiers: [false, true, true] },
      { feature: "Google Search Console configuration", tiers: [true, true, true] },
      { feature: "Google Ads conversion tracking", tiers: [false, true, true] },
      { feature: "CMS video tutorials & onboarding", tiers: [false, false, true] },
    ],
  },
];
