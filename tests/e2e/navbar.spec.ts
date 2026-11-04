import { test, expect } from "@playwright/test";
import { headerNavigation, headerHref } from "../../src/data/header-navigation";

const labels = [
  "Home",
  "Services",
  "Our Top Clients",
  "Be The One",
  "Founder",
  "Join Us",
  "Marketing",
  "More",
];
async function settle(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

for (const width of [1280, 1440, 1920]) {
  test(`desktop navbar order, spacing and dropdowns at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/contact");
    const header = page.locator("header");
    const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
    await expect(nav.getByRole("button", { name: "Services", exact: true })).toBeEnabled();
    expect((await nav.locator("a,button").allTextContents()).map((label) => label.trim())).toEqual(
      labels,
    );
    await expect(
      header.getByRole("link", { name: "Sign in / Sign up", exact: true }),
    ).toBeVisible();
    await expect(
      header.getByRole("button", { name: "Display currency: INR", exact: true }),
    ).toContainText("Currency");
    expect((await header.boundingBox())!.height).toBe(81);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const bounds = await header
      .locator(
        'a[aria-label="AA100XTech home"], nav, button[aria-label^="Display currency"], a[href="/auth"]',
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          const r = element.getBoundingClientRect();
          return { x: r.x, right: r.right, y: r.y, bottom: r.bottom };
        }),
      );
    for (let index = 1; index < bounds.length; index++)
      expect(bounds[index]!.x).toBeGreaterThanOrEqual(bounds[index - 1]!.right);
    for (const name of ["Join Us", "Marketing", "More"]) {
      const trigger = nav.getByRole("button", { name, exact: true });
      await trigger.click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      const group = headerNavigation.find((item) => item.label === name)!;
      if (group.kind !== "dropdown") throw new Error("Expected dropdown");
      for (const link of group.items)
        await expect(menu.getByRole("menuitem", { name: link.label, exact: true })).toHaveAttribute(
          "href",
          headerHref(link),
        );
      await settle(page);
      if (name === "More")
        await page.screenshot({ path: testInfo.outputPath(`navbar-more-${width}.png`) });
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    await expect(nav.getByRole("button", { name: "More", exact: true })).toHaveAttribute(
      "data-active",
      "true",
    );
    await nav.getByRole("button", { name: "More", exact: true }).press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "About Us", exact: true })).toBeFocused();
    await settle(page);
    await page.mouse.click(5, 200);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await page.evaluate(() => window.scrollTo(0, 500));
    expect((await header.boundingBox())!.y).toBe(0);
    expect(errors).toEqual([]);
  });
}

for (const width of [375, 768, 1024, 1279]) {
  test(`responsive expandable menus at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/contact");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Menu", exact: true });
    for (const name of ["Services", "Join Us", "Marketing", "More"]) {
      const trigger = sheet.getByRole("button", { name, exact: true });
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      if (name === "More")
        await expect(sheet.getByRole("link", { name: "Contact Us", exact: true })).toHaveAttribute(
          "aria-current",
          "page",
        );
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
    await sheet.getByRole("button", { name: "More", exact: true }).click();
    await settle(page);
    expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`navbar-mobile-${width}.png`) });
    await sheet.getByRole("link", { name: "Contact Us", exact: true }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect(sheet).toHaveCount(0);
  });
}

test("currency selection, authentication and primary links preserve their behavior", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Display currency: INR", exact: true }).click();
  await page.getByPlaceholder("Search country or currency").fill("USD");
  await page.getByRole("option").first().click();
  await expect(
    page.getByRole("button", { name: "Display currency: USD", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Display currency: USD", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Display currency: USD", exact: true }).click();
  await page.getByPlaceholder("Search country or currency").fill("INR");
  await page.getByRole("option").first().click();
  await page
    .locator("header")
    .getByRole("link", { name: "Sign in / Sign up", exact: true })
    .click();
  await expect(page).toHaveURL(/\/auth$/);
  for (const item of headerNavigation) {
    const links = item.kind === "link" ? [item] : item.kind === "dropdown" ? item.items : [];
    for (const link of links) {
      if (headerHref(link).startsWith("https://")) continue;
      expect((await request.get(headerHref(link))).status(), headerHref(link)).toBe(200);
    }
  }
});
