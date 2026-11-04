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
  await expect(
    page.getByRole("form", { name: "Influencer partner application", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByRole("form", { name: "Brand campaign enquiry", exact: true })).toHaveCount(
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

test("brand partner form retains failed submissions and includes audience in the shared enquiry API", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const attempts: Record<string, unknown>[] = [];
  let success = false;
  await page.route("**/api/website/requests", async (route) => {
    const data = await new Response(route.request().postDataBuffer(), {
      headers: { "content-type": route.request().headers()["content-type"]! },
    }).formData();
    attempts.push(JSON.parse(String(data.get("data"))));
    await route.fulfill({
      status: success ? 200 : 503,
      json: success
        ? { saved: true, notification: "not_configured" }
        : { saved: false, message: "Synthetic campaign save failed. Please retry." },
    });
  });
  await page.goto("/influencers");
  const form = page.getByRole("form", { name: "Brand campaign enquiry", exact: true });
  for (const [name, value] of Object.entries({
    name: "Synthetic Brand",
    company: "Test Brand",
    email: "brand@example.test",
    phone: "+910000000000",
    location: "India",
    targetAudience: "Technology enthusiasts",
    budget: "Discuss scope",
    timeline: "Next month",
    requirements: "A scoped technology campaign for review.",
  }))
    await form.locator(`[name="${name}"]`).fill(value);
  await form.getByRole("button", { name: "Enquire as Brand Partner", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("save failed");
  await expect(form.locator('[name="targetAudience"]')).toHaveValue("Technology enthusiasts");
  success = true;
  await form.getByRole("button", { name: "Enquire as Brand Partner", exact: true }).click();
  await expect(form.getByRole("status")).toContainText("Your campaign enquiry has been saved.");
  expect(attempts).toHaveLength(2);
  expect(attempts[0]!.id).toBe(attempts[1]!.id);
  expect(attempts[1]).toMatchObject({
    kind: "influencer",
    company: "Test Brand",
    campaign: {
      targetAudience: "Technology enthusiasts",
      location: "India",
      type: "Influencer Marketing",
    },
  });
});
