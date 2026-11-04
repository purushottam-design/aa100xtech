import { test, expect } from "@playwright/test";

for (const route of ["/careers", "/careers/apply"]) {
  test(`existing task application retains fields, uploads and retry behavior at ${route}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const attempts: Record<string, unknown>[] = [];
    const attachments: string[] = [];
    let succeed = false;
    await page.route("**/api/website/requests", async (request) => {
      const contentType = request.request().headers()["content-type"]!;
      const form = await new Response(request.request().postDataBuffer(), {
        headers: { "content-type": contentType },
      }).formData();
      attempts.push(JSON.parse(String(form.get("data"))));
      attachments.push((form.get("attachment") as File).name);
      await request.fulfill({
        status: succeed ? 200 : 503,
        json: succeed
          ? { saved: true, notification: "sent" }
          : { saved: false, message: "Could not save your application." },
      });
    });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const form = page.locator("form").filter({ has: page.locator('input[name="task_title"]') });
    await expect(form).toHaveCount(1);
    for (const name of [
      "full_name",
      "email",
      "phone",
      "task_title",
      "hours_needed",
      "availability",
      "expected_cost",
      "deliverables",
      "experience",
      "portfolio_url",
      "file",
    ])
      await expect(form.locator(`[name="${name}"]`)).toHaveCount(1);
    await expect(form.locator('input[name="file"]')).toHaveAttribute(
      "accept",
      "application/pdf,.pdf",
    );
    await form.getByLabel("Full name *", { exact: true }).fill("Test Applicant");
    await form.getByLabel("Email *", { exact: true }).fill("applicant@example.test");
    await form.getByLabel("Phone / WhatsApp", { exact: true }).fill("+910000000000");
    await form.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await form
      .getByLabel("Task / brief you are taking on *", { exact: true })
      .fill("Build a responsive project page");
    await form.getByLabel("Time needed", { exact: true }).fill("14 hours");
    await form.getByLabel("Working hours / timezone", { exact: true }).fill("11am-5pm IST");
    await form.getByLabel("Your cost / rate", { exact: true }).fill("Discuss scope");
    await form
      .getByLabel("What exactly will you deliver? *", { exact: true })
      .fill("Responsive components and documented source files.");
    await form
      .getByLabel("Experience", { exact: true })
      .fill("Experience building responsive React interfaces.");
    await form
      .getByLabel("Portfolio / previous work link", { exact: true })
      .fill("https://example.test/work");
    const resumeInput = form.locator('input[name="file"]');
    await resumeInput.setInputFiles({
      name: "resume.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nTest resume\n%%EOF"),
    });
    await expect(form.getByText("resume.pdf", { exact: true })).toBeVisible();
    await form.getByRole("button", { name: "Submit task plan", exact: true }).click();
    await expect(page.getByText("Could not save your application.", { exact: true })).toBeVisible();
    await expect(form.getByLabel("Full name *", { exact: true })).toHaveValue("Test Applicant");
    succeed = true;
    await form.getByRole("button", { name: "Submit task plan", exact: true }).click();
    await expect(
      page.getByText("Your application has been submitted to HR.", { exact: true }),
    ).toBeVisible();
    await expect(form.getByLabel("Full name *", { exact: true })).toHaveValue("");
    expect(attempts).toHaveLength(2);
    expect(attempts[0]!.id).toBe(attempts[1]!.id);
    expect(attempts[0]).toMatchObject({
      kind: "career",
      name: "Test Applicant",
      hours: "14 hours",
      expectedCost: "Discuss scope",
      requirements: "Build a responsive project page",
    });
    expect(attachments).toEqual(["resume.pdf", "resume.pdf"]);
  });
}

test("Jobs navigation reaches the embedded form without affecting other Join Us links", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/careers");
  const nav = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await nav.getByRole("button", { name: "Join Us", exact: true }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: "Jobs", exact: true })).toHaveAttribute(
    "href",
    "/careers",
  );
  await expect(
    menu.getByRole("menuitem", { name: "Influencer Partners", exact: true }),
  ).toBeVisible();
  await expect(
    menu.getByRole("menuitem", { name: "Request an Account", exact: true }),
  ).toBeVisible();
  await expect(menu.locator('a[href="/careers/apply"]')).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Submit your task plan", exact: true }).click();
  await expect(page).toHaveURL(/\/careers#task-application$/);
  await expect(page.locator("#task-application")).toBeInViewport();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("#apply form")).toHaveCount(1);
  await expect(page.locator("form")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Send application", exact: true })).toHaveCount(0);
  const roleCard = page.locator("#roles details").first();
  const roleTitle = (await roleCard.locator("h3").innerText()).trim();
  await roleCard.locator("summary").click();
  await roleCard.getByRole("link", { name: "Apply to this role", exact: true }).click();
  await expect(page.locator("#apply form").getByRole("combobox")).toContainText(roleTitle);
  await page
    .locator("#apply")
    .screenshot({ path: testInfo.outputPath("careers-application-desktop.png") });
  const ids = await page
    .locator("#apply [id], #task-application [id]")
    .evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(ids).size).toBe(ids.length);
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .locator("#apply")
    .screenshot({ path: testInfo.outputPath("careers-application-mobile.png") });
  await page.goto("/careers/london");
  await expect(page.locator("#task-application")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Submit your task plan", exact: true }),
  ).toHaveAttribute("href", "/careers/apply");
});

test("a saved application never claims an email was sent when HR email is unconfigured", async ({
  page,
}) => {
  await page.route("**/api/website/requests", (request) =>
    request.fulfill({ json: { saved: true, notification: "not_configured" } }),
  );
  await page.goto("/careers");
  const form = page.locator("#apply form");
  await form.getByLabel("Full name *", { exact: true }).fill("Test Applicant");
  await form.getByLabel("Email *", { exact: true }).fill("applicant@example.test");
  await form.getByLabel("Phone / WhatsApp", { exact: true }).fill("+910000000000");
  await form.getByRole("combobox").click();
  await page.getByRole("option").first().click();
  await form
    .getByLabel("Task / brief you are taking on *", { exact: true })
    .fill("Build a responsive project page");
  await form
    .getByLabel("What exactly will you deliver? *", { exact: true })
    .fill("Responsive components and documented source files.");
  await form.getByRole("button", { name: "Submit task plan", exact: true }).click();
  await expect(
    page.getByText(
      "Your application was saved, but the HR email could not be sent. Please email your resume to hr@aa100xtech.com.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Your application has been submitted to HR.", { exact: true }),
  ).toHaveCount(0);
});
