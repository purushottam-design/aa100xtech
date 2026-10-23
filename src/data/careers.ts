export type Role = {
  title: string;
  line: string;
  seats: number;
  briefDays: 7 | 10;
  brief: string;
  deliver: string;
  tools: string[];
};

export type CareersCohort = {
  slug: "global" | "london";
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  lede: string;
  kicker?: string;
  seats: number;
  email: string;
  whatsapp: string;
  stats: { value: string; label: string }[];
  sampleBrief: { title: string; body: string };
  linesIntro: string;
  lines: { n: string; name: string; body: string }[];
  flagship: { label: string; title: string; body: string; pipeline: string[] };
  rolesIntro: string;
  roles: Role[];
  timelineIntro: string;
  timeline: { day: string; title: string; body: string }[];
  scorecardIntro: string;
  scorecard: { name: string; body: string; pts: number }[];
  offerTitle: string;
  offer: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  hoursOptions: string[];
  extraFields?: { name: string; label: string; options?: string[] }[];
};

const sharedLines = [
  {
    n: "01",
    name: "Websites",
    body: "Marketing sites, landing pages and funnels that load fast and convert on mobile.",
  },
  {
    n: "02",
    name: "Mobile & web apps",
    body: "Product apps end to end — auth, payments, dashboards, App Store and Play releases.",
  },
  {
    n: "03",
    name: "AI agents",
    body: "Agents that do the boring half of a business: intake, enrichment, drafting, routing, logging.",
  },
  {
    n: "04",
    name: "Sales AI",
    body: "Outbound that runs itself — AI voice calling plus multi-step email, booked straight into a calendar.",
  },
  {
    n: "05",
    name: "Customer support AI",
    body: "Chat and voice support trained on a client's own docs, with clean escalation to a human.",
  },
  {
    n: "06",
    name: "Performance marketing",
    body: "Meta and Google campaigns run to a cost-per-lead number, not to impressions.",
  },
  {
    n: "07",
    name: "Graphic & brand design",
    body: "Identity, social kits, decks and ad creative built on a system, not one-off files.",
  },
  {
    n: "08",
    name: "Photography",
    body: "Product, property and brand shoots, plus retouching and batch colour work at volume.",
  },
  {
    n: "09",
    name: "Video production",
    body: "Brand films, vertical cuts, captions and motion graphics — shot, edited and delivered.",
  },
  {
    n: "10",
    name: "UGC ads",
    body: "Creator-style ads that look native to the feed. Hook, problem, product, call to action.",
  },
];

const scorecard = [
  {
    name: "Output quality",
    body: "Would we send this to a paying client without touching it?",
    pts: 40,
  },
  { name: "Speed", body: "Did each milestone land on its date, or did the date move?", pts: 25 },
  {
    name: "Cost efficiency",
    body: "What did it cost in tools, credits and hours — and could it be cheaper at 100 units?",
    pts: 20,
  },
  {
    name: "Ownership",
    body: "Did you flag problems early, or did we discover them on day nine?",
    pts: 15,
  },
];

const hoursOptions = ["2–4 hours", "4–6 hours", "6–8 hours", "Full time"];

