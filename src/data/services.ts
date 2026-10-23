export type Offering = { name: string; price: string };

export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  startingFrom: string;
  priceNote: string;
  icon: string;
  highlights: string[];
  offerings: Offering[];
};

import { aiServices } from "./services-ai";

const coreServices: Service[] = [
  {
    slug: "website-development",
    title: "Website Development",
    short: "High-performance websites engineered for brand impact, SEO and conversions.",
    description:
      "We design and build tailored, SEO-optimised websites that make the best possible first impression — from fast landing pages to CMS-driven corporate platforms and complex portals.",
    startingFrom: "₹7,999",
    priceNote: "one-time project fee",
    icon: "Globe",
    highlights: [
      "Content management systems",
      "Presentation & corporate websites",
      "Online catalogues",
      "Portal systems",
      "Headless / custom CMS",
      "Any other dynamic website",
    ],
    offerings: [
      { name: "Landing Page", price: "₹7,999" },
      { name: "Portfolio Website", price: "₹12,999" },
      { name: "Business Website", price: "₹19,999" },
      { name: "Restaurant Website", price: "₹24,999" },
      { name: "Corporate Website", price: "₹34,999" },
      { name: "Educational Website", price: "₹39,999" },
      { name: "Real Estate Website", price: "₹44,999" },
      { name: "Hospital Website", price: "₹49,999" },
      { name: "Booking Website", price: "₹49,999" },
      { name: "News Portal", price: "₹59,999" },
      { name: "Job Portal", price: "₹69,999" },
      { name: "CRM Website", price: "₹79,999" },
      { name: "LMS Platform", price: "₹99,999" },
      { name: "ERP Website", price: "₹1,49,999" },
      { name: "Marketplace", price: "₹1,99,999" },
    ],
  },
  {
    slug: "ecommerce-development",
    title: "E-Commerce Development",
    short: "Scalable online stores and marketplaces with seamless payments and operations.",
    description:
      "Virtual shops built to sell: secure payment gateways, inventory and order operations, and B2C/B2B portals that scale with your catalogue.",
    startingFrom: "₹9,999",
    priceNote: "one-time + optional AMC",
    icon: "ShoppingCart",
    highlights: [
      "Payment gateway integration",
      "Shopping cart & checkout",
      "Order tracking",
      "Inventory management",
      "B2C & B2B portals",
      "Shopify / headless commerce",
    ],
    offerings: [
      { name: "Payment Gateway Integration", price: "₹9,999" },
      { name: "Shopping Cart", price: "₹14,999" },
      { name: "Order Tracking", price: "₹19,999" },
      { name: "Inventory Management", price: "₹29,999" },
      { name: "Online Store", price: "₹39,999" },
      { name: "Shopify Store Setup", price: "₹49,999" },
      { name: "B2C Portal", price: "₹79,999" },
      { name: "Multi-vendor Marketplace", price: "₹1,99,999" },
    ],
  },
  {
    slug: "mobile-app-development",
    title: "Mobile App Development",
    short: "Native and cross-platform apps that deliver speed, security and delightful UX.",
    description:
      "From MVP to store launch: Android, iOS, Flutter and React Native apps with clean UI/UX, analytics, and ongoing maintenance.",
    startingFrom: "₹49,999",
    priceNote: "one-time project fee",
    icon: "Smartphone",
    highlights: [
      "iOS app development",
      "Android app development",
      "Cross-platform solutions",
      "App UI/UX design",
      "App maintenance",
      "App store optimisation",
    ],
    offerings: [
      { name: "Android App", price: "₹49,999" },
      { name: "Hybrid App", price: "₹54,999" },
      { name: "iOS App", price: "₹59,999" },
      { name: "Flutter App", price: "₹69,999" },
      { name: "React Native App", price: "₹74,999" },
      { name: "E-commerce App", price: "₹99,999" },
      { name: "Delivery App", price: "₹1,29,999" },
      { name: "Fintech App", price: "₹1,99,999" },
      { name: "App Maintenance (AMC)", price: "₹9,999/mo" },
      { name: "App Store Optimisation", price: "₹7,999/mo" },
    ],
  },
  {
    slug: "seo",
    title: "Search Engine Optimization",
    short: "Rank higher on Google, Bing and Yahoo with technical and content-led SEO.",
    description:
      "Ensuring your business is optimised to rank higher on search engines — from technical foundations and on-page work to local SEO and authority building.",
    startingFrom: "₹7,999/mo",
    priceNote: "monthly retainer",
    icon: "Search",
    highlights: [
      "Keyword research & analysis",
      "On-page optimisation",
      "Technical SEO",
      "Link building strategy",
      "Local SEO optimisation",
      "SEO performance tracking",
    ],
    offerings: [
      { name: "Local SEO", price: "₹7,999/mo" },
      { name: "On-Page SEO", price: "₹9,999/mo" },
      { name: "Technical SEO Audit", price: "₹14,999" },
      { name: "National SEO", price: "₹24,999/mo" },
      { name: "E-commerce SEO", price: "₹29,999/mo" },
    ],
  },
  {
    slug: "advertising-management",
    title: "Advertising Management",
    short: "Paid campaigns engineered for measurable return on ad spend.",
    description:
      "Increasing your visibility in SERPs and social feeds primarily through paid advertising, with tight conversion tracking on every rupee spent.",
    startingFrom: "₹7,999/mo",
    priceNote: "management fee, excl. ad spend",
    icon: "Megaphone",
    highlights: [
      "Google Ads management",
      "Social media advertising",
      "Display advertising",
      "Retargeting campaigns",
      "Ad copywriting",
      "Conversion tracking",
    ],
    offerings: [
      { name: "Google Ads Management", price: "₹7,999/mo" },
      { name: "Meta Ads Management", price: "₹9,999/mo" },
      { name: "Display & Retargeting", price: "₹12,999/mo" },
      { name: "Full Performance Suite", price: "₹24,999/mo" },
    ],
  },
  {
    slug: "social-media-marketing",
    title: "Social Media Marketing",
    short: "Enhanced social tactics backed by research, content and analysis.",
    description:
      "Strategy, content production and community management that turns followers into a pipeline — with reporting you can actually act on.",
    startingFrom: "₹7,999/mo",
    priceNote: "monthly retainer",
    icon: "Share2",
    highlights: [
      "Social strategy development",
      "Content creation & curation",
      "Community management",
      "Influencer marketing",
      "Social analytics & reporting",
      "Brand awareness campaigns",
    ],
    offerings: [
      { name: "2-Platform Management", price: "₹7,999/mo" },
      { name: "4-Platform Management", price: "₹14,999/mo" },
      { name: "Reels & Video Content", price: "₹19,999/mo" },
      { name: "Influencer Campaigns", price: "₹29,999/mo" },
    ],
  },
  {
    slug: "graphic-design",
    title: "Graphic Design",
    short: "Eye-catching design that grabs your audience's attention.",
    description:
      "Brand identity, marketing collateral and interface design produced by a team that thinks in systems, not one-off files.",
    startingFrom: "₹1,499",
    priceNote: "per deliverable",
    icon: "PenTool",
    highlights: [
      "Logo & brand identity",
      "Marketing materials",
      "User interface (UI) design",
      "Infographics & illustrations",
      "Print design services",
      "Social media graphics",
    ],
    offerings: [
      { name: "Social Media Creative", price: "₹1,499" },
      { name: "Brochure / Flyer", price: "₹2,999" },
      { name: "Logo Design", price: "₹4,999" },
      { name: "Brand Identity Kit", price: "₹14,999" },
      { name: "Full UI Design System", price: "₹49,999" },
    ],
  },
  {
    slug: "ai-solutions",
    title: "AI & Automation",
    short: "Agentic AI, chatbots and automation wired into your real workflows.",
    description:
      "We integrate AI where it pays off: support agents, document intelligence, lead qualification and internal automation built on modern LLM stacks.",
    startingFrom: "₹29,999",
    priceNote: "project based",
    icon: "Sparkles",
    highlights: [
      "AI chatbots & support agents",
      "Document & data intelligence",
      "Workflow automation",
      "Recommendation engines",
      "Custom model integration",
      "Analytics & evaluation",
    ],
    offerings: [
      { name: "AI Chatbot Integration", price: "₹29,999" },
      { name: "Workflow Automation", price: "₹49,999" },
      { name: "Document Intelligence", price: "₹79,999" },
      { name: "Custom Agentic Platform", price: "₹1,99,999" },
    ],
  },
  {
    slug: "cloud-devops",
    title: "Cloud & DevOps",
    short: "Reliable infrastructure, CI/CD and observability for growing platforms.",
    description:
      "Cloud architecture, deployment pipelines and monitoring so your product ships often and stays up.",
    startingFrom: "₹19,999",
    priceNote: "project or monthly",
    icon: "Cloud",
    highlights: [
      "Cloud architecture & migration",
      "CI/CD pipelines",
      "Containerisation",
      "Monitoring & alerting",
      "Backup & disaster recovery",
      "Cost optimisation",
    ],
    offerings: [
      { name: "Deployment & CI/CD Setup", price: "₹19,999" },
      { name: "Cloud Migration", price: "₹49,999" },
      { name: "Managed DevOps (AMC)", price: "₹24,999/mo" },
    ],
  },
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    short: "Audits, hardening and monitoring that keep your platform trustworthy.",
    description:
      "Security reviews, penetration testing and hardening for web and mobile platforms, plus ongoing monitoring.",
    startingFrom: "₹24,999",
    priceNote: "per engagement",
    icon: "ShieldCheck",
    highlights: [
      "Security audits",
      "Penetration testing",
      "SSL & hardening",
      "Access control reviews",
      "Incident response planning",
      "Compliance guidance",
    ],
    offerings: [
      { name: "Website Security Audit", price: "₹24,999" },
      { name: "Penetration Test", price: "₹49,999" },
      { name: "Managed Security", price: "₹19,999/mo" },
    ],
  },
];

export const services: Service[] = [...coreServices, ...aiServices];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);
