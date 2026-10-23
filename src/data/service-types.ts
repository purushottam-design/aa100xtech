export type ServiceTypeCategory =
  | "websites"
  | "apps"
  | "graphics"
  | "music"
  | "ai"
  | "social";

export type ServiceType = {
  slug: string;
  category: ServiceTypeCategory;
  title: string;
  tagline: string;
  description: string;
  startingFrom: string;
  priceNote: string;
  timeline: string;
  /** What the client receives at handover. */
  deliverables: string[];
  /** The "full working" — modules / screens / moving parts of the build. */
  modules: { name: string; detail: string }[];
  /** Step-by-step how we run the engagement. */
  process: { step: string; detail: string }[];
  stack: string[];
  faqs: { q: string; a: string }[];
  /** Optional link into the priced service catalogue. */
  serviceSlug?: string;
  /** Optional key into serviceDemos for embedded video samples. */
  demoKey?: string;
};

export const serviceCategories: {
  id: ServiceTypeCategory;
  label: string;
  icon: string;
  blurb: string;
}[] = [
  {
    id: "websites",
    label: "Websites",
    icon: "Globe",
    blurb: "Marketing sites, stores, portals and SaaS dashboards engineered for speed and SEO.",
  },
  {
    id: "apps",
    label: "Mobile Apps",
    icon: "Smartphone",
    blurb: "Android, iOS and cross-platform products from MVP to store launch and AMC.",
  },
  {
    id: "graphics",
    label: "Graphics & Design",
    icon: "PenTool",
    blurb: "Brand identity, campaign creatives, UI systems and print-ready collateral.",
  },
  {
    id: "music",
    label: "Music & Audio",
    icon: "Music",
    blurb: "AI music beds, voiceovers, dubbing, podcasts and sonic branding for your content.",
  },
  {
    id: "ai",
    label: "AI & Automation",
    icon: "Sparkles",
    blurb: "Chatbots, voice agents, document intelligence and workflow automation that ships.",
  },
  {
    id: "social",
    label: "Social Media",
    icon: "Share2",
    blurb: "Account setup, always-on content production, influencer campaigns and paid social.",
  },
];

