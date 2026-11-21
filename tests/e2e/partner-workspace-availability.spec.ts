import { test, expect } from "@playwright/test";
import envPackage from "@next/env";
const { loadEnvConfig } = envPackage;
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const uid = "00000000-0000-4000-8000-000000000001";
async function fixture(page, role = "admin", state = "approved") {
  const payload = Buffer.from(
    JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" }),
  ).toString("base64url");
  await page.addInitScript(
    ({ ref, uid, token }) => {
      localStorage.setItem(
        `sb-${ref}-auth-token`,
        JSON.stringify({
          access_token: token,
          refresh_token: "synthetic-nonfunctional-token",
          token_type: "bearer",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          expires_in: 3600,
          user: {
            id: uid,
            aud: "authenticated",
            role: "authenticated",
            email: "ui-test@example.test",
            user_metadata: { full_name: "UI Test Admin" },
            app_metadata: { provider: "email" },
            created_at: "2026-01-01T00:00:00Z",
          },
        }),
      );
    },
    { ref, uid, token: `eyJhbGciOiJIUzI1NiJ9.${payload}.synthetic` },
  );
  await page.route("**/*.supabase.co/**", (r) => r.abort());
  await page.route("**/api/partner-workspace/*", async (route) => {
    const op = new URL(route.request().url()).pathname.split("/").pop();
    const data = route.request().postDataJSON();
    if (op === "access-state")
      return route.fulfill({
        json: {
          data: {
            state,
            user: { id: uid, name: "UI Test Admin", email: "ui-test@example.test" },
            role,
            domain: role === "lead_team" ? "gamer" : null,
            accountId: uid,
          },
        },
      });
    if (op === "dashboard")
      return route.fulfill({
        json: {
          data: {
            influencers: 0,
            campaigns: 0,
            pending: 0,
            due: 0,
            leads: 0,
            inProgress: 0,
            closed: 0,
            conversion: 0,
            activity: Array.from({ length: data.range === "7" ? 7 : 30 }, (_, i) => ({
              date: new Date(Date.UTC(2026, 10, i + 1)).toISOString().slice(0, 10),
              leads: 0,
              campaigns: 0,
            })),
            approvals: [],
            followUps: [],
          },
        },
      });
    if (op === "list") return route.fulfill({ json: { data: { rows: [], count: 0 } } });
    if (op === "add-lead")
      return route.fulfill({
        json: { data: { outcomes: [{ row: 1, status: "inserted", id: uid }] } },
      });
    return route.fulfill({
      status: 503,
      json: {
        error: { message: "Synthetic configuration blocker", code: "CONFIGURATION_REQUIRED" },
      },
    });
  });
}
test("workspace guest redirects to existing login with safe return", async ({ page }) => {
  await page.goto("/partner-workspace");
  await expect(page).toHaveURL(/\/auth\?next=%2Fpartner-workspace#login/);
  await expect(
    page.getByRole("heading", { name: "Partner Workspace is not yet installed" }),
  ).toHaveCount(0);
});
for (const path of ["/partner-workspace", "/partner-workspace/overview"])
  test(`backend error remains a retry state at ${path}, not missing membership`, async ({
    page,
  }) => {
    await fixture(page);
    await page.route("**/api/partner-workspace/access-state", (r) =>
      r.fulfill({
        status: 503,
        json: {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Authentication service unavailable. Please retry.",
          },
        },
      }),
    );
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Workspace temporarily unavailable" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry connection" })).toBeVisible();
    await expect(page.getByText("Partners membership required", { exact: true })).toHaveCount(0);
  });
for (const state of ["pending", "disabled", "missing"])
  test(`workspace ${state} state never mounts private modules`, async ({ page }) => {
    await fixture(page, "admin", state);
    await page.goto("/partner-workspace/overview");
    await expect(page.getByRole("navigation", { name: "Workspace navigation" })).toHaveCount(0);
    await expect(page.getByRole("heading")).toContainText(
      state === "pending" ? "pending" : state === "disabled" ? "disabled" : "membership required",
    );
  });
