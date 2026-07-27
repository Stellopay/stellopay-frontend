import { expect, test } from "@playwright/test";

test.describe("sidebar preference persistence", () => {
  test("restores the collapsed state after a page reload", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect(
      page.getByRole("button", { name: "Expand sidebar" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => window.localStorage.getItem("sidebarOpen")),
      )
      .toBe("false");

    await page.reload();

    await expect(
      page.getByRole("button", { name: "Expand sidebar" }),
    ).toBeVisible();
  });

  test("uses the expanded default when no preference is stored", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.evaluate(() => window.localStorage.removeItem("sidebarOpen"));

    await page.reload();

    await expect(
      page.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeVisible();
  });
});
