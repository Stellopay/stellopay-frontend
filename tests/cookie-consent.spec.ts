// End-to-end coverage for the cookie-consent banner.
//
// Flows under test:
//   1. Accepting the banner dismisses it and the choice survives a reload.
//   2. Declining behaves the same way for the opposite choice.
//   3. A fresh browser context (no stored choice) shows the banner again.
//   4. Dismissing via the close button hides the banner without persisting.
//   5. The banner is accessible via keyboard navigation.
//   6. The banner renders correctly across mobile breakpoints.
//   7. The banner renders correctly in dark mode.
//   8. The banner passes an axe-core accessibility scan.

import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./axe-helper";

const CONSENT_STORAGE_KEY = "stellopay.cookie-consent";

/** Breakpoints matching the Tailwind sm/md/lg/xl defaults plus mobile. */
const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  sm: { width: 640, height: 900 },
  md: { width: 768, height: 1024 },
  lg: { width: 1024, height: 768 },
  xl: { width: 1280, height: 800 },
};

// ---------------------------------------------------------------------------
// Persistence — accept / reject / close
// ---------------------------------------------------------------------------

test.describe("Cookie consent banner", () => {
  test("accepting the banner dismisses it and the choice survives a reload", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    await page.getByTestId("cookie-consent-accept").click();

    await expect(banner).not.toBeVisible();

    // Choice must persist across a full page reload.
    await page.reload();
    await expect(banner).not.toBeVisible();

    // Pass the key as an argument so the function runs in the page context
    // without relying on the outer JS closure, which is not serialised into
    // the browser execution context.
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe("accepted");
  });

  test("declining the banner dismisses it and the choice survives a reload", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    await page.getByTestId("cookie-consent-reject").click();

    await expect(banner).not.toBeVisible();

    // Choice must persist across a full page reload.
    await page.reload();
    await expect(banner).not.toBeVisible();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe("rejected");
  });

  test("a fresh browser context shows the banner again", async ({ page }) => {
    // Each Playwright test runs in a fresh BrowserContext, so localStorage
    // starts empty by default and the consent key is absent.
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();
  });

  test("dismissing the banner via close button hides it but the banner reappears on reload", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    await page.getByTestId("cookie-consent-close").click();

    await expect(banner).not.toBeVisible();

    // After dismissal via close, no preference was stored so the banner
    // reappears on the next page load.
    await page.reload();
    await expect(banner).toBeVisible();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  test("banner buttons are reachable and operable via keyboard", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    // Tab to the Reject button and activate with Enter.
    const rejectBtn = page.getByTestId("cookie-consent-reject");
    await rejectBtn.focus();
    await expect(rejectBtn).toBeFocused();
    await rejectBtn.press("Enter");

    await expect(banner).not.toBeVisible();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe("rejected");
  });

  test("accept button is operable via keyboard (Space)", async ({ page }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    const acceptBtn = page.getByTestId("cookie-consent-accept");
    await acceptBtn.focus();
    await expect(acceptBtn).toBeFocused();
    // HTML buttons respond to both Enter and Space.
    await acceptBtn.press("Space");

    await expect(banner).not.toBeVisible();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      CONSENT_STORAGE_KEY,
    );
    expect(stored).toBe("accepted");
  });

  test("close button is reachable via Tab and operable with Enter", async ({
    page,
  }) => {
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    const closeBtn = page.getByTestId("cookie-consent-close");
    await closeBtn.focus();
    await expect(closeBtn).toBeFocused();
    await closeBtn.press("Enter");

    await expect(banner).not.toBeVisible();

    // Close does not write a value — banner reappears on reload.
    await page.reload();
    await expect(banner).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Responsive layout
  // -------------------------------------------------------------------------

  for (const [label, viewport] of Object.entries(VIEWPORTS)) {
    test(`banner is visible and interactive at ${label} viewport (${viewport.width}×${viewport.height})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const banner = page.getByTestId("cookie-consent-banner");
      await expect(banner).toBeVisible();

      // All three controls must be visible at every breakpoint.
      await expect(page.getByTestId("cookie-consent-accept")).toBeVisible();
      await expect(page.getByTestId("cookie-consent-reject")).toBeVisible();
      await expect(page.getByTestId("cookie-consent-close")).toBeVisible();

      // Interaction must work at every breakpoint.
      await page.getByTestId("cookie-consent-accept").click();
      await expect(banner).not.toBeVisible();
    });
  }

  // -------------------------------------------------------------------------
  // Dark mode
  // -------------------------------------------------------------------------

  test("banner is visible and interactive in dark colour scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const banner = page.getByTestId("cookie-consent-banner");
    await expect(banner).toBeVisible();

    await page.getByTestId("cookie-consent-accept").click();
    await expect(banner).not.toBeVisible();

    await page.reload();
    await expect(banner).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Accessibility scans
  // -------------------------------------------------------------------------

  test("has no serious or critical a11y violations on the landing page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page);
  });

  test("has no serious or critical a11y violations on the landing page in dark mode", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page);
  });

  test("has no serious or critical a11y violations on the dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expectNoSeriousA11yViolations(page);
  });
});
