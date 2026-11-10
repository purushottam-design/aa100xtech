import { test, expect } from "@playwright/test";

test("consolidated URLs redirect without changing distinct marketing and profile routes", async ({
  request,
  page,
}) => {
  for (const path of ["/influencers", "/influencer-programs"]) {
    const response = await request.get(`${path}?source=saved-link`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toBe("/influencer-partners?source=saved-link");
  }
  for (const path of [
    "/influencer-marketing",
    "/influencer-marketing/for-brands",
    "/influencer-marketing/for-influencers",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  }
  await page.goto("/influencers#benefits");
  await expect(page).toHaveURL(/\/influencer-partners#benefits$/);
  await expect(page.locator("#partner-details")).toHaveAttribute("open", "");
  await expect(page.locator("#benefits-title")).toBeInViewport();
});

test("unified program has accessible sections, working navigation and preserved services", async ({
  page,
}) => {
  await page.goto("/influencer-partners");
  await expect(page.locator("h1")).toHaveText("Influencer Programs & Influencer Marketing");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(
    navigation.getByRole("button", { name: "Marketing", exact: true }),
  ).toHaveAttribute("data-active", "true");
  for (const name of ["For Influencers", "For Brands", "How It Works"]) {
    const link = page
      .getByRole("navigation", { name: "Explore the partner program" })
      .getByRole("link", { name });
    await link.click();
    const href = await link.getAttribute("href");
    await expect(page.locator(href!)).toBeInViewport();
  }
  await page.getByRole("link", { name: "Explore creator services", exact: true }).click();
  await expect(page.locator("#creative-services")).toHaveAttribute("open", "");
  await expect(
    page.locator("#creative-services").getByRole("link", { name: "Inquire", exact: true }),
  ).toHaveCount(10);
  await page.getByRole("link", { name: "Explore partner benefits", exact: true }).click();
  await expect(page.locator("#partner-details")).toHaveAttribute("open", "");
  await expect(page.locator("#faq-title")).toHaveText(/Good questions/);
});
