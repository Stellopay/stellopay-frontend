import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./axe-helper";

/**
 * Dashboard accessibility tests — issue #267 (axe-core integration).
 *
 * Scans the authenticated-area dashboard, which renders account overview,
 * quick actions, and chart-heavy analytics widgets behind a simulated
 * loading state.
 */

const DASHBOARD_URL = "/dashboard";

test.describe("Dashboard", () => {
  test("renders the main sections", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("has no serious or critical accessibility violations", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);

    // The analytics widgets show a skeleton for ~1.5s before rendering real
    // content; wait for that to settle so the scan covers the loaded UI.
    await page.waitForLoadState("networkidle");

    await expectNoSeriousA11yViolations(page);
  });
});
