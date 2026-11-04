import { test, expect } from "@playwright/test";

test("consultation bar is immediately visible and stays fixed across pages and screen sizes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/contact", "/consultation", "/privacy-policy", "/app/login"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const bar = page.getByRole("complementary", { name: "Expert consultation", exact: true });
      await expect(bar).toBeVisible();
      await expect(bar).toContainText("Ready to Talk to an Expert?");
      await expect(
        bar.getByRole("link", { name: "Book Consultation", exact: true }),
      ).toHaveAttribute("href", "/consultation");
      await expect(bar).toHaveCSS("position", "fixed");
      const before = await bar.boundingBox();
      expect(before!.x).toBeGreaterThanOrEqual(0);
      expect(before!.x + before!.width).toBeLessThanOrEqual(width);
      expect(before!.y + before!.height).toBeLessThanOrEqual(900);
      expect(await bar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      expect((await bar.boundingBox())!.y).toBe(before!.y);
      if (route === "/contact" && [375, 1440].includes(width))
        await page.screenshot({ path: testInfo.outputPath(`consultation-bar-${width}.png`) });
    }
  }
  await page.goto("/contact");
  await page
    .getByRole("complementary", { name: "Expert consultation", exact: true })
    .getByRole("link", { name: "Book Consultation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/consultation$/);
  await page.getByRole("button", { name: "Book Now", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});

test("consultation bar is present before JavaScript hydration", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 900 },
  });
  const page = await context.newPage();
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  const bar = page.getByRole("complementary", { name: "Expert consultation", exact: true });
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("link", { name: "Book Consultation", exact: true })).toHaveAttribute(
    "href",
    "/consultation",
  );
  await context.close();
});
