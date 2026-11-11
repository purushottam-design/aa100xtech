export const partnershipApplicationHref =
  "/influencer-marketing/for-influencers?partnership=1#apply";

export const partnershipPackages = [
  { id: "digital-presence", name: "Digital Presence" },
  { id: "content-music", name: "Content & Music" },
  { id: "entertainment-studio", name: "Entertainment Studio" },
  { id: "multiple-services", name: "Multiple Services" },
  { id: "expert-guidance", name: "Need Expert Guidance" },
] as const;

export const partnershipProposalHref = (packageId = "expert-guidance") =>
  `/proposal?kind=partnership&package=${encodeURIComponent(packageId)}`;

export const partnershipInterestGroups = [
  {
    name: "Digital Presence",
    services: [
      "Portfolio Website",
      "Creator Website",
      "Creator Application",
      "Domain Support",
      "Professional Email Accounts",
      "Website Hosting",
      "Application Hosting",
    ],
  },
  {
    name: "Content & Music",
    services: [
      "Image Production",
      "Video Production",
      "AI Image Prompts",
      "AI Video Prompts",
      "Songs / Music",
      "Music Albums",
    ],
  },
  {
    name: "Entertainment Studio",
    services: [
      "Music Videos",
      "Microdrama",
      "Digital Distribution",
      "Original IP Development",
      "Audience Growth Support",
    ],
  },
] as const;

export const partnershipBenefits = [
  {
    title: "Portfolio Website",
    description: "Showcase your work, media kit, collaborations and creator profile.",
    detail:
      "A dedicated professional portfolio with your influencer profile, portfolio gallery, media kit, social media links, brand collaboration showcase, and contact and enquiry form.",
  },
  {
    title: "Personal Branding Website",
    description: "A professional website for your identity, services and opportunities.",
    detail:
      "Modern responsive design, personal brand presentation, creator services, collaboration enquiries, social media integration and a basic SEO-friendly structure.",
  },
  {
    title: "Creator App",
    description: "A personalised app or fan-engagement platform, as per scope.",
    detail:
      "Explore a creator profile, content gallery, fan engagement features, collaboration information, digital content showcase and custom creator tools based on approved project requirements.",
  },
  {
    title: "3 Email Accounts",
    description: "Up to three professional domain-based email accounts.",
    detail:
      "Eligible packages may include setup for hello@yourdomain.com, collaborations@yourdomain.com and business@yourdomain.com. Account limits and subscription costs are agreed in advance.",
  },
  {
    title: "Custom Domain",
    description: "Domain selection, registration and connection support.",
    detail:
      "Assistance with domain selection, registration, DNS configuration and connection to your creator website. Availability, fees, ownership and renewal terms are agreed before setup.",
  },
  {
    title: "Website Hosting",
    description: "Reliable hosting, deployment and technical setup support.",
    detail:
      "Suitable website hosting assistance, deployment, HTTPS configuration and technical setup based on the approved partnership scope and maintenance responsibilities.",
  },
  {
    title: "App Hosting",
    description: "Hosting and infrastructure support for your creator app.",
    detail:
      "Explore app deployment, hosting, infrastructure configuration and technical support. Resource limits, recurring charges and support responsibilities are defined in your agreement.",
  },
  {
    title: "Image Creation",
    description: "Photo shoots, editing and promotional creative support.",
    detail:
      "Develop branded promotional images, professional photography concepts, social media graphics and campaign creatives aligned with your creator identity.",
  },
  {
    title: "Video Production",
    description: "Reels, short-form, long-form videos and editing support.",
    detail:
      "Explore short-form video concepts, Instagram Reels, YouTube Shorts, promotional videos, editing support and long-form video planning.",
  },
  {
    title: "AI Image Prompts",
    description: "Structured AI prompts for marketing, lifestyle and brand visuals.",
    detail:
      "Image prompt resources for social media creatives, promotional concepts, photography, lifestyle visuals and creator branding.",
  },
  {
    title: "AI Video Prompts",
    description: "Creative video prompts for reels, shorts and cinematic content.",
    detail:
      "Video prompt resources for Reels, Shorts, promotional campaigns, cinematic content and short-form storytelling concepts.",
  },
  {
    title: "Music & Entertainment",
    description: "Original music, music videos, albums and microdrama support.",
    detail:
      "Explore original music, music videos, microdrama concepts, production planning and suitable entertainment collaboration opportunities within an approved project scope.",
  },
];

