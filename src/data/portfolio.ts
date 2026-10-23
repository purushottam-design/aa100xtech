export type Project = {
  slug: string;
  name: string;
  category: string;
  description: string;
  tech: string[];
  url: string;
  image: string;
};

export const projects: Project[] = [
  {
    slug: "worldwide-prominent-properties",
    name: "Worldwide Prominent Properties",
    category: "Web Development",
    description:
      "Premium real-estate website for global property listings and lead generation.",
    tech: ["MERN Stack", "Next.js", "TypeScript"],
    url: "https://worldwideprominentproperties.com/",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&h=600&fit=crop&q=80",
  },
  {
    slug: "picempire",
    name: "PicEmpire",
    category: "AI Platform",
    description:
      "AI-powered creative platform for modern image experiences and generation workflows.",
    tech: ["MERN Stack", "Next.js", "TypeScript"],
    url: "https://picempire.ai/",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&h=600&fit=crop&q=80",
  },
  {
    slug: "shakti-sphere-lifestyle",
    name: "Shakti Sphere Lifestyle",
    category: "E-Commerce",
    description:
      "Lifestyle brand website built for products, storytelling and conversions.",
    tech: ["MERN Stack", "Next.js", "TypeScript"],
    url: "https://shaktispherelifestyle.com/",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=600&fit=crop&q=80",
  },
  {
    slug: "ecoblossom-creations",
    name: "EcoBlossom Creations",
    category: "E-Commerce",
    description:
      "Sustainable products storefront with a clean catalogue and checkout experience.",
    tech: ["Next.js", "Commerce", "SEO"],
    url: "https://ecoblossomcreations.com/",
    image:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=900&h=600&fit=crop&q=80",
  },
  {
    slug: "tasty-foods-delights",
    name: "Tasty Foods Delights",
    category: "Web Development",
    description:
      "Restaurant and food brand site with menu presentation and online enquiry flow.",
    tech: ["React", "Node.js", "SEO"],
    url: "https://tastyfoodsdelights.com/",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&h=600&fit=crop&q=80",
  },
  {
    slug: "digital-growth-campaigns",
    name: "Digital Growth Campaigns",
    category: "Marketing",
    description:
      "Multi-client paid and organic growth programmes across search and social.",
    tech: ["Google Ads", "Meta Ads", "Analytics"],
    url: "https://www.aa100xtech.com/contact",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=600&fit=crop&q=80",
  },
];

export const projectCategories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];
