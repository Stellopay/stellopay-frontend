import { expect, test } from "@playwright/test";

/** Shared mobile viewport width used across drawer parity assertions.
 *  Below 768 px both drawers should collapse into their mobile variants. */
const MOBILE_WIDTH = 600;
const MOBILE_HEIGHT = 900;

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

// ── Mobile drawer parity (issue #783) ────────────────────────────────────────

test.describe("mobile drawer parity — sidebar vs dashboard-navbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({
      width: MOBILE_WIDTH,
      height: MOBILE_HEIGHT,
    });

    // Ensure the sidebar opens by default on mobile by clearing any saved
    // preference; the sidebar context initialises isSidebarOpen to true.
    await page.evaluate(() => {
      window.localStorage.removeItem("sidebarOpen");
    });

    await page.goto("/dashboard");
  });

  // ── Mobile sidebar overlay tests ─────────────────────────────────────────

  test.describe("mobile sidebar overlay (app-layout)", () => {
    test("renders as a dialog overlay on mobile", async ({ page }) => {
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      await expect(sidebarDialog).toBeVisible();
      await expect(sidebarDialog).toHaveAttribute("aria-modal", "true");
    });

    test("closes when Escape is pressed", async ({ page }) => {
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      await expect(sidebarDialog).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(sidebarDialog).not.toBeVisible();
    });

    test("closes when the backdrop overlay is clicked", async ({ page }) => {
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      await expect(sidebarDialog).toBeVisible();

      // Click the right edge of the viewport, outside the sidebar panel itself.
      // The sidebar panel is constrained to max-w-sm (384px), so clicking at
      // x=500, y=450 should hit the backdrop.
      await page.mouse.click(500, 450);

      await expect(sidebarDialog).not.toBeVisible();
    });

    test("locks body scroll when the sidebar overlay is open", async ({
      page,
    }) => {
      const overflow = await page.evaluate(
        () => document.body.style.overflow,
      );
      expect(overflow).toBe("hidden");
    });

    test("unlocks body scroll after closing via Escape", async ({ page }) => {
      await page.keyboard.press("Escape");

      const overflow = await page.evaluate(
        () => document.body.style.overflow,
      );
      expect(overflow).toBe("");
    });
  });

  // ── Dashboard navbar mobile drawer tests ──────────────────────────────────

  test.describe("dashboard-navbar mobile drawer", () => {
    test("has a hamburger toggle that opens the drawer", async ({ page }) => {
      // First close the sidebar so it doesn't overlap
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      const sidebarWasOpen = await sidebarDialog.isVisible();
      if (sidebarWasOpen) {
        await page.keyboard.press("Escape");
        await expect(sidebarDialog).not.toBeVisible();
      }

      const hamburger = page.getByRole("button", {
        name: "Open navigation menu",
      });
      await expect(hamburger).toBeVisible();

      await hamburger.click();

      const drawer = page.getByRole("dialog", {
        name: "Mobile navigation menu",
      });
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveAttribute("aria-modal", "true");
    });

    test("closes when Escape is pressed", async ({ page }) => {
      // Dismiss the sidebar first
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      if (await sidebarDialog.isVisible()) {
        await page.keyboard.press("Escape");
      }

      // Open the dashboard-navbar drawer
      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();

      const drawer = page.getByRole("dialog", {
        name: "Mobile navigation menu",
      });
      await expect(drawer).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(drawer).not.toBeVisible();
    });

    test("closes when the backdrop overlay is clicked", async ({ page }) => {
      // Dismiss the sidebar first
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      if (await sidebarDialog.isVisible()) {
        await page.keyboard.press("Escape");
      }

      // Open the dashboard-navbar drawer
      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();

      const drawer = page.getByRole("dialog", {
        name: "Mobile navigation menu",
      });
      await expect(drawer).toBeVisible();

      // Click the backdrop overlay — a fixed full-screen div behind the drawer.
      // Use the dialog's sibling backdrop by locating the aria-hidden div that
      // sits at the same DOM level and clicking at its centre.
      const overlay = page.locator(
        'div[aria-hidden="true"].fixed.inset-0',
      );
      await overlay.click();

      await expect(drawer).not.toBeVisible();
    });

    test("locks body scroll when the drawer is open", async ({ page }) => {
      // Dismiss the sidebar first
      const sidebarDialog = page.getByRole("dialog", {
        name: "Mobile sidebar navigation",
      });
      if (await sidebarDialog.isVisible()) {
        await page.keyboard.press("Escape");
      }

      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();

      const overflow = await page.evaluate(
        () => document.body.style.overflow,
      );
      expect(overflow).toBe("hidden");
    });
  });

  // ── Breakpoint parity test ────────────────────────────────────────────────

  test.describe("breakpoint parity", () => {
    test("both drawers use the same md (768px) breakpoint", async ({
      page,
    }) => {
      // At 768px (the md breakpoint), both drawers should NOT render as
      // mobile overlays — they should use their desktop layouts.
      await page.setViewportSize({ width: 768, height: 900 });
      await page.goto("/dashboard");

      // Sidebar should NOT be a modal dialog at 768px
      await expect(
        page.getByRole("dialog", { name: "Mobile sidebar navigation" }),
      ).not.toBeVisible();

      // The sidebar should be rendered inline (complementary role)
      await expect(page.getByRole("complementary")).toBeVisible();

      // Dashboard-navbar hamburger should NOT be visible at 768px (md:hidden)
      await expect(
        page.getByRole("button", { name: "Open navigation menu" }),
      ).not.toBeVisible();
    });

    test("both drawers render as mobile overlays below 768px", async ({
      page,
    }) => {
      // At 767px both drawers should collapse to mobile
      await page.setViewportSize({ width: 767, height: 900 });
      await page.evaluate(() => {
        window.localStorage.removeItem("sidebarOpen");
      });
      await page.goto("/dashboard");

      // Sidebar should be a dialog overlay
      await expect(
        page.getByRole("dialog", { name: "Mobile sidebar navigation" }),
      ).toBeVisible();

      // Dashboard-navbar hamburger should be visible
      await expect(
        page.getByRole("button", { name: "Open navigation menu" }),
      ).toBeVisible();
    });
  });

  // ── Accessibility parity ──────────────────────────────────────────────────

  test.describe("accessibility parity (WCAG 2.1 AA)", () => {
    test("both drawers expose aria-modal='true'", async ({ page }) => {
      // Sidebar overlay
      await expect(
        page.getByRole("dialog", { name: "Mobile sidebar navigation" }),
      ).toHaveAttribute("aria-modal", "true");

      // Close sidebar, open dashboard-navbar drawer
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();

      await expect(
        page.getByRole("dialog", { name: "Mobile navigation menu" }),
      ).toHaveAttribute("aria-modal", "true");
    });

    test("both drawers use role='dialog'", async ({ page }) => {
      await expect(
        page.getByRole("dialog", { name: "Mobile sidebar navigation" }),
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();

      await expect(
        page.getByRole("dialog", { name: "Mobile navigation menu" }),
      ).toBeVisible();
    });

    test("both drawer toggle buttons expose aria-expanded", async ({
      page,
    }) => {
      // Sidebar toggle (the collapse/expand button inside the sidebar header)
      const sidebarToggle = page.getByRole("button", {
        name: /collapse sidebar|expand sidebar/i,
      });
      // On mobile, the sidebar is open by default so the toggle shows "Collapse"
      await expect(sidebarToggle).toBeVisible();
      await expect(sidebarToggle).toHaveAttribute("aria-expanded", "true");

      // Close sidebar, then test the dashboard-navbar hamburger
      await page.keyboard.press("Escape");

      const hamburger = page.getByRole("button", {
        name: "Open navigation menu",
      });
      await expect(hamburger).toHaveAttribute("aria-expanded", "false");

      await hamburger.click();

      await expect(hamburger).toHaveAttribute("aria-expanded", "true");
    });

    test("both drawers have accessible names", async ({ page }) => {
      // Sidebar dialog
      await expect(
        page.getByRole("dialog", { name: "Mobile sidebar navigation" }),
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();

      // Dashboard-navbar dialog
      await expect(
        page.getByRole("dialog", { name: "Mobile navigation menu" }),
      ).toBeVisible();
    });

    test("sidebar focus returns to main content after Escape close", async ({
      page,
    }) => {
      await page.keyboard.press("Escape");

      const mainContent = page.locator("#main-content");
      await expect(mainContent).toBeFocused();
    });

    test("dashboard-navbar focus returns to hamburger after Escape close", async ({
      page,
    }) => {
      // Close sidebar first
      await page.keyboard.press("Escape");

      // Open the dashboard-navbar drawer, then close it
      await page
        .getByRole("button", { name: "Open navigation menu" })
        .click();
      await page.keyboard.press("Escape");

      await expect(
        page.getByRole("button", { name: "Open navigation menu" }),
      ).toBeFocused();
    });
  });
});
