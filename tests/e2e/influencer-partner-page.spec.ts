import { test, expect } from "@playwright/test";

test("unified partner sections, existing workflows and creator photography fit all screen sizes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/influencer-partners", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("Influencer Partner Program | Creators & Brands | AA100XTECH");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aa100xtech.com/influencer-partners",
  );
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator(".uip-creator-collage img")).toHaveCount(1);
  await expect(page.locator(".uip-program")).toHaveCount(3);
  await expect(page.locator(".uip-services > article")).toHaveCount(6);
  await expect(page.locator(".uip-platform")).toHaveCount(5);
  await expect(page.locator(".uip-industries > article")).toHaveCount(7);
  await expect(page.locator(".uip-steps li")).toHaveCount(5);
  await expect(
    page.getByRole("form", { name: "Brand campaign inquiry", exact: true }),
  ).toBeVisible();
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
          .locator(".uip-creator-collage img")
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
    .locator(".uip-opportunities")
    .getByRole("link", { name: "Apply as Influencer Partner", exact: true })
    .click();
  await expect(page).toHaveURL(/\/influencer-marketing\/for-influencers$/, { timeout: 20_000 });
  await expect(
    page.getByRole("form", { name: "Influencer application", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await page
    .locator(".uip-hero-copy")
    .getByRole("link", { name: "Get Customised Influencer Proposal" })
    .click();
  await expect(page.locator("#uip-brand-form-title")).toBeInViewport();
  await expect(page.locator("#creators, #directory")).toHaveCount(0);
  await expect(page.getByLabel("Filter by category", { exact: true })).toHaveCount(0);
  const final = page.locator(".uip-final");
  await final
    .getByRole("link", { name: "Get Customised Influencer Proposal", exact: true })
    .click();
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
