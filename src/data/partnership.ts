export type PartnerLevel = {
  level: number;
  name: string;
  commission: string;
  requirement: string;
  unlocks: string;
};

export type PartnerTier = {
  name: string;
  range: string;
  summary: string;
  levels: PartnerLevel[];
};

const levels: PartnerLevel[] = [
  { level: 1, name: "Starter Affiliate", commission: "5%", requirement: "Sign up & share your link", unlocks: "Affiliate dashboard, tracking link, starter creative kit" },
  { level: 2, name: "Active Affiliate", commission: "7%", requirement: "1 qualified referral", unlocks: "Swipe copy library, monthly payout" },
  { level: 3, name: "Rising Affiliate", commission: "9%", requirement: "3 qualified referrals", unlocks: "Custom coupon code for your audience" },
  { level: 4, name: "Verified Affiliate", commission: "11%", requirement: "5 referrals or ₹1L tracked revenue", unlocks: "Verified badge, priority support" },
  { level: 5, name: "Pro Affiliate", commission: "13%", requirement: "₹2.5L tracked revenue", unlocks: "Dedicated partner manager" },

  { level: 6, name: "Brand Ambassador", commission: "15%", requirement: "₹5L tracked revenue", unlocks: "Co-branded landing page" },
  { level: 7, name: "Content Ambassador", commission: "16%", requirement: "4 published collaborations", unlocks: "Free AI avatar + voice clone setup" },
  { level: 8, name: "Signature Ambassador", commission: "17%", requirement: "₹10L tracked revenue", unlocks: "Your own service bundle to resell" },
  { level: 9, name: "Featured Ambassador", commission: "18%", requirement: "Sustained 3-month performance", unlocks: "Feature on AA100XTech channels" },
  { level: 10, name: "Elite Ambassador", commission: "20%", requirement: "₹20L tracked revenue", unlocks: "Quarterly performance bonus pool" },

  { level: 11, name: "Creator Partner", commission: "20% + 2% override", requirement: "Recruit 3 active affiliates", unlocks: "Second-tier override on your recruits" },
  { level: 12, name: "Studio Creator", commission: "21% + 3% override", requirement: "₹30L tracked revenue", unlocks: "Free production credits each month" },
  { level: 13, name: "Campaign Creator", commission: "22% + 3% override", requirement: "Run 2 joint campaigns", unlocks: "Co-funded ad budget" },
  { level: 14, name: "Senior Creator", commission: "23% + 4% override", requirement: "₹50L tracked revenue", unlocks: "White-label proposal toolkit" },
  { level: 15, name: "Master Creator", commission: "25% + 5% override", requirement: "10 active affiliates in your team", unlocks: "Revenue share on retained clients" },

  { level: 16, name: "City Leader", commission: "25% + 5% override", requirement: "Own a city market", unlocks: "Exclusive city territory rights" },
  { level: 17, name: "State Leader", commission: "26% + 6% override", requirement: "₹1Cr tracked revenue", unlocks: "State-level lead routing" },
  { level: 18, name: "Regional Leader", commission: "27% + 6% override", requirement: "3 city leaders in your line", unlocks: "Regional operations budget" },
  { level: 19, name: "Country Leader", commission: "28% + 7% override", requirement: "₹2Cr tracked revenue", unlocks: "Country partnership agreement" },
  { level: 20, name: "Continental Leader", commission: "30% + 8% override", requirement: "Multi-country performance", unlocks: "Continental exclusivity & board access" },

  { level: 21, name: "Academy Mentor", commission: "30% + 8% override", requirement: "Certify as an AA100XTech trainer", unlocks: "Teach the partner curriculum" },
  { level: 22, name: "Academy Builder", commission: "31% + 9% override", requirement: "Train 25 students", unlocks: "Student revenue share" },
  { level: 23, name: "Academy Director", commission: "32% + 10% override", requirement: "Train 100 students", unlocks: "Branded academy micro-site & app" },
  { level: 24, name: "Expert Maker", commission: "33% + 10% override", requirement: "10 students reach Level 10", unlocks: "Expert placement & project pipeline" },
  { level: 25, name: "Global Educator", commission: "35% + 12% override", requirement: "500 students across 3 countries", unlocks: "Global campus licence" },

  { level: 26, name: "Venture Partner", commission: "35% + 12% override", requirement: "Launch a partner-owned business unit", unlocks: "Company-backed incubation" },
  { level: 27, name: "Equity Partner", commission: "Profit share", requirement: "Sustained ₹5Cr annual revenue", unlocks: "Equity participation in your unit" },
  { level: 28, name: "Company Builder", commission: "Profit share + override", requirement: "Spin up your own registered company with us", unlocks: "Shared IP, infrastructure and delivery team" },
  { level: 29, name: "Global Company Partner", commission: "Profit share + override", requirement: "Operations in 3+ countries", unlocks: "Global brand licence & joint ventures" },
  { level: 30, name: "Founding Global Partner", commission: "Full partnership", requirement: "Board-approved global partnership", unlocks: "Group-level partnership, equity and governance seat" },
];

export const partnerTiers: PartnerTier[] = [
  {
    name: "Affiliate",
    range: "Levels 1–5",
    summary: "Start earning from day one by sharing what we build.",
    levels: levels.slice(0, 5),
  },
  {
    name: "Ambassador",
    range: "Levels 6–10",
    summary: "Become the face of AA100XTech to your audience.",
    levels: levels.slice(5, 10),
  },
  {
    name: "Creator Partner",
    range: "Levels 11–15",
    summary: "Build a team and earn overrides on everything they close.",
    levels: levels.slice(10, 15),
  },
  {
    name: "Territory Leader",
    range: "Levels 16–20",
    summary: "Own a city, state, country or continent.",
    levels: levels.slice(15, 20),
  },
  {
    name: "Academy Builder",
    range: "Levels 21–25",
    summary: "Train global students and turn them into working experts.",
    levels: levels.slice(20, 25),
  },
  {
    name: "Global Partner",
    range: "Levels 26–30",
    summary: "Build your own company with us — equity, IP and governance.",
    levels: levels.slice(25, 30),
  },
];

export const partnerLevels = levels;

export const partnerBenefits = [
  "Transparent tracking dashboard with real-time attribution",
  "Monthly payouts in INR or USD",
  "Ready-made creatives, scripts and landing pages",
  "Free AI avatar and voice clone from Level 7",
  "Dedicated partner manager from Level 5",
  "Lifetime credit on every client you introduce",
];

export const partnerFaqs = [
  {
    q: "Who can join the partnership programme?",
    a: "Influencers, creators, consultants, agencies, students and sales professionals anywhere in the world. There is no joining fee at Level 1.",
  },
  {
    q: "How do levels work?",
    a: "Every level has a clear requirement — referrals, tracked revenue, team size or students trained. Meet it and you're promoted automatically at the start of the next cycle. Levels never expire once earned.",
  },
  {
    q: "When do I get paid?",
    a: "Commissions are approved once a client's invoice clears and are paid out monthly. Overrides from your team are paid on the same cycle.",
  },
  {
    q: "What is the academy track (Levels 21–25)?",
    a: "You train students in our curriculum, we certify them, and you earn a share of what they produce as they grow into working experts and their own companies.",
  },
  {
    q: "What does Level 30 actually mean?",
    a: "A full partnership with the company: your own operating unit, equity participation, shared IP and delivery infrastructure, and a governance seat at group level.",
  },
];
