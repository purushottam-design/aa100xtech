import { projects } from "@/data/portfolio";
import { clients } from "@/data/site";

type ClientDetails = {
  industry: string;
  initials: string;
  image: string;
  services: string[];
  description?: string;
};

const details: Record<string, ClientDetails> = {
  "worldwideprominentproperties.com": {
    industry: "Real estate",
    initials: "WP",
    image: "/influencer-marketing/real-estate.webp",
    services: ["Website development", "Lead generation"],
  },
  "ecoblossomcreations.com": {
    industry: "Lifestyle & retail",
    initials: "EC",
    image: "/clients/sustainable.webp",
    services: ["E-commerce", "Product catalogue"],
  },
  "tastyfoodsdelights.com": {
    industry: "Food & hospitality",
    initials: "TF",
    image: "/influencer-marketing/food.webp",
    services: ["Website development", "Brand presentation"],
  },
  "creatormoves365.ai": {
    industry: "AI & technology",
    initials: "CM",
    image: "/influencers/creator-filmmaker.webp",
    services: ["AI platform", "Creative workflows"],
  },
  "creatormoves365.com": {
    industry: "Creator platforms",
    initials: "365",
    image: "/influencers/creator-podcast.webp",
    services: ["Creator platform", "Digital experiences"],
    description: "Explore the creatormoves365.com brand and its dedicated online destination.",
  },
  "shaktispherelifestyle.com": {
    industry: "Lifestyle & retail",
    initials: "SS",
    image: "/clients/retail.webp",
    services: ["E-commerce", "Brand storytelling"],
  },
};

// Every company in the shared list is included, even without a portfolio entry.
export const clientShowcase = clients.map((client) => {
  const domain = new URL(client.url).hostname.replace(/^www\./, "");
  const detail = details[domain];
  const project = projects.find((entry) => new URL(entry.url).hostname === domain);
  return {
    ...client,
    domain,
    industry: detail?.industry ?? "Digital business",
    initials: detail?.initials ?? client.name.slice(0, 2).toUpperCase(),
    image: detail?.image ?? "/influencer-marketing/business.webp",
    services: detail?.services ?? ["Digital experiences"],
    description: detail?.description ?? project?.description ?? `Explore ${client.name} online.`,
  };
});

export const clientIndustries = [...new Set(clientShowcase.map((client) => client.industry))];