export const partnershipPrograms = [
  {
    id: "digital-presence",
    name: "Digital Presence",
    tagline: "Build Your Professional Creator Identity.",
    description:
      "Establish a strong digital foundation with professional websites, portfolio tools, creator applications, domains, branded email and suitable hosting.",
    services: [
      {
        title: "Website",
        short: "Creator & branding website",
        features: [
          "Professional creator website",
          "Personal branding website",
          "Responsive landing page",
        ],
      },
      {
        title: "App",
        short: "Creator / fan engagement app",
        features: ["Creator application", "Fan-engagement app, where agreed"],
      },
      {
        title: "Domain",
        short: "Selection & setup",
        features: ["Custom domain selection", "Domain configuration and connection"],
      },
      {
        title: "Email",
        short: "Up to 3 professional accounts",
        features: ["Branded professional email accounts", "Up to three accounts where included"],
      },
      {
        title: "Portfolio",
        short: "Profile, media kit & enquiries",
        features: [
          "Professional creator profile",
          "Media kit and content showcase",
          "Collaboration enquiry form",
        ],
      },
      {
        title: "Hosting",
        short: "Website & app hosting support",
        features: [
          "Website hosting assistance",
          "Creator app hosting support",
          "Deployment and setup",
        ],
      },
    ],
  },
  {
    id: "content-music",
    name: "Content & Music",
    tagline: "Produce, Create, and Publish Engaging Content.",
    description:
      "Develop creative images, videos, original music and branded content that reflect your creator identity and engage your target audience.",
    services: [
      {
        title: "Images",
        short: "Photo shoots & campaign creatives",
        features: [
          "Professional photo shoots",
          "Image editing and campaign creatives",
          "Promotional image concepts",
        ],
      },
      {
        title: "Videos",
        short: "Reels, shorts & long-form",
        features: [
          "Instagram Reels and YouTube Shorts",
          "Promotional and long-form videos",
          "Video editing",
        ],
      },
      {
        title: "Image Prompts",
        short: "AI visual concepts",
        features: ["AI image concepts", "Brand creative prompts", "Photography prompt resources"],
      },
      {
        title: "Video Prompts",
        short: "AI video concepts",
        features: [
          "AI video concepts",
          "Cinematic prompt ideas",
          "Short-form storytelling prompts",
        ],
      },
      {
        title: "Songs / Music",
        short: "Original tracks & production",
        features: [
          "Original music concepts",
          "Audio production planning",
          "Recording coordination",
          "Original track development and music releases",
        ],
      },
      {
        title: "Music Albums",
        short: "Multi-track planning & release",
        features: [
          "Multi-track album planning",
          "Album concept development",
          "Creative packaging and release preparation",
        ],
      },
    ],
  },
  {
    id: "entertainment-studio",
    name: "Entertainment Studio",
    tagline: "Bring Bigger Stories and Signature Creative Projects to Life.",
    description:
      "Explore entertainment production possibilities, from original music videos and short-form drama concepts to distribution and promotional support.",
    services: [
      {
        title: "Music Videos",
        short: "Concept, shoot & edit",
        features: [
          "Creative concepts and storyboarding",
          "Shoot coordination",
          "Video editing and release support",
        ],
      },
      {
        title: "Microdramas",
        short: "Story, script & production",
        features: [
          "Original story concepts",
          "Episodic planning and scriptwriting support",
          "Production coordination",
          "Post-production support",
        ],
      },
      {
        title: "Distribution",
        short: "Publishing & release support",
        features: [
          "Music release planning",
          "Video publishing coordination",
          "Platform distribution guidance",
        ],
      },
      {
        title: "Growth Support",
        short: "Audience & brand strategy",
        features: [
          "Audience strategy and content promotion",
          "Brand collaboration planning",
          "Creator positioning",
        ],
      },
      {
        title: "Original IP",
        short: "Creator-led projects & series",
        features: [
          "Original content concepts",
          "Creator-led entertainment projects",
          "Signature series planning",
          "Ownership and licensing discussions",
        ],
      },
      {
        title: "Launch & Promotion",
        short: "Campaign & release",
        features: [
          "Launch planning",
          "Promotional creative coordination",
          "Release campaign support",
        ],
      },
    ],
  },
];

