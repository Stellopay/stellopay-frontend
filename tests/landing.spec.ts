import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders the App Router hero on /", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /the future of payroll on blockchain/i }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
