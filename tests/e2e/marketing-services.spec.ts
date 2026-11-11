import { test, expect } from "@playwright/test";
import { marketingServices, marketingServiceHref } from "../../src/data/marketing-services";
import { marketingLinks } from "../../src/data/site";

for (const width of [390, 768, 1440]) {
  test(`complete marketing pages, metadata, images and FAQs at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const service of marketingServices) {
      // Paid social has a dedicated page and its own complete browser coverage.
      if (service.slug === "social-media-ads") continue;
      const response = await page.goto(marketingServiceHref(service));
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(service.title);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toContainText(service.heading);
      for (const title of [
        service.aboutHeading,
        "Our Marketing Services",
        "Why Choose Us",
        "How It Works",
        "Who Can Benefit",
        "Good questions.",
        service.ctaHeading,
      ]) {
        await expect(
          page.getByRole("heading", { name: title, exact: title !== "Good questions." }),
        ).toBeVisible();
      }
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://aa100xtech.com${marketingServiceHref(service)}`,
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        service.description,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        service.title,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        `https://aa100xtech.com${service.image}`,
      );
      const image = page.getByAltText(service.imageAlt, { exact: true });
      await expect(image).toBeVisible();
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
        .toBe(true);
      await expect(page.locator(".marketing-offering")).toHaveCount(6);
      await expect(page.locator(".marketing-process > li")).toHaveCount(5);
      await expect(page.locator(".marketing-audiences > article")).toHaveCount(5);
      await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toContainText(
        service.label,
      );
      const question = page.getByRole("button", { name: service.faqs[0]!.question, exact: true });
      await question.click();
      await expect(question).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByText(service.faqs[0]!.answer, { exact: true })).toBeVisible();
      await question.press("Enter");
      await expect(question).toHaveAttribute("aria-expanded", "false");
      for (const link of await page
        .getByRole("link", { name: "Get a Free Consultation", exact: false })
        .all())
        await expect(link).toHaveAttribute("href", "/contact");
      for (const link of await page
        .getByRole("link", { name: "Get Customised Proposal", exact: false })
        .all())
        await expect(link).toHaveAttribute("href", "/proposal");
      await expect(
        page
          .getByRole("navigation", { name: "Related marketing services", exact: true })
          .getByRole("link"),
      ).toHaveCount(5);
      const graph = await page
        .locator('.marketing-page script[type="application/ld+json"]')
        .textContent();
      const schema = JSON.parse(graph!)["@graph"];
      expect(schema.map((entry: { "@type": string }) => entry["@type"])).toEqual([
        "Service",
        "BreadcrumbList",
        "FAQPage",
      ]);
      expect(schema[2].mainEntity).toHaveLength(6);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect(errors).toEqual([]);
  });
}

test("desktop Marketing supports hover, keyboard navigation, active states and all six destinations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/marketing/social-media-ads");
  const trigger = page
    .getByRole("navigation", { name: "Main navigation", exact: true })
    .getByRole("button", { name: "Marketing", exact: true });
  await trigger.hover();
  await expect(page.getByRole("menu")).toBeVisible();
  await expect(page.getByRole("menuitem")).toHaveCount(6);
  await page.mouse.move(5, 200);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await trigger.press("ArrowDown");
  const first = page.getByRole("menuitem", { name: marketingLinks[0].label, exact: true });
  await expect(first).toBeFocused();
  await expect(first).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitem", { name: "Celebrity Marketing", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Banner Marketing", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  for (const link of marketingLinks) {
    await trigger.hover();
    await page.getByRole("menuitem", { name: link.label, exact: true }).click();
    await expect(page).toHaveURL(
      link.to === "/influencers" ? /\/influencer-partners$/ : new RegExp(`${link.to}$`),
      // The existing influencer route waits for its public database read.
      { timeout: 20_000 },
    );
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("data-active", "true");
    await trigger.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: link.label, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await page.keyboard.press("Escape");
    await page.mouse.move(5, 200);
  }
});

test("Marketing supports touch at the desktop breakpoint", async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/marketing/social-media-ads");
    const trigger = page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("button", { name: "Marketing", exact: true });
    await trigger.tap();
    await expect(page.getByRole("menuitem")).toHaveCount(6);
    await trigger.tap();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.tap();
    await page.getByRole("menuitem", { name: "Hoarding Ads", exact: true }).tap();
    await expect(page).toHaveURL(/\/marketing\/hoarding-ads$/);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  } finally {
    await context.close();
  }
});

for (const width of [390, 768, 1024]) {
  test(`mobile Marketing opens on tap and closes after navigation at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/marketing/banner-marketing");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Menu", exact: true });
    const trigger = sheet.getByRole("button", { name: "Marketing", exact: true });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    for (const link of marketingLinks)
      await expect(sheet.getByRole("link", { name: link.label, exact: true })).toHaveAttribute(
        "href",
        link.to,
      );
    await expect(
      sheet.getByRole("link", { name: "Banner Marketing", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await sheet.getByRole("link", { name: "Newspaper Marketing", exact: true }).click();
    await expect(page).toHaveURL(/\/marketing\/newspaper-marketing$/);
    await expect(sheet).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test("marketing CTAs reach existing forms and reduced motion is respected", async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/marketing/celebrity-marketing");
  await expect(page.locator(".marketing-hero-copy")).toHaveCSS("animation-name", "none");
  await page.getByRole("link", { name: "Get a Free Consultation", exact: false }).first().click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeVisible();
  await page.goto("/marketing/hoarding-ads");
  await page.getByRole("link", { name: "Get Customised Proposal", exact: false }).first().click();
  await expect(page).toHaveURL(/\/proposal$/);
  await expect(page.getByRole("form", { name: "Proposal inquiry", exact: true })).toBeVisible();
  expect((await request.get("/marketing/not-a-service")).status()).toBe(404);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const service of marketingServices)
    expect(xml).toContain(`https://aa100xtech.com${marketingServiceHref(service)}`);
});
