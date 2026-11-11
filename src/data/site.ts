export const site = {
  name: "AA100XTech",
  legalName: "Absolute Advancement 100X Tech Pvt. Ltd.",
  tagline: "Premium digital & IT engineering studio",
  email: "customer.care@aa100xtech.com",
  phone: "",
  phoneHref: "",
  address: "101 City Plaza, Kidwaipuri, Patna, Bihar - 800001, India",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=City+Plaza+Kidwaipuri+Patna+Bihar+800001",
  hours: "11:00 AM – 5:00 PM",
  businessHours: { start: 11, end: 17, timeZone: "Asia/Calcutta" },
  consultationUrl: "/consultation",
  origin: "https://aa100xtech.com",
  hrEmail: "hr@aa100xtech.com",
  phoneApprovalPending: false,
  gstin: "10ABCCA6080A1ZH",
  domain: "www.aa100xtech.com",
  myNameMyPrideUrl: "https://mynamemypride.com",
} as const;

export const navLinks: readonly { to: string; label: string; href?: string }[] = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/business-plans", label: "Business Plans" },
  { to: "/consultation", label: "Consultation" },
  { to: "/contact", label: "Contact" },
  { to: "/careers", label: "Careers" },
] as const;

// Keep footer links and the underlying pages available.
export const headerNavLinks = navLinks.filter((link) => link.to !== "/careers");

// Re-enable navigation account controls without changing authentication routes.
export const showAuthButtons = true;

export const joinUsLinks = [{ to: "/careers", label: "Jobs" }] as const;

export const marketingLinks = [
  { to: "/social-media-ads-marketing", label: "Social Media Ads Marketing" },
  { to: "/marketing/banner-marketing", label: "Banner Marketing" },
  { to: "/marketing/newspaper-marketing", label: "Newspaper Marketing" },
  {
    to: "/influencers",
    label: "Influencer Marketing",
    activePaths: ["/influencer-partners", "/influencer-marketing"],
  },
  { to: "/marketing/hoarding-ads", label: "Hoarding Ads" },
  { to: "/marketing/celebrity-marketing", label: "Celebrity Marketing" },
] as const;

export const moreLinks = [
  { to: "/about", label: "About" },
  { to: "/clients", label: "Our Clients" },
  { to: "/be-the-one", label: "Be The One" },
  { to: "/creator-moves-365", label: "Creator Moves 365" },
  { to: "/influencer-partners", label: "Influencer Partner Program" },
  { to: "/influencer-success-program", label: "Influencer Success Program" },
  { to: "/partners", label: "Partners" },
  { to: "/affiliates", label: "Affiliates" },
  { to: "/founders", label: "Aman" },
  { to: "/influencer-marketing", label: "Influencer Marketing" },
  { to: "/influencer-partners#creative-services", label: "Influencer Programs" },
] as const;

export const programLinks = [
  { to: "/creator-moves-365", label: "Creator Moves 365" },
  { to: "/influencer-partners", label: "Influencer Partner Program" },
  { to: "/influencer-success-program", label: "Influencer Success Program" },
  { to: "/influencer-partners#creative-services", label: "Influencer Programs" },
  { to: "/affiliates", label: "Affiliates" },
  { to: "/consultation", label: "Consultation" },
] as const;

export const legalLinks = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/refund-policy", label: "Refund & Cancellation" },
  { to: "/cookie-policy", label: "Cookie Policy" },
  { to: "/disclaimer", label: "Disclaimer" },
  { to: "/shipping-policy", label: "Digital Delivery Policy" },
] as const;

export const heroStats = [
  { value: 200, suffix: "+", label: "Projects completed" },
  { value: 98, suffix: "%", label: "Client satisfaction" },
  { value: 10, suffix: "+", label: "Years of team experience" },
];

export const clients = [
  {
    name: "Worldwide Prominent Properties",
    url: "https://worldwideprominentproperties.com/",
  },
  { name: "EcoBlossom Creations", url: "https://ecoblossomcreations.com/" },
  { name: "Tasty Foods Delights", url: "https://tastyfoodsdelights.com/" },
  { name: "creatormoves365.ai", url: "https://creatormoves365.ai/" },
  { name: "creatormoves365.com", url: "https://creatormoves365.com/" },
  {
    name: "Shakti Sphere Lifestyle",
    url: "https://shaktispherelifestyle.com/",
  },
];

export const whyChooseUs = [
  "Expert team of developers",
  "Agile development process",
  "On-time project delivery",
  "24/7 technical support",
  "Scalable solutions",
  "Competitive pricing",
];
