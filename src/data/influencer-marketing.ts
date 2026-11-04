export const creatorCategories = [
  {
    id: "fashion",
    name: "Fashion & Lifestyle",
    description: "Style, everyday stories and personal expression.",
    image: "/influencer-marketing/fashion.webp",
    alt: "Editorial fashion photography",
    keywords: ["fashion", "lifestyle", "beauty", "style"],
  },
  {
    id: "technology",
    name: "Tech & Gaming",
    description: "Product discoveries, reviews and gaming culture.",
    image: "/influencers/creator-filmmaker.webp",
    alt: "Editorial photograph of a creator working with a camera",
    keywords: ["technology", "tech", "gaming", "gadget"],
  },
  {
    id: "food",
    name: "Food & Travel",
    description: "Flavours, destinations and experiences worth sharing.",
    image: "/influencer-marketing/food.webp",
    alt: "Editorial food photography",
    keywords: ["food", "travel", "cooking", "restaurant"],
  },
  {
    id: "fitness",
    name: "Fitness & Wellness",
    description: "Movement, wellbeing and healthier everyday habits.",
    image: "/influencer-marketing/fitness.webp",
    alt: "Editorial fitness and wellbeing photography",
    keywords: ["fitness", "wellness", "health", "yoga"],
  },
  {
    id: "education",
    name: "Education",
    description: "Ideas, learning and knowledge made accessible.",
    image: "/influencer-marketing/education.webp",
    alt: "Editorial photograph illustrating education",
    keywords: ["education", "learning", "teaching", "student"],
  },
  {
    id: "business",
    name: "Finance & Business",
    description: "Professional insights and entrepreneurial thinking.",
    image: "/influencer-marketing/business.webp",
    alt: "Editorial photograph of a team working together",
    keywords: ["business", "finance", "entrepreneur", "investment"],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "Spaces, property stories and local perspectives.",
    image: "/influencer-marketing/real-estate.webp",
    alt: "Editorial photograph of a residential interior",
    keywords: ["real estate", "property", "interior", "real-estate"],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Culture, music and stories that spark a conversation.",
    image: "/influencer-marketing/entertainment.webp",
    alt: "Editorial photograph of a live music audience",
    keywords: ["entertainment", "music", "comedy", "film"],
  },
] as const;

export const campaignServices = [
  {
    name: "Influencer Marketing",
    description:
      "Brand collaborations, sponsored posts, product promotions and creator partnerships.",
    icon: "Users",
    href: "#influencer-marketing",
  },
  {
    name: "Viral Influencer Marketing",
    description: "Trend-led reels, multi-creator promotions and thoughtful campaign amplification.",
    icon: "Sparkles",
    href: "#viral-influencer-marketing",
  },
  {
    name: "UGC Content Production",
    description: "Product demonstrations, authentic creator perspectives and advertising videos.",
    icon: "Video",
    href: "/services/ugc-ads",
  },
  {
    name: "Campaign Management",
    description: "Creator selection, briefs, approvals, usage rights, coordination and reporting.",
    icon: "ClipboardCheck",
    href: "#campaign-enquiry",
  },
  {
    name: "Regional Influencer Marketing",
    description: "Campaign planning around your target city, state, language and audience.",
    icon: "MapPin",
    href: "#campaign-enquiry",
  },
  {
    name: "YouTube & Instagram Promotions",
    description: "Creator-led stories, videos and product promotions for the right platform.",
    icon: "Megaphone",
    href: "#campaign-enquiry",
  },
] as const;

export const campaignPackages = [
  {
    name: "Starter Campaign",
    tag: "A focused beginning",
    audience: "Local businesses and focused marketing briefs.",
    description: "Build a clear campaign around one audience and an agreed creative direction.",
    features: [
      "Campaign goals and audience brief",
      "Relevant creator shortlist",
      "Agreed content formats and approval steps",
      "Campaign deliverables and performance summary",
    ],
  },
  {
    name: "Growth Campaign",
    tag: "Connected storytelling",
    audience: "Growing brands planning multi-creator collaborations.",
    description: "Bring creators, content and reporting together around your next stage of growth.",
    features: [
      "Multi-creator campaign planning",
      "Content calendar and coordination",
      "Agreed usage rights and publishing checks",
      "Performance reporting and next-step review",
    ],
  },
  {
    name: "Viral Campaign",
    tag: "Ideas made to travel",
    audience: "Broader briefs involving multiple creators and platforms.",
    description:
      "Plan trend-led creative and coordinated publishing around a shareable campaign idea.",
    features: [
      "Trend and creative concept development",
      "Multi-platform creator coordination",
      "Content review and amplification planning",
      "Reporting against agreed campaign objectives",
    ],
  },
] as const;

export const campaignFaqs = [
  {
    q: "What is influencer marketing?",
    a: "It is a collaboration between a brand and a creator to tell a relevant story, demonstrate a product or introduce an offer to an audience that creator understands.",
  },
  {
    q: "How can brands find the right influencers?",
    a: "Start with your audience, location, platform and campaign goal. Use the directory to explore approved profiles, then share your brief so audience fit, content quality and availability can be reviewed.",
  },
  {
    q: "How much does an influencer campaign cost?",
    a: "Our existing influencer and viral marketing offers start at ₹500. A complete campaign is quoted after its scope, creators, content, usage rights and reporting requirements are agreed. Packages on this page have custom quotations.",
  },
  {
    q: "Can small businesses use influencer marketing?",
    a: "Yes. A focused local or niche brief can be scoped around your budget and audience. We confirm what is feasible before agreeing deliverables.",
  },
  {
    q: "How do influencers register?",
    a: "Use Become an Influencer or Join Our Creator Network to open the existing Influencer Partner Program application. Current consent, verification and approval rules continue to apply.",
  },
  {
    q: "Which social media platforms do you support?",
    a: "Campaigns can be planned for Instagram, YouTube, Facebook and other relevant platforms, subject to creator availability, regional access and the agreed brief.",
  },
  {
    q: "Do you manage the full campaign?",
    a: "Campaign management can include discovery, outreach, negotiation, briefs, content approvals, posting coordination and reporting. Your proposal confirms the exact scope.",
  },
  {
    q: "How are campaign results measured?",
    a: "We agree the objectives first. Reporting can cover reach, engagement, clicks, tracked conversions and content delivery, depending on platform access and campaign setup. Reach, virality and revenue are not guaranteed.",
  },
  {
    q: "How is creator quality reviewed?",
    a: "Shortlisting considers content relevance, audience quality, engagement patterns and brand safety. Directory audience ranges use profile-reported figures; independent metric verification is confirmed during campaign planning.",
  },
  {
    q: "Can I reuse the content creators make?",
    a: "Reposting, advertising usage, whitelisting and licensing rights must be agreed with the creator in writing. The campaign proposal confirms the permissions included.",
  },
] as const;
