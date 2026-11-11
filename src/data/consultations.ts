export type ConsultationCategory = "standard" | "premium";

export type ConsultationPlan = {
  id: string;
  name: string;
  category: ConsultationCategory;
  duration: string;
  /** Price in rupees (INR). Server always re-derives the amount from this. */
  price: number;
  currency: "INR";
  features: string[];
  badge?: string;
  buttonLabel: string;
  featured?: boolean;
};

export const consultationPlans: ConsultationPlan[] = [
  {
    id: "quick",
    name: "Quick Consultation",
    category: "standard",
    duration: "15 Minutes",
    price: 2500,
    currency: "INR",
    features: ["Quick Discussion", "Q&A", "Basic Guidance"],
    buttonLabel: "Book Now",
  },
  {
    id: "standard",
    name: "Standard Consultation",
    category: "standard",
    duration: "30 Minutes",
    price: 5000,
    currency: "INR",
    features: [
      "Business Discussion",
      "Technology Recommendation",
      "Cost Estimation",
      "Initial Planning",
    ],
    buttonLabel: "Book Now",
    featured: true,
  },
  {
    id: "professional",
    name: "Professional Consultation",
    category: "standard",
    duration: "1 Hour",
    price: 10000,
    currency: "INR",
    features: [
      "Requirement Analysis",
      "Architecture Discussion",
      "Feature Planning",
      "Development Strategy",
    ],
    buttonLabel: "Book Now",
  },
  {
    id: "premium",
    name: "Premium Strategy Session",
    category: "premium",
    duration: "1.5 Hours",
    price: 20000,
    currency: "INR",
    badge: "MOST POPULAR",
    features: [
      "Senior Technical Expert",
      "Complete Business Analysis",
      "Technical Architecture",
      "Technology Stack Recommendation",
      "Project Scope",
      "Budget Estimation",
      "Timeline Planning",
      "AI & Automation Suggestions",
      "Live Q&A",
      "Personalized Development Roadmap",
    ],
    buttonLabel: "Book Premium",
  },
  {
    id: "enterprise",
    name: "Enterprise Premium Consultation",
    category: "premium",
    duration: "2 Hours",
    price: 30000,
    currency: "INR",
    badge: "BEST VALUE",
    featured: true,
    features: [
      "Dedicated Senior Architect",
      "CTO-Level Guidance",
      "Enterprise Solution Planning",
      "Infrastructure Design",
      "Security Consultation",
      "Cloud Strategy",
      "API Architecture",
      "Team Planning",
      "Product Roadmap",
      "Business Growth Strategy",
      "Technical Documentation Review",
    ],
    buttonLabel: "Book Enterprise",
  },
  {
    id: "executive",
    name: "Executive Consultation",
    category: "premium",
    duration: "3 Hours",
    price: 50000,
    currency: "INR",
    badge: "ULTIMATE PREMIUM EXPERIENCE",
    features: [
      "Dedicated Expert Team",
      "Enterprise Architecture",
      "AI Transformation Strategy",
      "Product Planning",
      "Investment Planning",
      "Scaling Strategy",
      "Security Review",
      "Performance Optimization",
      "Long-Term Technical Roadmap",
      "One-on-One Executive Session",
    ],
    buttonLabel: "Book Executive",
  },
];

export function getConsultationPlan(id: string): ConsultationPlan | undefined {
  return consultationPlans.find((p) => p.id === id);
}

export const consultationServices = [
  "Website Development",
  "Web Application",
  "Mobile App Development",
  "App Development",
  "Business IT Solutions",
  "SEO",
  "Influencer Marketing",
  "Game Development",
  "AI Solution",
  "Software Development",
  "Cloud Infrastructure",
  "Digital Marketing",
  "Social Media Ads Marketing",
  "E-commerce",
  "Custom Software",
  "Other",
];

export const meetingPlatforms = ["Google Meet", "Zoom", "Microsoft Teams", "Phone Call"];

export const timeZones = [
  "Asia/Calcutta",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];
