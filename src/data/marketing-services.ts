export type MarketingService = {
  slug: string;
  label: string;
  title: string;
  description: string;
  keywords: string[];
  heading: string;
  highlight: string;
  intro: string;
  image: string;
  imageAlt: string;
  imageCaption: string;
  aboutHeading: string;
  about: string[];
  benefits: string[];
  offerings: { title: string; description: string }[];
  reasons: { title: string; description: string }[];
  process: string[];
  audiences: string[];
  faqs: { question: string; answer: string }[];
  ctaHeading: string;
  ctaDescription: string;
  copy?: {
    heroTag: string;
    primaryButton: string;
    secondaryButton: string;
    heroNote: string;
    offerings: { label: string; heading: string; intro: string };
    why: { label: string; heading: string; intro: string };
    process: { label: string; heading: string; intro: string };
    audiences: { label: string; heading: string; intro: string };
    faq: { label: string; heading: [string, string] };
    cta: { label: string; note: string };
  };
};

export const marketingServices: MarketingService[] = [
  {
    slug: "social-media-ads",
    label: "Social Media Ads Marketing",
    title: "Social Media Ads Marketing & Campaign Management | AA100XTech",
    description:
      "Plan Facebook, Instagram, YouTube and Google Ads campaigns with AA100XTech. Explore audience targeting, ad creatives, lead generation and conversion tracking.",
    keywords: [
      "social media ads marketing",
      "Facebook ads",
      "Instagram ads",
      "YouTube ads",
      "Google Ads",
      "lead generation",
    ],
    heading: "Reach the right people.",
    highlight: "Make every ad count.",
    intro:
      "Turn your next campaign into a clear path from discovery to enquiry. We bring audience research, thoughtful creative and ongoing optimisation together across social and search.",
    image: "/marketing/social-media-ads.webp",
    imageAlt: "Campaign analytics and charts on a laptop screen",
    imageCaption: "Audience insight. Creative direction. Measurable actions.",
    aboutHeading: "A strategy behind every scroll.",
    about: [
      "Paid advertising helps your business reach people beyond your existing followers. Facebook and Instagram ads support visual discovery, YouTube brings your story to video audiences, and Google Ads can connect you with people actively searching for a solution.",
      "AA100X TECH helps you choose platforms around your goal, build relevant messages and create a useful next step for each visitor. We plan tracking before launch and review campaign data to guide decisions, with budgets and deliverables agreed in advance.",
    ],
    benefits: [
      "Reach audiences by interest, intent and location",
      "Connect ad creative to a clear landing page",
      "Understand which actions your campaigns generate",
    ],
    offerings: [
      {
        title: "Campaign strategy",
        description:
          "Define your objective, platform mix, budget allocation and campaign structure before spending begins.",
      },
      {
        title: "Audience targeting",
        description:
          "Build audiences using relevant locations, interests and intent, with remarketing where consent and platform policies allow.",
      },
      {
        title: "Ad creatives",
        description:
          "Develop platform-ready visuals, videos and copy with clear messages and useful calls to action.",
      },
      {
        title: "Lead generation",
        description:
          "Connect lead forms and landing pages to an agreed enquiry flow so your team can follow up.",
      },
      {
        title: "Conversion tracking",
        description:
          "Configure agreed events, tags and campaign links to understand meaningful actions while respecting consent.",
      },
      {
        title: "Campaign optimisation",
        description:
          "Review targeting, placements, creative and spend; test changes against your campaign objective.",
      },
    ],
    reasons: [
      {
        title: "Goals before platforms",
        description:
          "We start with the action your business needs, then recommend where to advertise.",
      },
      {
        title: "Creative with context",
        description:
          "Messaging and formats reflect how people use each channel and what your audience needs.",
      },
      {
        title: "Connected delivery",
        description:
          "Our marketing and technology expertise helps align ads, landing pages and tracking.",
      },
      {
        title: "Clear campaign reviews",
        description:
          "Understand spend, available metrics, changes made and the next recommended steps.",
      },
    ],
    process: [
      "Discuss your audience, offer and preferred business outcome.",
      "Map platforms, creative, landing pages, budget and tracking.",
      "Launch approved campaigns after account and creative checks.",
      "Review delivery and conversion signals; test and refine where useful.",
      "Share available performance data, learnings and next steps.",
    ],
    audiences: [
      "Validate an offer and build awareness with a focused test.",
      "Reach potential customers with a manageable campaign scope.",
      "Coordinate campaigns across products, locations or business units.",
      "Promote products and track shopping actions where supported.",
      "Target relevant areas and encourage nearby customers to enquire.",
    ],
    faqs: [
      {
        question: "Which advertising platforms can you help with?",
        answer:
          "We plan campaigns for Facebook, Instagram, YouTube and Google Ads, and can discuss other channels when they suit your audience. Platform selection depends on your goals, creative assets, account eligibility and budget.",
      },
      {
        question: "Is advertising spend included in the management fee?",
        answer:
          "Media spend and campaign management are scoped separately in your proposal. We confirm what is included, how advertising accounts are billed and which creative or landing page work is required before launch.",
      },
      {
        question: "Can you work with our existing ad accounts?",
        answer:
          "Yes. We can review existing accounts and request the appropriate business access. Your team should retain ownership of accounts and assets; we do not need you to share personal passwords.",
      },
      {
        question: "How do you measure leads and conversions?",
        answer:
          "We agree on useful actions such as form submissions, purchases or qualified enquiries, then assess the available tracking. Platform attribution, consent settings and your sales follow-up can all affect what is measurable.",
      },
      {
        question: "How soon can a campaign launch?",
        answer:
          "Timing depends on account access, approved creative, landing pages, tracking and platform review. We provide a launch plan after reviewing these dependencies rather than promising a fixed turnaround for every campaign.",
      },
      {
        question: "Can you guarantee a number of sales or leads?",
        answer:
          "No. Results depend on the offer, market, competition, budget and customer experience. We focus on a clear strategy, responsible testing and transparent reporting without guaranteeing sales or a fixed cost per lead.",
      },
    ],
    ctaHeading: "Give your next campaign a clear direction.",
    ctaDescription:
      "Tell us what you are promoting, who you want to reach and what success means for your business.",
  },
  {
    slug: "banner-marketing",
    label: "Banner Marketing",
    title: "Banner Marketing, Design & Placement Services | AA100XTech",
    description:
      "Create promotional, digital, website and event banners with AA100XTech. Get help with campaign messaging, banner design, production files and placement planning.",
    keywords: [
      "banner marketing",
      "promotional banners",
      "digital advertising banners",
      "website banner design",
      "event banners",
    ],
    heading: "A clear message.",
    highlight: "An unmissable presence.",
    intro:
      "From a website grand launch to a busy event venue entrance, make your brand easy to notice and understand with high-impact banner marketing. We design and place banners around your exact message, your target audience, and the physical or digital space where they will appear.",
    image: "/marketing/banner-marketing.webp",
    imageAlt: "Designer using a stylus and graphics tablet to develop visual creative",
    imageCaption: "One brand story, adapted to every format.",
    aboutHeading: "Designed to be seen. Built for high-impact banner marketing.",
    about: [
      "A good marketing banner gives people a compelling reason to pause and a clear next step. The right headline, visual hierarchy, and correct dimension format help your promotional message work seamlessly across high-traffic websites, digital display placements, outdoor storefronts, and live corporate events.",
      "Absolute Advancement 100X Tech translates your campaign brief into consistent, practical banner creatives. We help plan precise dimensions, strategic placements, and professional production requirements so each advertising banner fits its setting perfectly—whether it is viewed on a mobile phone screen or printed large for a physical venue.",
    ],
    benefits: [
      "Keep your brand identity consistent across all digital and physical banner placements.",
      "Make special offers and calls to action much easier for target customers to understand.",
      "Prepare professional creative files that fully meet technical digital display and print production requirements.",
    ],
    offerings: [
      {
        title: "Promotional Banners",
        description:
          "Introduce limited-time offers, seasonal promotional campaigns, and brand product launches with a clear headline and powerful call to action.",
      },
      {
        title: "Digital Advertising Banners",
        description:
          "Create high-converting display ad banner variations suited precisely to the dimensions and specs of your chosen online advertising channels.",
      },
      {
        title: "Website Banners",
        description:
          "Design responsive website hero banners and campaign banners that instantly complement your web pages and guide visitors to the right landing page.",
      },
      {
        title: "Event Banners",
        description:
          "Plan large-scale backdrops, standees, roll-up banners, and venue display banners with readable typography and practical production sizes.",
      },
      {
        title: "Business Promotional Creatives",
        description:
          "Build a coordinated visual banner direction for retail store promotions, local service announcements, and corporate marketing campaigns.",
      },
      {
        title: "Design & Placement Coordination",
        description:
          "Prepare approved banner files and coordinate agreed media placement or print requirements with the relevant publishing provider or printer.",
      },
    ],
    reasons: [
      {
        title: "Message-Led Banner Design",
        description:
          "Every layout starts with the main point your target audience should remember and act upon.",
      },
      {
        title: "Visual Consistency Across Sizes",
        description:
          "Your banner campaign keeps its sharp identity as we adapt layouts for different spaces and dimensions.",
      },
      {
        title: "Practical Production Standards",
        description:
          "File formats, bleed areas, safe zones, and print specifications are thoroughly considered before final handover.",
      },
      {
        title: "Collaborative Approvals",
        description:
          "Review your banner designs and scope of revisions carefully before files are released or media placement begins.",
      },
    ],
    process: [
      "Discuss your marketing campaign goals, brand assets, and intended banner placement locations.",
      "Agree on core messaging, banner dimensions, creative visual direction, and production requirements.",
      "Design, review, and release approved marketing banners for all agreed digital or physical channels.",
      "Check live display performance or physical print output and refine suitable digital banner variations.",
      "Summarize delivered banner assets, verified placements, and any available campaign performance feedback.",
    ],
    audiences: [
      "Give a brand new product launch a consistent, unmissable visual identity through eye-catching banners.",
      "Promote seasonal offers and local services effectively without having to rebuild your entire brand.",
      "Coordinate approved banner creative effortlessly across large regional teams, offices, and major events.",
      "Highlight trending products, new collections, and limited-time sales promotions with dynamic banners.",
      "Make your storefronts, local community events, and special store discounts much easier for passersby to notice.",
    ],
    faqs: [
      {
        question: "Do you design both digital and printed banners?",
        answer:
          "Yes, we create digital banners for websites and online ads, as well as print-ready files for physical hoardings, standees, and venue displays.",
      },
      {
        question: "What do you need before banner design starts?",
        answer:
          "We need your brand logo, brand color guidelines, campaign objectives, preferred text or offers, and any specific size dimensions required.",
      },
      {
        question: "Can one banner design be used in several sizes?",
        answer:
          "Yes, we adapt a master design concept into various horizontal, vertical, and square dimensions to fit different platforms.",
      },
      {
        question: "Are printing and media placement included?",
        answer:
          "Our primary scope covers professional design, sizing, and file preparation. We can also coordinate with trusted print or media partners upon request.",
      },
      {
        question: "Can you help place a banner on our website?",
        answer:
          "Yes, our technical team can embed and position your website hero or promotional banners directly into your web pages.",
      },
      {
        question: "Which file formats will we receive?",
        answer:
          "You will receive high-resolution print-ready files (PDF, CDR/AI) and optimized digital formats (PNG, JPEG, WebP) ready for use.",
      },
    ],
    ctaHeading: "Make your next marketing message unmissable.",
    ctaDescription:
      "Share your campaign idea and where your banner needs to appear. We will help shape the right creative and formats.",
    copy: {
      heroTag: "BANNER MARKETING & DESIGN",
      primaryButton: "Get a Free Banner Consultation",
      secondaryButton: "Get Customised Banner Proposal",
      heroNote:
        "Start with your campaign brief. We will help shape your next banner marketing step.",
      offerings: {
        label: "OUR BANNER MARKETING SERVICES",
        heading: "Our Banner Marketing Services",
        intro:
          "Thoughtful planning, purposeful creative design, and practical support for your entire banner marketing campaign.",
      },
      why: {
        label: "WHY CHOOSE US",
        heading: "Why Choose Our Banner Marketing Team",
        intro:
          "A clear scope, a collaborative creative process, and a team that connects your banner campaigns directly with wider business growth.",
      },
      process: {
        label: "OUR PROCESS",
        heading: "How Our Banner Marketing Works",
        intro:
          "One shared, transparent plan, from your first conversation to the final banner campaign review.",
      },
      audiences: {
        label: "WHO WE HELP",
        heading: "Who Can Benefit From Our Banner Marketing?",
        intro:
          "Your business stage, target market, and growth priorities shape the right banner marketing campaign.",
      },
      faq: {
        label: "FREQUENTLY ASKED QUESTIONS",
        heading: ["Banner Marketing:", "Frequently Asked Questions"],
      },
      cta: {
        label: "LET'S GROW YOUR BUSINESS",
        note: "Send a consultation enquiry or share your banner marketing requirements for a tailored proposal.",
      },
    },
  },
  {
    slug: "newspaper-marketing",
    label: "Newspaper Marketing",
    title: "Newspaper Marketing & Print Advertisement Planning | AA100XTech",
    description:
      "Plan newspaper advertising with AA100XTech: print ad design, classifieds, display ads, regional campaigns and placement coordination for your business.",
    keywords: [
      "newspaper marketing",
      "newspaper advertisement planning",
      "print advertising",
      "classified advertisements",
      "regional newspaper campaigns",
    ],
    heading: "Your brand, in daily newspapers.",
    highlight: "Your message, in every hand.",
    intro:
      "Connect directly with local and regional readers through well-planned newspaper advertisements. We help you select the right city editions, create print-ready designs, and coordinate seamless bookings.",
    image: "/marketing/newspaper-marketing.webp",
    imageAlt: "Printed newspapers showing the texture and layout of traditional print media",
    imageCaption: "Local relevance, thoughtful planning and print-ready creative.",
    aboutHeading: "Make your business part of the daily newspaper read.",
    about: [
      "Newspaper advertising puts your business announcements directly in front of an engaged audience that spends quality time reading daily editions. Choosing the right city edition, regional language, and ad size ensures your budget delivers maximum local visibility. AA100X TECH helps you navigate those choices, preparing artwork to publisher specifications with written approvals confirmed before release.",
    ],
    benefits: [
      "Focus on relevant cities, editions, and readership based on where your core customers live and shop.",
      "Choose ad formats suited to your message—from classified text ads to full-page display announcements.",
      "Connect print enquiries seamlessly with your wider marketing activity using dedicated numbers or landing page links.",
    ],
    offerings: [
      {
        title: "Advertisement Planning",
        description:
          "Recommend publication types, editions, dates, and ad formats around your audience and campaign goal.",
      },
      {
        title: "Print Advertisement Design",
        description:
          "Create readable, print-ready artwork with the right column widths, dimensions, and required brand details.",
      },
      {
        title: "Classified Advertisements",
        description:
          "Prepare concise classified copy and coordinate category lines, word limits, and publisher requirements.",
      },
      {
        title: "Display Advertisements",
        description:
          "Develop visual display ads for launches, promotions, and business announcements at agreed sizes.",
      },
      {
        title: "Regional Newspaper Campaigns",
        description:
          "Plan local or regional editions and language adaptations appropriate to your target communities.",
      },
      {
        title: "Ad Placement Coordination",
        description:
          "Coordinate artwork submission, booking deadlines, digital proof approvals, and publication confirmations.",
      },
    ],
    reasons: [
      {
        title: "Relevant Media Choices",
        description:
          "Publication recommendations reflect your audience and location, with availability checked before booking.",
      },
      {
        title: "Attention to Print Detail",
        description:
          "We consider artwork specifications, font readability, and column layouts before your message goes to press.",
      },
      {
        title: "Clear Approvals",
        description:
          "Review copy, artwork, publication details, and quoted costs before final release.",
      },
      {
        title: "Coordinated Execution",
        description:
          "Keep publisher deadlines, creative preparation, and campaign timing smoothly connected.",
      },
    ],
    process: [
      "Discuss your business offer, target readers, preferred location, and advertising dates.",
      "Choose suitable editions, ad formats (classified or display), artwork needs, and booking options.",
      "Submit approved print artwork and secure confirmed placement slots with the publication desk.",
      "Check physical publication details and use enquiry feedback to inform later insertions.",
      "Provide official publication tearsheets or digital confirmation proofs along with campaign performance summaries.",
    ],
    audiences: [
      "Introduce a brand new business or service to a selected local readership.",
      "Announce festive offers, grand openings, and local services in relevant editions.",
      "Coordinate regional brand announcements and multi-edition campaigns effortlessly.",
      "Support major sales launches with print messages linked to an online destination.",
      "Reach active readers directly around your physical shops, offices, and service areas.",
    ],
    faqs: [
      {
        question: "Can you help choose a newspaper and edition?",
        answer:
          "Yes. We discuss your audience, city, preferred language and campaign purpose, then assess suitable publications and editions. Final availability, rates and booking terms are confirmed with the publisher.",
      },
      {
        question: "What is the difference between classified and display ads?",
        answer:
          "Classified ads usually follow a compact text or category-based format. Display ads provide more control over layout, imagery and size. We can help choose a format based on the message and available budget.",
      },
      {
        question: "Can you coordinate regional or local-language campaigns?",
        answer:
          "We can discuss regional editions and language adaptations. Translation, proofing responsibilities and publication availability are agreed for the campaign, and final copy requires your approval before submission.",
      },
      {
        question: "How far ahead should I book a newspaper advertisement?",
        answer:
          "Deadlines vary by publication, edition, date and format. Contact us with your preferred date so we can check the booking window and allow time for artwork, review and publisher approval.",
      },
      {
        question: "Will I receive proof that the advertisement was published?",
        answer:
          "We request available publication evidence, such as an e-paper page or publisher confirmation, as agreed in the scope. The type and timing of evidence depend on the publication and booking arrangement.",
      },
      {
        question: "Can newspaper advertising results be tracked?",
        answer:
          "A dedicated landing page, QR code, offer code or enquiry question can help identify responses. Print exposure cannot be measured like a digital click, so we agree on realistic reporting before the campaign.",
      },
    ],
    ctaHeading: "Bring your next announcement to the right readers.",
    ctaDescription:
      "Tell us your target city, preferred publication date, and message. We will help plan the next steps.",
    copy: {
      heroTag: "NEWSPAPER MARKETING",
      primaryButton: "Get a Free Consultation",
      secondaryButton: "Get Customised Proposal",
      heroNote: "Start with your brief. We will help shape your next newspaper marketing step.",
      offerings: {
        label: "FROM IDEA TO EXECUTION",
        heading: "Our Newspaper Marketing Services",
        intro:
          "Thoughtful planning, purposeful creative design, and practical support for your entire newspaper advertising campaign.",
      },
      why: {
        label: "A CONSIDERED APPROACH",
        heading: "Why Choose Our Newspaper Marketing Team",
        intro:
          "A clear scope, a collaborative process and a team that connects your marketing with the wider business.",
      },
      process: {
        label: "CLARITY AT EVERY STAGE",
        heading: "How Our Newspaper Advertising Works",
        intro: "One shared plan, from the first conversation to the campaign review.",
      },
      audiences: {
        label: "BUILT AROUND YOUR BUSINESS",
        heading: "Who Can Benefit From Our Newspaper Marketing?",
        intro: "Your stage, your market and your priorities shape the campaign.",
      },
      faq: {
        label: "Before we begin",
        heading: ["Good questions.", "Clear answers."],
      },
      cta: {
        label: "YOUR NEXT MOVE STARTS HERE",
        note: "Send a consultation enquiry or share your requirements for a tailored proposal.",
      },
    },
  },
  {
    slug: "hoarding-ads",
    label: "Hoarding Ads",
    title: "Hoarding Ads, Billboards & Outdoor Advertising | AA100XTech",
    description:
      "Explore hoarding ads and outdoor advertising with AA100XTech. Plan city and highway billboards, location strategy, large-format design and placement coordination.",
    keywords: [
      "hoarding ads",
      "outdoor advertising",
      "billboard campaigns",
      "highway hoardings",
      "city advertising",
    ],
    heading: "A bigger canvas.",
    highlight: "A stronger local presence.",
    intro:
      "Bring your brand into the places people pass every day. From city routes to highway locations, we help connect the right outdoor space with a clear, memorable message.",
    image: "/marketing/hoarding-ads.webp",
    imageAlt: "Outdoor advertising billboards along a city street",
    imageCaption: "Location, visibility and a message built for the real world.",
    aboutHeading: "Make your brand part of the landscape.",
    about: [
      "Hoarding and billboard campaigns give your business a physical presence beyond a screen. The value of a location depends on factors such as the surrounding audience, sightlines, display size and how people travel past it.",
      "AA100X TECH helps you plan locations and create artwork that communicates quickly. We coordinate agreed media and production requirements with providers, while confirming site availability, booking terms and relevant permissions before execution.",
    ],
    benefits: [
      "Build visibility in selected cities and neighbourhoods",
      "Keep a simple brand message present along daily routes",
      "Support launches and local campaigns with outdoor creative",
    ],
    offerings: [
      {
        title: "Outdoor advertising planning",
        description:
          "Define the role of outdoor media within your campaign, including audience, timing and location criteria.",
      },
      {
        title: "Billboard campaigns",
        description:
          "Shortlist suitable billboard formats and booking options based on campaign needs and available inventory.",
      },
      {
        title: "Highway hoardings",
        description:
          "Explore relevant highway and approach-road locations with attention to viewing distance and message simplicity.",
      },
      {
        title: "City advertising",
        description:
          "Plan visibility near commercial areas, local routes and other locations relevant to your business.",
      },
      {
        title: "Location-based strategy",
        description:
          "Assess audience context, sightlines and placement suitability rather than selecting a site on size alone.",
      },
      {
        title: "Creative and placement",
        description:
          "Prepare large-format artwork and coordinate agreed printing, installation and display checks with providers.",
      },
    ],
    reasons: [
      {
        title: "Location with purpose",
        description:
          "We connect site selection to the people and areas your campaign aims to reach.",
      },
      {
        title: "Creative at scale",
        description:
          "Short copy, strong contrast and a clear focal point help the message work at a distance.",
      },
      {
        title: "Practical coordination",
        description:
          "Production, installation and display responsibilities are agreed before booking.",
      },
      {
        title: "Transparent scope",
        description:
          "Understand the media period, available evidence, costs and dependencies in your proposal.",
      },
    ],
    process: [
      "Discuss target areas, campaign dates, audience and brand message.",
      "Review location options, creative direction, availability and production needs.",
      "Coordinate approved artwork, booking and agreed installation arrangements.",
      "Check available display evidence and address reported placement issues.",
      "Summarise the display period, available site records and campaign learnings.",
    ],
    audiences: [
      "Introduce a launch in carefully selected areas.",
      "Give local promotions a visible physical presence.",
      "Coordinate outdoor messaging across agreed city locations.",
      "Build awareness with a short, memorable online destination.",
      "Help nearby customers recognise your brand on familiar routes.",
    ],
    faqs: [
      {
        question: "How do you recommend hoarding locations?",
        answer:
          "We discuss the areas and audiences you want to reach, then consider available sites, surrounding context, visibility, display dimensions and campaign timing. Site recommendations and availability are confirmed before booking.",
      },
      {
        question: "Can you plan city and highway campaigns?",
        answer:
          "Yes. We can explore city and highway options that suit your brief. Inventory, media terms and permissions vary by location, so no specific site is promised until it is checked and confirmed.",
      },
      {
        question: "Are printing and installation included?",
        answer:
          "They can be coordinated when included in the agreed scope. Your proposal explains the media booking, artwork, printing, installation, removal and maintenance responsibilities, including any separate provider costs.",
      },
      {
        question: "What makes a good hoarding design?",
        answer:
          "A short headline, a strong visual, a recognisable brand and one clear next step usually work better than dense copy. We adapt artwork to the actual site dimensions and expected viewing conditions.",
      },
      {
        question: "How are permissions and site terms handled?",
        answer:
          "We confirm the relevant provider responsibilities and available permission information as part of planning. Placement proceeds only after the site terms, approvals and responsibilities have been agreed.",
      },
      {
        question: "How can we assess an outdoor campaign?",
        answer:
          "Available reporting may include installation photographs, display-period records and responses from a dedicated URL or campaign code. Any audience estimates supplied by a media provider are identified as estimates, not verified individual views.",
      },
    ],
    ctaHeading: "Find the right place for your brand.",
    ctaDescription:
      "Share your target locations, campaign dates and creative idea. We will help explore an outdoor plan that fits.",
  },
  {
    slug: "celebrity-marketing",
    label: "Celebrity Marketing",
    title: "Celebrity Marketing & Endorsement Campaign Planning | AA100XTech",
    description:
      "Discuss celebrity endorsements, brand ambassadors, promotional videos and product launches with AA100XTech. Plan talent fit, deliverables, rights and campaign coordination.",
    keywords: [
      "celebrity marketing",
      "celebrity endorsements",
      "brand ambassador campaigns",
      "celebrity collaborations",
      "product launch promotions",
    ],
    heading: "The right voice.",
    highlight: "A story worth sharing.",
    intro:
      "Explore a celebrity collaboration built around your brand, your audience and a clear creative idea. We help shape the brief, assess talent fit and coordinate the campaign from proposal to delivery.",
    image: "/marketing/celebrity-marketing.webp",
    imageAlt: "Stage lighting and an audience at a live entertainment event",
    imageCaption: "Campaign planning for talent-led stories and brand moments.",
    aboutHeading: "Recognition starts with the right fit.",
    about: [
      "Celebrity marketing brings a recognisable public voice into your brand story through endorsements, ambassador roles, videos or launch appearances. A useful collaboration needs more than recognition: the audience, values, message and agreed rights must fit.",
      "AA100X TECH helps define the campaign brief and coordinate proposed collaborations with the relevant representatives. Talent availability, fees, usage rights and approvals are confirmed individually. Any engagement depends on a written agreement; no celebrity relationship is implied by this service.",
    ],
    benefits: [
      "Align talent selection with your brand and audience",
      "Agree on deliverables and content usage before production",
      "Coordinate campaign messaging across approved channels",
    ],
    offerings: [
      {
        title: "Celebrity endorsements",
        description:
          "Shape endorsement concepts with clear brand messages, proposed deliverables and approval requirements.",
      },
      {
        title: "Brand ambassador campaigns",
        description:
          "Plan longer-term association concepts, campaign touchpoints and proposed exclusivity terms.",
      },
      {
        title: "Celebrity collaborations",
        description:
          "Assess campaign fit and coordinate enquiries with relevant talent representatives, subject to availability.",
      },
      {
        title: "Promotional video campaigns",
        description:
          "Develop video briefs covering scripts, production needs, approved edits and intended distribution.",
      },
      {
        title: "Product launch promotions",
        description:
          "Plan a talent-led launch concept across agreed appearances, content or promotional activities.",
      },
      {
        title: "Brand awareness campaigns",
        description:
          "Build a coordinated rollout around approved celebrity content and a consistent brand story.",
      },
    ],
    reasons: [
      {
        title: "Fit before fame",
        description:
          "Campaign recommendations consider your audience, positioning and the proposed talent's public profile.",
      },
      {
        title: "Defined deliverables",
        description:
          "Content formats, approvals and timelines are documented before the work begins.",
      },
      {
        title: "Rights considered early",
        description:
          "Usage channels, territory, duration and exclusivity form part of the agreement discussion.",
      },
      {
        title: "Coordinated rollout",
        description:
          "Keep creative, production, talent approvals and distribution connected to the same brief.",
      },
    ],
    process: [
      "Discuss your brand, audience, campaign objective and talent preferences.",
      "Develop the concept and assess proposed talent, rights, availability and scope.",
      "Coordinate agreed contracts, production and talent-approved deliverables.",
      "Review the rollout and adjust approved campaign elements where appropriate.",
      "Summarise completed deliverables, available platform data and next steps.",
    ],
    audiences: [
      "Explore whether a talent-led launch fits your stage and budget.",
      "Assess focused collaborations around a clear business message.",
      "Plan ambassador concepts and coordinated brand campaigns.",
      "Support product stories with approved talent-led content.",
      "Explore suitable personalities for relevant regional promotions.",
    ],
    faqs: [
      {
        question: "Do you have confirmed celebrity partnerships?",
        answer:
          "This page describes campaign planning services and does not claim a partnership with any celebrity. Proposed talent is contacted through appropriate representatives, and availability and engagement terms must be confirmed for each campaign.",
      },
      {
        question: "How is a celebrity selected for a campaign?",
        answer:
          "We begin with your audience, brand values, objective, budget and preferred markets. We then assess suitable profiles and discuss potential options, subject to availability, representative responses and your approval.",
      },
      {
        question: "Can we request a particular celebrity?",
        answer:
          "Yes. Share your preference during the enquiry. A request does not guarantee availability or acceptance, and no booking is confirmed until the relevant parties approve and sign the agreed terms.",
      },
      {
        question: "What usage rights should we plan for?",
        answer:
          "The agreement should cover where content can appear, for how long, in which territories and whether paid advertising or exclusivity is included. Reuse beyond the agreed scope needs the relevant permission.",
      },
      {
        question: "Can a campaign include promotional videos and launch appearances?",
        answer:
          "It can, when those deliverables are agreed with the talent and production team. We scope scripts, shoot needs, appearance details, approvals and distribution separately so expectations are clear.",
      },
      {
        question: "How much does celebrity marketing cost?",
        answer:
          "Costs depend on talent, deliverables, production, campaign duration, rights and exclusivity. We discuss your brief and obtain relevant confirmations before presenting a customised proposal; there is no universal fixed price.",
      },
    ],
    ctaHeading: "Start with a strong brief. Build the right collaboration.",
    ctaDescription:
      "Tell us your brand story, campaign idea and talent preferences. We will help assess the possibilities and next steps.",
  },
];

export const marketingServiceHref = (service: Pick<MarketingService, "slug">) =>
  service.slug === "social-media-ads"
    ? "/social-media-ads-marketing"
    : `/marketing/${service.slug}`;

export function findMarketingService(slug: string) {
  return marketingServices.find((service) => service.slug === slug);
}
