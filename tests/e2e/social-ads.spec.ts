import { test, expect } from "@playwright/test";

for (const width of [390, 768, 1440]) {
  test(`paid social page renders complete content and navigation at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto("/social-media-ads-marketing");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Social Media Ads Marketing Services | AA100XTech");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aa100xtech.com/social-media-ads-marketing",
    );
    await expect(page.locator(".ads-service-card")).toHaveCount(6);
    await expect(page.locator(".ads-platform-card")).toHaveCount(6);
    await expect(page.locator(".ads-timeline > li")).toHaveCount(5);
    await expect(page.locator(".ads-metrics-grid article")).toHaveCount(8);
    await expect(page.locator(".marketing-faq button")).toHaveCount(10);
    const feeQuestion = page.getByRole("button", {
      name: "Is advertising spend included in your management fee?",
    });
    await feeQuestion.click();
    await expect(feeQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByText("Advertising platform spend is separate from our agency management fee", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(page.locator('.ads-hero a[href="/consultation"]')).toHaveText(
      "Book a Social Media Consultation",
    );
    await page.locator('.ads-hero a[href="#ad-proposal"]').click();
    await expect(page).toHaveURL(/#ad-proposal$/);
    await expect(
      page.getByRole("form", { name: "Social media advertising proposal" }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const image = page.locator(".ads-hero-slider img").first();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`social-ads-${width}.png`), fullPage: true });
  });
}

test("old paid social link redirects to the canonical page", async ({ page }) => {
  await page.goto("/marketing/social-media-ads");
  await expect(page).toHaveURL(/\/social-media-ads-marketing$/);
});

test("hero gallery has four images and supports arrows, dots and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/social-media-ads-marketing");
  const gallery = page.getByRole("region", { name: "Social media advertising image gallery" });
  await expect(gallery.locator("img")).toHaveCount(4);
  await expect(gallery.locator(".ads-slide-count")).toHaveText("01 / 04");
  await gallery.getByRole("button", { name: "Next advertising image" }).click();
  await expect(gallery.locator(".ads-slide-count")).toHaveText("02 / 04");
  await gallery
    .getByRole("button", { name: "Show advertising image 4: Relevant audiences" })
    .click();
  await expect(gallery.locator(".ads-slide-count")).toHaveText("04 / 04");
  await gallery.getByRole("button", { name: "Next advertising image" }).click();
  await expect(gallery.locator(".ads-slide-count")).toHaveText("01 / 04");
  await gallery.getByRole("button", { name: "Previous advertising image" }).click();
  await expect(gallery.locator(".ads-slide-count")).toHaveText("04 / 04");
  await expect(gallery.getByRole("button", { name: "Pause image slideshow" })).toHaveCount(0);
  for (const dot of await gallery.locator(".ads-slide-dots button").all()) {
    await dot.click();
    const index = await dot.getAttribute("aria-label");
    await expect(dot).toHaveAttribute("aria-current", "true");
    expect(index).toContain("advertising image");
  }
});

test("proposal submission validates selection, preserves errors and waits for confirmed storage", async ({
  page,
}) => {
  let requests = 0;
  let confirm: (() => void) | undefined;
  await page.route("**/api/website/social-ads", async (route) => {
    requests++;
    if (requests === 1)
      return route.fulfill({
        status: 503,
        json: { saved: false, message: "Storage is unavailable. Please try again." },
      });
    await new Promise<void>((resolve) => {
      confirm = resolve;
    });
    await route.fulfill({ json: { saved: true, notification: "not_configured" } });
  });
  await page.goto("/social-media-ads-marketing#ad-proposal");
  await page.getByLabel("Full name", { exact: false }).fill("Test Business Owner");
  await page.getByLabel("Business / company name", { exact: false }).fill("Example Business");
  await page.getByLabel("Business email address", { exact: false }).fill("owner@example.test");
  await page.getByLabel("Phone / WhatsApp number", { exact: false }).fill("+91 9876543210");
  await page.getByLabel("Monthly advertising budget", { exact: false }).selectOption({ index: 1 });
  await page
    .getByLabel("Primary advertising objective", { exact: false })
    .selectOption("Lead Generation");
  await page.getByLabel("Target city", { exact: false }).fill("Patna, India");
  await page.getByLabel("Expected campaign start date", { exact: false }).fill("2026-12-01");
  await page
    .getByLabel("Project requirements", { exact: false })
    .fill("We need a social advertising strategy for our business.");
  const submit = page.getByRole("button", { name: "Request My Customised Ad Proposal" });
  await submit.click();
  expect(requests).toBe(0);
  await page.getByRole("checkbox", { name: /I agree to/ }).check();
  await submit.click();
  await expect(page.locator(".ads-form-error")).toContainText("Select at least one service");
  expect(requests).toBe(0);
  await page.getByRole("checkbox", { name: "Advertising Strategy", exact: true }).check();
  await page.getByRole("checkbox", { name: "Facebook Ads", exact: true }).check();
  await submit.click();
  await expect(page.locator(".ads-form-error")).toContainText("Storage is unavailable");
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue("Test Business Owner");
  await submit.click();
  await expect(page.getByRole("button", { name: "Saving your enquiry" })).toBeDisabled();
  await expect(
    page.getByText("Thank you for sharing your advertising requirements.", { exact: true }),
  ).toHaveCount(0);
  await expect.poll(() => Boolean(confirm)).toBe(true);
  confirm!();
  await expect(
    page.getByText("Thank you for sharing your advertising requirements.", { exact: true }),
  ).toBeVisible();
  expect(requests).toBe(2);
});
