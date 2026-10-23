export type Demo = {
  title: string;
  blurb: string;
  format: string;
  /** YouTube video id, Vimeo id or a direct .mp4 URL. Leave empty until the sample is published. */
  youtubeId?: string;
  vimeoId?: string;
  videoUrl?: string;
};

/**
 * Demo reels / walkthrough examples shown on each AI & real-estate service page.
 * Drop a `youtubeId`, `vimeoId` or `videoUrl` into any entry and it embeds instantly.
 */
export const serviceDemos: Record<string, Demo[]> = {
  "real-estate-photo-to-video": [
    {
      title: "3BHK listing reel from 18 photos",
      blurb:
        "Stills to a 30-second vertical reel: parallax camera pushes, room-to-room transitions, price and contact end card.",
      format: "30s · 9:16 · Instagram / Reels",
    },
    {
      title: "Cinematic house tour",
      blurb:
        "A 75-second landscape film with an establishing drone-style opener, room chapters, licensed score and agency branding.",
      format: "75s · 16:9 · YouTube / website hero",
    },
    {
      title: "Luxury property presentation film",
      blurb:
        "Slow cinematic grade, on-screen specification cards, amenity montage and a closing call-to-action for premium listings.",
      format: "2–3 min · 4K · Pitch & portal",
    },
  ],
  "ai-avatar-property-walkthrough": [
    {
      title: "AI host walkthrough — English",
      blurb:
        "A photoreal AI presenter introduces the property, then narrates each room over the tour footage, lip-synced end to end.",
      format: "90s · 16:9 · Portal listing",
    },
    {
      title: "Same tour, Hindi voice track",
      blurb:
        "One script, regenerated in a second language with matching lip-sync — no reshoot, no second presenter fee.",
      format: "90s · Multi-language",
    },
  ],
  "agent-in-video-walkthrough": [
    {
      title: "Agent-inside walkthrough",
      blurb:
        "Your agent filmed once, then composited into every property walkthrough — greeting, room commentary and closing pitch.",
      format: "60–90s · 16:9",
    },
    {
      title: "Broker intro + property cutaway",
      blurb:
        "Talking-head opener with picture-in-picture property footage, captions and branded lower-thirds.",
      format: "45s · 9:16 & 16:9",
    },
  ],
  "ai-voice-agent": [
    {
      title: "Inbound enquiry call",
      blurb:
        "A Jarvis-style voice agent answers a live property enquiry, qualifies the buyer, quotes availability and books a site visit.",
      format: "Audio demo · 2 min call",
    },
    {
      title: "Outbound follow-up call",
      blurb:
        "The agent calls back a stale lead, handles objections and logs the outcome into your CRM automatically.",
      format: "Audio demo · 90s call",
    },
  ],
  "ai-avatar-agent": [
    {
      title: "Website avatar concierge",
      blurb:
        "A talking avatar embedded on your site answers visitor questions in real time and hands off to a human when asked.",
      format: "Screen recording · 2 min",
    },
  ],
  "one-identity-one-world": [
    {
      title: "Identity rollout walkthrough",
      blurb:
        "Domain, email, website, app, social pages and your AI avatar — a screen tour of one identity deployed everywhere.",
      format: "3 min walkthrough",
    },
  ],
  "your-voice-your-song": [
    {
      title: "Voice-to-song sample",
      blurb: "A short voice sample turned into a fully produced track with your own vocal timbre.",
      format: "Audio · 2 min track",
    },
  ],
  "avatar-story-music-videos": [
    {
      title: "Avatar music video",
      blurb:
        "Your avatar performing an original track with story cuts, scene changes and a graded cinematic look.",
      format: "Music video · 2–3 min",
    },
  ],
  "voice-cloning": [
    {
      title: "Cloned voice A/B",
      blurb: "Original recording next to the cloned voice reading fresh script — same tone, new lines.",
      format: "Audio comparison · 60s",
    },
  ],
  "ugc-ads": [
    {
      title: "Marketplace UGC ad",
      blurb:
        "Creator-style unboxing and demo built for Amazon, Flipkart, Blinkit and Meta placements, with hook variants.",
      format: "15–30s · 9:16",
    },
    {
      title: "Hook test pack",
      blurb: "The same product ad in five different opening hooks so you can test what actually converts.",
      format: "5 × 15s · 9:16",
    },
  ],
  "branded-ecommerce-store": [
    {
      title: "Store + app launch walkthrough",
      blurb:
        "Storefront, brand system, checkout and the matching iOS/Android app shown end to end from a real launch.",
      format: "3 min walkthrough",
    },
  ],
  "social-content-strategy": [
    {
      title: "30-day content plan walkthrough",
      blurb:
        "How we build a month of hooks, formats and posting cadence from your offer and audience data.",
      format: "4 min walkthrough",
    },
  ],
};

export const demosForSlug = (slug: string): Demo[] => serviceDemos[slug] ?? [];
