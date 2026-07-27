import { expect, test } from "@playwright/test";

test.describe("landing mobile navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
  });

  test("restores an open menu after a page reload", async ({ page }) => {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "Mobile navigation menu" }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("landingMobileNavOpen"),
        ),
      )
      .toBe("true");

    await page.reload();

    await expect(
      page.getByRole("navigation", { name: "Mobile navigation menu" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close menu" }),
    ).toBeVisible();
  });

  test("keeps the compact header intact below the desktop breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.reload();

    await expect(page.getByRole("button", { name: /menu$/i })).toBeVisible();
    const header = page.locator("header");
    await expect(header).toHaveJSProperty("scrollWidth", 1024);
  });
});
