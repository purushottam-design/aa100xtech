const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-server.cjs");

const input = {
  token: "00000000-0000-4000-8000-000000000003",
  startedAt: Date.now() - 5000,
  email: "brand@example.invalid",
  phone: "+910000000000",
  privacy: true,
  company: "Synthetic Brand",
  contact_name: "Synthetic Contact",
  objective: "Brand Awareness",
  platforms: ["Instagram"],
  category: "Technology",
  influencer_count: null,
  budget: "Not Decided",
  promotions: ["Instagram Reels"],
};
const { prepareMarketingForm } = load(
  "src/lib/marketing-form.server.ts",
  {
    "@/lib/influencers.server": { getPublishedInfluencer: async () => null },
  },
  { File, FormData },
);
function prepare(data) {
  const form = new FormData();
  form.set("data", JSON.stringify(data));
  return prepareMarketingForm(form, "brand");
}

test("campaign selections reject unknown products and derive prices and total scope on the server", async () => {
  for (const id of [
    "cm365-campaign-starter",
    "cm365-campaign-growth",
    "cm365-campaign-premium",
    "cm365-campaign-enterprise",
  ]) {
    const result = await prepare({
      ...input,
      campaign_package_id: id,
      campaign_offer: { priceLabel: "₹1", features: ["unlimited per creator"] },
    });
    assert.equal(result.details.campaign_package_id, id);
    assert.equal(result.details.campaign_offer.id, id);
    assert.notEqual(result.details.campaign_offer.priceLabel, "₹1");
    assert.match(
      result.details.campaign_offer.qualification,
      /totals for the whole campaign, not per creator/,
    );
    assert.equal(result.details.campaign_offer.scopeVersion, "partners-prd-fr23-v1");
  }
  await assert.rejects(prepare({ ...input, campaign_package_id: "starter" }));
  await assert.rejects(prepare({ ...input, campaign_package_id: ["cm365-campaign-growth"] }));
  const growth = await prepare({ ...input, campaign_package_id: "cm365-campaign-growth" });
  assert.equal(growth.details.campaign_offer.priceLabel, "₹15,999");
  assert.deepEqual(Array.from(growth.details.campaign_offer.features).slice(0, 4), [
    "Up to 10 creators",
    "4–6 total reels",
    "10 total stories",
    "3 total static posts",
  ]);
});

test("existing enquiries keep their original payload without a campaign offer", async () => {
  const result = await prepare(input);
  assert.equal(Object.hasOwn(result.details, "campaign_package_id"), false);
  assert.equal(Object.hasOwn(result.details, "campaign_offer"), false);
  assert.equal(result.details.budget, "Not Decided");
  assert.equal(result.token, input.token);
});
