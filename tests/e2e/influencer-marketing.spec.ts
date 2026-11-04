import { test, expect } from "@playwright/test";

test("premium influencer marketing page, real directory controls and category navigation fit every screen", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/influencer-marketing", { waitUntil: "domcontentloaded" });
  await expect(page.locator("h1")).toHaveText("Turn Influence Into Impact.");
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Become an Influencer", exact: true }),
  ).toHaveAttribute("href", "/influencers#join");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aa100xtech.com/influencer-marketing",
  );
  await expect(page).toHaveTitle("Influencer Marketing Services in India | AA100XTech");
  await expect(page.getByText("Starting at ₹500", { exact: true })).toHaveCount(3);
  await expect(page.locator("#creator-categories button")).toHaveCount(8);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${width}px`,
    ).toBe(true);
    const hero = page.locator(".im-hero");
    await expect(hero.locator("figure img")).toHaveCount(3);
    await expect
      .poll(() =>
        hero
          .locator("figure img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    if ([375, 1440].includes(width))
      await page.screenshot({ path: testInfo.outputPath(`influencer-marketing-${width}.png`) });
  }
  await page
    .locator("#creator-categories")
    .getByRole("button", { name: /Fashion & Lifestyle/ })
    .click();
  await expect(page.getByLabel("Filter by category", { exact: true })).toHaveValue("fashion");
  const directory = page.locator("#creators");
  await expect(directory).toBeInViewport();
  await page
    .getByLabel("Search creators by name, niche or location")
    .fill("no-such-creator-qa-example");
  await page.getByLabel("Filter by platform", { exact: true }).selectOption("snapchat");
  await page.getByLabel("Filter by followers", { exact: true }).selectOption("50k-100k");
  await page.getByLabel("Filter by location", { exact: true }).fill("No such place");
  await expect(directory.locator("article")).toHaveCount(0);
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  for (const label of [
    "Filter by category",
    "Filter by platform",
    "Filter by followers",
    "Filter by location",
  ])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Search creators by name, niche or location")).toHaveValue("");
  await page
    .locator(".im-package")
    .filter({ has: page.getByRole("heading", { name: "Growth Campaign", exact: true }) })
    .getByRole("button", { name: "Get Customised Proposal", exact: true })
    .click();
  await expect(page.getByLabel("Campaign package", { exact: true })).toHaveValue("Growth Campaign");
  const question = page.getByRole("button", { name: "What is influencer marketing?", exact: true });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((animation) => animation.playState === "running").length,
      ),
    )
    .toBe(0);
  await expect(
    page.getByRole("complementary", { name: "Expert consultation", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("brand campaign form preserves a failed brief and saves all structured fields only after server confirmation", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const attempts: Record<string, unknown>[] = [];
  let success = false;
  await page.route("**/api/website/requests", async (route) => {
    const form = await new Response(route.request().postDataBuffer(), {
      headers: { "content-type": route.request().headers()["content-type"]! },
    }).formData();
    attempts.push(JSON.parse(String(form.get("data"))));
    await route.fulfill({
      status: success ? 200 : 503,
      json: success
        ? { saved: true, notification: "not_configured" }
        : { saved: false, message: "Your request could not be saved. Please try again." },
    });
  });
  await page.goto("/influencer-marketing");
  const form = page.getByRole("form", { name: "Brand campaign enquiry", exact: true });
  await form.getByLabel("Full name *", { exact: true }).fill("Test Brand Manager");
  await form.getByLabel("Business name *", { exact: true }).fill("Test Brand");
  await form.getByLabel("Email *", { exact: true }).fill("brand@example.test");
  await form.getByLabel("Phone / WhatsApp *", { exact: true }).fill("+910000000000");
  await form
    .getByLabel("Campaign type *", { exact: true })
    .selectOption("Viral Influencer Marketing");
  await form.getByLabel("Influencer category *", { exact: true }).selectOption("Food & Travel");
  await form.getByLabel("Target platform *", { exact: true }).selectOption("YouTube");
  await form.getByLabel("Target location *", { exact: true }).fill("Patna, India");
  await form.getByLabel("Estimated budget *", { exact: true }).fill("Discuss an approved budget");
  await form.getByLabel("Preferred timeline *", { exact: true }).fill("Next month");
  await form.getByLabel("Campaign package", { exact: true }).selectOption("Growth Campaign");
  await form
    .getByLabel("Campaign description *", { exact: true })
    .fill("A scoped product launch with relevant food creators.");
  const send = form.getByRole("button", { name: "Get Customised Proposal", exact: true });
  await send.click();
  await expect(form.getByRole("alert")).toContainText("could not be saved");
  await expect(form.getByLabel("Full name *", { exact: true })).toHaveValue("Test Brand Manager");
  success = true;
  await send.click();
  await expect(form.getByRole("status")).toContainText("Your campaign enquiry has been saved.");
  expect(attempts).toHaveLength(2);
  expect(attempts[0]!.id).toBe(attempts[1]!.id);
  expect(attempts[1]).toMatchObject({
    kind: "influencer",
    selectedPlan: "viral-influencer-marketing",
    campaign: {
      type: "Viral Influencer Marketing",
      category: "Food & Travel",
      platform: "YouTube",
      location: "Patna, India",
      budget: "Discuss an approved budget",
      timeline: "Next month",
      package: "Growth Campaign",
    },
  });
  await expect(form.getByLabel("Full name *", { exact: true })).toHaveValue("");
});

test("campaign API rejects malformed structured details and cross-site requests before saving", async ({
  request,
  baseURL,
}) => {
  const input = {
    id: "00000000-0000-4000-8000-000000000001",
    kind: "influencer",
    name: "Test Brand",
    email: "brand@example.test",
    phone: "+910000000000",
    company: "Test Company",
    selectedPlan: "influencer-marketing",
    requirements: "A scoped campaign request",
    startedAt: Date.now() - 5000,
    campaign: {
      type: "Invalid campaign type",
      category: "Fashion & Lifestyle",
      platform: "Instagram",
      location: "Patna",
      budget: "Discuss budget",
      timeline: "Next month",
      package: "",
    },
  };
  const response = await request.post("/api/website/requests", {
    headers: { origin: new URL(baseURL!).origin, "x-aa-rpc": "1" },
    multipart: { data: JSON.stringify(input) },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).saved).toBe(false);
  const csrf = await request.post("/api/website/requests", {
    headers: { origin: "https://example.test", "x-aa-rpc": "1" },
    multipart: { data: JSON.stringify(input) },
  });
  expect(csrf.status()).toBe(403);
});