test("authorized fixture dashboard matches layout and filters, without fabricated metrics", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await fixture(page);
  await page.goto("/partner-workspace/overview");
  await expect(page.getByRole("heading", { name: "Lead & Campaign Activity" })).toBeVisible();
  await expect(page.getByText("No comparable history").first()).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Expert consultation" })).toHaveCount(0);
  const request = page.waitForRequest(
    (r) => r.url().includes("/dashboard") && r.postDataJSON()?.range === "7",
  );
  await page.getByRole("button", { name: "7 Days", exact: true }).click();
  await request;
  await expect(page.getByRole("button", { name: "7 Days", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { name: "Lead & Campaign Activity" })).toBeVisible();
  await page.screenshot({
    path: ".migration/partner-workspace/desktop-fixture.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.locator(".pw-collapsed")).toBeVisible();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await page.getByRole("link", { name: "Import Leads", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CSV import" })).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await page.getByRole("link", { name: "Add Influencer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lead for review" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
for (const width of [320, 375, 768, 1024, 1440])
  test(`workspace responsive layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await fixture(page);
    await page.goto("/partner-workspace/overview");
    await expect(page.getByRole("heading", { name: "Lead & Campaign Activity" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (width < 1000) {
      await page.getByRole("button", { name: "Open workspace navigation" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: "Influencer CRM", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Influencer CRM", exact: true }),
      ).toBeVisible();
    }
    if (width === 375) {
      await page.goto("/partner-workspace/overview");
      await expect(page.getByRole("heading", { name: "Lead & Campaign Activity" })).toBeVisible();
      await page.screenshot({
        path: ".migration/partner-workspace/mobile-fixture.png",
        fullPage: true,
      });
    }
  });
test("gamer role cannot open admin module or see its sidebar links", async ({ page }) => {
  await fixture(page, "lead_team");
  await page.goto("/partner-workspace/creators");
  await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Workspace navigation" })
      .getByRole("link", { name: "Deal Approvals" }),
  ).toHaveCount(0);
});

test("manual lead form sends validated social profiles to the authorized backend operation", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/partner-workspace/lead-add");
  await page.getByLabel("Name *", { exact: true }).fill("Synthetic creator");
  await page.getByLabel("Handle *", { exact: true }).fill("@synthetic");
  await page
    .getByLabel("HTTPS profile URL *", { exact: true })
    .fill("https://instagram.com/synthetic");
  const request = page.waitForRequest((r) => r.url().includes("/add-lead"));
  await page.getByRole("button", { name: "Save lead for review" }).click();
  const body = (await request).postDataJSON();
  expect(body.domain).toBe("influencer");
  expect(body.rows[0].socials[0].handle).toBe("synthetic");
  expect(body.rows[0].created_by_user_id).toBeUndefined();
  await expect(page.getByRole("status")).toContainText("Lead saved for admin review");
});

test("CSV preview preserves invalid rows and imports only validated rows", async ({ page }) => {
  await fixture(page);
  await page.route("**/api/partner-workspace/import-leads", (r) =>
    r.fulfill({ json: { data: { outcomes: [{ row: 1, status: "inserted" }] } } }),
  );
  await page.goto("/partner-workspace/import");
  await page.getByLabel("Choose CSV", { exact: false }).setInputFiles({
    name: "synthetic.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "name,platform,handle,url,followers\nSynthetic,instagram,synthetic,https://instagram.com/synthetic,1.2k\nInvalid,instagram,,bad,0",
    ),
  });
  await expect(page.getByText("1 valid · 1 invalid", { exact: true })).toBeVisible();
  const request = page.waitForRequest((r) => r.url().includes("/import-leads"));
  await page.getByRole("button", { name: "Import valid rows" }).click();
  expect((await request).postDataJSON().rows).toHaveLength(1);
  await expect(page.getByRole("status").first()).toContainText("1 inserted");
});
