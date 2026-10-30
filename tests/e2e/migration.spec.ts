import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const inventory = readFileSync(path.join(process.cwd(), "docs/route-inventory.md"), "utf8");
const originalRoutes = [...inventory.matchAll(/^\| `([^`]+)` \| `src\/routes\//gm)].map(
  (match) => match[1]!,
);

test("all original page routes and published service URLs render", async ({
  request,
}, testInfo) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const publishedRoutes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]!).pathname,
  );
  const exploreResponse = await request.get("/services/explore");
  const explore = await exploreResponse.text();
  const exploredRoutes = [...explore.matchAll(/href="(\/services\/explore\/[^"?#]+)"/g)].map(
    (match) => match[1]!,
  );
  const routes = new Set([
    ...originalRoutes.filter((route) => !route.includes("[")),
    ...publishedRoutes,
    ...exploredRoutes,
    "/app/service/00000000-0000-4000-8000-000000000000",
  ]);
  for (const route of routes) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(200);
    expect(await response.text(), route).not.toContain("This page didn't load");
  }
  const redirect = await request.get("/app", { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers()["location"]).toBe("/app/home");
  for (const route of [
    "/missing-migration-page",
    "/services/missing-migration-service",
    "/services/explore/missing-migration-type",
  ]) {
    expect((await request.get(route)).status(), route).toBe(404);
  }
  await testInfo.attach("checked-routes", {
    body: JSON.stringify({ count: routes.size, routes: [...routes] }, null, 2),
    contentType: "application/json",
  });
});

test("real API transport rejects unauthorized and invalid requests before mutations", async ({
  request,
}) => {
  const protectedResponse = await request.get("/api/rpc/accounts/getMyAccount", {
    headers: { "x-aa-rpc": "1" },
  });
  expect(protectedResponse.status()).toBe(401);
  expect((await protectedResponse.json()).error.message).toMatch(/Unauthorized/);
  const csrf = await request.post("/api/rpc/accounts/signUpAccount", { data: {} });
  expect(csrf.status()).toBe(403);
  const invalidSignup = await request.post("/api/rpc/accounts/signUpAccount", {
    headers: { "x-aa-rpc": "1" },
    data: { data: {} },
  });
  expect(invalidSignup.status()).toBe(400);
  const conversion = await request.post("/api/public/v1/conversions", { data: {} });
  expect(conversion.status()).toBe(401);
  for (const route of ["health", "conversions", "coupons/validate", "track/click"]) {
    const response = await request.fetch(`/api/public/v1/${route}`, { method: "OPTIONS" });
    expect(response.status(), route).toBe(204);
    expect(await response.text(), route).toBe("");
  }
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`navigation, search state and layouts at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const pageErrors: string[] = [];
    const hydrationErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|did not match|server rendered HTML/i.test(message.text())
      ) {
        hydrationErrors.push(message.text());
      }
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("Crafting digital excellence");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeAttached();
    await expect(
      page.getByRole("img", { name: "Absolute Advancement 100X Tech logo" }).first(),
    ).toBeVisible();
    expect(
      await page
        .locator("body")
        .evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`home-${viewport.width}.png`),
      fullPage: true,
    });

    if (viewport.width < 1024) {
      await page.getByRole("button", { name: "Open menu" }).click();
      const menu = page.getByRole("dialog");
      await expect(menu).toBeVisible();
      await menu.getByRole("link", { name: "Services", exact: true }).click();
    } else {
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Services", exact: true })
        .click();
    }
    await expect(page).toHaveURL(/\/services$/);
    await expect(
      page.getByRole("heading", { name: "Clear prices for every IT service" }),
    ).toBeVisible();
    await page.goto("/services/website-development");
    await expect(page.locator("h1")).toHaveText("Website Development");
    await expect(page).toHaveTitle("Website Development — AA100XTech");
    await page.goto("/partners/apply?opportunity=paid-promotion");
    await expect(page.locator("#target_level")).toHaveCount(0);
    await expect(page.locator("#plan")).toHaveCount(0);
    await page.goto("/partners/apply");
    await expect(page.locator("#target_level")).toBeAttached();
    await expect(page.locator("#plan")).toBeAttached();
    await page.goto("/contact");
    await expect(page.locator("form")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`contact-${viewport.width}.png`),
      fullPage: true,
    });
    await page.goto("/app/login");
    // The existing app keeps its own logo header, without the public-site navigation.
    await expect(
      page.getByRole("navigation", { name: "Main navigation", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "AA100XTech app home", exact: true }),
    ).toBeVisible();
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.locator("form")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth$/);
    expect(pageErrors).toEqual([]);
    expect(hydrationErrors).toEqual([]);
  });
}

test("browser renders every original page without hydration or runtime errors", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`${page.url()}: ${error.message}`));
  for (const route of originalRoutes) {
    const resolved = route
      .replace("/services/[slug]", "/services/website-development")
      .replace("/services/explore/[slug]", "/services/explore/business-website")
      .replace("[id]", "00000000-0000-4000-8000-000000000000");
    const response = await page.goto(resolved, { waitUntil: "domcontentloaded" });
    expect(response?.status(), resolved).toBe(200);
    await expect(
      page.getByRole("heading", { name: "This page didn't load", exact: true }),
    ).toHaveCount(0);
    await page.waitForTimeout(100);
  }
  await testInfo.attach("browser-routes", {
    body: JSON.stringify(originalRoutes),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});
