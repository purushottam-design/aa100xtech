import { test, expect, type Locator } from "@playwright/test";

async function controls(form: Locator) {
  return form.evaluate((node) =>
    Array.from(
      node.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input,select,textarea",
      ),
    ).map((control) => ({
      tag: control.tagName,
      type: control.type,
      required: control.required,
      placeholder: control.getAttribute("placeholder"),
      accept: control.getAttribute("accept"),
      max: control.getAttribute("maxlength"),
      options:
        control instanceof HTMLSelectElement ? Array.from(control.options, (o) => o.text) : null,
      choice: control.closest("label")?.textContent?.trim().replace(/\s+/g, " ") ?? null,
    })),
  );
}

test("partner page keeps the shared brand form without the influencer application section", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.goto("/influencer-marketing/for-brands");
  const brandControls = await controls(
    page.getByRole("form", { name: "Brand campaign inquiry", exact: true }),
  );
  await page.goto("/influencer-partners");
  const creator = page.getByRole("form", { name: "Influencer application", exact: true });
  const brand = page.getByRole("form", { name: "Brand campaign inquiry", exact: true });
  await expect(creator).toHaveCount(0);
  await expect(page.locator("#uip-creator-form-title")).toHaveCount(0);
  await expect(brand).toHaveCount(1);
  expect(await controls(brand)).toEqual(brandControls);
  await expect(page.locator(".ipp-form-panel,.ip-application-form,.ipp-detailed-link")).toHaveCount(
    0,
  );
  const duplicateIds = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll("[id]"), (n) => n.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(duplicateIds).toEqual([]);
  await brand.getByLabel("Business Email").fill("brand@example.invalid");
  await expect(brand.getByLabel("Business Email")).toHaveValue("brand@example.invalid");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const boxes = await page.locator(".uip-form-panel").evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, bottom: r.bottom };
      }),
    );
    expect(boxes).toHaveLength(1);
    expect(boxes[0]!.width).toBeLessThanOrEqual(760);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(brand.getByLabel("Company / Brand Name")).toHaveCSS("height", "36px");
    if (width === 390 || width === 1440) {
      await page.locator(".uip-forms").scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`shared-forms-${width}.png`), fullPage: true });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const kind of ["creator", "brand"] as const) {
  test(`${kind} form validates, keeps input on errors and uses the shared API receipt`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: kind === "creator" ? 390 : 1440, height: 1000 });
    await page.goto(
      kind === "creator" ? "/influencer-marketing/for-influencers" : "/influencer-partners",
    );
    const panel = page.locator(kind === "creator" ? "main" : "#brand-enquiry");
    const form = panel.getByRole("form");
    const button = form.getByRole("button", {
      name: kind === "creator" ? "Submit Influencer Application" : "Submit Campaign Inquiry",
    });
    await button.click();
    await expect(form.getByRole("alert")).toContainText("highlighted");
    const fields =
      kind === "creator"
        ? [
            ["Full Name", "Synthetic Creator"],
            ["Email Address", "creator@example.invalid"],
            ["WhatsApp Number", "+910000000000"],
            ["City", "Patna"],
            ["State", "Bihar"],
            ["Country", "India"],
          ]
        : [
            ["Company / Brand Name", "Synthetic Brand"],
            ["Contact Person", "Synthetic Contact"],
            ["Business Email", "brand@example.invalid"],
            ["WhatsApp / Phone Number", "+910000000000"],
            ["Business Category / Industry", "Technology"],
            ["City / Country", "Patna, India"],
          ];
    for (const [label, value] of fields)
      await form.getByLabel(label!, { exact: false }).fill(value!);
    if (kind === "creator") {
      await form.getByRole("checkbox", { name: "Instagram", exact: true }).check();
      await form
        .getByLabel("Social Media Profile URL")
        .fill("https://instagram.com/synthetic-test");
      await form.getByLabel("Instagram Followers / Subscribers").fill("123");
      await form.getByLabel("Content Category").selectOption("Technology");
      await form.getByRole("radio", { name: "Paid", exact: true }).check();
      await form
        .getByLabel("Tell Us About Yourself")
        .fill("Synthetic creator biography for browser verification only.");
      await expect(
        form.getByRole("checkbox", { name: /I consent to displaying/ }),
      ).not.toBeChecked();
      await form.getByText("Additional creator details (optional)").click();
      await form.getByLabel("Content Language").fill("Hindi");
    } else {
      await form.getByLabel("Preferred Influencer Category").selectOption("Technology");
      await form.getByRole("checkbox", { name: "Instagram Reels", exact: true }).check();
      await form
        .getByLabel("Campaign Requirements")
        .fill("Synthetic brief for browser verification only.");
    }
    await form.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
    const attempts: Record<string, unknown>[] = [];
    let success = false;
    await page.route(`**/api/marketing/${kind}`, async (route) => {
      const fd = await new Response(route.request().postDataBuffer(), {
        headers: { "content-type": route.request().headers()["content-type"]! },
      }).formData();
      attempts.push(JSON.parse(String(fd.get("data"))));
      if (success) await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: success ? 201 : 503,
        json: success
          ? { ok: true, reference: `verified-${kind}-reference` }
          : { error: "Synthetic database failure" },
      });
    });
    await button.click();
    await expect(form.getByRole("alert")).toContainText("Synthetic database failure");
    await expect(
      form.getByLabel(kind === "creator" ? "Full Name" : "Company / Brand Name"),
    ).toHaveValue(kind === "creator" ? "Synthetic Creator" : "Synthetic Brand");
    success = true;
    await button.click();
    await expect(form.getByRole("button", { name: /^Submitting/ })).toBeDisabled();
    await expect(
      panel.getByRole("heading", {
        name: kind === "creator" ? "Application submitted" : "Campaign inquiry received",
        exact: true,
      }),
    ).toBeVisible();
    await expect(panel.getByText(`verified-${kind}-reference`, { exact: true })).toBeVisible();
    expect(attempts).toHaveLength(2);
    expect(attempts[0]!["token"]).toBe(attempts[1]!["token"]);
    if (kind === "creator") {
      expect(attempts[1]!["publication_consent"]).toBe(false);
      expect(attempts[1]!["language"]).toBe("Hindi");
    }
  });
}
