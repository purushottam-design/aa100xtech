import { test, expect } from "@playwright/test";

test("dedicated partnership route, responsive layout, navigation, package details and FAQs", async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  expect((await page.goto("/partnership-for-influencers"))?.status()).toBe(200);
  await expect(page).toHaveTitle("Partnership for Influencers | Creator Program – AA100XTech");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://aa100xtech.com/partnership-for-influencers",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://aa100xtech.com/influencers/partnership-creator-hero.webp",
  );
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toContainText("Create Your Identity.");
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator(".pfi-benefit")).toHaveCount(12);
  await expect(page.locator(".pfi-package")).toHaveCount(3);
  await expect(page.locator(".pfi-timeline > li")).toHaveCount(5);
  await expect(page.locator(".pfi-audience-grid > article")).toHaveCount(6);
  await expect(page.locator(".pfi-support-grid > article")).toHaveCount(4);
  for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${width}px overflow`,
    ).toBe(true);
    if (width >= 1280) {
      const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
      await expect(
        nav.getByRole("link", { name: "PARTNERSHIP FOR INFLUENCERS", exact: true }),
      ).toHaveCount(0);
      const joinUs = nav.getByRole("button", { name: "Join Us", exact: true });
      await expect(joinUs).toHaveAttribute("data-active", "true");
      await joinUs.click();
      const partnershipLink = page.getByRole("menuitem", {
        name: "PARTNERSHIP FOR INFLUENCERS",
        exact: true,
      });
      await expect(partnershipLink).toHaveAttribute("href", "/partnership-for-influencers");
      await expect(partnershipLink).toHaveAttribute("aria-current", "page");
      await page.keyboard.press("Escape");
      for (const name of ["Home", "Services", "Our Top Clients", "Founder"])
        await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
      for (const name of ["Marketing", "Join Us"])
        await expect(nav.getByRole("button", { name, exact: true })).toBeVisible();
      const boxes = await page.locator("header nav, header nav + div").evaluateAll((nodes) =>
        nodes.map((node) => {
          const r = node.getBoundingClientRect();
          return { left: r.left, right: r.right };
        }),
      );
      expect(boxes[0]!.right).toBeLessThanOrEqual(boxes[1]!.left);
    }
    if (width === 390 || width === 1440)
      await page.screenshot({ path: info.outputPath(`partnership-${width}.png`), fullPage: true });
  }
  await expect
    .poll(() =>
      page
        .locator(".pfi-hero-visual img")
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
  const packageCard = page.locator("#pfi-content-music");
  await packageCard.locator("summary").click();
  await expect(packageCard.getByText("Recording coordination", { exact: true })).toBeVisible();
  await expect(
    packageCard.getByRole("link", { name: "Request a proposal for Content & Music" }),
  ).toHaveAttribute("href", "/proposal?kind=partnership&package=content-music");
  const faq = page.getByRole("button", {
    name: "Does joining guarantee brand deals?",
    exact: true,
  });
  await faq.click();
  await expect(faq).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByText("No. Partnership approval does not guarantee brand deals", { exact: false }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("button", { name: "Join Us", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("link", { name: "PARTNERSHIP FOR INFLUENCERS", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("partnership application reuses the creator API, retains failed submissions and confirms only successful saves", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/partnership-for-influencers");
  await page
    .getByRole("link", { name: "Apply for Influencer Partnership", exact: false })
    .first()
    .click();
  await expect(page).toHaveURL(/for-influencers\?partnership=1#apply$/, { timeout: 30_000 });
  const form = page.getByRole("form", { name: "Influencer application", exact: true });
  await expect(form).toHaveCount(1);
  await form.getByRole("button", { name: "Submit Partnership Application" }).click();
  await expect(form.getByRole("alert")).toContainText("highlighted");
  for (const [name, value] of [
    ["Full Name", "Synthetic Creator"],
    ["Email Address", "creator@example.invalid"],
    ["Mobile Number", "+919876543210"],
    ["City", "Patna"],
    ["State", "Bihar"],
    ["Country", "India"],
    ["Influencer / Creator Name", "Synthetic Studio"],
    ["What Are Your Creator Goals?", "Develop a music album and portfolio."],
    ["Why Do You Want to Partner with AA100XTech?", "Explore production and technology support."],
    ["Expected Project Requirements", "A creator portfolio and original album."],
  ])
    await form.getByLabel(name!, { exact: false }).fill(value!);
  await form.getByRole("checkbox", { name: "YouTube", exact: true }).check();
  await form.getByLabel("Social Media Profile URL").fill("https://youtube.com/@synthetic-test");
  await form.getByLabel("Content Category").selectOption("Music");
  await form.getByLabel("Primary Social Media Platform").selectOption("YouTube");
  await form.getByRole("radio", { name: "Open to All", exact: true }).check();
  await form.getByRole("checkbox", { name: "Portfolio Website", exact: true }).check();
  await form.getByRole("checkbox", { name: "Songs / Music", exact: true }).check();
  await form.getByRole("checkbox", { name: "Microdrama", exact: true }).check();
  await form.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
  const attempts: Record<string, unknown>[] = [];
  await page.route("**/api/marketing/creator", async (route) => {
    const fd = await new Response(route.request().postDataBuffer(), {
      headers: { "content-type": route.request().headers()["content-type"]! },
    }).formData();
    attempts.push(JSON.parse(String(fd.get("data"))));
    await route.fulfill({
      status: attempts.length === 1 ? 503 : 201,
      json:
        attempts.length === 1
          ? { error: "Could not save your application. Please try again." }
          : { ok: true, reference: "synthetic-partnership-reference" },
    });
  });
  const submit = form.getByRole("button", { name: "Submit Partnership Application" });
  await submit.click();
  await expect(form.getByRole("alert")).toContainText("Could not save");
  await expect(form.getByLabel("Full Name")).toHaveValue("Synthetic Creator");
  await submit.click();
  await expect(
    page.getByRole("heading", { name: "Application submitted", exact: true }),
  ).toBeVisible();
  expect(attempts[0]!.token).toBe(attempts[1]!.token);
  expect(attempts[1]).toMatchObject({
    partnership_application: true,
    privacy: true,
    publication_consent: false,
    creator_name: "Synthetic Studio",
    primary_platform: "YouTube",
    partnership_interests: ["Portfolio Website", "Songs / Music", "Microdrama"],
  });
});

test("partnership proposal keeps the selected package and uses the existing request API with retry identity", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/partnership-for-influencers");
  const card = page.locator("#pfi-entertainment-studio");
  await card.locator("summary").click();
  await card.getByRole("link", { name: "Request a proposal for Entertainment Studio" }).click();
  await expect(page).toHaveURL(/\/proposal\?kind=partnership&package=entertainment-studio$/, {
    timeout: 30_000,
  });
  const form = page.getByRole("form", { name: "Proposal inquiry" });
  await expect(form.getByLabel("Selected Package")).toHaveValue("entertainment-studio");
  await expect(form.getByLabel("Selected plan or service")).toHaveValue("influencer-partnership");
  await form.getByLabel("Full name").fill("Synthetic Creator");
  await form.getByLabel("Email *").fill("creator@example.invalid");
  await form.getByLabel("Phone *").fill("+919876543210");
  await form.getByLabel("Company / Creator Name").fill("Synthetic Studio");
  await form.getByLabel("Project Description").fill("A short original microdrama project.");
  await form.getByRole("checkbox", { name: "Microdrama", exact: true }).check();
  await form.getByLabel("Budget Range").fill("To discuss");
  await form.getByLabel("Expected Timeline").fill("Next month");
  await form.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
  const attempts: Record<string, unknown>[] = [];
  await page.route("**/api/website/requests", async (route) => {
    const fd = await new Response(route.request().postDataBuffer(), {
      headers: { "content-type": route.request().headers()["content-type"]! },
    }).formData();
    attempts.push(JSON.parse(String(fd.get("data"))));
    await route.fulfill({
      status: attempts.length === 1 ? 503 : 200,
      json:
        attempts.length === 1
          ? { saved: false, message: "Temporary save failure. Please retry." }
          : { saved: true, notification: "not_configured" },
    });
  });
  const submit = form.getByRole("button", { name: "Request My Partnership Proposal" });
  await submit.click();
  await expect(form.getByRole("status")).toContainText("Temporary save failure");
  await expect(form.getByLabel("Project Description")).toHaveValue(
    "A short original microdrama project.",
  );
  await submit.click();
  await expect(form.getByRole("status")).toContainText("Your request has been saved");
  expect(attempts[0]!.id).toBe(attempts[1]!.id);
  expect(attempts[1]).toMatchObject({
    kind: "influencer",
    selectedPlan: "influencer-partnership",
    partnership: {
      package: "entertainment-studio",
      services: ["Microdrama"],
      budget: "To discuss",
      timeline: "Next month",
      privacy: true,
    },
  });
});
