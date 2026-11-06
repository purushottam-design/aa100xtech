import { expect, test } from "@playwright/test";

test("retired app URLs redirect to website functions and preserve query parameters", async ({
  request,
}) => {
  for (const [source, target] of [
    ["/app", "/"],
    ["/app/home", "/"],
    ["/app/install", "/"],
    ["/app/admin", "/admin/select"],
    ["/app/login", "/auth"],
    ["/app/profile", "/profile"],
    ["/app/settings", "/settings"],
    ["/app/notifications", "/notifications"],
    ["/app/services", "/catalog"],
    ["/app/service/catalog-item", "/catalog/catalog-item"],
    ["/app/book-consultation", "/consultation"],
  ]) {
    const response = await request.get(`${source}?ref=bookmark`, { maxRedirects: 0 });
    expect(response.status(), source).toBe(308);
    expect(response.headers()["location"], source).toBe(`${target}?ref=bookmark`);
  }
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ display: "browser", start_url: "/", scope: "/" });
});

test("admin dashboards use the website header, responsive grid and footer", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/app/admin");
  await expect(page).toHaveURL(/\/admin\/select$/);
  await expect(page.getByRole("heading", { name: "Continue as", exact: true })).toBeVisible();
  const buttons = page.getByRole("button", { name: "Open dashboard", exact: true });
  await expect(buttons).toHaveCount(5);
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
  const container = page.locator("#main-content > div");
  expect((await container.boundingBox())!.width).toBeGreaterThan(1100);
  const first = (await buttons.nth(0).boundingBox())!;
  const second = (await buttons.nth(1).boundingBox())!;
  expect(Math.abs(first.y - second.y)).toBeLessThan(2);
  expect(second.x).toBeGreaterThan(first.x);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator('a[href^="/app"]')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("website-admin-desktop.png") });
  await buttons.first().click();
  await expect(page.getByRole("heading", { name: "Super Admin Login" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 375, height: 900 });
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation", exact: true }),
  ).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("website-admin-mobile.png") });
  expect(errors).toEqual([]);
});

test("service catalogue links keep their details and consultation action on the website", async ({
  page,
}) => {
  await page.route("**/api/rpc/affiliate/listCatalogItems*", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            id: "website-service",
            name: "Website service",
            category: "Web development",
            description: "A website for your business.",
            slug: "website-service",
            type: "service",
            active: true,
            recurring: false,
            cookie_duration_days: 30,
            default_commission_type: "percent",
            default_commission_value: 10,
          },
        ],
      },
    }),
  );
  await page.goto("/app/services");
  await expect(page).toHaveURL(/\/catalog$/);
  await page.getByRole("link", { name: /Website service Web development/ }).click();
  await expect(page).toHaveURL(/\/catalog\/website-service$/);
  await expect(page.getByRole("heading", { name: "Website service", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Book a consultation", exact: true }),
  ).toHaveAttribute("href", "/consultation");
  await expect(
    page.getByRole("navigation", { name: "Main navigation", exact: true }),
  ).toBeVisible();
});

test("website account functions require sign-in", async ({ page }) => {
  for (const route of ["/profile", "/settings", "/notifications"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.locator("footer")).toHaveCount(1);
  }
});