export const partnershipReasons = [
  [
    "Professional Brand Identity",
    "Develop a recognisable creator identity through professional branding and digital presentation.",
  ],
  [
    "Technology and Creative Support",
    "Explore websites, apps, creative content and digital tools together.",
  ],
  [
    "Flexible Partnership Options",
    "Select services based on your current needs and approved scope.",
  ],
  ["Professional Creative Direction", "Access content planning and creative development support."],
  [
    "Transparent Project Scope",
    "Agree deliverables, pricing, timelines, responsibilities and revision terms before work begins.",
  ],
  [
    "Long-Term Collaboration Opportunities",
    "Explore suitable future campaigns, creator partnerships and entertainment projects as opportunities become available.",
  ],
];

export const partnershipSteps = [
  [
    "Apply for Partnership",
    "Share your creator details, social profiles, niche and partnership interests.",
  ],
  ["Profile Review", "Our team reviews your background, audience and partnership suitability."],
  [
    "Partnership Discussion",
    "Discuss your goals, requested services, opportunities and commercial terms.",
  ],
  [
    "Onboarding & Setup",
    "After approval and agreement, coordinate your selected assets, services and technical setup.",
  ],
  [
    "Create, Collaborate & Grow",
    "Begin approved activities and explore relevant content and collaboration opportunities.",
  ],
];

export const partnershipAudiences = [
  [
    "Emerging Influencers",
    "Build your digital journey with branding, portfolio tools and creative support.",
  ],
  [
    "Established Content Creators",
    "Expand an established creator brand with structured tools and new project opportunities.",
  ],
  ["YouTubers & Video Creators", "Develop your channel, original content and promotional videos."],
  ["Instagram Creators", "Explore Reels, lifestyle content, visual branding and collaborations."],
  [
    "Musicians & Artists",
    "Develop original tracks, music videos, albums and suitable production support.",
  ],
  [
    "Actors & Entertainment Creators",
    "Explore microdramas, short-form entertainment and creator-led stories.",
  ],
];

export const partnershipSupport = [
  [
    "Digital Branding Support",
    "Professional presentation, profile development, portfolio guidance and brand identity recommendations.",
  ],
  [
    "Creative Planning Support",
    "Content concepts, creative direction, image prompts, video prompts and campaign planning resources.",
  ],
  [
    "Technical Infrastructure Support",
    "Website deployment, domain configuration, professional email setup and approved app hosting assistance.",
  ],
  [
    "Production & Entertainment Support",
    "Music, video, microdrama, original content development and coordinated creative production services.",
  ],
];

export const partnershipFaqs = [
  {
    question: "Who can apply for the influencer partnership program?",
    answer:
      "Emerging influencers, established content creators, YouTubers, musicians, artists and other eligible creative professionals can apply. Applications are reviewed based on creator profile, content relevance, professional goals and available partnership opportunities.",
  },
  {
    question: "What services can I receive as an influencer partner?",
    answer:
      "Depending on your approved partnership scope, services may include portfolio websites, creator apps, domain setup, professional email accounts, hosting assistance, creative resources, content production, music and entertainment support.",
  },
  {
    question: "Will I receive a free website and domain?",
    answer:
      "Website development and domain support depend on the approved partnership terms. Free or subsidised services are available only when explicitly included in your partnership agreement.",
  },
  {
    question: "Can I get three professional email accounts?",
    answer:
      "Eligible packages may provide setup assistance for up to three branded professional email accounts. Subscription terms, applicable costs and account limits are defined in the agreement.",
  },
  {
    question: "Can AA100XTech help with video and music production?",
    answer:
      "Creators can explore suitable video, original music, album and entertainment production services based on project requirements and available production capabilities.",
  },
  {
    question: "Is microdrama production available?",
    answer:
      "Microdrama support may include story development, scripting, episode planning, production coordination, editing and release support, based on the approved project scope.",
  },
  {
    question: "Does joining guarantee brand deals?",
    answer:
      "No. Partnership approval does not guarantee brand deals, paid collaborations, revenue or a fixed number of projects. Opportunities depend on creator suitability, campaign availability and agreed terms.",
  },
  {
    question: "Is there a joining fee?",
    answer:
      "Any applicable registration, service, production, hosting or other fees are disclosed before you accept a partnership agreement. Pricing depends on the services and scope you approve.",
  },
  {
    question: "Can I select only the services I need?",
    answer:
      "Yes. Discuss available services based on your goals and our approved partnership offerings. The final service package and deliverables are documented in your agreement.",
  },
  {
    question: "How do I apply?",
    answer:
      "Click Apply for Influencer Partnership, complete the creator application and submit your profile. Our team reviews applications and contacts suitable applicants about next steps. Submitting an application does not automatically guarantee approval.",
  },
];
