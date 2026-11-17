import { test, expect as baseExpect } from "@playwright/test";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const expect = baseExpect.configure({ timeout: 30_000 });
test.setTimeout(120_000);
test.use({ serviceWorkers: "block", reducedMotion: "reduce" });
const path = "/influencer-marketing/for-brands";

// Browser-only synthetic Auth fixture. API persistence is verified separately
// against the real intake SQL in marketing-flow.test.cjs; no live rows are used.
test.beforeEach(async ({ page }) => {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: "00000000-0000-4000-8000-000000000042",
    email: "customer@example.test",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", exp: expires })}.synthetic-signature`;
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    {
      key: `sb-${ref}-auth-token`,
      session: {
        access_token: token,
        refresh_token: "synthetic-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: expires,
        user,
      },
    },
  );
  await page.route("**/auth/v1/**", (route) => route.fulfill({ json: user }));
});

test("the four campaign offers remain readable at mobile, tablet and desktop widths", async ({
  page,
}, info) => {
  await page.goto(path);
  const packages = page.getByRole("region", { name: "Creator Moves365 campaign packages" });
  await expect(packages.getByRole("article")).toHaveCount(4);
  await expect(packages).toContainText("Starting at ₹5,999");
  await expect(packages).toContainText("₹15,999");
  await expect(packages).toContainText("₹49,999");
  await expect(packages).toContainText("not per creator");
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width === 375 || width === 1440)
      await packages.screenshot({ path: info.outputPath(`campaign-packages-${width}.png`) });
  }
  await packages.getByText("Are the content quantities per creator?", { exact: true }).click();
  await expect(packages.getByText(/All listed reels, stories and static posts/)).toBeVisible();
});

test("package context reaches the native enquiry and survives a failed submission", async ({
  page,
}) => {
  await page.goto(path);
  await page.getByRole("link", { name: "Enquire about Growth", exact: true }).click();
  await expect(page).toHaveURL(/campaignPackage=cm365-campaign-growth#apply$/);
  await expect(page.getByLabel("Selected campaign package")).toContainText("Growth — ₹15,999");
  for (const [label, value] of [
    ["Company / Brand Name", "Synthetic Brand"],
    ["Contact Person", "Synthetic Contact"],
    ["Business Email", "fixture@example.test"],
    ["WhatsApp / Phone Number", "+919876543210"],
  ])
    await page.getByLabel(label).fill(value!);
  await page.getByLabel("Preferred Influencer Category").selectOption("Technology");
  await page.getByRole("checkbox", { name: "Instagram Reels", exact: true }).check();
  await page.getByRole("checkbox", { name: /I agree to the Privacy Policy/ }).check();
  const submissions: Record<string, unknown>[] = [];
  await page.route("**/api/marketing/brand", async (route) => {
    const request = route.request();
    expect(request.headers()["authorization"]).toMatch(/^Bearer /);
    const form = await new Response(request.postDataBuffer(), {
      headers: { "content-type": request.headers()["content-type"]! },
    }).formData();
    submissions.push(JSON.parse(String(form.get("data"))));
    if (submissions.length === 1)
      return route.fulfill({ status: 503, json: { error: "Synthetic database unavailable" } });
    return route.fulfill({
      status: 201,
      json: { ok: true, reference: "synthetic-campaign-receipt" },
    });
  });
  const submit = page.getByRole("button", { name: "Submit Campaign Inquiry" });
  await submit.click();
  await expect(page.locator("form [role=alert]")).toContainText("Synthetic database unavailable");
  await expect(page.getByRole("heading", { name: "Campaign inquiry received" })).toHaveCount(0);
  await expect(page.getByLabel("Company / Brand Name")).toHaveValue("Synthetic Brand");
  await expect(page.getByLabel("Selected campaign package")).toContainText("Growth");
  await submit.click();
  await expect(page.getByRole("heading", { name: "Campaign inquiry received" })).toBeVisible();
  expect(submissions).toHaveLength(2);
  expect(submissions[0]!.campaign_package_id).toBe("cm365-campaign-growth");
  expect(submissions[1]!.token).toBe(submissions[0]!.token);
  expect(submissions[0]).not.toHaveProperty("campaign_offer");
});

test("unknown or repeated package parameters never preselect an arbitrary product", async ({
  page,
}) => {
  for (const query of [
    "campaignPackage=unknown-package",
    "campaignPackage=cm365-campaign-growth&campaignPackage=cm365-campaign-premium",
  ]) {
    await page.goto(`${path}?${query}`);
    await expect(page.getByLabel("Selected campaign package")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Start Your Influencer Campaign" }),
    ).toBeVisible();
  }
});
