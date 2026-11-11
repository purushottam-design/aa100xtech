import type { MarketingService } from "./marketing-services";

export type MarketingHeroSlide = { image: string; alt: string; label: string };

const strategy: MarketingHeroSlide = {
  image: "/influencer-marketing/business.webp",
  alt: "Business professionals collaborating around a meeting table",
  label: "Campaign planning",
};
const creative: MarketingHeroSlide = {
  image: "/marketing/banner-marketing.webp",
  alt: "Designer developing digital artwork with a stylus and tablet",
  label: "Creative development",
};
const audience: MarketingHeroSlide = {
  image: "/clients/retail.webp",
  alt: "Retail shopper carrying shopping bags outdoors",
  label: "Connecting with customers",
};
const outdoor: MarketingHeroSlide = {
  image: "/marketing/hoarding-ads.webp",
  alt: "Large outdoor advertising display overlooking a city street",
  label: "Real-world visibility",
};

const additionalSlides: Record<string, MarketingHeroSlide[]> = {
  "banner-marketing": [strategy, outdoor, audience],
  "newspaper-marketing": [creative, strategy, audience],
  "hoarding-ads": [creative, strategy, audience],
  "celebrity-marketing": [
    {
      image: "/influencers/creator-filmmaker.webp",
      alt: "Filmmaker operating a professional video camera on a production set",
      label: "Talent-led storytelling",
    },
    {
      image: "/influencers/creator-podcast.webp",
      alt: "Presenter speaking into a microphone in a recording studio",
      label: "Authentic brand conversations",
    },
    strategy,
  ],
};

export function marketingHeroSlides(service: MarketingService): MarketingHeroSlide[] {
  return [
    { image: service.image, alt: service.imageAlt, label: service.label },
    ...(additionalSlides[service.slug] ?? [strategy, creative, audience]),
  ];
}
