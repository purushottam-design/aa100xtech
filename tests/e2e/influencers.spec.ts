import { test, expect } from "@playwright/test";
import path from "node:path";

for (const width of [1440, 768, 390]) {
  test(`influencer program and existing navigation at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/influencers", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toHaveText("Partner With Influence.Grow With Impact.");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeAttached();
    await expect(page.locator(".ip-spotlight")).toHaveCount(0);
    await expect(page.getByLabel("Search influencers by name")).toHaveCount(0);
    await page
      .locator("summary")
      .filter({ hasText: "Is website or app development always free?" })
      .click();
    await expect(
      page.getByText("No. Development is not automatically free or unlimited.", { exact: false }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`influencers-${width}.png`),
      fullPage: true,
    });
    if (width >= 1280)
      await expect(page.getByRole("button", { name: "Join Us", exact: true })).toBeVisible();
    await page
      .getByRole("link", { name: "Become an Influencer Partner", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/partners\/apply\?opportunity=paid-promotion$/);
    await expect(page.getByLabel("Public creator name", { exact: false })).toBeVisible();
    await expect(page.locator("#target_level")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: testInfo.outputPath(`influencer-application-${width}.png`),
      fullPage: true,
    });
    await page.goto("/admin/influencers");
    await expect(page).toHaveURL(/\/auth$/);
    expect(errors).toEqual([]);
  });
}

test("application UI retains inputs on failure and submits consent and files through the existing route", async ({
  page,
}) => {
  let success = false;
  const bodies: string[] = [];
  await page.route("**/api/influencers/apply", async (route) => {
    bodies.push(route.request().postDataBuffer()?.toString() ?? "");
    await route.fulfill({
      status: success ? 201 : 503,
      json: success ? { ok: true } : { error: "Could not save test application" },
    });
  });
  await page.goto("/partners/apply?opportunity=paid-promotion");
  for (const [id, value] of Object.entries({
    full_name: "Test Applicant",
    display_name: "Test Creator",
    email: "test@example.test",
    phone: "+910000000000",
    city: "Test City",
    state: "Test State",
    country: "India",
    biography: "Synthetic biography used only for browser testing.",
    instagram: "https://instagram.com/test",
    instagram_followers: "123",
    audience_location: "India",
    deliverables: "An agreed series of educational videos",
    expected_terms: "Scope and fees to be agreed in writing",
  }))
    await page.locator(`#${id}`).fill(value);
  await page.locator("#category").selectOption("Technology");
  await page
    .locator("#profile_image")
    .setInputFiles(path.join(process.cwd(), "public/influencers/creator-podcast.webp"));
  await page.locator('[name="processing_consent"]').check();
  await page.locator('[name="publication_consent"]').check();
  await page.getByRole("button", { name: "Submit partnership application", exact: true }).click();
  await expect(page.getByText("Could not save test application", { exact: true })).toBeVisible();
  await expect(page.locator("#full_name")).toHaveValue("Test Applicant");
  expect(bodies[0]).toContain('"publication_consent":true');
  expect(bodies[0]).toContain('"processing_consent":true');
  expect(bodies[0]).toContain('name="profile_image"');
  success = true;
  await page.getByRole("button", { name: "Submit partnership application", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your application is with our team.", exact: true }),
  ).toBeVisible();
});

test("live influencer endpoints reject invalid submissions and unauthorized administration before mutations", async ({
  request,
}) => {
  const forbidden = await request.post("/api/influencers/apply", { data: {} });
  expect(forbidden.status()).toBe(403);
  const malformed = await request.post("/api/influencers/apply", {
    headers: { "x-aa-rpc": "1" },
    multipart: { application: "{}" },
  });
  expect(malformed.status()).toBe(400);
  const admin = await request.get("/api/rpc/influencers/listInfluencerApplications", {
    headers: { "x-aa-rpc": "1" },
  });
  expect(admin.status()).toBe(401);
  expect(
    (
      await request.get("/api/influencers/program?profileId=00000000-0000-4000-8000-000000000001", {
        headers: { "x-aa-rpc": "1" },
      })
    ).status(),
  ).toBe(401);
  const upload = await request.post("/api/influencers/upload", {
    headers: { "x-aa-rpc": "1" },
    multipart: { applicationId: "00000000-0000-4000-8000-000000000001" },
  });
  expect(upload.status()).toBe(401);
  expect((await request.get("/api/influencers/media/not-an-image")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "https://aa100xtech.com/influencers",
  );
});

test("the program join form preserves applicant details on failure and submits through the existing application API", async ({
  page,
}) => {
  let success = false;
  const applications: {
    socials: { primary: string; instagram_followers: number };
    program_terms_consent: boolean;
    submission_id: string;
    portfolio_url: string;
    deliverables: string;
  }[] = [];
  await page.route("**/api/influencers/apply", async (route) => {
    const body = route.request().postDataBuffer()?.toString() ?? "";
    const json = body.match(/name="application"\r\n\r\n([^\r]+)\r\n/);
    expect(json).not.toBeNull();
    applications.push(JSON.parse(json![1]));
    await route.fulfill({
      status: success ? 201 : 503,
      json: success ? { ok: true } : { error: "Synthetic test application could not be saved." },
    });
  });
  await page.goto("/influencers", { waitUntil: "domcontentloaded" });
  const form = page.locator(".ip-application-form");
  for (const [name, value] of Object.entries({
    full_name: "Synthetic Creator",
    phone: "+910000000000",
    email: "synthetic@example.test",
    city: "Test City",
    state: "Test State",
    country: "India",
    instagram: "https://instagram.com/synthetic-test",
    follower_count: "321",
    audience_location: "India",
    motivation: "I want to connect genuine businesses with a trusted technology team.",
    portfolio_url: "https://example.test/portfolio",
    collaboration_interests: "Educational creator videos and brand collaborations.",
  }))
    await form.locator(`[name="${name}"]`).fill(value);
  await form.locator('[name="primary_platform"]').selectOption("instagram");
  await form.locator('[name="category"]').selectOption("Technology");
  for (const name of ["program_terms_consent", "processing_consent", "publication_consent"])
    await form.locator(`[name="${name}"]`).check();
  await form.getByRole("button", { name: "Apply as Influencer", exact: false }).click();
  await expect(form.getByRole("alert")).toContainText("could not be saved");
  await expect(form.locator('[name="full_name"]')).toHaveValue("Synthetic Creator");
  expect(applications[0].socials.primary).toBe("instagram");
  expect(applications[0].socials.instagram_followers).toBe(321);
  expect(applications[0].program_terms_consent).toBe(true);
  expect(applications[0].portfolio_url).toBe("https://example.test/portfolio");
  expect(applications[0].deliverables).toBe("Educational creator videos and brand collaborations.");
  success = true;
  await form.getByRole("button", { name: "Apply as Influencer", exact: false }).click();
  await expect(
    page.getByRole("heading", { name: "Your next chapter starts here.", exact: true }),
  ).toBeVisible();
  expect(applications[0].submission_id).toBe(applications[1].submission_id);
});