export const serviceTypes: ServiceType[] = [
  // ── Websites ────────────────────────────────────────────────
  {
    slug: "business-website",
    category: "websites",
    title: "Business & Corporate Website",
    tagline: "A credibility-first website that turns visitors into enquiries.",
    description:
      "A multi-page corporate website with a content management system, service pages, lead capture and analytics — built on a design system so every future page stays on brand.",
    startingFrom: "₹19,999",
    priceNote: "one-time project fee",
    timeline: "2–4 weeks",
    deliverables: [
      "6–15 designed and responsive pages",
      "CMS access to edit text, images and blog posts",
      "Contact & enquiry forms with email routing",
      "On-page SEO, sitemap, schema and analytics",
      "Deployment, SSL and 30 days of post-launch support",
    ],
    modules: [
      { name: "Home & hero", detail: "Positioning, proof, primary call-to-action above the fold." },
      { name: "Service pages", detail: "One indexable page per offering with pricing and FAQs." },
      { name: "Case studies", detail: "Filterable portfolio entries with results and imagery." },
      { name: "Blog / insights", detail: "CMS-driven articles with categories and related posts." },
      { name: "Lead capture", detail: "Forms, WhatsApp and call CTAs wired to your inbox and CRM." },
      { name: "Admin panel", detail: "Role-based login to publish content without a developer." },
    ],
    process: [
      { step: "Discovery", detail: "Sitemap, goals, competitor teardown and keyword map." },
      { step: "Design", detail: "Design system plus high-fidelity pages you approve in Figma." },
      { step: "Build", detail: "Component build, CMS wiring, forms, integrations and QA." },
      { step: "Launch", detail: "Performance pass, SEO checks, DNS cutover and handover training." },
    ],
    stack: ["React", "TanStack Start", "Tailwind CSS", "Headless CMS", "Cloudflare", "GA4"],
    faqs: [
      { q: "Can we edit the site ourselves?", a: "Yes — every text block, image and blog post is editable from the CMS, and we record a walkthrough for your team." },
      { q: "Is hosting included?", a: "First year of edge hosting and SSL is included; after that it is billed at cost or moved to your account." },
    ],
    serviceSlug: "website-development",
  },
  {
    slug: "ecommerce-store",
    category: "websites",
    title: "E-Commerce Store",
    tagline: "Catalogue, checkout, payments and operations in one place.",
    description:
      "A conversion-tuned online store with product management, secure payment gateways, shipping logic, order tracking and an admin dashboard your operations team can actually run.",
    startingFrom: "₹39,999",
    priceNote: "one-time + optional AMC",
    timeline: "4–8 weeks",
    deliverables: [
      "Storefront with catalogue, search and filters",
      "Cart, checkout and payment gateway integration",
      "Order, inventory and customer dashboards",
      "Coupons, shipping zones and tax configuration",
      "Staff training and 30 days of hypercare",
    ],
    modules: [
      { name: "Catalogue", detail: "Products, variants, stock, collections and bulk CSV import." },
      { name: "Checkout", detail: "Guest and account checkout with UPI, cards, netbanking and COD." },
      { name: "Payments", detail: "Razorpay/Stripe with webhooks, refunds and reconciliation." },
      { name: "Orders", detail: "Status pipeline, invoices, shipping labels and tracking emails." },
      { name: "Customers", detail: "Accounts, wishlists, addresses and order history." },
      { name: "Analytics", detail: "Revenue, AOV, funnel drop-off and best-seller reporting." },
    ],
    process: [
      { step: "Commerce audit", detail: "Catalogue structure, pricing rules, logistics and payment needs." },
      { step: "Design", detail: "Storefront, PDP and checkout flows designed for conversion." },
      { step: "Build & integrate", detail: "Payments, shipping partners, invoicing and inventory sync." },
      { step: "Go live", detail: "Test orders, refunds, load check, then launch with monitoring." },
    ],
    stack: ["React", "Node", "PostgreSQL", "Razorpay / Stripe", "Shopify (optional)", "Shiprocket"],
    faqs: [
      { q: "Shopify or custom?", a: "Shopify when you need speed and standard flows; custom when catalogue logic, B2B pricing or marketplace rules are unusual." },
      { q: "Do you handle GST invoices?", a: "Yes — GST-compliant invoicing and HSN handling are part of the commerce build." },
    ],
    serviceSlug: "ecommerce-development",
  },
  {
    slug: "saas-web-app",
    category: "websites",
    title: "SaaS & Dashboard Web App",
    tagline: "Multi-tenant products with auth, billing and role-based access.",
    description:
      "Product-grade web applications: authentication, organisations and roles, subscription billing, data dashboards and an admin console — engineered to scale past the MVP.",
    startingFrom: "₹99,999",
    priceNote: "project based",
    timeline: "6–12 weeks",
    deliverables: [
      "Authenticated multi-tenant application",
      "Role-based permissions and audit trail",
      "Subscription billing and plan gating",
      "Dashboards, exports and notifications",
      "CI/CD pipeline, staging environment and docs",
    ],
    modules: [
      { name: "Auth", detail: "Email, OAuth and magic-link sign-in with session security." },
      { name: "Tenancy", detail: "Workspaces, invitations, seats and per-tenant data isolation." },
      { name: "Roles", detail: "Owner, admin and member permissions enforced server-side." },
      { name: "Billing", detail: "Plans, trials, upgrades, dunning and invoice history." },
      { name: "Data views", detail: "Tables, filters, charts, CSV export and saved views." },
      { name: "Admin console", detail: "Internal tooling for support, impersonation and metrics." },
    ],
    process: [
      { step: "Product shaping", detail: "User stories, data model and a scoped v1 you can sell." },
      { step: "Architecture", detail: "Schema, security policies, environments and pipelines." },
      { step: "Sprints", detail: "Two-week increments with a live staging URL after every sprint." },
      { step: "Launch & iterate", detail: "Monitoring, error tracking and a roadmap for v2." },
    ],
    stack: ["React", "TypeScript", "PostgreSQL", "Row-level security", "Stripe", "GitHub Actions"],
    faqs: [
      { q: "Do we own the code?", a: "Fully — the repository is transferred to your organisation at handover." },
      { q: "Can you take over an existing app?", a: "Yes, after a paid audit sprint that maps the codebase and risks." },
    ],
    serviceSlug: "website-development",
  },
  {
    slug: "booking-portal",
    category: "websites",
    title: "Booking & Appointment Portal",
    tagline: "Calendars, slots, payments and reminders that run themselves.",
    description:
      "Booking systems for clinics, salons, studios, travel and services — real-time availability, online payment, automated reminders and a staff back-office.",
    startingFrom: "₹49,999",
    priceNote: "one-time project fee",
    timeline: "4–6 weeks",
    deliverables: [
      "Customer booking flow with live availability",
      "Staff / resource calendars and shift rules",
      "Online payment or pay-at-venue options",
      "Email, SMS and WhatsApp reminders",
      "Back-office for rescheduling and reporting",
    ],
    modules: [
      { name: "Availability engine", detail: "Slot generation, buffers, blackout dates and capacity." },
      { name: "Booking flow", detail: "Service picker, date/time, customer details and confirmation." },
      { name: "Payments", detail: "Deposits, full payment, refunds and cancellation windows." },
      { name: "Reminders", detail: "Automated confirmations and no-show reduction nudges." },
      { name: "Staff app", detail: "Day view, check-in, reschedule and walk-in entry." },
      { name: "Reports", detail: "Occupancy, revenue per service and repeat-customer rates." },
    ],
    process: [
      { step: "Rules workshop", detail: "Services, durations, staff, pricing and cancellation policy." },
      { step: "Design", detail: "Three-tap booking flow tested on mobile first." },
      { step: "Build", detail: "Calendar engine, payments, messaging and back-office." },
      { step: "Pilot", detail: "Soft launch with one location, then roll out." },
    ],
    stack: ["React", "PostgreSQL", "Razorpay", "Twilio / WhatsApp API", "Google Calendar sync"],
    faqs: [
      { q: "Multiple locations?", a: "Yes — locations, staff and services are all configurable per branch." },
      { q: "Does it sync with Google Calendar?", a: "Two-way sync is available for staff calendars." },
    ],
    serviceSlug: "website-development",
  },
  {
    slug: "landing-page-funnel",
    category: "websites",
    title: "Landing Page & Conversion Funnel",
    tagline: "One page, one offer, measurable cost per lead.",
    description:
      "High-velocity landing pages built for ad traffic: fast load, sharp copy, objection handling, tracked forms and A/B-ready sections.",
    startingFrom: "₹7,999",
    priceNote: "per page",
    timeline: "3–7 days",
    deliverables: [
      "Single high-converting page (desktop + mobile)",
      "Copywriting and offer structure",
      "Lead form with CRM/sheet/WhatsApp routing",
      "Pixel, GA4 and conversion tracking",
      "Thank-you page and follow-up email",
    ],
    modules: [
      { name: "Hero", detail: "Offer, proof and CTA within the first screen." },
      { name: "Proof stack", detail: "Testimonials, logos, results and guarantees." },
      { name: "Objections", detail: "FAQ and comparison blocks that remove hesitation." },
      { name: "Form", detail: "Short capture with validation, spam guard and instant alerts." },
      { name: "Tracking", detail: "Events for scroll, form start and submit for ad optimisation." },
    ],
    process: [
      { step: "Offer brief", detail: "Audience, promise, objections and proof assets." },
      { step: "Copy + design", detail: "Wireframe, copy, then visual build in one pass." },
      { step: "Launch", detail: "Publish, verify tracking, hand the URL to your ads team." },
    ],
    stack: ["React", "Tailwind CSS", "Meta Pixel", "GA4", "Zapier / CRM webhook"],
    faqs: [
      { q: "Can you run the ads too?", a: "Yes — our advertising management retainer starts at ₹7,999/mo excluding ad spend." },
    ],
    serviceSlug: "website-development",
  },
  {
    slug: "real-estate-portal",
    category: "websites",
    title: "Real Estate Portal",
    tagline: "Listings, enquiries and agent tooling in one platform.",
    description:
      "Property portals with map search, rich listings, saved searches, lead routing to agents and a CRM-style back-office — plus video tours generated from your photos.",
    startingFrom: "₹44,999",
    priceNote: "one-time project fee",
    timeline: "5–8 weeks",
    deliverables: [
      "Listing search with filters and map view",
      "Property detail pages with gallery and video",
      "Enquiry routing and agent profiles",
      "Agent/admin dashboard for listing management",
      "SEO-ready listing URLs and schema markup",
    ],
    modules: [
      { name: "Search", detail: "Location, budget, BHK, amenity and status filters." },
      { name: "Listing page", detail: "Gallery, floor plans, video tour, EMI calculator, enquiry form." },
      { name: "Map", detail: "Cluster pins, draw-to-search and nearby landmark data." },
      { name: "Leads", detail: "Round-robin assignment, call/WhatsApp logging and status pipeline." },
      { name: "Agent console", detail: "Bulk upload, availability, featured slots and performance." },
    ],
    process: [
      { step: "Inventory model", detail: "Property fields, statuses, media rules and agent hierarchy." },
      { step: "Design", detail: "Search, listing and dashboard flows." },
      { step: "Build", detail: "Search index, maps, media pipeline and lead routing." },
      { step: "Content load", detail: "We import your existing inventory before launch." },
    ],
    stack: ["React", "PostgreSQL", "Mapbox / Google Maps", "Media CDN", "Schema.org RealEstateListing"],
    faqs: [
      { q: "Can it publish to portals?", a: "We can push feeds to major portals where an API or XML feed exists." },
    ],
    serviceSlug: "website-development",
  },

  // ── Apps ────────────────────────────────────────────────────
  {
    slug: "cross-platform-app",
    category: "apps",
    title: "Cross-Platform Mobile App",
    tagline: "One codebase, both stores, native feel.",
    description:
      "Flutter or React Native applications with offline support, push notifications, analytics and store submission handled end to end.",
    startingFrom: "₹69,999",
    priceNote: "one-time project fee",
    timeline: "6–10 weeks",
    deliverables: [
      "Android + iOS builds from one codebase",
      "Auth, profiles and push notifications",
      "Offline caching and error reporting",
      "Play Store & App Store submission",
      "Source code, keys and release documentation",
    ],
    modules: [
      { name: "Onboarding", detail: "Splash, permissions, sign-up and first-run tutorial." },
      { name: "Core flows", detail: "Your product's primary screens with state management." },
      { name: "Notifications", detail: "Push campaigns, deep links and in-app messaging." },
      { name: "Offline", detail: "Local cache and queued actions for weak networks." },
      { name: "Analytics", detail: "Funnels, retention events and crash reporting." },
    ],
    process: [
      { step: "Scope", detail: "Screen inventory, platform requirements and store policy check." },
      { step: "Design", detail: "Mobile design system and clickable prototype." },
      { step: "Build", detail: "Sprint builds distributed via TestFlight and Play internal testing." },
      { step: "Release", detail: "Store listings, review handling and version 1.0 launch." },
    ],
    stack: ["Flutter / React Native", "Firebase", "REST / GraphQL", "Sentry", "Fastlane"],
    faqs: [
      { q: "Native or cross-platform?", a: "Cross-platform for most products; native when you need heavy device APIs, AR or high-performance graphics." },
      { q: "Who owns the store accounts?", a: "You do — we publish under your developer accounts." },
    ],
    serviceSlug: "mobile-app-development",
  },
  {
    slug: "ecommerce-app",
    category: "apps",
    title: "E-Commerce & Delivery App",
    tagline: "Shop, pay, track — plus a rider and merchant side.",
    description:
      "Customer app, merchant panel and delivery-partner app with live tracking, payments, promotions and order lifecycle management.",
    startingFrom: "₹99,999",
    priceNote: "project based",
    timeline: "8–14 weeks",
    deliverables: [
      "Customer app with catalogue, cart and payments",
      "Merchant panel for orders and inventory",
      "Delivery partner app with live location",
      "Promotions, referrals and loyalty",
      "Admin dashboard and reporting",
    ],
    modules: [
      { name: "Storefront", detail: "Categories, search, product pages and recommendations." },
      { name: "Cart & pay", detail: "Address, slots, coupons, wallet, UPI and COD." },
      { name: "Live tracking", detail: "Order status, rider map and ETA notifications." },
      { name: "Rider app", detail: "Assignment, pickup proof, delivery OTP and earnings." },
      { name: "Admin", detail: "Zones, pricing rules, refunds and settlement reports." },
    ],
    process: [
      { step: "Operations mapping", detail: "Zones, fulfilment model, SLAs and settlement rules." },
      { step: "Design", detail: "Three connected apps designed as one system." },
      { step: "Build", detail: "Phased delivery: customer app first, then merchant and rider." },
      { step: "Pilot", detail: "Single-zone pilot with live orders before scale-up." },
    ],
    stack: ["Flutter", "Node", "PostgreSQL", "Google Maps", "Razorpay", "FCM"],
    faqs: [
      { q: "Can we start with just the customer app?", a: "Yes — phase one ships the customer app on a manual back-office, then we automate." },
    ],
    serviceSlug: "mobile-app-development",
  },
  {
    slug: "fintech-app",
    category: "apps",
    title: "Fintech & Wallet App",
    tagline: "KYC, ledgers and payments with compliance-grade controls.",
    description:
      "Regulated-adjacent financial products: onboarding with KYC, double-entry ledger, payouts, statements, limits and fraud controls.",
    startingFrom: "₹1,99,999",
    priceNote: "project based",
    timeline: "12–20 weeks",
    deliverables: [
      "KYC onboarding with document verification",
      "Double-entry ledger and reconciliation",
      "Payments, payouts and statements",
      "Risk limits, alerts and audit logging",
      "Security review and penetration test report",
    ],
    modules: [
      { name: "Onboarding", detail: "PAN/Aadhaar or passport KYC, liveness and risk scoring." },
      { name: "Ledger", detail: "Immutable double-entry accounting with reconciliation jobs." },
      { name: "Money movement", detail: "Collections, payouts, refunds and failure handling." },
      { name: "Controls", detail: "Velocity limits, device binding, 2FA and admin approvals." },
      { name: "Reporting", detail: "Statements, exports and regulator-ready audit trails." },
    ],
    process: [
      { step: "Compliance scoping", detail: "Partner banks/PSPs, data residency and audit needs." },
      { step: "Architecture", detail: "Ledger design, secrets management and threat model." },
      { step: "Build", detail: "Hardened sprints with security review at each milestone." },
      { step: "Assurance", detail: "Penetration test, fixes and launch runbook." },
    ],
    stack: ["React Native", "PostgreSQL", "Kafka / queues", "HSM-backed secrets", "PSP APIs"],
    faqs: [
      { q: "Do you provide licences?", a: "No — we build the technology; licensing and banking partnerships remain yours." },
    ],
    serviceSlug: "mobile-app-development",
  },
  {
    slug: "app-maintenance",
    category: "apps",
    title: "App Maintenance & Growth (AMC)",
    tagline: "Keep it stable, compliant and improving every month.",
    description:
      "Monthly retainer covering OS updates, crash triage, store policy compliance, performance work and a fixed pool of feature hours.",
    startingFrom: "₹9,999/mo",
    priceNote: "monthly retainer",
    timeline: "Ongoing",
    deliverables: [
      "SDK and OS version upkeep",
      "Crash and ANR triage with monthly report",
      "Store policy compliance updates",
      "Performance and size optimisation",
      "Reserved feature-development hours",
    ],
    modules: [
      { name: "Monitoring", detail: "Crash, latency and rating dashboards reviewed weekly." },
      { name: "Release train", detail: "Predictable monthly releases with changelogs." },
      { name: "Support desk", detail: "Ticket intake with severity-based response times." },
      { name: "Store ops", detail: "Listing, screenshots, ASO keywords and review responses." },
    ],
    process: [
      { step: "Takeover audit", detail: "Codebase, pipelines, dependencies and risk list." },
      { step: "Stabilise", detail: "Fix the top crashes and unblock releases." },
      { step: "Operate", detail: "Monthly cycle: monitor, fix, improve, report." },
    ],
    stack: ["Sentry", "Firebase", "Fastlane", "Play Console", "App Store Connect"],
    faqs: [
      { q: "Do you maintain apps you didn't build?", a: "Yes, after a takeover audit sprint." },
    ],
    serviceSlug: "mobile-app-development",
  },

  // ── Graphics ────────────────────────────────────────────────
  {
    slug: "brand-identity",
    category: "graphics",
    title: "Logo & Brand Identity System",
    tagline: "One coherent identity across every surface.",
    description:
      "Logo suite, colour and type system, iconography and a usage guide so your website, app, packaging and ads all look like the same company.",
    startingFrom: "₹4,999",
    priceNote: "logo · identity kit from ₹14,999",
    timeline: "1–3 weeks",
    deliverables: [
      "Primary, secondary and monochrome logo files",
      "Colour palette and typography scale",
      "Icon and pattern set",
      "Brand guideline PDF",
      "Source files (AI/Figma) + web/print exports",
    ],
    modules: [
      { name: "Discovery", detail: "Positioning, audience and competitor visual audit." },
      { name: "Concepts", detail: "Three distinct directions, not variations of one." },
      { name: "Refinement", detail: "Two rounds on the chosen route." },
      { name: "System", detail: "Colour, type, spacing, iconography and imagery rules." },
      { name: "Applications", detail: "Stationery, social avatars, signage and app icon mockups." },
    ],
    process: [
      { step: "Brief", detail: "Questionnaire and moodboard alignment." },
      { step: "Concepts", detail: "Directions presented in real-world context." },
      { step: "Refine", detail: "Iterate on the selected direction." },
      { step: "Deliver", detail: "Full asset pack and guideline handover." },
    ],
    stack: ["Figma", "Adobe Illustrator", "Adobe Photoshop", "Variable fonts"],
    faqs: [
      { q: "Do we get source files?", a: "Yes — editable vector sources are included with the identity kit." },
    ],
    serviceSlug: "graphic-design",
  },
  {
    slug: "social-creatives",
    category: "graphics",
    title: "Social Media Creatives",
    tagline: "Templated, on-brand posts produced at campaign speed.",
    description:
      "Static posts, carousels, story sets and ad creatives designed on a reusable template system so volume never breaks consistency.",
    startingFrom: "₹1,499",
    priceNote: "per creative · packs available",
    timeline: "24–72 hours per batch",
    deliverables: [
      "Feed posts, carousels and story frames",
      "Ad variants sized for Meta, Google and LinkedIn",
      "Editable Figma/Canva template set",
      "Caption and hashtag suggestions",
      "Monthly batch delivery option",
    ],
    modules: [
      { name: "Template system", detail: "Grids, type scale and colour rules for fast output." },
      { name: "Content formats", detail: "Offer, testimonial, educational, launch and festive." },
      { name: "Ad variants", detail: "Multiple hooks per creative for A/B testing." },
      { name: "Handoff", detail: "Editable templates so your team can produce in-house." },
    ],
    process: [
      { step: "Brand pull", detail: "Extract or build the visual system." },
      { step: "Template design", detail: "Master layouts approved once." },
      { step: "Production", detail: "Batch creatives against your content calendar." },
    ],
    stack: ["Figma", "Canva", "Photoshop", "After Effects (motion add-on)"],
    faqs: [
      { q: "Can you also write the captions?", a: "Yes — copy is included in the social media retainer." },
    ],
    serviceSlug: "graphic-design",
  },
  {
    slug: "ui-ux-design",
    category: "graphics",
    title: "UI/UX Design System",
    tagline: "Research-backed interfaces engineers can build directly.",
    description:
      "User flows, wireframes, high-fidelity screens and a token-based component library documented for development handoff.",
    startingFrom: "₹49,999",
    priceNote: "full design system",
    timeline: "3–6 weeks",
    deliverables: [
      "User flows and information architecture",
      "Wireframes and high-fidelity screens",
      "Component library with tokens and states",
      "Clickable prototype for stakeholder testing",
      "Developer handoff documentation",
    ],
    modules: [
      { name: "Research", detail: "User interviews, journey map and heuristic review." },
      { name: "Flows", detail: "Task-level flows for the critical paths." },
      { name: "Screens", detail: "Responsive layouts including empty, loading and error states." },
      { name: "System", detail: "Tokens, components, variants and accessibility rules." },
      { name: "Prototype", detail: "Interactive build for usability testing before code." },
    ],
    process: [
      { step: "Understand", detail: "Users, constraints and success metrics." },
      { step: "Structure", detail: "IA, flows and low-fidelity validation." },
      { step: "Design", detail: "High-fidelity system and screens." },
      { step: "Handoff", detail: "Specs, tokens and a walkthrough with your engineers." },
    ],
    stack: ["Figma", "Design tokens", "WCAG 2.2 AA", "Maze / usability testing"],
    faqs: [
      { q: "Do you design for an existing product?", a: "Yes — redesigns start with an audit of the current interface and analytics." },
    ],
    serviceSlug: "graphic-design",
  },
  {
    slug: "print-packaging",
    category: "graphics",
    title: "Print, Packaging & Collateral",
    tagline: "Press-ready artwork that survives the printer.",
    description:
      "Brochures, catalogues, packaging, signage and event collateral prepared with correct bleed, colour profiles and dielines.",
    startingFrom: "₹2,999",
    priceNote: "per deliverable",
    timeline: "3–10 days",
    deliverables: [
      "Print-ready PDFs with bleed and crop marks",
      "CMYK colour-managed artwork",
      "Packaging dielines and mockups",
      "Editable source files",
      "Printer liaison and proof check",
    ],
    modules: [
      { name: "Format setup", detail: "Sizes, folds, substrate and finishing decisions." },
      { name: "Layout", detail: "Grid, typography and imagery for the print medium." },
      { name: "Prepress", detail: "Colour profiles, overprint, spot colours and traps." },
      { name: "Proofing", detail: "Digital proof review before the press run." },
    ],
    process: [
      { step: "Spec", detail: "Print method, quantity and finishing requirements." },
      { step: "Design", detail: "Layout and copy placement with two revision rounds." },
      { step: "Prepress", detail: "Final files delivered directly to your printer." },
    ],
    stack: ["Adobe InDesign", "Illustrator", "Photoshop", "PDF/X-4"],
    faqs: [
      { q: "Can you manage printing?", a: "We can coordinate with your vendor or recommend one; printing is billed at actuals." },
    ],
    serviceSlug: "graphic-design",
  },

  // ── Music & Audio ───────────────────────────────────────────
  {
    slug: "ai-music-tracks",
    category: "music",
    title: "AI Music & Custom Score",
    tagline: "Original, licence-clean tracks made for your brand.",
    description:
      "Custom music beds, jingles and full scores generated and produced for reels, ads, films and product videos — delivered with commercial usage rights.",
    startingFrom: "₹2,999",
    priceNote: "per track",
    timeline: "2–5 days",
    deliverables: [
      "Mastered track in WAV and MP3",
      "15s / 30s / 60s edits and a loopable version",
      "Stems on request",
      "Commercial usage licence",
      "Two revision rounds on mood and arrangement",
    ],
    modules: [
      { name: "Brief", detail: "Reference tracks, mood, tempo and brand personality." },
      { name: "Generation", detail: "Multiple AI-composed directions for you to choose from." },
      { name: "Production", detail: "Arrangement, edits and transitions cut to your video." },
      { name: "Mastering", detail: "Loudness targets for social, broadcast and cinema." },
      { name: "Licensing", detail: "Written clearance for commercial and paid-ad use." },
    ],
    process: [
      { step: "Brief", detail: "Share references and the video or script." },
      { step: "Directions", detail: "Pick from three composed options." },
      { step: "Produce", detail: "Refine, cut to picture and master." },
    ],
    stack: ["Generative music models", "Logic Pro / Ableton", "iZotope mastering"],
    faqs: [
      { q: "Is it copyright-safe for YouTube and Meta?", a: "Yes — tracks are original and cleared, so they will not trigger content claims." },
    ],
    serviceSlug: "ai-solutions",
  },
  {
    slug: "voiceover-dubbing",
    category: "music",
    title: "AI Voiceover & Multi-Language Dubbing",
    tagline: "One script, every language, one consistent voice.",
    description:
      "Studio-grade AI voiceovers and dubbing with lip-sync options — scale a single video into Hindi, English and regional markets without reshoots.",
    startingFrom: "₹1,999",
    priceNote: "per minute of finished audio",
    timeline: "24–72 hours",
    deliverables: [
      "Script adaptation and pronunciation pass",
      "Voiceover in selected languages and accents",
      "Timed audio synced to your edit",
      "Optional lip-synced video render",
      "Subtitle/SRT files per language",
    ],
    modules: [
      { name: "Voice selection", detail: "Pick a stock voice or clone your own with consent." },
      { name: "Script", detail: "Localisation, not literal translation — tone is preserved." },
      { name: "Render", detail: "Emotion, pacing and emphasis tuned line by line." },
      { name: "Sync", detail: "Timed to your cut; lip-sync available for on-camera talent." },
      { name: "Delivery", detail: "Mixed audio, stems and subtitle files." },
    ],
    process: [
      { step: "Assets", detail: "Send the video, script and target languages." },
      { step: "Sample", detail: "Approve a 20-second voice sample first." },
      { step: "Deliver", detail: "Full render, sync and subtitles." },
    ],
    stack: ["ElevenLabs-class TTS", "Voice cloning", "Lip-sync models", "Pro Tools"],
    faqs: [
      { q: "Can you clone our founder's voice?", a: "Yes, with written consent and a clean 5-minute recording." },
    ],
    serviceSlug: "ai-solutions",
  },
  {
    slug: "podcast-production",
    category: "music",
    title: "Podcast & Audio Content Production",
    tagline: "From raw recording to published, clipped and distributed.",
    description:
      "End-to-end podcast operations: editing, noise repair, intro/outro, show art, episode notes, distribution and short-form clips for social.",
    startingFrom: "₹7,999/mo",
    priceNote: "monthly retainer",
    timeline: "Weekly cadence",
    deliverables: [
      "Edited, levelled episodes",
      "Branded intro/outro and music beds",
      "Cover art and episode thumbnails",
      "Show notes, chapters and transcript",
      "4–8 short vertical clips per episode",
    ],
    modules: [
      { name: "Edit", detail: "Filler removal, noise repair, pacing and levelling." },
      { name: "Brand", detail: "Intro, outro, stingers and consistent loudness." },
      { name: "Publish", detail: "Spotify, Apple, YouTube and RSS distribution." },
      { name: "Repurpose", detail: "Vertical clips with captions for Reels, Shorts and TikTok." },
      { name: "Report", detail: "Downloads, retention and clip performance monthly." },
    ],
    process: [
      { step: "Setup", detail: "Format, recording kit guidance and hosting setup." },
      { step: "Pilot", detail: "First episode defines the sound and template." },
      { step: "Run", detail: "Weekly production, publishing and clipping." },
    ],
    stack: ["Descript", "Adobe Audition", "Auphonic", "Spotify for Podcasters"],
    faqs: [
      { q: "Do you handle remote guests?", a: "Yes — we set up a remote recording flow that captures separate high-quality tracks." },
    ],
    serviceSlug: "social-media-marketing",
  },
  {
    slug: "sonic-branding",
    category: "music",
    title: "Sonic Branding & Jingles",
    tagline: "A sound your customers recognise in two seconds.",
    description:
      "Audio logos, jingles and a sound palette applied consistently across ads, app interactions, IVR and retail environments.",
    startingFrom: "₹14,999",
    priceNote: "per identity package",
    timeline: "2–4 weeks",
    deliverables: [
      "Audio logo in multiple lengths",
      "Full jingle with vocal and instrumental cuts",
      "UI sound set for app and web",
      "IVR and hold-music variants",
      "Sonic guideline document",
    ],
    modules: [
      { name: "Strategy", detail: "Brand attributes translated into musical language." },
      { name: "Audio logo", detail: "1s, 3s and 5s marks that survive compression." },
      { name: "Extensions", detail: "Jingle, ad beds, UI sounds and IVR variants." },
      { name: "Guidelines", detail: "Where, when and how each asset is used." },
    ],
    process: [
      { step: "Workshop", detail: "Define the brand's sonic personality." },
      { step: "Compose", detail: "Three mark directions with contextual demos." },
      { step: "Systemise", detail: "Extend the chosen mark into the full palette." },
    ],
    stack: ["Logic Pro", "Kontakt", "Session musicians (optional)", "Loudness standards"],
    faqs: [
      { q: "Do we own the music?", a: "Yes — full buyout of the composition and recordings is included." },
    ],
    serviceSlug: "graphic-design",
  },

  // ── AI & Automation ─────────────────────────────────────────
  {
    slug: "ai-chatbot",
    category: "ai",
    title: "AI Chatbot & Support Agent",
    tagline: "Answers from your own content, escalates when it should.",
    description:
      "A retrieval-grounded assistant trained on your documents, catalogue and policies — embedded on the website, WhatsApp or in-app, with human handover.",
    startingFrom: "₹29,999",
    priceNote: "setup + usage",
    timeline: "2–4 weeks",
    deliverables: [
      "Knowledge base ingestion and refresh pipeline",
      "Website widget and/or WhatsApp channel",
      "Lead capture and CRM handoff",
      "Human escalation with transcript",
      "Analytics on deflection and satisfaction",
    ],
    modules: [
      { name: "Ingestion", detail: "PDFs, site pages, sheets and policy docs chunked and embedded." },
      { name: "Retrieval", detail: "Grounded answers with citations; refuses when unsure." },
      { name: "Channels", detail: "Web widget, WhatsApp, in-app or Slack." },
      { name: "Handover", detail: "Escalates to a human with full context and history." },
      { name: "Guardrails", detail: "Topic limits, PII redaction and prompt-injection defence." },
      { name: "Analytics", detail: "Top questions, unanswered queries and deflection rate." },
    ],
    process: [
      { step: "Content audit", detail: "What the bot may answer and what it must not." },
      { step: "Build", detail: "Ingestion, prompts, guardrails and channel integration." },
      { step: "Evaluate", detail: "Test set scored for accuracy before go-live." },
      { step: "Operate", detail: "Monthly retraining on new content and gaps." },
    ],
    stack: ["LLM gateway", "Vector search", "PostgreSQL", "WhatsApp Business API", "Webhooks"],
    faqs: [
      { q: "Will it invent answers?", a: "It answers only from your indexed content and says it doesn't know otherwise — every answer can show sources." },
    ],
    serviceSlug: "ai-solutions",
  },
  {
    slug: "workflow-automation",
    category: "ai",
    title: "Workflow & Back-Office Automation",
    tagline: "Delete the copy-paste work between your tools.",
    description:
      "Automations that move data between forms, CRM, sheets, email, WhatsApp and accounting — with AI steps for classification, extraction and drafting.",
    startingFrom: "₹49,999",
    priceNote: "per automation programme",
    timeline: "2–5 weeks",
    deliverables: [
      "Mapped process documentation (before/after)",
      "Live automations with error alerting",
      "AI steps for triage, extraction and drafting",
      "Dashboard of runs, failures and time saved",
      "Team training and runbook",
    ],
    modules: [
      { name: "Triggers", detail: "Forms, inboxes, webhooks, schedules and database changes." },
      { name: "AI steps", detail: "Classify, extract, summarise and draft replies." },
      { name: "Actions", detail: "CRM updates, invoices, WhatsApp/email sends, sheet writes." },
      { name: "Reliability", detail: "Retries, dead-letter queue and failure notifications." },
      { name: "Reporting", detail: "Volume, success rate and hours recovered." },
    ],
    process: [
      { step: "Process mining", detail: "Shadow the team and quantify the manual cost." },
      { step: "Prioritise", detail: "Rank automations by hours saved versus effort." },
      { step: "Build & pilot", detail: "Ship one workflow, prove it, then expand." },
    ],
    stack: ["n8n / Make", "Server functions", "PostgreSQL", "LLM gateway", "Google Workspace APIs"],
    faqs: [
      { q: "Do we need to change our tools?", a: "No — we automate around your existing stack wherever an API or inbox exists." },
    ],
    serviceSlug: "ai-solutions",
  },
  {
    slug: "ai-voice-agent",
    category: "ai",
    title: "AI Voice Agent & Call Automation",
    tagline: "Picks up every call, qualifies, books and logs it.",
    description:
      "Inbound and outbound voice agents that answer FAQs, qualify leads, book appointments and hand off to your team with a full transcript.",
    startingFrom: "₹39,999",
    priceNote: "setup + per-minute usage",
    timeline: "3–5 weeks",
    deliverables: [
      "Voice agent with your script and tone",
      "Telephony number and call routing",
      "Calendar booking and CRM logging",
      "Recording, transcript and summary per call",
      "Escalation to a human agent",
    ],
    modules: [
      { name: "Telephony", detail: "Number provisioning, IVR entry and routing rules." },
      { name: "Conversation", detail: "Interruptible, low-latency dialogue with your knowledge base." },
      { name: "Actions", detail: "Book slots, check order status, create tickets." },
      { name: "Handover", detail: "Warm transfer to staff with context summary." },
      { name: "Compliance", detail: "Consent notice, recording policy and opt-out." },
    ],
    process: [
      { step: "Call audit", detail: "Listen to real calls and script the top intents." },
      { step: "Build", detail: "Agent, tools, telephony and CRM wiring." },
      { step: "Shadow mode", detail: "Run alongside humans, then take live traffic." },
    ],
    stack: ["Realtime speech models", "Twilio / Exotel", "LLM gateway", "Calendar & CRM APIs"],
    faqs: [
      { q: "What languages?", a: "English and Hindi are standard; major regional languages are available on request." },
    ],
    serviceSlug: "ai-solutions",
  },
  {
    slug: "document-intelligence",
    category: "ai",
    title: "Document & Data Intelligence",
    tagline: "Turn PDFs, invoices and contracts into structured data.",
    description:
      "Extraction pipelines that read invoices, KYC documents, contracts and forms, validate the fields and push clean records into your systems.",
    startingFrom: "₹79,999",
    priceNote: "project based",
    timeline: "4–8 weeks",
    deliverables: [
      "Extraction schema per document type",
      "Confidence scoring and human review queue",
      "Validation rules and duplicate detection",
      "API/webhook delivery into your systems",
      "Accuracy benchmark report",
    ],
    modules: [
      { name: "Intake", detail: "Email, upload, scanner or storage-folder ingestion." },
      { name: "Extraction", detail: "OCR plus LLM parsing into typed fields." },
      { name: "Validation", detail: "Business rules, totals checks and cross-references." },
      { name: "Review UI", detail: "Low-confidence items queued for a human in seconds." },
      { name: "Delivery", detail: "Structured records pushed to ERP, sheets or database." },
    ],
    process: [
      { step: "Sample set", detail: "You supply 50–200 real documents per type." },
      { step: "Benchmark", detail: "We publish per-field accuracy before scaling." },
      { step: "Deploy", detail: "Pipeline, review UI and integration go live." },
    ],
    stack: ["OCR engines", "Vision LLMs", "PostgreSQL", "Queue workers", "REST webhooks"],
    faqs: [
      { q: "How accurate is it?", a: "Typically 95%+ per field on clean documents; anything below the confidence threshold goes to human review." },
    ],
    serviceSlug: "ai-solutions",
  },

  // ── Social ──────────────────────────────────────────────────
  {
    slug: "social-account-management",
    category: "social",
    title: "Social Account Setup & Management",
    tagline: "Profiles built properly, then run every single day.",
    description:
      "Full setup and always-on management of Instagram, Facebook, LinkedIn, YouTube and X — optimisation, posting, engagement and monthly reporting.",
    startingFrom: "₹7,999/mo",
    priceNote: "2 platforms · more from ₹14,999/mo",
    timeline: "Setup in 1 week, then ongoing",
    deliverables: [
      "Profile creation, verification and optimisation",
      "Content calendar published monthly in advance",
      "Daily posting and story cadence",
      "Comment and DM community management",
      "Monthly analytics report with next-month plan",
    ],
    modules: [
      { name: "Setup", detail: "Handles, bios, links, highlights, pinned posts and business tools." },
      { name: "Calendar", detail: "Themes, hooks and posting times approved before the month starts." },
      { name: "Publishing", detail: "Scheduled posts, stories and platform-native formats." },
      { name: "Community", detail: "Replies, DMs, lead routing and reputation handling." },
      { name: "Reporting", detail: "Reach, engagement, followers, saves and leads generated." },
    ],
    process: [
      { step: "Audit", detail: "Current profiles, competitors and audience research." },
      { step: "Strategy", detail: "Pillars, tone and 90-day content plan." },
      { step: "Run", detail: "Produce, publish, engage, report — every month." },
    ],
    stack: ["Meta Business Suite", "Later / Buffer", "Canva", "Native analytics"],
    faqs: [
      { q: "Who owns the accounts?", a: "You do — we work as managers on your business accounts and hand back full access any time." },
    ],
    serviceSlug: "social-media-marketing",
  },
  {
    slug: "content-production",
    category: "social",
    title: "Reels & Short-Form Content Production",
    tagline: "Scroll-stopping video, produced in batches.",
    description:
      "Concepting, shooting or AI-generating, editing and captioning short-form video for Reels, Shorts and TikTok — with hooks tested against performance data.",
    startingFrom: "₹19,999/mo",
    priceNote: "monthly production retainer",
    timeline: "Weekly batches",
    deliverables: [
      "12–30 vertical videos per month",
      "Hook writing and scripting",
      "Editing, captions, motion graphics and sound",
      "Thumbnails and covers",
      "Performance review and format iteration",
    ],
    modules: [
      { name: "Concepting", detail: "Formats matched to what is working in your niche this month." },
      { name: "Capture", detail: "Shoot day, remote self-shoot kit or AI avatar generation." },
      { name: "Edit", detail: "Pacing, b-roll, captions, sound design and branding." },
      { name: "Distribute", detail: "Platform-native posting with tailored copy." },
      { name: "Iterate", detail: "Double down on formats with the best watch-through." },
    ],
    process: [
      { step: "Format sprint", detail: "Test 5 formats in month one." },
      { step: "Batch produce", detail: "One capture session covers weeks of content." },
      { step: "Scale winners", detail: "Rebuild the calendar around proven formats." },
    ],
    stack: ["Premiere Pro", "CapCut", "After Effects", "AI avatar & voice tools"],
    faqs: [
      { q: "We can't be on camera — is that a problem?", a: "No — we use AI avatars, faceless formats, product footage and motion design." },
    ],
    serviceSlug: "social-media-marketing",
  },
  {
    slug: "influencer-campaigns",
    category: "social",
    title: "Influencer & Creator Campaigns",
    tagline: "Sourced, briefed, tracked and paid — end to end.",
    description:
      "Creator discovery, negotiation, briefing, content approval, tracked links and consolidated performance reporting across the campaign.",
    startingFrom: "₹29,999/mo",
    priceNote: "management fee, excl. creator fees",
    timeline: "3–6 weeks per campaign",
    deliverables: [
      "Vetted creator shortlist with audience data",
      "Rate negotiation and contracting",
      "Creative brief and content approvals",
      "Tracked links, codes and UTM setup",
      "Campaign report with CPM, CPE and ROAS",
    ],
    modules: [
      { name: "Discovery", detail: "Fit, authenticity and fake-follower screening." },
      { name: "Deal", detail: "Rates, deliverables, usage rights and exclusivity." },
      { name: "Brief", detail: "Hooks, mandatories and compliance disclosure." },
      { name: "Tracking", detail: "Codes, links and attribution to sales." },
      { name: "Amplify", detail: "Whitelisted paid boosting of top-performing posts." },
    ],
    process: [
      { step: "Plan", detail: "Objective, budget split and creator tiers." },
      { step: "Activate", detail: "Onboard creators and approve content." },
      { step: "Measure", detail: "Report and re-invest in the top performers." },
    ],
    stack: ["Creator databases", "UTM tracking", "Meta partnership ads", "Affiliate codes"],
    faqs: [
      { q: "Do you have creators on roster?", a: "We work with a vetted network plus our own 30-level partner programme." },
    ],
    serviceSlug: "social-media-marketing",
  },
  {
    slug: "paid-social-ads",
    category: "social",
    title: "Paid Social & Performance Ads",
    tagline: "Spend that is tracked to leads and revenue, not impressions.",
    description:
      "Meta, Google and LinkedIn campaign management with creative testing, audience structure, conversion tracking and weekly optimisation.",
    startingFrom: "₹7,999/mo",
    priceNote: "management fee, excl. ad spend",
    timeline: "Live in 5–7 days",
    deliverables: [
      "Account structure and audience build",
      "Conversion tracking and pixel/API setup",
      "Ad creative and copy variants",
      "Weekly optimisation and budget pacing",
      "Dashboard with CPL, CAC and ROAS",
    ],
    modules: [
      { name: "Tracking", detail: "Pixel, Conversions API, GA4 and offline conversion import." },
      { name: "Structure", detail: "Prospecting, retargeting and retention campaigns." },
      { name: "Creative", detail: "Multiple hooks and formats tested every cycle." },
      { name: "Landing", detail: "Matched landing pages built for the offer." },
      { name: "Reporting", detail: "Live dashboard plus a weekly written readout." },
    ],
    process: [
      { step: "Setup", detail: "Accounts, tracking and baseline benchmarks." },
      { step: "Launch", detail: "First test cohort of audiences and creatives." },
      { step: "Optimise", detail: "Kill losers weekly, scale winners, refresh creative monthly." },
    ],
    stack: ["Meta Ads", "Google Ads", "LinkedIn Ads", "GA4", "Looker Studio"],
    faqs: [
      { q: "What is the minimum ad spend?", a: "We recommend at least ₹30,000/month in media for statistically useful testing." },
    ],
    serviceSlug: "advertising-management",
  },
  {
    slug: "competitor-spy-autopilot",
    category: "social",
    title: "Competitor Spy & Autopilot Video System",
    tagline: "Choose a category, learn from the leaders, publish everywhere on autopilot.",
    description:
      "A single system that watches your category's top creators, extracts what is working, then produces real videos with your AI avatar and cloned voice and publishes them on schedule across every platform — replying to comments as they land.",
    startingFrom: "₹24,999",
    priceNote: "per month",
    timeline: "10–14 days to go live, then continuous",
    deliverables: [
      "Category and competitor tracking dashboard",
      "Weekly trend, hook and format intelligence report",
      "AI avatar and voice clone trained on you",
      "Scheduled multi-platform publishing calendar",
      "Automated comment reply and DM triage",
      "Monthly performance and scaling review",
    ],
    modules: [
      { name: "Category picker", detail: "Select your niche and we seed the competitor set you should be beating." },
      { name: "Spy engine", detail: "Tracks competitor posts, hooks, formats, cadence and outlier performance." },
      { name: "Learn & script", detail: "Turns winning patterns into scripts written in your own voice and positioning." },
      { name: "Avatar studio", detail: "Photoreal AI avatar plus cloned voice renders real, lip-synced videos." },
      { name: "Auto-publisher", detail: "Queues and posts to YouTube, Instagram, TikTok, Facebook, LinkedIn and X at chosen times." },
      { name: "Comment AI", detail: "Answers comments and DMs in your tone, escalating real leads to you." },
    ],
    process: [
      { step: "Pick category", detail: "Define niche, geography and the competitors to shadow." },
      { step: "Clone & train", detail: "Record a short sample to build your avatar and voice model." },
      { step: "Run autopilot", detail: "Weekly intelligence in, scheduled videos out, comments handled daily." },
    ],
    stack: ["Social APIs", "LLM gateway", "Avatar & voice cloning", "n8n / server functions", "PostgreSQL", "Analytics"],
    faqs: [
      { q: "Is this scraping or copying competitors?", a: "No content is copied — we analyse public performance patterns and write original scripts for your brand." },
      { q: "Can I approve videos before they post?", a: "Yes. Approval mode holds every video in a queue until you tap publish." },
    ],
    serviceSlug: "competitor-spy-content-engine",
  },
  {
    slug: "automated-hiring-engine",
    category: "ai",
    title: "Automated Hiring & Test Engine",
    tagline: "No interview rounds — tests, submissions and scoring on autopilot.",
    description:
      "Hire for yourself or your agency through a series of role-based tests. Candidates get timed tasks, upload deliverables with costing and availability, and are scored and shortlisted automatically.",
    startingFrom: "₹19,999",
    priceNote: "setup + optional monthly ops",
    timeline: "1–3 weeks",
    deliverables: [
      "Role-wise test series and rubrics",
      "Candidate portal with timers and file uploads",
      "Automated scoring, shortlist and rejection flows",
      "Costing, hours and deliverable capture per candidate",
      "Hiring funnel analytics",
    ],
    modules: [
      { name: "Test builder", detail: "Create task briefs, time limits and scoring rubrics per role." },
      { name: "Candidate portal", detail: "Apply, receive the brief, submit files, rates and availability." },
      { name: "Auto scoring", detail: "AI plus rubric scoring with plagiarism and AI-usage signals." },
      { name: "Decision flows", detail: "Auto shortlist, reject, schedule and notify by email and WhatsApp." },
      { name: "Analytics", detail: "Pass rates, time-to-hire and quality by role and source." },
    ],
    process: [
      { step: "Define roles", detail: "Pick roles, write real briefs and set what good looks like." },
      { step: "Wire the funnel", detail: "Portal, timers, storage, scoring and notifications go live." },
      { step: "Hire on repeat", detail: "Every new opening reuses the engine with a fresh brief." },
    ],
    stack: ["Server functions", "PostgreSQL + RLS", "Object storage", "LLM gateway", "Email & WhatsApp APIs"],
    faqs: [
      { q: "Can we use it for our own agency clients?", a: "Yes — the agency suite supports unlimited roles and separate candidate pools." },
    ],
    serviceSlug: "automated-hiring-engine",
  },
];

export const serviceTypeBySlug = (slug: string) => serviceTypes.find((t) => t.slug === slug);

export const serviceTypesByCategory = (id: ServiceTypeCategory) =>
  serviceTypes.filter((t) => t.category === id);
