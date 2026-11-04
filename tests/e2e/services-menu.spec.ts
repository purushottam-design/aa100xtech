import { test, expect } from "@playwright/test";
import { serviceNavigation } from "../../src/data/service-navigation";
import { services } from "../../src/data/services";

for (const width of [1280, 1440, 1920]) {
  test(`desktop mega menu hover, keyboard, links and layout at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Services", exact: true });
    await trigger.hover();
    const panel = page.locator("[data-service-panel]");
    await expect(panel).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Display currency: INR", exact: true }),
    ).toBeVisible();
    await expect(panel.locator("a")).toHaveCount(services.length + 4);
    const expected = serviceNavigation.flatMap((group) => group.items.map((item) => item.href));
    expect(
      await panel
        .locator("a")
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")).filter((href) => href !== "/services"),
        ),
    ).toEqual(expected);
    const link = panel.getByRole("link", { name: "Website Development", exact: true });
    await link.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    await page.screenshot({ path: testInfo.outputPath(`services-${width}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const bounds = await panel.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(panel.getByRole("link", { name: "View all services", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(link).toBeFocused();
    await page.keyboard.press("End");
    await expect(panel.locator("a").last()).toBeFocused();
    await page.keyboard.press("Escape");
    await trigger.press("Enter");
    await expect(panel).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(panel).toHaveCount(0);
    await trigger.hover();
    await link.click();
    await expect(page).toHaveURL(/\/services\/website-development$/);
    await expect(panel).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText("Website Development");
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(page.locator("header")).toHaveClass(/shadow-md/);
    expect((await page.locator("header").boundingBox())!.y).toBe(0);
  });
}

for (const width of [375, 768, 1024]) {
  test(`mobile grouped accordion navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/portfolio", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Services", exact: true }).click();
    const category = sheet.getByRole("button", { name: "Website & App Development", exact: true });
    await category.click();
    const link = sheet.getByRole("link", { name: "Android Apps", exact: true });
    await expect(link).toBeVisible();
    await expect(link).toBeInViewport();
    await expect(sheet.getByRole("link", { name: "Voice Cloning", exact: true })).toHaveCount(0);
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
    await page.screenshot({ path: testInfo.outputPath(`mobile-services-${width}.png`) });
    expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    await link.click();
    await expect(page).toHaveURL(/\/services\/android-apps$/);
    await expect(sheet).toHaveCount(0);
    await expect(page.locator("h1")).toHaveText("Android Apps");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });
}

test("shared header works across public routes and every catalog destination resolves", async ({
  page,
  request,
}) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "/",
    "/about",
    "/services",
    "/services/website-development",
    "/portfolio",
    "/business-plans",
    "/influencer-marketing",
    "/influencer-programs",
    "/consultation",
    "/contact",
    "/careers",
    "/privacy-policy",
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("header")).toHaveCount(1);
    const trigger = page.getByRole("button", { name: "Services", exact: true });
    await expect(trigger).toBeEnabled();
    await trigger.focus();
    await trigger.press("ArrowDown");
    await expect(page.locator("[data-service-panel]")).toBeVisible();
    await page.keyboard.press("Escape");
  }
  for (const service of services)
    expect((await request.get(`/services/${service.slug}`)).status(), service.slug).toBe(200);
  for (const route of ["/influencer-marketing", "/influencer-programs"])
    expect((await request.get(route)).status()).toBe(200);
  await page.goto("/influencer-marketing#viral-influencer-marketing");
  await expect(page.locator("#viral-influencer-marketing")).toBeVisible();
  expect(errors).toEqual([]);
});

test("reduced motion and short desktop viewport keep the mega menu accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/services", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Services", exact: true }).hover();
  const panel = page.locator(".service-mega-panel");
  const bounds = await panel.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(600);
  expect(await panel.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
  await page.getByRole("link", { name: "Cybersecurity", exact: true }).first().click();
  await expect(page).toHaveURL(/\/services\/cybersecurity$/);
});
