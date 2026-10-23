import {
  Atom,
  BarChart3,
  Blocks,
  Boxes,
  Brackets,
  Braces,
  Cloud,
  Code2,
  Coffee,
  Component,
  Cpu,
  Database,
  Feather,
  FileCode2,
  Flame,
  Gauge,
  Globe,
  HardDrive,
  Layers,
  LayoutTemplate,
  Leaf,
  LineChart,
  Mail,
  Megaphone,
  MousePointerClick,
  Network,
  Palette,
  PenTool,
  Rocket,
  Search,
  Server,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Store,
  Target,
  Terminal,
  TrendingUp,
  Triangle,
  Users,
  Wind,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type TechCategoryId = "frontend" | "backend" | "database" | "cms" | "marketing";

export type Technology = {
  name: string;
  description: string;
  icon: LucideIcon;
  category: TechCategoryId;
};

export const techCategories: { id: TechCategoryId; label: string; icon: LucideIcon }[] = [
  { id: "frontend", label: "Frontend", icon: Code2 },
  { id: "backend", label: "Backend", icon: Server },
  { id: "database", label: "Database", icon: Database },
  { id: "cms", label: "CMS & Platforms", icon: LayoutTemplate },
  { id: "marketing", label: "Digital Marketing", icon: Megaphone },
];

export const categoryLabel: Record<TechCategoryId, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Database",
  cms: "CMS & Platforms",
  marketing: "Digital Marketing",
};

export const technologies: Technology[] = [
  // Frontend
  { name: "React", description: "UI Library", icon: Atom, category: "frontend" },
  { name: "Vue.js", description: "Progressive Framework", icon: Leaf, category: "frontend" },
  { name: "Angular", description: "Platform Framework", icon: Component, category: "frontend" },
  { name: "Next.js", description: "React Framework", icon: Triangle, category: "frontend" },
  { name: "TypeScript", description: "Typed JavaScript", icon: FileCode2, category: "frontend" },
  { name: "Tailwind CSS", description: "Utility CSS", icon: Wind, category: "frontend" },
  { name: "Redux", description: "State Management", icon: Workflow, category: "frontend" },
  { name: "Webpack", description: "Module Bundler", icon: Boxes, category: "frontend" },

  // Backend
  { name: "Node.js", description: "JavaScript Runtime", icon: Terminal, category: "backend" },
  { name: "Python", description: "Programming Language", icon: Braces, category: "backend" },
  { name: "Java", description: "Enterprise Language", icon: Coffee, category: "backend" },
  { name: "PHP", description: "Server Language", icon: Brackets, category: "backend" },
  { name: "Express.js", description: "Node Framework", icon: Network, category: "backend" },
  { name: "Django", description: "Python Framework", icon: Layers, category: "backend" },
  { name: "Spring Boot", description: "Java Framework", icon: Rocket, category: "backend" },
  { name: "Laravel", description: "PHP Framework", icon: Feather, category: "backend" },

  // Database
  { name: "PostgreSQL", description: "Relational DB", icon: Database, category: "database" },
  { name: "MongoDB", description: "NoSQL Database", icon: Leaf, category: "database" },
  { name: "MySQL", description: "Relational DB", icon: HardDrive, category: "database" },
  { name: "Redis", description: "In-Memory Store", icon: Zap, category: "database" },
  { name: "Elasticsearch", description: "Search Engine", icon: Search, category: "database" },
  { name: "Firebase", description: "BaaS Platform", icon: Flame, category: "database" },
  { name: "Oracle", description: "Enterprise DB", icon: Cpu, category: "database" },
  { name: "Cassandra", description: "Distributed DB", icon: Cloud, category: "database" },

  // CMS & Platforms
  { name: "WordPress", description: "CMS Platform", icon: Globe, category: "cms" },
  { name: "Shopify", description: "E-commerce", icon: ShoppingBag, category: "cms" },
  { name: "Magento", description: "E-commerce", icon: Store, category: "cms" },
  { name: "Drupal", description: "CMS Platform", icon: Blocks, category: "cms" },
  { name: "Contentful", description: "Headless CMS", icon: PenTool, category: "cms" },
  { name: "Strapi", description: "Headless CMS", icon: Layers, category: "cms" },
  { name: "WooCommerce", description: "E-commerce", icon: ShoppingCart, category: "cms" },
  { name: "Sanity", description: "Content Platform", icon: Palette, category: "cms" },

  // Digital Marketing
  { name: "Google Analytics", description: "Web Analytics", icon: BarChart3, category: "marketing" },
  { name: "Google Ads", description: "Advertising", icon: MousePointerClick, category: "marketing" },
  { name: "SEMrush", description: "SEO Tool", icon: LineChart, category: "marketing" },
  { name: "HubSpot", description: "Marketing Hub", icon: Target, category: "marketing" },
  { name: "Mailchimp", description: "Email Marketing", icon: Mail, category: "marketing" },
  { name: "Hootsuite", description: "Social Media", icon: Share2, category: "marketing" },
  { name: "Ahrefs", description: "SEO Tool", icon: TrendingUp, category: "marketing" },
  { name: "Meta Ads", description: "Social Ads", icon: Users, category: "marketing" },
];

export const techStats = [
  { value: "40+", label: "Technologies", icon: Boxes },
  { value: "50+", label: "Projects Built", icon: Gauge },
  { value: "1+", label: "Years Experience", icon: Rocket },
  { value: "100%", label: "Client Satisfaction", icon: Target },
];
