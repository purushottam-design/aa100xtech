export type PartnerPlan = {
  id: string;
  no: number;
  name: string;
  category: string;
  payout: string;
  bestFor: string;
  deliverable: string;
};

export const planCategories = [
  "Affiliate",
  "Referral",
  "Content",
  "Community",
  "Enterprise",
] as const;

export const partnerPlans: PartnerPlan[] = [
  { id: "affiliate-marketing", no: 1, name: "Affiliate Marketing", category: "Affiliate", payout: "5–20% per sale", bestFor: "Anyone with an audience", deliverable: "Tracking link + creative kit" },
  { id: "coupon-cashback", no: 2, name: "Coupon & Cashback", category: "Affiliate", payout: "8% + code bonus", bestFor: "Deal pages & communities", deliverable: "Personal discount code" },
  { id: "review-partner", no: 3, name: "Review Partner", category: "Content", payout: "₹15k / review + 10%", bestFor: "Tech & business reviewers", deliverable: "Long-form review video" },
  { id: "youtube-integration", no: 4, name: "YouTube Integration", category: "Content", payout: "Flat fee + 10%", bestFor: "YouTubers 10k+", deliverable: "60–90s in-video segment" },
  { id: "instagram-reels", no: 5, name: "Instagram Reels", category: "Content", payout: "Per reel + 8%", bestFor: "Reels creators", deliverable: "3 reels / month" },
  { id: "shorts-tiktok", no: 6, name: "Shorts & TikTok", category: "Content", payout: "Per post + 8%", bestFor: "Short-form creators", deliverable: "Hook-led product shorts" },
  { id: "linkedin-b2b", no: 7, name: "LinkedIn B2B", category: "Content", payout: "12% on closed deals", bestFor: "Founders & consultants", deliverable: "Case-study posts" },
  { id: "newsletter-sponsor", no: 8, name: "Newsletter Partner", category: "Content", payout: "CPM + 10%", bestFor: "Email publishers", deliverable: "Dedicated email slot" },
  { id: "blog-seo", no: 9, name: "Blog & SEO Partner", category: "Content", payout: "10% recurring", bestFor: "Niche site owners", deliverable: "Evergreen ranked article" },
  { id: "podcast-partner", no: 10, name: "Podcast Partner", category: "Content", payout: "Flat + 10%", bestFor: "Podcast hosts", deliverable: "Host-read placement" },
  { id: "livestream-selling", no: 11, name: "Livestream Selling", category: "Content", payout: "15% live sales", bestFor: "Live sellers", deliverable: "Monthly live demo" },
  { id: "ugc-creator", no: 12, name: "UGC Creator", category: "Content", payout: "Per asset", bestFor: "Creators without audience", deliverable: "Ad-ready UGC library" },
  { id: "whitelisting", no: 13, name: "Creative Whitelisting", category: "Content", payout: "Usage fee + 8%", bestFor: "High-performing creators", deliverable: "Paid-ads usage rights" },
  { id: "brand-ambassador", no: 14, name: "Brand Ambassador", category: "Community", payout: "15% + retainer", bestFor: "Loyal long-term voices", deliverable: "Always-on representation" },
  { id: "student-ambassador", no: 15, name: "Campus Ambassador", category: "Community", payout: "Stipend + 10%", bestFor: "Students", deliverable: "Campus workshops" },
  { id: "referral-classic", no: 16, name: "Client Referral", category: "Referral", payout: "10% of project value", bestFor: "Professionals & agencies", deliverable: "Warm client intro" },
  { id: "refer-a-friend", no: 17, name: "Refer-a-Friend", category: "Referral", payout: "₹5,000 per signup", bestFor: "Existing customers", deliverable: "Shareable invite link" },
  { id: "real-estate-referral", no: 18, name: "Real Estate Referral", category: "Referral", payout: "12% per listing package", bestFor: "Brokers & agents", deliverable: "Property media pipeline" },
  { id: "agency-reseller", no: 19, name: "Agency Reseller", category: "Enterprise", payout: "25% margin", bestFor: "Agencies", deliverable: "White-label delivery" },
  { id: "white-label", no: 20, name: "White-Label Partner", category: "Enterprise", payout: "30% margin", bestFor: "Studios & consultancies", deliverable: "Your brand, our team" },
  { id: "saas-integration", no: 21, name: "SaaS Integration", category: "Enterprise", payout: "Rev-share 20%", bestFor: "Software products", deliverable: "Co-built integration" },
  { id: "marketplace-partner", no: 22, name: "Marketplace Partner", category: "Enterprise", payout: "18% per order", bestFor: "Marketplaces & portals", deliverable: "Embedded service catalogue" },
  { id: "events-partner", no: 23, name: "Events & Expo", category: "Community", payout: "Booth share + 10%", bestFor: "Event organisers", deliverable: "On-ground activation" },
  { id: "community-partner", no: 24, name: "Community Partner", category: "Community", payout: "12% group revenue", bestFor: "WhatsApp / Discord admins", deliverable: "Member-only offer" },
  { id: "coach-partner", no: 25, name: "Coach & Trainer", category: "Community", payout: "20% cohort revenue", bestFor: "Educators", deliverable: "Curriculum licence" },
  { id: "academy-franchise", no: 26, name: "Academy Franchise", category: "Enterprise", payout: "Rev-share + overrides", bestFor: "Institutes", deliverable: "Branded academy" },
  { id: "territory-license", no: 27, name: "Territory Licence", category: "Enterprise", payout: "City / state exclusivity", bestFor: "Local market owners", deliverable: "Protected territory" },
  { id: "team-builder", no: 28, name: "Team Builder Override", category: "Referral", payout: "5% team override", bestFor: "Recruiters of affiliates", deliverable: "Sub-affiliate network" },
  { id: "venture-partner", no: 29, name: "Venture Partner", category: "Enterprise", payout: "Profit share", bestFor: "Operators", deliverable: "Partner-owned unit" },
  { id: "global-partner", no: 30, name: "Global Company Partner", category: "Enterprise", payout: "Equity + profit share", bestFor: "Level 30 partners", deliverable: "Joint company & IP" },
];

export type AffiliatePlatform = { name: string; note: string; url: string };

export const affiliatePlatforms: AffiliatePlatform[] = [
  { name: "Impact", note: "Global partnership automation", url: "https://impact.com" },
  { name: "PartnerStack", note: "B2B SaaS partner programs", url: "https://partnerstack.com" },
  { name: "ShareASale", note: "Established affiliate network", url: "https://shareasale.com" },
  { name: "CJ Affiliate", note: "Enterprise affiliate network", url: "https://cj.com" },
  { name: "Rakuten Advertising", note: "Global brand network", url: "https://rakutenadvertising.com" },
  { name: "Awin", note: "Europe & India reach", url: "https://awin.com" },
  { name: "Cuelinks", note: "India-first monetisation", url: "https://cuelinks.com" },
  { name: "vCommission", note: "Indian affiliate network", url: "https://vcommission.com" },
  { name: "Admitad", note: "Emerging markets", url: "https://admitad.com" },
  { name: "Refersion", note: "Creator & coupon tracking", url: "https://refersion.com" },
  { name: "Tapfiliate", note: "Lightweight tracking", url: "https://tapfiliate.com" },
  { name: "AA100X Direct", note: "Our own dashboard & payouts", url: "/partners/apply" },
];
