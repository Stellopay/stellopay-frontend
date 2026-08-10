/**
 * RTL (right-to-left) smoke test for the dashboard shell.
 *
 * Forces dir="rtl" on the root <html> element and loads the dashboard
 * route, then asserts that no element overflows the viewport and no
 * text is visually clipped.  Captures a screenshot artifact for manual
 * visual review.
 *
 * RTL readiness is important because many layout primitives implicitly
 * assume LTR (flex/grid gap ordering, margins, icon chevrons, absolute
 * positioning).  This test catches regressions in overflow / clipped
 * text before eventual locale support lands.
 *
 * @see https://github.com/Stellopay/stellopay-frontend/issues/821
 */
import { test, expect } from "@playwright/test";

test.describe("Dashboard — RTL layout smoke test", () => {
  test.beforeEach(async ({ page }) => {
    // Force the document into RTL mode before any script runs.
    await page.addInitScript(() => {
      document.documentElement.setAttribute("dir", "rtl");
    });
  });

  test("dashboard shell renders without viewport overflow or clipped text", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // The dashboard shows a loading state for ~1.5s before content settles.
    await expect(page.locator("main, div").first()).toBeVisible();
    await page.waitForTimeout(2500);

    // -----------------------------------------------------------------------
    // 1. Assert the page itself does not scroll horizontally under RTL.
    //    When dir="rtl" breaks a layout, the document grows wider than the
    //    viewport and a horizontal scrollbar appears — this is the classic
    //    RTL regression signal.
    // -----------------------------------------------------------------------
    const pageOverflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });
    expect(pageOverflow.scrollWidth).toBeLessThanOrEqual(
      pageOverflow.clientWidth + 1,
    );

    // -----------------------------------------------------------------------
    // 2. Assert no visible element extends beyond the viewport's horizontal
    //    edges (content clipped to the right in RTL, i.e. the inline-start).
    //    We skip elements that are intentionally off-screen (sr-only,
    //    hidden, or zero-size) to avoid false positives.
    // -----------------------------------------------------------------------
    const offscreenCount = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      let count = 0;
      const all = document.querySelectorAll<HTMLElement>("body *");
      for (const el of all) {
        const style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) === 0
        ) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // Anything sticking out more than 1px past the viewport edge is a
        // likely RTL overflow bug.
        if (rect.right > viewportWidth + 1 || rect.left < -1) {
          count++;
        }
      }
      return count;
    });
    expect(offscreenCount).toBe(0);

    // -----------------------------------------------------------------------
    // 3. Capture a full-page screenshot for manual visual review by the team.
    // -----------------------------------------------------------------------
    await page.screenshot({
      path: "__screenshots__/rtl-dashboard.png",
      fullPage: true,
    });
  });
});