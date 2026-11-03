import { test, expect } from "@playwright/test";

for (const width of [375, 768, 1024, 1440]) {
  test(`business website routes and navigation fit ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [route, heading] of [
      ["/", "Expert IT & Digital Marketing Solutions"],
      ["/business-plans", "A stronger digital foundation"],
      ["/influencer-programs", "Influencer Programs"],
      ["/influencer-marketing", "purpose and creativity"],
      ["/portfolio", "portfolio"],
      ["/consultation", "Talk to Our IT & Marketing Experts"],
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toContainText(heading);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
      await expect(page.getByRole("button", { name: "Join Us", exact: true })).toHaveCount(0);
      await expect(page.getByText("Our creator community", { exact: true })).toHaveCount(0);
      if (width < 1024) {
        await expect(page.locator('a[aria-label="Book Consultation"]')).toBeHidden();
      }
      if (route === "/influencer-marketing") {
        await expect(page.getByText("Starting at ₹500", { exact: true })).toHaveCount(3);
      }
      if (route === "/business-plans") {
        await page.evaluate(async () => {
          await Promise.all(
            document
              .getAnimations()
              .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
              .map((animation) => animation.finished.catch(() => undefined)),
          );
        });
        await page.screenshot({
          path: testInfo.outputPath(`business-${width}.png`),
          fullPage: true,
        });
      }
    }
    await page.goto("/business-plans");
    await expect(page.getByText("3 business email accounts", { exact: true })).toBeVisible();
    await expect(page.getByText("4 business email accounts", { exact: true })).toBeVisible();
    await page.locator('a[href="/proposal?plan=business"]').first().click();
    await expect(page.locator('select[name="selectedPlan"]')).toHaveValue("business");
    if (width < 1024) {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      await expect(
        page.getByRole("dialog").getByRole("link", { name: "Business Plans", exact: true }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}

test("proposal form reports persisted success only, retains input on failure and preserves retry id", async ({
  page,
}) => {
  let succeed = false;
  const ids: string[] = [];
  await page.route("**/api/website/requests", async (route) => {
    const raw = route.request().postData() ?? "";
    const match = raw.match(/"id":"([a-f0-9-]+)"/);
    if (match) ids.push(match[1]);
    await route.fulfill({
      status: succeed ? 200 : 503,
      json: succeed
        ? { saved: true, notification: "not_configured" }
        : { saved: false, message: "Your request could not be saved. Please try again." },
    });
  });
  await page.goto("/proposal?plan=business-plus");
  await page.getByLabel("Full name", { exact: false }).fill("Test Applicant");
  await page.getByLabel("Business / company name").fill("Synthetic Company");
  await page.getByLabel("Email", { exact: false }).fill("qa@example.test");
  await page.getByLabel("Phone", { exact: false }).fill("+910000000000");
  await page
    .getByLabel("Business requirements", { exact: false })
    .fill("A responsive website with manageable content.");
  await page.getByRole("button", { name: "Request a proposal", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("could not be saved");
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue("Test Applicant");
  succeed = true;
  await page.getByRole("button", { name: "Request a proposal", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("has been saved");
  expect(ids.length).toBe(2);
  expect(ids[0]).toBe(ids[1]);
});

test("public APIs reject cross-site submissions and private inbox access", async ({ request }) => {
  expect((await request.get("/api/website/requests")).status()).toBe(401);
  const response = await request.post("/api/website/requests", {
    headers: { origin: "https://attacker.example.test", "x-aa-rpc": "1" },
    multipart: { data: "{}" },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).saved).toBe(false);
});

test("reduced motion leaves content and actions usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/business-plans");
  await expect(page.getByRole("heading", { name: "A stronger digital foundation." })).toBeVisible();
  await expect(page.locator('a[href="/proposal?plan=business"]').first()).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === "running").length,
    ),
  ).toBe(0);
});

test("consultation cards wait for hydration before accepting a booking click", async ({ page }) => {
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/_next/static/**", async (route) => {
    if (route.request().resourceType() === "script") await scriptsReady;
    await route.continue();
  });
  await page.route("**/api/payments/icici/availability", (route) =>
    route.fulfill({ json: { available: false } }),
  );
  try {
    await page.goto("/consultation", { waitUntil: "commit" });
    const book = page.getByRole("button", { name: "Book Now", exact: true }).first();
    await expect(book).toBeDisabled();
    releaseScripts();
    await expect(book).toBeEnabled();
    await book.click();
    await expect(
      page.getByRole("dialog").getByPlaceholder("Your name", { exact: true }),
    ).toBeVisible();
  } finally {
    releaseScripts();
  }
});
