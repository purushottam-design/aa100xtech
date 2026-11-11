const assert = require("node:assert/strict");
const { test } = require("node:test");
const load = require("./helpers/load-server.cjs");
const { websiteRequestSchema } = load("src/lib/website-requests.ts");
const { creatorIntakeSchema } = load("src/lib/marketing-intake.ts");

const proposal = {
  id: "00000000-0000-4000-8000-000000000001",
  kind: "influencer",
  name: "Synthetic Creator",
  email: "creator@example.test",
  phone: "+919876543210",
  selectedPlan: "influencer-partnership",
  requirements: "A creator portfolio and original music project.",
  startedAt: Date.now() - 5000,
  partnership: {
    package: "content-music",
    services: ["Songs / Music", "Portfolio Website"],
    budget: "To discuss",
    timeline: "Next month",
    privacy: true,
  },
};
test("partnership proposals require valid service identity, package, services and privacy on the server", () => {
  assert.equal(websiteRequestSchema.safeParse(proposal).success, true);
  for (const patch of [
    { partnership: undefined },
    { kind: "proposal" },
    { selectedPlan: "other" },
    { partnership: { ...proposal.partnership, privacy: false } },
    { partnership: { ...proposal.partnership, package: "invented" } },
    { partnership: { ...proposal.partnership, services: ["guaranteed income"] } },
    { partnership: { ...proposal.partnership, timeline: "x".repeat(201) } },
  ])
    assert.equal(websiteRequestSchema.safeParse({ ...proposal, ...patch }).success, false);
  assert.equal(
    websiteRequestSchema.safeParse({
      ...proposal,
      kind: "proposal",
      selectedPlan: "other",
      partnership: undefined,
    }).success,
    true,
  );
});

const creator = {
  token: proposal.id,
  startedAt: proposal.startedAt,
  privacy: true,
  full_name: proposal.name,
  email: proposal.email,
  phone: proposal.phone,
  city: "Patna",
  state: "Bihar",
  country: "India",
  creator_name: "Synthetic Music Studio",
  primary_platform: "YouTube",
  category: "Music",
  profiles: [{ platform: "YouTube", url: "https://youtube.com/@synthetic", followers: 500 }],
  average_views: null,
  engagement: null,
  collaboration: "Open to All",
  partnership_application: true,
  partnership_interests: ["Songs / Music", "Portfolio Website"],
  creator_goals: "Create an original music album.",
  joining_reason: "Explore technical support and music production.",
  project_requirements: "An original album and creator website.",
  whatsapp: "+919876543210",
  additional_message: "Contact me next month.",
};
test("partnership applications validate goals, profile choice and interests without changing legacy requirements", () => {
  assert.equal(creatorIntakeSchema.safeParse(creator).success, true);
  for (const patch of [
    { privacy: false },
    { creator_goals: "" },
    { city: "" },
    { joining_reason: "" },
    { project_requirements: "" },
    { partnership_interests: [] },
    { primary_platform: "Instagram" },
    { whatsapp: "invalid phone" },
  ])
    assert.equal(creatorIntakeSchema.safeParse({ ...creator, ...patch }).success, false);
  assert.equal(
    creatorIntakeSchema.safeParse({
      ...creator,
      partnership_application: undefined,
      city: "",
      creator_goals: "",
      joining_reason: "",
      project_requirements: "",
      partnership_interests: [],
    }).success,
    true,
  );
});