export const globalCohort: CareersCohort = {
  slug: "global",
  eyebrow: "Hiring open · Remote · India · UAE · US",
  headline: "We don't interview.",
  headlineAccent: "We brief you.",
  lede: "AA100X Tech is opening 30 remote seats across 11 product lines. Skip the resume theatre — shortlisted candidates get one real client-grade brief and 10 days to ship it. Ship it well and the role is confirmed on day 10.",
  kicker: "Kaam bolega. Resume baad mein.",
  seats: 30,
  email: "careers@aa100xtech.com",
  whatsapp: "+919031838342",
  stats: [
    { value: "30", label: "Seats open" },
    { value: "11", label: "Product lines" },
    { value: "10", label: "Days to prove it" },
    { value: "100%", label: "Work from home" },
  ],
  sampleBrief: {
    title: "AI Video Producer — Real Estate",
    body: "Turn 12 still listing photos of one property into a 45-second cinematic walkthrough. Camera moves must read as real — no warping doorframes, no melting furniture. Finish with the agent's branding card and a voiceover.",
  },
  linesIntro:
    "Absolute Advancement 100X Tech builds and runs these for clients across India, the UAE and the US. Every open role sits inside one of them — so the brief you get is the work you'd actually do.",
  lines: sharedLines,
  flagship: {
    label: "11 · Flagship",
    title: "Real estate cinematic tours",
    body: "An agent sends us the listing photos. We send back a cinematic walkthrough — camera moves, lighting, ambience, the agent's own branding and voice over the top. No crew, no drone permit, no reshoot. This is our fastest-growing line, and three of the thirty seats sit here.",
    pipeline: [
      "IN — 12–20 listing photos from the broker",
      "01 — Clean-up, straighten, colour match",
      "02 — AI motion pass, shot by shot",
      "03 — Grade, sound design, agent card",
      "OUT — 45–60 sec tour, ready to post",
    ],
  },
  rolesIntro:
    "Every role below shows the exact trial task before you apply. Nothing is hidden until \"round three\" — there is no round three. Apply to one role only; you get one brief.",
  roles: [
    {
      title: "Frontend web developer",
      line: "Websites",
      seats: 4,
      briefDays: 10,
      brief:
        "Build a five-section landing page for one of our service lines from a written brief — no Figma file. It must load in under two seconds on 4G, score 90+ on mobile Lighthouse, and be live on a public URL.",
      deliver: "Live URL, repo access, and a 60-second walkthrough video.",
      tools: ["HTML/CSS/JS", "React / Next.js", "Tailwind", "Netlify"],
    },
    {
      title: "App developer",
      line: "Mobile & web apps",
      seats: 3,
      briefDays: 10,
      brief:
        "Ship a three-screen working app — onboarding, upload, result — wired to a real API, not mock data. Hand over an installable build.",
      deliver: "Signed APK or TestFlight link, repo, and a short screen recording of the full flow.",
      tools: ["React Native", "Flutter", "Firebase", "Supabase"],
    },
    {
      title: "AI agent engineer",
      line: "AI agents",
      seats: 3,
      briefDays: 10,
      brief:
        "Build one agent that takes an inbound lead form, enriches it, scores it, drafts a reply in our tone, and logs it — end to end, with zero manual steps in the middle.",
      deliver: "The working workflow, a recorded test run on ten fake leads, and your cost per 1,000 leads.",
      tools: ["n8n", "Make.com", "Claude / OpenAI API", "Webhooks"],
    },
    {
      title: "Sales AI specialist",
      line: "Sales AI",
      seats: 2,
      briefDays: 10,
      brief:
        "Stand up one outbound campaign — 200 sourced leads, one AI voice script, one four-email sequence — and run it live for five days.",
      deliver: "Connect rate, reply rate, calls booked, and your real cost per booked call.",
      tools: ["Bland AI", "Retell AI", "Instantly.ai", "Make.com"],
    },
    {
      title: "Customer support AI specialist",
      line: "Support AI",
      seats: 2,
      briefDays: 10,
      brief:
        "Turn a 20-page product doc into a support agent. It should answer 20 test questions correctly, escalate the three it shouldn't touch, and never invent a fact it wasn't given.",
      deliver: "A live chat widget plus an accuracy log showing all 23 test cases and their outcomes.",
      tools: ["Claude / OpenAI API", "Vector search", "Chat widgets", "Ticketing"],
    },
    {
      title: "Performance marketer",
      line: "Marketing",
      seats: 2,
      briefDays: 10,
      brief:
        "Plan and run a small paid test for one service line — three creatives, two audiences, budget capped and agreed on day two.",
      deliver:
        "CPM, CTR, cost per lead, and a one-page note on exactly what you'd change at ten times the budget.",
      tools: ["Meta Ads", "Google Ads", "GA4", "Sheets"],
    },
    {
      title: "Graphic & brand designer",
      line: "Design",
      seats: 3,
      briefDays: 7,
      brief:
        "One service line, one full kit — logo lockup, six social posts, a deck cover and an ad set — all built on our white-and-gold system so any of them can sit next to each other.",
      deliver: "Figma link with named layers, plus packaged exports at the right sizes.",
      tools: ["Figma", "Illustrator", "Photoshop"],
    },
    {
      title: "Photo editor & retoucher",
      line: "Photography",
      seats: 3,
      briefDays: 7,
      brief:
        "Twenty-five raw property photos into twenty-five finished ones — straightened, colour matched, windows recovered, skies replaced where they need it. Batch consistency counts more than any single hero shot.",
      deliver: "The full before-and-after set and the preset or action you built to keep them consistent.",
      tools: ["Lightroom", "Photoshop", "Topaz"],
    },
    {
      title: "Video editor",
      line: "Video production",
      seats: 4,
      briefDays: 10,
      brief:
        "One 60-second brand film and three 15-second vertical cuts, all from the same footage pack we send you. Licensed music, burned captions, brand end card.",
      deliver: "Four exports at the right specs, plus the project file so someone else could pick it up.",
      tools: ["Premiere Pro", "After Effects", "DaVinci Resolve", "ffmpeg"],
    },
    {
      title: "AI video producer — real estate",
      line: "Cinematic tours",
      seats: 2,
      briefDays: 10,
      brief:
        "Turn 12 still listing photos of one property into a 45-second cinematic walkthrough. Camera moves must read as real — no warping doorframes, no melting furniture. Finish with the agent's branding card and a voiceover.",
      deliver: "Final MP4 under 25 MB, your shot list, and your generation cost per property.",
      tools: ["Kling", "Runway", "Flux / Midjourney", "ffmpeg"],
    },
    {
      title: "UGC creator",
      line: "UGC ads",
      seats: 2,
      briefDays: 7,
      brief:
        "Three 30-second UGC ads for one service — same offer, three completely different hooks. Shot on your phone, in your own voice, no studio.",
      deliver: "Three raw takes and three edited verticals with captions.",
      tools: ["Phone camera", "Ring light", "CapCut"],
    },
  ],
  timelineIntro:
    "The dates below are the whole process. Design, photo and UGC roles run on a seven-day version of the same track. You keep your current job, your college, your other clients — we only care that the delivery lands on the date.",
  timeline: [
    {
      day: "D1",
      title: "Brief drop and kickoff",
      body: "You get the brief in writing and a 20-minute call. Ask everything today — questions after day one cost you points on ownership.",
    },
    {
      day: "D2",
      title: "Your plan, on one page",
      body: "Approach, tools, what it will cost to run, and a day-by-day timeline. We approve the budget here. Nothing gets spent before it.",
    },
    {
      day: "D3–6",
      title: "Build",
      body: "One update every evening on WhatsApp. One line — what moved, what's stuck. No essays, no silence.",
    },
    {
      day: "D7",
      title: "First cut in",
      body: "Submit whatever you have, finished or not. We review the same day and send notes back in writing.",
    },
    {
      day: "D8",
      title: "Fix round",
      body: "One round of notes, applied. How you take feedback tells us more than the first cut did.",
    },
    {
      day: "D9",
      title: "Final delivery and cost sheet",
      body: "Files handed over, plus what it actually cost you in tools, credits and hours to produce.",
    },
    {
      day: "D10",
      title: "Demo, and a decision",
      body: "Fifteen minutes. You walk us through it, we score it against the card, and you hear yes or no the same day. Nobody waits a week for an email.",
    },
  ],
  scorecardIntro:
    "We're not looking for the most expensive answer or the most impressive one. We're looking for the best output that took the least time and the least money to produce — because that's the job.",
  scorecard,
  offerTitle: "What the seat actually comes with.",
  offer: [
    {
      title: "Monthly retainer plus project bonus",
      body: "Fixed base for the seat, extra on top per delivered project. Your band is set on day ten, from your score.",
    },
    {
      title: "Work from home, permanently",
      body: "No relocation, no office. We work across India, the UAE and the US, so you overlap with whichever market your line serves.",
    },
    {
      title: "Tools and credits on us",
      body: "Adobe, Figma, Kling, API credits and ad spend are company cost. You never pay to do company work.",
    },
    {
      title: "Milestone-based revisions",
      body: "Hit an agreed delivery milestone and your compensation is revised — a written number, not a promise about next year.",
    },
    {
      title: "Straight to the founder",
      body: "One layer between you and the decision. Briefs come down clean and answers come back the same day.",
    },
    {
      title: "Room to run a line",
      body: "Every product line needs a lead. They come from inside, from whoever keeps delivering.",
    },
  ],
  faq: [
    {
      q: "Is the trial paid?",
      a: "The stipend for your brief is stated in the brief email you receive, and it's paid on final delivery whether or not we hire you. Anything you produce during the trial stays credited to you.",
    },
    {
      q: "Can I do this alongside my job or college?",
      a: "Yes. Most people do. We don't track your hours — we track the dates on the timeline. Tell us upfront what your realistic daily window is so the brief is sized for it.",
    },
    {
      q: "Do I need a degree or years of experience?",
      a: "No. We've never once looked at a degree. The brief is the filter, and it's the same brief for a fresher and a ten-year veteran.",
    },
    {
      q: "What if I'm going to miss a milestone?",
      a: "Tell us before the date, not after. One slip that you flag early costs you almost nothing. Silence costs you the seat.",
    },
    {
      q: "Can I apply for two roles?",
      a: "Pick one. You get one brief, and doing one properly beats doing two at half strength — which is also roughly how the job works.",
    },
    {
      q: "Who owns the work I produce in the trial?",
      a: "You keep it in your portfolio. If we use it commercially, it moves under a normal work agreement and you're paid for it as a delivered project.",
    },
  ],
  hoursOptions,
};

