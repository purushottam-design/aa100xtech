import { test, expect } from "@playwright/test";

test("unified partner sections, existing workflows and creator photography fit all screen sizes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/influencers", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("Influencer Partner Program | Creators & Brands | AA100XTECH");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aa100xtech.com/influencer-partners",
  );
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator(".uip-portrait img")).toHaveCount(2);
  await expect(page.locator(".uip-program")).toHaveCount(3);
  await expect(page.locator(".uip-tabs a")).toHaveCount(3);
  await expect(page.locator(".uip-steps li")).toHaveCount(4);
  await expect(page.getByRole("form", { name: "Influencer application", exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole("form", { name: "Brand campaign inquiry", exact: true })).toHaveCount(
    1,
  );
  await page.locator("#partner-details > summary").click();
  for (const name of ["Starter Partner", "Growth Partner", "Pro Partner", "Elite Partner"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.locator(".uip-brand-strip")).not.toContainText(/10K|1K\+|125K|560K|8\.4%/);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), {
        message: `${width}px overflow`,
      })
      .toBe(true);
    await expect
      .poll(() =>
        page
          .locator(".uip-portrait img")
          .evaluateAll((images) =>
            images.every(
              (img) =>
                (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    if ([390, 1440].includes(width))
      await page.screenshot({ path: testInfo.outputPath(`partner-${width}.png`) });
  }
  await expect(
    page.locator(".uip-more-paths").getByRole("link", { name: "Explore Affiliate Program" }),
  ).toHaveAttribute("href", "/affiliates");
  await expect(
    page.locator(".uip-more-paths").getByRole("link", { name: "Explore Regional Partnerships" }),
  ).toHaveAttribute("href", "/partners");
  await page
    .locator(".uip-hero-copy")
    .getByRole("link", { name: "Join as Influencer", exact: true })
    .click();
  await expect(page).toHaveURL(/\/influencer-marketing\/for-influencers$/);
  await expect(
    page.getByRole("form", { name: "Influencer application", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page.locator(".uip-hero-copy").getByRole("link", { name: "Partner as a Brand" }).click();
  await expect(page.locator("#uip-brand-form-title")).toBeInViewport();
  await page.getByLabel("Filter by category", { exact: true }).selectOption("technology");
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.getByLabel("Filter by category", { exact: true })).toHaveValue("");
  const final = page.locator(".uip-final");
  await final.getByRole("link", { name: "Partner as a Brand", exact: true }).click();
  await expect(page.locator("#uip-brand-form-title")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.getAnimations().filter((animation) => animation.playState === "running").length,
      ),
    )
    .toBe(0);
  expect(errors).toEqual([]);
});
