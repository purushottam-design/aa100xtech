import { expect as baseExpect, test } from "@playwright/test";
import nextEnv from "@next/env";
const expect = baseExpect.configure({ timeout: 30_000 });

// No traces/screenshots/video: an opted-in live run types operator credentials.
test.use({
  trace: "off",
  screenshot: "off",
  video: "off",
  serviceWorkers: "block",
});
const live = process.env["ADMIN_LIVE_E2E"] === "true";
if (live) nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
process.env["PLAYWRIGHT_NO_COPY_PROMPT"] = "1";
test.beforeEach(async ({ page, baseURL }) => {
  page.setDefaultTimeout(30_000);
  // Keep ngrok's automation header on this origin only. Service workers are
  // blocked in this isolated context so requests remain interceptable.
  if (new URL(baseURL!).hostname.endsWith(".ngrok-free.dev")) {
    await page.route(`${new URL(baseURL!).origin}/**`, (route) =>
      route.continue({
        headers: { ...route.request().headers(), "ngrok-skip-browser-warning": "1" },
      }),
    );
  }
});

test("dashboard login displays invalid credentials and recovers from a network failure", async ({
  page,
}) => {
  await page.goto("/app/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Checking your roles…", { exact: true })).toBeHidden({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Super Admin Login" })).toBeVisible();
  await dialog.getByLabel("Email", { exact: true }).fill("fixture@example.test");
  await dialog.getByLabel("Password", { exact: true }).fill("invalid-fixture-password");
  await page.route("**/api/rpc/dashboard-auth/dashboardLogin", (route) =>
    route.fulfill({
      json: {
        data: { ok: false, code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
      },
    }),
  );
  await dialog.getByRole("button", { name: "Login", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Invalid email or password.");
  await expect(dialog.getByRole("button", { name: "Login", exact: true })).toBeEnabled();
  await page.unroute("**/api/rpc/dashboard-auth/dashboardLogin");
  await page.route("**/api/rpc/dashboard-auth/dashboardLogin", (route) => route.abort("failed"));
  await dialog.getByRole("button", { name: "Login", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Login", exact: true })).toBeEnabled();
  await expect(page).toHaveURL(/\/app\/admin$/);
});

test("live configured administrator: login, refresh, logout, revoked bearer and protected route", async ({
  page,
  baseURL,
}) => {
  test.skip(!live, "Opt in with ADMIN_LIVE_E2E=true; no database roles or passwords are changed.");
  test.setTimeout(180_000);
  const accountPrefix = process.env["ADMIN_LIVE_ACCOUNT"] === "dedicated" ? "SUPER_ADMIN" : "ADMIN";
  const email = process.env[`${accountPrefix}_EMAIL`];
  const password = process.env[`${accountPrefix}_PASSWORD`];
  // Assert availability only, never print credential values in assertion output.
  expect(Boolean(email && password)).toBe(true);
  const target = new URL(baseURL!);
  expect(
    target.hostname === "127.0.0.1" || target.origin === process.env["DEV_TUNNEL_ORIGIN"],
  ).toBe(true);
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth$/);
  await page.goto("/app/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Checking your roles…", { exact: true })).toBeHidden({
    timeout: 30_000,
  });
  await page.getByRole("button", { name: "Continue", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email", { exact: true }).fill(email!);
  await dialog.getByLabel("Password", { exact: true }).fill(password!);
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/rpc/dashboard-auth/dashboardLogin"),
  );
  await dialog.getByRole("button", { name: "Login", exact: true }).click();
  const result = (await (await response).json()).data;
  expect(result?.ok === true).toBe(true);
  const token = result.session.access_token as string;
  try {
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Admin console", exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Admin console", exact: true })).toBeVisible();
    await page.goto("/app/profile", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect(page).toHaveURL(/\/app\/login$/);
    const revoked = await fetch(`${target.origin}/api/rpc/accounts/getSupremeAdminAccess`, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "x-aa-rpc": "1",
        origin: target.origin,
        authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "1",
      },
    });
    expect(revoked.status).toBe(401);
    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth$/);
  } finally {
    // Best-effort revoke ONLY this test session if an assertion fails midway.
    await fetch(`${process.env["SUPABASE_URL"]}/auth/v1/logout?scope=local`, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: {
        apikey: process.env["SUPABASE_PUBLISHABLE_KEY"]!,
        authorization: `Bearer ${token}`,
      },
    }).catch(() => undefined);
  }
});
