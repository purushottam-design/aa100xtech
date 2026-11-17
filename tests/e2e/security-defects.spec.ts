import { test, expect as baseExpect, type Page } from "@playwright/test";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const expect = baseExpect.configure({ timeout: 30_000 });
test.setTimeout(120_000);
test.use({ serviceWorkers: "block", reducedMotion: "reduce" });

const path = "/security-identity-defect";
const id = "00000000-0000-4000-8000-000000000010";
const user = {
  id: "00000000-0000-4000-8000-000000000042",
  email: "customer@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const ticket = {
  id,
  ticket_number: 1,
  full_name: "Test Customer",
  email: user.email,
  phone: "+910000000000",
  company: "Test Company",
  category: "Authentication",
  title: "Unable to verify my login",
  description:
    "Synthetic report: the login verification step returns an error after entering the required details.",
  priority: "High",
  status: "Open",
  created_at: "2026-11-17T06:00:00Z",
  updated_at: "2026-11-17T06:00:00Z",
  attachment_name: "attachment.pdf",
};

test.beforeEach(async ({ page }) => {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const expires = Math.floor(Date.now() / 1000) + 3600;
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

async function mockTickets(page: Page, admin = false, initial = [ticket]) {
  let rows = initial.map((row) => ({ ...row }));
  const submissions: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];
  await page.route("**/api/security-defects**", async (route) => {
    const request = route.request();
    expect(request.headers()["authorization"]).toMatch(/^Bearer /);
    if (request.url().endsWith("/attachment"))
      return route.fulfill({
        contentType: "application/pdf",
        body: "%PDF-1.7\nSynthetic test attachment\n%%EOF",
      });
    if (request.method() === "POST") {
      const form = await new Response(request.postDataBuffer(), {
        headers: { "content-type": request.headers()["content-type"]! },
      }).formData();
      const data = JSON.parse(String(form.get("data")));
      submissions.push(data);
      rows = [
        {
          ...ticket,
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
        },
      ];
      return route.fulfill({
        status: 201,
        json: {
          saved: true,
          ticket: { id: data.id, ticket_number: 1, status: "Open", created: true },
        },
      });
    }
    if (request.method() === "PATCH") {
      const update = request.postDataJSON();
      updates.push(update);
      rows = rows.map((row) => (row.id === update.id ? { ...row, status: update.status } : row));
      return route.fulfill({
        json: { saved: true, ticket: rows.find((row) => row.id === update.id) },
      });
    }
    const url = new URL(request.url());
    const status = url.searchParams.get("status");
    const query = url.searchParams.get("q")?.toLowerCase();
    const visible = rows.filter(
      (row) =>
        (!status || status === "all" || row.status === status) &&
        (!query ||
          row.title.toLowerCase().includes(query) ||
          `sid-${String(row.ticket_number).padStart(6, "0")}` === query),
    );
    return route.fulfill({
      json: { rows: visible, total: visible.length, canReview: admin, canManage: admin },
    });
  });
  return { submissions, updates };
}

for (const width of [1440, 768, 375]) {
  test(`new service button sits below both featured links and opens a responsive page at ${width}px`, async ({
    page,
  }, testInfo) => {
    await mockTickets(page, false, []);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    let menu;
    if (width >= 1280) {
      await expect(page.getByRole("button", { name: "My account", exact: true })).toBeVisible();
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: "Services", exact: true })
        .press("ArrowDown");
      menu = page.locator("[data-service-panel]");
    } else {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      menu = page.getByRole("dialog");
      await expect(menu.getByRole("link", { name: "My account", exact: true })).toBeVisible();
      await menu.getByRole("button", { name: "Services", exact: true }).click();
    }
    const identity = menu.getByRole("link", {
      name: "One Identity One World One Person",
      exact: true,
    });
    const pride = menu.getByRole("link", { name: "My Name My Pride - Be The One", exact: true });
    const security = menu.getByRole("link", { name: "Security & Identity Defect", exact: true });
    await expect(security).toBeVisible();
    const a = await identity.boundingBox();
    const b = await pride.boundingBox();
    const c = await security.boundingBox();
    expect(c!.y).toBeGreaterThanOrEqual(Math.max(a!.y + a!.height, b!.y + b!.height));
    if (width >= 1280) {
      expect(c!.width).toBeGreaterThan(a!.width + b!.width);
    }
    await page.screenshot({ path: testInfo.outputPath(`security-menu-${width}.png`) });
    await security.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole("heading", { name: "Security & Identity Defect", exact: true }),
    ).toBeVisible();
    await expect(menu).toHaveCount(0);
    await expect(page).toHaveTitle("Security & Identity Defect | AA100XTech");
    await expect(page.getByText("No tickets yet", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole("link", { name: "Report an Issue", exact: true }).click();
    await expect(page).toHaveURL(/#report-issue$/);
    await expect(page.getByLabel("Full Name", { exact: true })).toBeInViewport();
    await expect(
      page.getByRole("link", { name: "Talk to an Expert", exact: true }),
    ).toHaveAttribute("href", "/consultation");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: testInfo.outputPath(`security-page-${width}.png`),
      fullPage: true,
    });
  });
}

