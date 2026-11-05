import { test, expect } from "@playwright/test";
test("compact creator form preserves platform details and only confirms a saved application", async ({
  page,
}, info) => {
  await page.goto("/influencer-marketing/for-influencers");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Become an Influencer Partner");
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.getByRole("button", { name: "Submit Influencer Application" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("highlighted");
  for (const [label, value] of [
    ["Full Name", "Synthetic Creator"],
    ["Email Address", "fixture@example.test"],
    ["WhatsApp Number", "+919876543210"],
    ["City", "Patna"],
    ["State", "Bihar"],
    ["Country", "India"],
  ])
    await page.getByLabel(label, { exact: false }).fill(value);
  await page.getByRole("checkbox", { name: "Instagram", exact: true }).check();
  await page.getByRole("checkbox", { name: "Snapchat", exact: true }).check();
  await page.getByLabel("Instagram Profile URL").fill("https://instagram.com/fixture");
  await page.getByLabel("Snapchat Profile URL").fill("https://snapchat.com/add/fixture");
  await page.getByLabel("Content Category").selectOption("Technology");
  await page.getByRole("radio", { name: "Open to All", exact: true }).check();
  await page
    .getByLabel("Tell Us About Yourself")
    .fill("A synthetic biography used only in this browser test.");
  await expect(page.getByRole("checkbox", { name: /I consent to displaying/ })).not.toBeChecked();
  await page.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
  let requests = 0;
  await page.route("**/api/marketing/creator", async (route) => {
    requests++;
    if (requests === 1)
      return route.fulfill({ status: 503, json: { error: "Test database unavailable" } });
    await new Promise((resolve) => setTimeout(resolve, 300));
    return route.fulfill({ status: 201, json: { ok: true, reference: "test-reference-creator" } });
  });
  await page.getByRole("button", { name: "Submit Influencer Application" }).click();
  await expect(page.locator("form [role=alert]")).toContainText("Test database unavailable");
  await expect(page.getByLabel("Instagram Profile URL")).toHaveValue(
    "https://instagram.com/fixture",
  );
  await page.screenshot({ path: info.outputPath("creator-form.png"), fullPage: true });
  await page.getByRole("button", { name: "Submit Influencer Application" }).click();
  await expect(page.getByRole("button", { name: /^Submitting/ })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Application submitted" })).toBeVisible();
  expect(requests).toBe(2);
});
test("compact brand form supports platform choices, validation and real submission handling", async ({
  page,
}, info) => {
  await page.goto("/influencer-marketing/for-brands");
  await expect(page.getByRole("radio", { name: "Instagram", exact: true })).toBeChecked();
  for (const [label, value] of [
    ["Company / Brand Name", "Synthetic Brand"],
    ["Contact Person", "Synthetic Contact"],
    ["Business Email", "fixture@example.test"],
    ["WhatsApp / Phone Number", "+919876543210"],
    ["Business Category / Industry", "Technology"],
    ["City / Country", "Patna, India"],
  ])
    await page.getByLabel(label).fill(value);
  await page.getByRole("radio", { name: "Multiple Platforms", exact: true }).check();
  await page.getByRole("checkbox", { name: "Instagram", exact: true }).check();
  await page.getByRole("checkbox", { name: "YouTube", exact: true }).check();
  await page.getByLabel("Preferred Influencer Category").selectOption("Technology");
  await page.getByRole("checkbox", { name: "YouTube Shorts", exact: true }).check();
  await page.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
  await page.route("**/api/marketing/brand", (route) =>
    route.fulfill({ status: 201, json: { ok: true, reference: "test-reference-brand" } }),
  );
  await page.screenshot({ path: info.outputPath("brand-form.png"), fullPage: true });
  await page.getByRole("button", { name: "Submit Campaign Inquiry" }).click();
  await expect(page.getByRole("heading", { name: "Campaign inquiry received" })).toBeVisible();
});
test("both reference-style forms fit mobile, tablet and desktop", async ({ page }, info) => {
  for (const kind of ["for-brands", "for-influencers"]) {
    await page.goto("/influencer-marketing/" + kind);
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.locator(".intake-reference-card")).toBeVisible();
      await expect(page.locator('.intake-reference-card input[type="text"]').first()).toHaveCSS(
        "border-top-left-radius",
        "999px",
      );
      await expect(page.locator(".intake-reference-card textarea").first()).toHaveCSS(
        "border-top-left-radius",
        "7px",
      );
      if (width === 375 || width === 1440)
        await page.screenshot({
          path: info.outputPath(kind + "-" + width + ".png"),
          fullPage: true,
        });
    }
  }
});
