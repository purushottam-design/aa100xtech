import { test, expect } from "@playwright/test";
import { joinInfluencerBenefits, joinInfluencerFaqs } from "../../src/data/join-influencer";
import { influencerProgramPackages } from "../../src/data/influencer-program-packages";

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`Join Us influencer page follows the reference and fits at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("/join-us/influencer");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Join AA100XTech as an Influencer Partner | Creator Benefits");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aa100xtech.com/join-us/influencer",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://aa100xtech.com/influencers/join-creator-hero.webp",
    );
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Grow, Create, and Earn with Us.");
    await expect(page.locator(".ji-benefit-card")).toHaveCount(11);
    await expect(page.locator(".ji-package-card")).toHaveCount(3);
    const packageColumns = await page
      .locator(".ji-program-grid")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(packageColumns).toBe(width > 1100 ? 3 : width >= 768 ? 2 : 1);
    await expect(page.locator(".ji-process-steps > li")).toHaveCount(5);
    await expect(page.locator(".ji-support-card")).toHaveCount(4);
    await expect(page.locator(".ji-highlights > li")).toHaveCount(4);
    await expect(page.locator(".ji-faq-section button")).toHaveCount(7);
    for (const link of await page
      .getByRole("link", { name: "Join as Influencer", exact: false })
      .all()) {
      await expect(link).toHaveAttribute("href", "/influencer-marketing/for-influencers#apply");
    }
    for (const link of await page
      .getByRole("link", { name: "Get Customised Proposal", exact: false })
      .all()) {
      await expect(link).toHaveAttribute("href", "/proposal");
    }
    const hero = page.locator(".ji-hero-photo");
    await expect
      .poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    await expect(
      page.getByText("Support options are subject to your approved partnership plan", {
        exact: false,
      }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(errors).toEqual([]);
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: info.outputPath(`join-influencer-${width}.png`),
        fullPage: true,
      });
    }
  });
}

test("benefits disclose their features and FAQs explain approved terms", async ({ page }) => {
  await page.goto("/join-us/influencer");
  for (const benefit of joinInfluencerBenefits) {
    const card = page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: benefit.title, exact: true }) });
    await card.locator("summary").click();
    await expect(card.getByText(benefit.detail, { exact: true })).toBeVisible();
    await expect(card.locator("li")).toHaveCount(benefit.features.length);
    await card.locator("summary").press("Enter");
    await expect(card.locator("details")).not.toHaveAttribute("open");
  }
  for (const faq of joinInfluencerFaqs) {
    const button = page.getByRole("button", { name: faq.question, exact: true });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(faq.answer, { exact: true })).toBeVisible();
  }
});

test("desktop Join Us keeps existing destinations, highlights Influencer and opens the shared application", async ({
  page,
}) => {
  await page.goto("/join-us/influencer");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  const trigger = navigation.getByRole("button", { name: "Join Us", exact: true });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: "Jobs", exact: true })).toHaveAttribute(
    "href",
    "/careers",
  );
  await expect(
    menu.getByRole("menuitem", { name: "Request an Account", exact: true }),
  ).toHaveAttribute("href", "/request-access");
  await expect(
    menu.getByRole("menuitem", { name: "Join Us Influencer", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Join as Influencer", exact: false }).first().click();
  await expect(page).toHaveURL(/\/influencer-marketing\/for-influencers#apply$/, {
    timeout: 20_000,
  });
  await expect(page.getByRole("form", { name: "Influencer application", exact: true })).toHaveCount(
    1,
  );
  await expect(
    page.getByRole("button", { name: "Submit Influencer Application", exact: true }),
  ).toBeVisible();
});

test("mobile Join Us links to Influencer without replacing Jobs or account requests", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/join-us/influencer");
  await page.getByRole("button", { name: /Open menu/i }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Join Us", exact: true }).click();
  await expect(dialog.getByRole("link", { name: "Jobs", exact: true })).toHaveAttribute(
    "href",
    "/careers",
  );
  await expect(
    dialog.getByRole("link", { name: "Request an Account", exact: true }),
  ).toHaveAttribute("href", "/request-access");
  await dialog.getByRole("link", { name: "Join Us Influencer", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/join-us\/influencer$/);
});

test("Join Us application submits requested support and creator goals through the existing API", async ({
  page,
}) => {
  await page.goto("/join-us/influencer");
  await page.getByRole("link", { name: "Join as Influencer", exact: false }).first().click();
  const form = page.getByRole("form", { name: "Influencer application", exact: true });
  await form.getByLabel("Full Name", { exact: false }).fill("Synthetic Creator");
  await form.getByLabel("Email Address", { exact: false }).fill("creator@example.invalid");
  await form.getByLabel("WhatsApp Number", { exact: false }).fill("+910000000000");
  await form.getByRole("checkbox", { name: "Instagram", exact: true }).check();
  await form
    .getByLabel("Social Media Profile URL", { exact: false })
    .fill("https://instagram.com/synthetic-test");
  await form.getByLabel("Content Category", { exact: false }).selectOption("Technology");
  await form.getByRole("radio", { name: "Open to All", exact: true }).check();
  await form.getByRole("checkbox", { name: "Portfolio Website", exact: true }).check();
  await form.getByRole("checkbox", { name: "Domain Support", exact: true }).check();
  const newInterests = [
    "Creator Website",
    "Image Production",
    "Video Production",
    "AI Image Prompts",
    "AI Video Prompts",
    "Songs / Music",
    "Music Albums",
    "Music Videos",
    "Digital Distribution",
    "Original IP Development",
    "Audience Growth Support",
  ];
  for (const interest of newInterests)
    await form.getByRole("checkbox", { name: interest, exact: true }).check();
  await form.getByText("Additional creator details (optional)").click();
  await form.getByLabel("Creator / Influencer Name", { exact: false }).fill("Synthetic Studio");
  await form.getByLabel("Primary Platform", { exact: false }).selectOption("Instagram");
  await form
    .getByRole("textbox", { name: "Portfolio Website", exact: false })
    .fill("https://example.test/creator");
  await form
    .getByLabel("Why Do You Want to Join AA100XTech?", { exact: false })
    .fill("I want help building my professional creator presence.");
  await form.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
  let application: Record<string, unknown> | undefined;
  await page.route("**/api/marketing/creator", async (route) => {
    const data = await new Response(route.request().postDataBuffer(), {
      headers: { "content-type": route.request().headers()["content-type"]! },
    }).formData();
    application = JSON.parse(String(data.get("data")));
    await route.fulfill({
      status: 201,
      json: { ok: true, reference: "verified-creator-support-reference" },
    });
  });
  await form.getByRole("button", { name: "Submit Influencer Application", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Application submitted", exact: true }),
  ).toBeVisible();
  expect(application).toMatchObject({
    creator_name: "Synthetic Studio",
    primary_platform: "Instagram",
    portfolio_url: "https://example.test/creator",
    joining_reason: "I want help building my professional creator presence.",
    partnership_interests: ["Portfolio Website", "Domain Support", ...newInterests],
    publication_consent: false,
  });
});

test("program package details add production services while reusing the eleven existing benefits", async ({
  page,
}) => {
  await page.goto("/join-us/influencer");
  for (const program of influencerProgramPackages) {
    const card = page
      .locator(".ji-package-card")
      .filter({ has: page.getByRole("heading", { name: program.name, exact: true }) });
    await expect(card.getByText(program.tagline, { exact: true })).toBeVisible();
    await expect(card.getByText(program.description, { exact: true })).toBeVisible();
    await card.locator("summary").click();
    for (const detail of program.details) {
      await expect(card.getByRole("heading", { name: detail.title, exact: true })).toBeVisible();
      for (const feature of detail.features)
        await expect(card.getByText(feature, { exact: true })).toBeVisible();
    }
    await card.locator("summary").press("Enter");
    await expect(card.locator("details")).not.toHaveAttribute("open");
    for (const service of program.services.filter((service) => service.benefit)) {
      const link = card.locator(`a[href="#ji-benefit-${service.benefit}"]`);
      await link.click();
      await expect(page.locator(`#ji-benefit-${service.benefit}`)).toBeInViewport();
    }
  }
  await expect(page.locator(".ji-benefit-card")).toHaveCount(11);
  await expect(page.locator(".ji-hero h1")).toHaveText(
    "Join AA100XTech as an Influencer Partner.Grow, Create, and Earn with Us.",
  );
  const pricing = page.locator(".ji-program-pricing");
  await expect(
    pricing.getByRole("heading", { name: "Custom Packages Built Around Your Creative Goals." }),
  ).toBeVisible();
  await expect(pricing).toContainText("may be billed separately");
  await expect(pricing).toContainText("copyright ownership is not automatically transferred");
  await expect(pricing).toContainText(
    "Platform acceptance, audience growth, earnings, and brand deals are not guaranteed",
  );
  await expect(pricing).not.toContainText(/₹|\$\d/);
  await pricing.getByRole("link", { name: "Get Customised Proposal", exact: false }).click();
  await expect(page).toHaveURL(/\/proposal$/, { timeout: 20_000 });
});
