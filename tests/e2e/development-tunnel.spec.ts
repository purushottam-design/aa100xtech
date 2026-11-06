import { test, expect } from "@playwright/test";

test.skip(process.env["VERIFY_DEV_TUNNEL"] !== "true", "Requires the running Next.js dev server");

for (const width of [1440, 390]) {
  test(`development resources and hydrated UI work at ${width}px`, async ({ page, request }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    let frames = 0;
    const socketErrors: string[] = [];
    page.on("websocket", (socket) => {
      if (!socket.url().includes("/_next/hmr")) return;
      socket.on("framereceived", () => frames++);
      socket.on("socketerror", (error) => socketErrors.push(String(error)));
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const heading = page.getByRole("heading", {
      name: /Expert IT & Digital Marketing Solutions for Your Business/,
    });
    const consent = page.getByRole("button", { name: /visit site/i });
    await expect(heading.or(consent)).toBeVisible({ timeout: 45_000 });
    if (await consent.isVisible()) await consent.click();
    await expect(heading).toBeVisible({ timeout: 30_000 });
    const origin = new URL(page.url()).origin;

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "crossorigin",
      "use-credentials",
    );
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')!;
      const response = await fetch(link.href, { credentials: "include" });
      return {
        status: response.status,
        type: response.headers.get("content-type"),
        body: await response.json(),
      };
    });
    expect(manifest.status).toBe(200);
    expect(manifest.type).toContain("application/manifest+json");
    expect(manifest.body.start_url).toBe("/");
    expect(manifest.body.display).toBe("browser");

    await page.getByText("Projects completed", { exact: true }).scrollIntoViewIfNeeded();
    for (const [label, value] of [
      ["Projects completed", "200+"],
      ["Client satisfaction", "98%"],
      ["Years of team experience", "10+"],
    ]) {
      await expect(page.getByText(label!, { exact: true }).locator("..")).toContainText(value!, {
        timeout: 30_000,
      });
    }
    await expect(page.getByRole("link", { name: "Book Consultation", exact: true })).toBeVisible();
    if (width < 640) await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Sign in / Sign up", exact: true }).filter({ visible: true }),
    ).toBeVisible({ timeout: 45_000 });
    if (width < 640) await page.getByRole("button", { name: "Close", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect.poll(() => frames).toBeGreaterThan(0);
    expect(socketErrors).toEqual([]);
    expect(errors).toEqual([]);

    const font = await request.get("/__nextjs_font/geist-latin.woff2", { headers: { origin } });
    expect(font.status()).toBe(200);
    expect(font.headers()["content-type"]).toContain("font/woff2");
    expect((await font.body()).subarray(0, 4).toString()).toBe("wOF2");
    const forbidden = await request.get("/__nextjs_font/geist-latin.woff2", {
      headers: { origin: "https://untrusted.example.test" },
    });
    expect(forbidden.status()).toBe(403);
    const auth = await request.post("/api/rpc/payments/listPayments", {
      headers: { origin, "x-aa-rpc": "1" },
      data: { data: {} },
    });
    expect(auth.status()).toBe(401);
    const crossSite = await request.post("/api/rpc/payments/listPayments", {
      headers: { origin: "https://untrusted.example.test", "x-aa-rpc": "1" },
      data: { data: {} },
    });
    expect(crossSite.status()).toBe(403);

    await page.getByRole("link", { name: "Book Consultation", exact: true }).click();
    await expect(page).toHaveURL(/\/consultation$/);
    await page.getByRole("button", { name: "Book Now", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Booking Details", exact: true })).toBeVisible();
  });
}

test("server-rendered counters and consultation link do not depend on hydration", async ({
  request,
  browser,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setContent(await response.text(), { waitUntil: "domcontentloaded" });
  for (const [label, value] of [
    ["Projects completed", "200+"],
    ["Client satisfaction", "98%"],
    ["Years of team experience", "10+"],
  ])
    await expect(page.getByText(label!, { exact: true }).locator("..")).toContainText(value!);
  await expect(page.getByRole("link", { name: "Book Consultation", exact: true })).toHaveAttribute(
    "href",
    "/consultation",
  );
  await context.close();
});
