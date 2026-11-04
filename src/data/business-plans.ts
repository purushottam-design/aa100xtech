// Approved names stay separate: no inferred mapping between these packages.
export type BusinessPlan = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  features: readonly string[];
};
export type InfluencerServicePackage = {
  id: string;
  name: string;
  description: string;
  price?: number;
  eligibility?: string;
  deliverables?: readonly string[];
  addOns?: readonly string[];
  rights?: string;
};
export const businessPlans: readonly BusinessPlan[] = [
  {
    id: "business",
    name: "Business",
    description: "A professional business website with responsive design and manageable content.",
    price: null,
    features: [
      "Professional business website",
      "Content management",
      "Responsive design",
      "Consultation and scoped proposal",
    ],
  },
  {
    id: "business-plus",
    name: "Business+",
    description:
      "A tailored scope for businesses with more advanced website and technology requirements.",
    price: null,
    features: [
      "Custom requirements review",
      "Existing website feature assessment",
      "Content management",
      "Consultation and scoped proposal",
    ],
  },
] as const;
export const emailEntitlements = [
  { id: "business-starter", name: "Business Starter", accounts: 3 },
  { id: "corporate", name: "Corporate", accounts: 4 },
] as const;
export const influencerServices: readonly InfluencerServicePackage[] = [
  {
    id: "website",
    name: "Website",
    description: "An owned home for your work, campaigns and inquiries.",
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "Plan a mobile experience around your audience and content.",
  },
  {
    id: "domain",
    name: "Domain",
    description: "Discuss domain selection and setup for your brand.",
  },
  {
    id: "business-emails",
    name: "Business Emails",
    description: "A professional email identity, scoped to your requirements.",
  },
  {
    id: "images",
    name: "Images",
    description: "Creative imagery and campaign assets.",
  },
  {
    id: "videos",
    name: "Videos",
    description: "Video concepts, production and editing requirements.",
  },
  {
    id: "songs-music",
    name: "Songs and Music",
    description: "Discuss original music production and the required usage rights.",
  },
  {
    id: "music-albums",
    name: "Music Albums",
    description: "Scope a cohesive album project and its deliverables.",
  },
  {
    id: "music-videos",
    name: "Music Videos",
    description: "Bring music and visual storytelling together.",
  },
  {
    id: "micro-dramas",
    name: "Micro Dramas",
    description: "Develop short episodic stories for digital audiences.",
  },
] as const;
export const inquiryOptions = [
  ...businessPlans.map((p) => ({ id: p.id as string, name: p.name as string })),
  ...emailEntitlements.map((p) => ({
    id: p.id as string,
    name: p.name as string,
  })),
  ...influencerServices.map((p) => ({
    id: p.id as string,
    name: p.name as string,
  })),
  { id: "influencer-marketing", name: "Influencer Marketing" },
  { id: "viral-influencer-marketing", name: "Viral Influencer Marketing" },
  { id: "other", name: "Other requirements" },
];
