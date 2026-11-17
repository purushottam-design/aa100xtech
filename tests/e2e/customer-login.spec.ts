import { expect as baseExpect, test } from "@playwright/test";
const expect = baseExpect.configure({ timeout: 30_000 });
test.setTimeout(120_000);

test.use({ serviceWorkers: "block" });

test.beforeEach(async ({ page }) => {
  // All auth and booking availability responses are synthetic; no account is created.
  await page.route("**/api/payments/icici/availability", (route) =>
    route.fulfill({ json: { available: false } }),
  );
});

test("guest booking requires login and keeps its destination when switching to signup", async ({
  page,
}) => {
  await page.goto("/consultation?book=quick", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth\?next=.*consultation.*book.*quick#login/);
  await expect(page.getByText("Already have an account?", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("header").getByRole("link", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\?next=.*consultation.*book.*quick#signup/);
  await expect(page.getByText("Create your account", { exact: true })).toBeVisible();
});

test("returning customer logs in, resumes the chosen booking and stays logged in on reload", async ({
  page,
}) => {
  const user = {
    id: "00000000-0000-4000-8000-000000000042",
    email: "customer@example.test",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", exp: expires })}.synthetic-signature`;
  await page.route("**/auth/v1/**", (route) => {
    if (route.request().url().includes("/token")) {
      const credentials = route.request().postDataJSON();
      expect(credentials.email).toBe(user.email);
      expect(credentials.password).toBe("existing-password");
      return route.fulfill({
        json: {
          access_token: token,
          refresh_token: "synthetic-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
          expires_at: expires,
          user,
        },
      });
    }
    return route.fulfill({ json: user });
  });
  await page.route("**/api/rpc/admin-management/recordAdminLogin", (route) =>
    route.fulfill({ json: { data: { blocked: false } } }),
  );
  await page.route("**/api/rpc/accounts/getMyAccount", (route) =>
    route.fulfill({ json: { data: { roles: ["customer"] } } }),
  );
  await page.goto("/consultation?book=quick", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth\?/);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill("existing-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/consultation$/);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByPlaceholder("you@company.com", { exact: true })).toHaveValue(user.email);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Book Now", exact: true }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/consultation$/);
});

test("guest enquiry pages redirect but policy pages stay accessible", async ({ page }) => {
  await page.goto("/contact", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth\?next=%2Fcontact#login/);
  await page.goto("/privacy-policy", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/privacy-policy$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
});
