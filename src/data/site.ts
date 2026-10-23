export const site = {
  name: "AA100XTech",
  legalName: "Absolute Advancement 100X Tech",
  tagline: "Premium digital & IT engineering studio",
  email: "customer.care@aa100xtech.com",
  phone: "+91 90318 38342",
  phoneHref: "tel:+919031838342",
  address: "101 City Plaza, Kidwaipuri, Patna, Bihar - 800001, India",
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=City+Plaza+Kidwaipuri+Patna+Bihar+800001",
  hours: "Mon – Sat: 10:00 AM – 7:00 PM",
  gstin: "10ABCCA6080A1ZH",
  domain: "www.aa100xtech.com",
} as const;

export const navLinks = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/clients", label: "Our Top Clients" },
  { to: "/be-the-one", label: "Be The One" },
  { to: "/creator-moves-365", label: "Creator Moves 365" },
  { to: "/founders", label: "Founder", href: "https://theamanlife.com/" },
  // { to: "/real-estate", label: "Real Estate Services" },
  { to: "/careers", label: "Careers" },
] as const;

// Keep footer links and the underlying pages available.
export const headerNavLinks = navLinks.filter(
  (link) => link.to !== "/creator-moves-365" && link.to !== "/careers",
);

// Re-enable navigation account controls without changing authentication routes.
export const showAuthButtons = false;

export const joinUsLinks = [
  { to: "/careers", label: "Jobs" },
  { to: "/partners/apply", search: { opportunity: "paid-promotion" }, label: "Influencer" },
] as const;

export const marketingLinks = [
  {
    to: "/services/$slug",
    params: { slug: "social-media-marketing" },
    label: "Social Media Marketing",
  },
  { to: "/influencer-marketing", label: "Influencer Marketing" },
] as const;

export const moreLinks = [
  { to: "/about", label: "About" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/partners", label: "Partners" },
  { to: "/affiliates", label: "Affiliates" },
  { to: "/consultation", label: "Book a consultation" },
  { to: "/contact", label: "Contact" },
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
  { value: 24, suffix: "/7", label: "Support available" },
];

export const clients = [
  { name: "Worldwide Prominent Properties", url: "https://worldwideprominentproperties.com/" },
  { name: "EcoBlossom Creations", url: "https://ecoblossomcreations.com/" },
  { name: "Tasty Foods Delights", url: "https://tastyfoodsdelights.com/" },
  { name: "PicEmpire", url: "https://picempire.ai/" },
  { name: "Shakti Sphere Lifestyle", url: "https://shaktispherelifestyle.com/" },
];

export const whyChooseUs = [
  "Expert team of developers",
  "Agile development process",
  "On-time project delivery",
  "24/7 technical support",
  "Scalable solutions",
  "Competitive pricing",
];
