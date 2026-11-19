import { expect, test } from "@playwright/test";

test("workspace entry reports missing integration without checking a guest session", async ({
  page,
}) => {
  const authRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/")) authRequests.push(request.url().split("?")[0]);
  });
  // An unreachable auth service must not hide the workspace's installation status.
  await page.route("**/auth/v1/**", (route) => route.abort("failed"));
  const response = await page.goto("/partner-workspace");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "Partner Workspace is not yet installed" }),
  ).toBeVisible();
  await expect(page.getByText("Unable to check your session.", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "AA100XTech login", exact: true })).toHaveAttribute(
    "href",
    "/auth?next=%2Fpartner-workspace#login",
  );
  expect(authRequests).toEqual([]);
});