test("report validation, submission, ticket search, filtering, details and attachment download work", async ({
  page,
}) => {
  const state = await mockTickets(page, false, []);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const submit = page.getByRole("button", { name: "Submit report", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByText("Enter your full name.", { exact: true })).toBeVisible();
  expect(state.submissions).toHaveLength(0);
  await page.getByLabel("Full Name", { exact: true }).fill(ticket.full_name);
  await page.getByLabel("Email Address", { exact: true }).fill(ticket.email);
  await page.getByLabel("Phone Number", { exact: true }).fill(ticket.phone);
  await page.getByLabel("Company Name (optional)", { exact: true }).fill(ticket.company);
  await page.getByLabel("Issue Category", { exact: true }).selectOption("Authentication");
  await page.getByLabel("Priority Level", { exact: true }).selectOption("High");
  await page.getByLabel("Issue Title", { exact: true }).fill(ticket.title);
  await page.getByLabel("Detailed Description", { exact: true }).fill(ticket.description);
  await page.getByLabel("Screenshot or File Attachment (optional)", { exact: true }).setInputFiles({
    name: "report.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nSynthetic report\n%%EOF"),
  });
  await submit.click();
  await expect(page.getByText("Report saved: SID-000001", { exact: true })).toBeVisible();
  expect(state.submissions).toHaveLength(1);
  expect(state.submissions[0]).toMatchObject({
    title: ticket.title,
    category: "Authentication",
    priority: "High",
  });
  await expect(page.getByLabel("Issue Title", { exact: true })).toHaveValue("");
  await page.getByLabel("Ticket ID or issue title", { exact: true }).fill("SID-000001");
  await page.getByRole("button", { name: "Search tickets", exact: true }).click();
  await expect(page.getByRole("cell", { name: "SID-000001", exact: true })).toBeVisible();
  await page.getByLabel("Filter by status", { exact: true }).selectOption("Resolved");
  await expect(page.getByText("No matching tickets", { exact: true })).toBeVisible();
  await page.getByLabel("Filter by status", { exact: true }).selectOption("all");
  await page
    .getByRole("button", { name: `${ticket.title} — View ticket details`, exact: true })
    .filter({ visible: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(ticket.description, { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Update ticket status", { exact: true })).toHaveCount(0);
  const downloading = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download attachment", exact: true }).click();
  expect((await downloading).suggestedFilename()).toContain("SID-000001");
});

test("support administrators can review the queue and update a ticket status", async ({ page }) => {
  const state = await mockTickets(page, true);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Ticket access", { exact: true }).selectOption("team");
  await page
    .getByRole("button", { name: `${ticket.title} — View ticket details`, exact: true })
    .filter({ visible: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Update ticket status", { exact: true }).selectOption("In Progress");
  await dialog.getByRole("button", { name: "Save status", exact: true }).click();
  await expect(dialog.getByText("Ticket status updated.", { exact: true })).toBeVisible();
  expect(state.updates).toEqual([{ id, previousStatus: "Open", status: "In Progress" }]);
  await expect(dialog.getByText("In Progress", { exact: true }).first()).toBeVisible();

  let finishUpdate!: () => void;
  const pendingUpdate = new Promise<void>((resolve) => {
    finishUpdate = resolve;
  });
  await page.route("**/api/security-defects", async (route) => {
    if (route.request().method() === "PATCH") await pendingUpdate;
    return route.fallback();
  });
  await dialog.getByLabel("Update ticket status", { exact: true }).selectOption("Resolved");
  await dialog.getByRole("button", { name: "Save status", exact: true }).click();
  await expect(dialog.getByRole("button", { name: "Saving…", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  finishUpdate();
  await expect.poll(() => state.updates.length).toBe(2);
  await expect(page.getByRole("cell", { name: "Resolved", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("backend outages show an honest error and keep unsaved form details", async ({ page }) => {
  let submittedId: string | null = null;
  let attempts = 0;
  await page.route("**/api/security-defects**", async (route) => {
    if (route.request().method() === "POST") {
      const request = route.request();
      const form = await new Response(request.postDataBuffer(), {
        headers: { "content-type": request.headers()["content-type"]! },
      }).formData();
      const data = JSON.parse(String(form.get("data")));
      if (submittedId) expect(data.id).toBe(submittedId);
      submittedId = data.id;
      attempts++;
    }
    return route.fulfill({
      status: 503,
      json: { message: "Security reports are temporarily unavailable. Please try again." },
    });
  });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Full Name", { exact: true }).fill(ticket.full_name);
  await page.getByLabel("Email Address", { exact: true }).fill(ticket.email);
  await page.getByLabel("Phone Number", { exact: true }).fill(ticket.phone);
  await page.getByLabel("Issue Title", { exact: true }).fill(ticket.title);
  await page.getByLabel("Detailed Description", { exact: true }).fill(ticket.description);
  await page.getByRole("button", { name: "Submit report", exact: true }).click();
  await expect(page.getByLabel("Issue Title", { exact: true })).toHaveValue(ticket.title);
  await expect(page.getByText(/Report saved:/)).toHaveCount(0);
  await page.getByRole("button", { name: "Submit report", exact: true }).click();
  await expect.poll(() => attempts).toBe(2);
  await expect(page.getByText("No tickets yet", { exact: true })).toHaveCount(0);
});

test("guest API requests cannot read tickets and the page preserves login navigation", async ({
  browser,
  request,
}) => {
  const response = await request.get("/api/security-defects");
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toBe("no-store");
  const context = await browser.newContext();
  try {
    const guest = await context.newPage();
    await guest.goto(`${process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100"}${path}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(guest).toHaveURL(/\/auth\?next=%2Fsecurity-identity-defect#login/);
  } finally {
    await context.close();
  }
});
