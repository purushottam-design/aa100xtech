import { test, expect } from "@playwright/test";

const galleries = [
  { path: "/marketing/banner-marketing", label: "Banner Marketing image gallery" },
  { path: "/marketing/newspaper-marketing", label: "Newspaper Marketing image gallery" },
  { path: "/marketing/hoarding-ads", label: "Hoarding Ads image gallery" },
  { path: "/marketing/celebrity-marketing", label: "Celebrity Marketing image gallery" },
  { path: "/social-media-ads-marketing", label: "Social media advertising image gallery" },
];

for (const galleryInfo of galleries) {
  test(`${galleryInfo.path} loops through four images every three seconds`, async ({ page }) => {
    await page.clock.install();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(galleryInfo.path);
    const gallery = page.getByRole("region", { name: galleryInfo.label, exact: true });
    await expect(gallery.locator("img")).toHaveCount(4);
    await expect(gallery.getByRole("button", { name: "Pause image slideshow" })).toBeVisible();
    await gallery.hover();
    await page.clock.pauseAt(new Date());
    const dots = gallery.locator('[aria-label^="Choose"] button');
    await dots.first().click();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    await page.clock.runFor(2999);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    await page.clock.runFor(1);
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
    for (const index of [2, 3, 0]) {
      await page.clock.runFor(3000);
      await expect(dots.nth(index)).toHaveAttribute("aria-current", "true");
    }
    await gallery.getByRole("button", { name: "Pause image slideshow" }).click();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await page.clock.runFor(6000);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    await expect(gallery.getByRole("button", { name: "Play image slideshow" })).toBeVisible();
  });
}

for (const width of [390, 768, 1440]) {
  test(`marketing sliders support manual navigation and fit at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const galleryInfo of galleries.slice(0, 4)) {
      await page.goto(galleryInfo.path);
      const gallery = page.getByRole("region", { name: galleryInfo.label, exact: true });
      await gallery.scrollIntoViewIfNeeded();
      const dots = gallery.locator(".marketing-slide-dots button");
      const images = gallery.locator("img");
      expect(
        new Set(await images.evaluateAll((imgs) => imgs.map((img) => img.getAttribute("src"))))
          .size,
      ).toBe(4);
      for (let index = 0; index < 4; index++) {
        await dots.nth(index).click();
        await expect(dots.nth(index)).toHaveAttribute("aria-current", "true");
        await expect
          .poll(() =>
            images
              .nth(index)
              .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
          )
          .toBe(true);
      }
      await gallery.getByRole("button", { name: "Next image", exact: true }).click();
      await expect(dots.first()).toHaveAttribute("aria-current", "true");
      await gallery.getByRole("button", { name: "Previous image", exact: true }).click();
      await expect(dots.nth(3)).toHaveAttribute("aria-current", "true");
      await gallery
        .getByRole("button", { name: "Previous image", exact: true })
        .press("ArrowRight");
      await expect(dots.first()).toHaveAttribute("aria-current", "true");
      await expect(gallery.getByRole("button", { name: "Pause image slideshow" })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect(errors).toEqual([]);
  });
}
