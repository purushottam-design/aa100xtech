import { test, expect } from "@playwright/test";

const destinations = [
  ["About Us", "/about"],
  ["Consultation", "/consultation"],
  ["Contact Us", "/contact"],
] as const;

for (const width of [375, 768, 1024, 1440]) {
  test(`complete navigation and service detail at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/services/website-development");
    await expect(page.locator("h1")).toHaveText("Website Development");
    for (const heading of [
      "Key benefits",
      "Technologies & tools",
      "How the engagement works",
      "Frequently asked questions",
      "Explore detailed deliverables",
    ]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }
    const question = page.locator("summary").first();
    await question.click();
    await expect(question.locator("..")).toHaveAttribute("open", "");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://aa100xtech.com/services/website-development",
    );
    await expect(page.locator('footer a[href="/services/ai-solutions"]')).toBeVisible();
    await expect(
      page.locator("footer").getByRole("heading", { name: "Programs", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width < 1280) {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "More", exact: true }).click();
      for (const [label, href] of destinations) {
        await expect(
          page.getByRole("dialog").getByRole("link", { name: label, exact: true }),
        ).toHaveAttribute("href", href);
      }
    } else {
      await page.locator("header").getByRole("button", { name: "More", exact: true }).click();
      for (const [label, href] of destinations) {
        await expect(page.getByRole("menuitem", { name: label, exact: true })).toHaveAttribute(
          "href",
          href,
        );
      }
    }
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    if (width < 1280) {
      const sheet = page.getByRole("dialog");
      expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
      const bounds = await sheet.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    }
    await page.screenshot({ path: testInfo.outputPath(`complete-${width}.png`) });
    await page.keyboard.press("Escape");
    if (width >= 1280)
      await expect(
        page.locator("header").getByRole("button", { name: "More", exact: true }),
      ).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test("sitemap includes the existing explore detail pages and no duplicate URLs", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const urls = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1],
  );
  expect(new Set(urls).size).toBe(urls.length);
  expect(urls).toContain("https://aa100xtech.com/services/explore/business-website");
  expect(urls).toContain("https://aa100xtech.com/services/explore/automated-hiring-engine");
});