export const londonCohort: CareersCohort = {
  slug: "london",
  eyebrow: "London cohort · 12 seats · Remote across the UK",
  headline: "London office.",
  headlineAccent: "No London commute.",
  lede: "AA100X Tech already runs product lines out of Dubai, Mumbai and New York. We're opening the London studio to serve UK clients on UK hours — starting with twelve people. Skip the interview rounds: shortlisted candidates get one real client brief and ten days to ship it.",
  seats: 12,
  email: "careers-uk@aa100xtech.com",
  whatsapp: "+919031838342",
  stats: [
    { value: "London", label: "Base · your working day" },
    { value: "Dubai", label: "Overlaps your morning" },
    { value: "Mumbai", label: "Production team" },
    { value: "New York", label: "Overlaps your afternoon" },
  ],
  sampleBrief: {
    title: "AI video producer — property",
    body: "Take 12 listing photos of a two-bed Zone 2 conversion and build a 45-second cinematic tour. Camera moves must read as real — no bending doorframes, no melting furniture. Cut it to sit on a Rightmove listing and as a 9:16 for the agent's Instagram.",
  },
  linesIntro:
    "The London cohort takes UK clients across all of these, with the production bench in Mumbai behind you. Every open seat sits inside one of these lines — so the brief you get is the work you'd actually do.",
  lines: [
    {
      n: "01",
      name: "Websites",
      body: "Marketing sites and funnels that pass Core Web Vitals and convert on a phone, on the tube, on 4G.",
    },
    ...sharedLines.slice(1, 5),
    {
      n: "06",
      name: "Performance marketing",
      body: "Meta and Google run to a cost-per-lead number, targeted down to postcode.",
    },
    ...sharedLines.slice(6),
  ],
  flagship: {
    label: "11 · Why London first",
    title: "Cinematic tours for UK property",
    body: "A London agent lists a flat with eight photos and a floor plan. We turn those same photos into a cinematic walkthrough — camera moves, light through the sash windows, the agent's branding and voice over the top. No crew, no drone permit, no second visit. Four of the twelve London seats sit on this line, because UK agents are the reason we're opening here.",
    pipeline: [
      "IN — 8–20 listing photos from the agent",
      "01 — Verticals straightened, grey skies replaced",
      "02 — AI motion pass, room by room",
      "03 — Grade, sound, agent card, voiceover",
      "OUT — 45 sec for the listing, 9:16 for social",
    ],
  },
  rolesIntro:
    "Every role shows its exact trial task. Nothing is held back for \"round three\" — there is no round three. Apply to one role only; you get one brief. You'll need the right to work in the UK, and you can be anywhere in the country.",
  roles: [
    {
      title: "AI video producer — property",
      line: "Cinematic tours",
      seats: 4,
      briefDays: 10,
      brief:
        "Take 12 listing photos of a two-bed Zone 2 conversion and build a 45-second cinematic tour. Camera moves must read as real — no bending doorframes, no melting furniture. Cut it for the listing and as a 9:16 for the agent's Instagram.",
      deliver:
        "Both exports, final MP4 under 25 MB, your shot list, and your generation cost per property in £.",
      tools: ["Kling", "Runway", "Flux / Midjourney", "ffmpeg"],
    },
    {
      title: "Property photo editor",
      line: "Photography",
      seats: 2,
      briefDays: 7,
      brief:
        "Twenty-five raw photos of a period conversion into twenty-five finished ones — verticals straightened, blown windows recovered, mixed tungsten and daylight balanced, flat grey sky replaced. Batch consistency counts more than any single hero shot.",
      deliver: "The full before-and-after set, plus the preset you built to keep the batch consistent.",
      tools: ["Lightroom", "Photoshop", "Topaz"],
    },
    {
      title: "Frontend web developer",
      line: "Websites",
      seats: 2,
      briefDays: 10,
      brief:
        "Build a five-section landing page for one of our UK service lines from a written brief — no Figma file. Green Core Web Vitals on mobile, a cookie banner that actually blocks scripts until consent, and live on a public URL.",
      deliver: "Live URL, repo access, and a 60-second walkthrough video.",
      tools: ["HTML/CSS/JS", "React / Next.js", "Tailwind", "Netlify"],
    },
    {
      title: "AI agent engineer",
      line: "AI agents",
      seats: 1,
      briefDays: 10,
      brief:
        "Build one agent for a lettings agency: it takes a viewing enquiry, checks the property against availability, replies in the agency's tone, books the slot and logs it — end to end, no manual step in the middle. Personal data stays inside the systems you're given.",
      deliver:
        "The working workflow, a recorded test run on ten fake enquiries, and your cost per 1,000 enquiries.",
      tools: ["n8n", "Make.com", "Claude / OpenAI API", "Webhooks"],
    },
    {
      title: "Sales AI specialist",
      line: "Sales AI",
      seats: 1,
      briefDays: 10,
      brief:
        "Stand up one outbound campaign to 200 London and South East estate agencies — one AI voice script, one four-email sequence. UK business hours only, a working one-click opt-out in every email, and no calling anyone on the TPS list.",
      deliver:
        "Connect rate, reply rate, demos booked, and your real cost per booked call in £.",
      tools: ["Bland AI", "Retell AI", "Instantly.ai", "Make.com"],
    },
    {
      title: "Performance marketer",
      line: "Marketing",
      seats: 1,
      briefDays: 10,
      brief:
        "Plan and run a £150 test for the property video line — three creatives, two audiences, targeted to London postcodes where agency density is highest. Budget agreed on day two, not spent before it.",
      deliver: "CPM, CTR, cost per lead, and one page on exactly what you'd change at £1,500.",
      tools: ["Meta Ads", "Google Ads", "GA4", "Sheets"],
    },
    {
      title: "Video editor",
      line: "Video production",
      seats: 1,
      briefDays: 10,
      brief:
        "One 60-second brand film and three 15-second verticals, all from the same footage pack. Properly licensed music, burned captions, brand end card.",
      deliver: "Four exports at spec, plus the project file so someone else could pick it up tomorrow.",
      tools: ["Premiere Pro", "After Effects", "DaVinci Resolve", "ffmpeg"],
    },
    {
      title: "Graphic & brand designer",
      line: "Design",
      seats: 1,
      briefDays: 7,
      brief:
        "One full kit for the UK property video offering — logo lockup, six social posts, a pitch deck cover and an ad set — all on our system, so any two can sit side by side without looking like different companies.",
      deliver: "Figma link with named layers, plus packaged exports at the right sizes.",
      tools: ["Figma", "Illustrator", "Photoshop"],
    },
  ],
  timelineIntro:
    "These dates are the entire process. Design and photo roles run a seven-day version of the same track. Keep your current job, your studies, your other clients — we only care that the delivery lands on the date.",
  timeline: [
    {
      day: "D1",
      title: "Brief drop and kickoff",
      body: "The brief in writing, plus a 20-minute call at 10am London time. Ask everything today — questions after day one cost you points on ownership.",
    },
    {
      day: "D2",
      title: "Your plan, on one page",
      body: "Approach, tools, what it costs to run in £, and a day-by-day timeline. We approve the budget here. Nothing gets spent before it.",
    },
    {
      day: "D3–6",
      title: "Build",
      body: "One update every evening on WhatsApp. One line — what moved, what's stuck. No essays, no silence.",
    },
    {
      day: "D7",
      title: "First cut in",
      body: "Submit whatever you have, finished or not. Mumbai reviews overnight, so notes are back in your inbox before you start on day eight.",
    },
    {
      day: "D8",
      title: "Fix round",
      body: "One round of notes, applied. How you take feedback tells us more than the first cut did.",
    },
    {
      day: "D9",
      title: "Final delivery and cost sheet",
      body: "Files handed over, plus what it actually cost in tools, credits and hours to produce.",
    },
    {
      day: "D10",
      title: "Demo, and a decision",
      body: "Fifteen minutes. You walk us through it, we score it against the card, and you hear yes or no the same day. Nobody waits a fortnight for an email.",
    },
  ],
  scorecardIntro:
    "We're not after the most expensive answer or the most impressive one. We're after the best output that took the least time and the least money to produce — because that is the job.",
  scorecard,
  offerTitle: "What the London seat comes with.",
  offer: [
    {
      title: "Monthly rate plus project bonus",
      body: "A fixed monthly figure in £, extra per delivered project. Contract or PAYE — we set the arrangement with you at offer, in writing.",
    },
    {
      title: "Remote anywhere in the UK",
      body: "London is the market, not the postcode you have to live in. Glasgow, Cardiff, Leeds — same seat, same rate.",
    },
    {
      title: "Tools and credits on us",
      body: "Adobe, Figma, Kling, API credits and ad spend are company cost. You never pay to do company work.",
    },
    {
      title: "A production bench behind you",
      body: "Mumbai picks up overnight. You brief at 6pm, it's reviewed by the time you're back at your desk.",
    },
    {
      title: "Milestone-based reviews",
      body: "Hit an agreed delivery milestone and your rate is revised — a written number on a written date, not a promise about next year.",
    },
    {
      title: "Room to run the line",
      body: "The London studio needs leads for each line. They come from inside, from whoever keeps delivering.",
    },
  ],
  faq: [
    {
      q: "Is the trial paid?",
      a: "The stipend for your brief is stated in the brief email, and it's paid on final delivery whether or not we take you on. Anything you produce stays credited to you.",
    },
    {
      q: "Do I need to live in London?",
      a: "No. London is the market we serve, not a place you have to commute to. You need the right to work in the UK and to be on UK hours — the postcode is yours to pick.",
    },
    {
      q: "Can I do this alongside my job?",
      a: "Yes, most people do. We don't count your hours, we count the dates on the timeline. Tell us your realistic daily window upfront and the brief gets sized for it.",
    },
    {
      q: "Employed or self-employed?",
      a: "Both are on the table, and we set it with you in writing at offer alongside the rate.",
    },
    {
      q: "Can I apply for two roles?",
      a: "Pick one. You get one brief, and doing one properly beats doing two at half strength.",
    },
    {
      q: "Who owns the work I produce in the trial?",
      a: "You keep it in your portfolio. If we use it commercially, it moves under a normal work agreement and you're paid for it as a delivered project.",
    },
  ],
  hoursOptions,
  extraFields: [
    {
      name: "rightToWork",
      label: "Right to work in the UK",
      options: ["Yes, without sponsorship", "Yes, on a visa with time limits", "Not yet"],
    },
    { name: "location", label: "Where you're based" },
  ],
};
