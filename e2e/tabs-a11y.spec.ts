/**
 * Accessibility tests for the Tabs component (components/ui/tabs.tsx).
 *
 * Verifies the roving-tabindex keyboard behavior matches the WAI-ARIA
 * tabs pattern (ArrowLeft/Right, Home, End) and that axe-core finds
 * no violations on a page using the tabs component.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Tabs — roving-tabindex keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the settings page which uses the Tabs component
    await page.goto("/");
    // Wait for the tabs to be fully rendered
    await page.waitForSelector('[data-slot="tabs"]');
  });

  test("axe-core finds no accessibility violations on the tabs component", async ({
    page,
  }) => {
    const results = await new AxeBuilder({ page })
      .include('[data-slot="tabs"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("ArrowRight moves focus to the next tab", async ({ page }) => {
    // Focus the first tab trigger
    const firstTab = page.locator('[data-slot="tabs-trigger"]').first();
    await firstTab.focus();

    // Press ArrowRight
    await page.keyboard.press("ArrowRight");

    // The second tab should now be focused
    const secondTab = page.locator('[data-slot="tabs-trigger"]').nth(1);
    await expect(secondTab).toBeFocused();
  });

  test("ArrowLeft moves focus to the previous tab", async ({ page }) => {
    // Focus the second tab trigger
    const secondTab = page.locator('[data-slot="tabs-trigger"]').nth(1);
    await secondTab.focus();

    // Press ArrowLeft
    await page.keyboard.press("ArrowLeft");

    // The first tab should now be focused
    const firstTab = page.locator('[data-slot="tabs-trigger"]').first();
    await expect(firstTab).toBeFocused();
  });

  test("ArrowRight from the last tab wraps to the first tab", async ({
    page,
  }) => {
    const allTabs = page.locator('[data-slot="tabs-trigger"]');
    const tabCount = await allTabs.count();

    // Focus the last tab
    const lastTab = allTabs.nth(tabCount - 1);
    await lastTab.focus();

    // Press ArrowRight
    await page.keyboard.press("ArrowRight");

    // The first tab should now be focused (wrap-around)
    const firstTab = allTabs.first();
    await expect(firstTab).toBeFocused();
  });

  test("ArrowLeft from the first tab wraps to the last tab", async ({
    page,
  }) => {
    const allTabs = page.locator('[data-slot="tabs-trigger"]');
    const tabCount = await allTabs.count();

    // Focus the first tab
    const firstTab = allTabs.first();
    await firstTab.focus();

    // Press ArrowLeft
    await page.keyboard.press("ArrowLeft");

    // The last tab should now be focused (wrap-around)
    const lastTab = allTabs.nth(tabCount - 1);
    await expect(lastTab).toBeFocused();
  });

  test("Home moves focus to the first tab", async ({ page }) => {
    const allTabs = page.locator('[data-slot="tabs-trigger"]');
    const tabCount = await allTabs.count();

    // Focus a middle tab
    const middleTab = allTabs.nth(Math.floor(tabCount / 2));
    await middleTab.focus();

    // Press Home
    await page.keyboard.press("Home");

    // The first tab should now be focused
    const firstTab = allTabs.first();
    await expect(firstTab).toBeFocused();
  });

  test("End moves focus to the last tab", async ({ page }) => {
    const allTabs = page.locator('[data-slot="tabs-trigger"]');
    const tabCount = await allTabs.count();

    // Focus a middle tab
    const middleTab = allTabs.nth(Math.floor(tabCount / 2));
    await middleTab.focus();

    // Press End
    await page.keyboard.press("End");

    // The last tab should now be focused
    const lastTab = allTabs.nth(tabCount - 1);
    await expect(lastTab).toBeFocused();
  });

  test("correct tabpanel receives aria-hidden=false when its tab is activated", async ({
    page,
  }) => {
    const allTabs = page.locator('[data-slot="tabs-trigger"]');
    const tabCount = await allTabs.count();

    // Click the second tab (if more than one)
    if (tabCount > 1) {
      const secondTab = allTabs.nth(1);
      await secondTab.click();

      // The second tabpanel should be visible (not aria-hidden)
      const secondPanel = page.locator('[data-slot="tabs-content"]').nth(1);
      await expect(secondPanel).toBeVisible();
      await expect(secondPanel).not.toHaveAttribute("aria-hidden", "true");

      // The first tabpanel should be hidden
      const firstPanel = page.locator('[data-slot="tabs-content"]').first();
      await expect(firstPanel).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("keyboard activation with Enter selects the focused tab", async ({
    page,
  }) => {
    const allTabs = page.locator('[data-slot="tabs-trigger"]');
    const tabCount = await allTabs.count();

    if (tabCount > 1) {
      // Arrow to the second tab
      const firstTab = allTabs.first();
      await firstTab.focus();
      await page.keyboard.press("ArrowRight");

      // Press Enter to activate
      await page.keyboard.press("Enter");

      // The second tab should now have data-state="active"
      const secondTab = allTabs.nth(1);
      await expect(secondTab).toHaveAttribute("data-state", "active");
    }
  });
});
