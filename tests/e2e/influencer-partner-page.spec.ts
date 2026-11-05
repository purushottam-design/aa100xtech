import { test, expect } from "@playwright/test";

test("partner reference sections, existing workflows and four-photo collage fit all screen sizes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/influencers", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("Influencer Partner Program | Join AA100XTECH Creator Network");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aa100xtech.com/influencers",
  );
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator(".ipp-portrait img")).toHaveCount(4);
  await expect(page.locator(".ipp-paths a")).toHaveCount(4);
  await expect(page.locator(".ipp-categories a")).toHaveCount(4);
  await expect(page.locator(".ipp-process li")).toHaveCount(4);
  await expect(page.getByRole("form", { name: "Influencer application", exact: true })).toHaveCount(
    1,
  );
  await expect(page.getByRole("form", { name: "Brand campaign inquiry", exact: true })).toHaveCount(
    1,
  );
  for (const name of ["Starter Partner", "Growth Partner", "Pro Partner", "Elite Partner"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.locator(".ipp-network")).not.toContainText(/10K|1K\+|125K|560K|8\.4%/);
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
          .locator(".ipp-portrait img")
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
    page
      .locator(".ipp-paths")
      .getByRole("link", { name: "Affiliate Partner: Explore Affiliate Program" }),
  ).toHaveAttribute("href", "/affiliates");
  await expect(
    page
      .locator(".ipp-paths")
      .getByRole("link", { name: "Regional Partner: Explore Partnerships" }),
  ).toHaveAttribute("href", "/partners");
  await page
    .locator(".ipp-hero-copy")
    .getByRole("link", { name: "Join as Influencer", exact: true })
    .click();
  await expect(page.locator("#join-title")).toBeInViewport();
  await page
    .locator(".ipp-paths")
    .getByRole("link", { name: "Brand Partner: Launch Campaign" })
    .click();
  await expect(page.locator("#brand-enquiry-title")).toBeInViewport();
  await page
    .locator(".ipp-categories")
    .getByRole("link", { name: /Tech & Gaming/ })
    .click();
  await expect(page.getByLabel("Filter by category", { exact: true })).toHaveValue("technology");
  await expect(page.locator("#directory")).toBeInViewport();
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  await expect(page.getByLabel("Filter by category", { exact: true })).toHaveValue("");
  const final = page.locator(".ipp-final");
  await final.getByRole("link", { name: "Launch Brand Campaign", exact: true }).click();
  await expect(page.locator("#brand-enquiry-title")).toBeInViewport();
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
