type ProgramService = { label: string; benefit?: number };
type ProgramDetail = { title: string; features: string[] };
type ProgramPackage = {
  name: string;
  tagline: string;
  description: string;
  services: ProgramService[];
  details: ProgramDetail[];
};

export const influencerProgramPackages: ProgramPackage[] = [
  {
    name: "Digital Presence",
    tagline: "Build Your Professional Creator Identity.",
    description:
      "Establish a strong professional digital presence with creator-focused websites, applications, domains, professional email accounts, and portfolio solutions.",
    services: [
      { label: "Portfolio Website", benefit: 1 },
      { label: "Website", benefit: 2 },
      { label: "Creator App", benefit: 4 },
      { label: "Domain", benefit: 11 },
      { label: "Professional Email", benefit: 3 },
      { label: "Website Hosting", benefit: 10 },
      { label: "App Hosting", benefit: 9 },
    ],
    details: [
      {
        title: "Additional Digital Options",
        features: [
          "Media kit presentation within your portfolio",
          "Optional fan engagement application",
          "Custom app functionality based on the approved project scope",
        ],
      },
    ],
  },
  {
    name: "Content & Music",
    tagline: "Produce and Publish Engaging Creator Content.",
    description:
      "Bring your creative ideas to life with professional image production, video content, music creation, audio production, and content development support. Develop visual and audio assets that align with your creator identity and audience.",
    services: [
      { label: "Images & Videos", benefit: 6 },
      { label: "Image Prompts", benefit: 7 },
      { label: "Video Prompts", benefit: 8 },
      { label: "Songs / Music" },
      { label: "Music Albums" },
      { label: "Content Production Support" },
    ],
    details: [
      {
        title: "Image Production",
        features: [
          "Professional image creation",
          "Photo shoots",
          "Image editing",
          "Promotional creatives, campaign visuals, and social media assets",
        ],
      },
      {
        title: "Video Production",
        features: [
          "Short-form videos, Instagram Reels, and YouTube Shorts",
          "Long-form video production",
          "Promotional video production",
          "Video editing and content planning",
        ],
      },
      {
        title: "Songs / Music & Audio Production",
        features: [
          "Original music concepts and original track development",
          "Songwriting and composition support",
          "Audio recording coordination",
          "Music production",
          "Mixing and mastering support",
          "Music release planning",
        ],
      },
      {
        title: "Music Albums",
        features: [
          "Multi-track album planning",
          "Album creative direction",
          "Track production coordination",
          "Album artwork concepts",
          "Album packaging",
          "Music release preparation",
        ],
      },
      {
        title: "Additional Content Production Support",
        features: [
          "Content calendars",
          "Content editing assistance",
          "Publishing support where agreed",
        ],
      },
    ],
  },
  {
    name: "Entertainment Studio",
    tagline: "Launch Bigger Stories and Signature Projects.",
    description:
      "Take your creative journey further with original entertainment concepts, music videos, microdramas, professional production planning, and promotional distribution support. Develop compelling projects that connect storytelling, production, audience engagement, and creator branding.",
    services: [
      { label: "Music Videos" },
      { label: "Microdramas", benefit: 5 },
      { label: "Digital Distribution" },
      { label: "Audience Growth Support" },
      { label: "Original IP Development" },
      { label: "Launch & Promotion" },
    ],
    details: [
      {
        title: "Music Videos",
        features: [
          "Music video concepts and creative direction",
          "Storyboarding and shoot planning",
          "Video production coordination",
          "Professional editing",
          "Release support",
        ],
      },
      {
        title: "Microdrama Episode Production",
        features: [
          "Original episodic storytelling",
          "Script development, character and story planning",
          "Episode structure",
          "Production coordination",
          "Short-form entertainment production",
          "Post-production support",
        ],
      },
      {
        title: "Distribution",
        features: [
          "Content publishing strategy",
          "Digital distribution planning",
          "Platform release coordination",
          "Music and video launch planning",
          "Promotional distribution support",
          "Content release scheduling",
        ],
      },
      {
        title: "Growth Support",
        features: [
          "Audience growth strategy",
          "Brand positioning",
          "Creative campaign promotion",
          "Social media marketing guidance",
          "Brand collaboration planning",
          "Audience engagement strategy",
        ],
      },
      {
        title: "Original IP Development",
        features: [
          "Original entertainment concept development",
          "Creator-led entertainment projects",
          "Original storytelling and signature content series",
          "Creative brand development",
          "IP ownership and licensing planning",
        ],
      },
      {
        title: "Launch & Promotion",
        features: [
          "Promotional campaign strategy",
          "Launch creatives",
          "Teaser concepts and trailer planning",
          "Audience awareness campaigns",
          "Release marketing coordination",
        ],
      },
    ],
  },
];
