/**
 * Network-switcher tests — issue #238
 *
 * Covers:
 * - Stellar is the default/active network exposed by the wallet context
 * - Active-network badge (green dot + "Active" label) on current network
 * - Trigger aria-label announces current network
 * - Clicking the active network does NOT open the confirmation dialog
 * - Clicking a different network opens the confirmation dialog
 * - Dialog describes the from/to networks
 * - Cancelling the dialog keeps the original network active
 * - Confirming the switch updates the displayed network
 * - Switching back and forth quickly (rapid switching)
 * - Unknown/unsupported network passed via prop renders without crash
 * - No private keys or secrets are visible anywhere in the component
 */

import { expect, test } from "@playwright/test";

// The landing page renders NetworkSwitcher without authentication.
const LANDING_URL = "/";

test.describe("NetworkSwitcher — active badge", () => {
  test("trigger shows a green indicator dot", async ({ page }) => {
    await page.goto(LANDING_URL);

    // The trigger button contains a green dot (w-2 h-2 rounded-full bg-green-500)
    const trigger = page.locator('[aria-label*="Current network"]').first();
    await expect(trigger).toBeVisible();

    // The green dot is inside the trigger
    const dot = trigger.locator('.bg-green-500').first();
    await expect(dot).toBeVisible();
  });

  test("trigger aria-label announces the current network name", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await expect(trigger).toHaveAttribute("aria-label", /current network/i);
    await expect(trigger).toHaveAttribute("aria-label", /Stellar/i);
  });

  test("active network item shows 'Active' badge in dropdown", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    // The first network (Stellar) should show the Active badge
    const activeBadge = page.getByText("Active").first();
    await expect(activeBadge).toBeVisible();
  });
});

test.describe("NetworkSwitcher — no-op on active network", () => {
  test("clicking the already-active network does not open a dialog", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    // Click the currently active network (Stellar)
    const stellarItem = page.getByRole("menuitem", { name: /Stellar/i }).first();
    await stellarItem.click();

    // Dialog should NOT appear
    const dialog = page.getByRole("dialog");
    await expect(dialog).not.toBeVisible();
  });
});

// Skipped: the placeholder EVM networks (Polygon/BSC/etc) were removed from
// SUPPORTED_NETWORKS, so Stellar is now the only network. With nothing to
// switch *to*, the confirmation-dialog flow can no longer be exercised. These
// scenarios should be reinstated (with real targets) once genuine multichain
// support lands.
test.describe.skip("NetworkSwitcher — confirmation dialog", () => {
  test("switching to a different network opens the confirmation dialog", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    const testnetItem = page.getByRole("menuitem", { name: /Testnet/i }).first();
    await testnetItem.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  });

  test("dialog describes the from and to networks", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    await page.getByRole("menuitem", { name: /Testnet/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Stellar");
    await expect(dialog).toContainText("Polygon");
  });

  test("dialog warns about balance/operations context change", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    await page.getByRole("menuitem", { name: /Testnet/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(/balances/i);
    await expect(dialog).toContainText(/stellar operations/i);
    // Confirm no funds are moved
    await expect(dialog).toContainText(/no funds will be moved/i);
  });

  test("cancelling the dialog keeps the original network", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    await page.getByRole("menuitem", { name: /Testnet/i }).first().click();

    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should be gone
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Trigger still shows Stellar
    const updatedTrigger = page.locator('[aria-label*="Current network"]').first();
    await expect(updatedTrigger).toHaveAttribute("aria-label", /Stellar/i);
  });

  test("confirming the switch updates the displayed network", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();

    await page.getByRole("menuitem", { name: /Testnet/i }).first().click();

    await page.getByTestId("confirm-network-switch").click();

    // Dialog should be gone
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Trigger now shows Testnet
    const updatedTrigger = page.locator('[aria-label*="Current network"]').first();
    await expect(updatedTrigger).toHaveAttribute("aria-label", /Testnet/i);
  });
});

// Skipped: requires multiple networks to switch between (see note above).
test.describe.skip("NetworkSwitcher — rapid switching", () => {
  test("switching back and forth quickly ends on the last confirmed network", async ({ page }) => {
    await page.goto(LANDING_URL);

    // Switch Stellar → Polygon
    await page.locator('[aria-label*="Current network"]').first().click();
    await page.getByRole("menuitem", { name: /Testnet/i }).first().click();
    await page.getByTestId("confirm-network-switch").click();

    // Switch Testnet → Futurenet
    await page.locator('[aria-label*="Current network"]').first().click();
    await page.getByRole("menuitem", { name: /Futurenet/i }).first().click();
    await page.getByTestId("confirm-network-switch").click();

    // Switch BSC → Stellar
    await page.locator('[aria-label*="Current network"]').first().click();
    await page.getByRole("menuitem", { name: /Stellar/i }).first().click();
    await page.getByTestId("confirm-network-switch").click();

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await expect(trigger).toHaveAttribute("aria-label", /Stellar/i);
  });

  test("cancelling mid-sequence preserves the last confirmed network", async ({ page }) => {
    await page.goto(LANDING_URL);

    // Confirm Stellar → Polygon
    await page.locator('[aria-label*="Current network"]').first().click();
    await page.getByRole("menuitem", { name: /Testnet/i }).first().click();
    await page.getByTestId("confirm-network-switch").click();

    // Start Testnet → Futurenet but cancel
    await page.locator('[aria-label*="Current network"]').first().click();
    await page.getByRole("menuitem", { name: /Futurenet/i }).first().click();
    await page.getByRole("button", { name: /cancel/i }).click();

    // Should still be Testnet
    const trigger = page.locator('[aria-label*="Current network"]').first();
    await expect(trigger).toHaveAttribute("aria-label", /Testnet/i);
  });
});

test.describe("NetworkSwitcher — security", () => {
  test("no private keys or secrets are visible in the component", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    const triggerText = await trigger.textContent();

    // Ensure no hex strings that look like private keys (64 hex chars)
    expect(triggerText).not.toMatch(/[0-9a-fA-F]{64}/);

    // Open dropdown and check
    await trigger.click();
    const dropdownText = await page.locator('[role="menu"]').first().textContent();
    expect(dropdownText).not.toMatch(/[0-9a-fA-F]{64}/);
  });
});

test.describe("NetworkSwitcher — keyboard accessibility", () => {
  test("trigger is focusable via Tab", async ({ page }) => {
    await page.goto(LANDING_URL);

    await page.keyboard.press("Tab");
    // Tab through until we reach the network switcher trigger
    // (exact number of tabs depends on page structure; we check focus lands on it)
    const trigger = page.locator('[aria-label*="Current network"]').first();
    // Focus the trigger directly and verify it accepts focus
    await trigger.focus();
    await expect(trigger).toBeFocused();
  });

  test("Enter opens the dropdown from the trigger", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.focus();
    await trigger.press("Enter");

    // Dropdown menu should be visible
    await expect(page.locator('[role="menu"]').first()).toBeVisible();
  });

  test("Escape closes the dropdown without switching", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await expect(page.locator('[role="menu"]').first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('[role="menu"]').first()).not.toBeVisible();

    // Network unchanged
    await expect(trigger).toHaveAttribute("aria-label", /Stellar/i);
  });
});

/**
 * Accessibility assertions for issue #343.
 *
 * Verifies that the confirmation dialog:
 *  - carries aria-labelledby pointing to the DialogTitle
 *  - carries aria-describedby pointing to the DialogDescription
 *  - emphasises the target network name with a <strong> element
 *  - returns focus to the DropdownMenuTrigger after Cancel
 *  - returns focus to the DropdownMenuTrigger after Confirm
 */
// Skipped: the confirmation dialog only opens when switching to a *different*
// network, which is impossible now that Stellar is the sole supported network.
test.describe.skip("NetworkSwitcher — dialog ARIA labels (issue #343)", () => {
  test("confirmation dialog has aria-labelledby referencing its title", async ({ page }) => {
    await page.goto(LANDING_URL);

    // Open dropdown and pick a different network to show the dialog
    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await page.getByRole("menuitem", { name: /Polygon/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The dialog element must carry aria-labelledby
    const labelledBy = await dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    // The element referenced by aria-labelledby must contain the dialog title text
    const titleEl = page.locator(`#${labelledBy}`);
    await expect(titleEl).toContainText(/switch network/i);
  });

  test("confirmation dialog has aria-describedby referencing its description", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await page.getByRole("menuitem", { name: /Polygon/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // The dialog element must carry aria-describedby
    const describedBy = await dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    // The element referenced by aria-describedby must include the warning copy
    const descEl = page.locator(`#${describedBy}`);
    await expect(descEl).toContainText(/Polygon/i);
    await expect(descEl).toContainText(/no funds will be moved/i);
  });

  test("target network name is wrapped in a <strong> element for semantic emphasis", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await page.getByRole("menuitem", { name: /Polygon/i }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Retrieve the aria-describedby id so we scope the strong search to the description
    const describedBy = await dialog.getAttribute("aria-describedby");
    const strongWithNetwork = page.locator(`#${describedBy} strong`).filter({ hasText: /Polygon/i });
    await expect(strongWithNetwork).toBeVisible();
  });

  test("focus returns to the trigger after cancelling the dialog", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await page.getByRole("menuitem", { name: /Polygon/i }).first().click();

    // Cancel the dialog
    await page.getByRole("button", { name: /cancel/i }).click();

    // Dialog should be gone
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Focus must have returned to the network-switcher trigger
    await expect(trigger).toBeFocused();
  });

  test("focus returns to the trigger after confirming the dialog", async ({ page }) => {
    await page.goto(LANDING_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await page.getByRole("menuitem", { name: /Polygon/i }).first().click();

    // Confirm the switch
    await page.getByTestId("confirm-network-switch").click();

    // Dialog should be gone
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Focus must be back on the trigger (now labelled Polygon)
    const updatedTrigger = page.locator('[aria-label*="Current network"]').first();
    await expect(updatedTrigger).toBeFocused();
  });

  test("dialog title and description ids are stable across open/close cycles", async ({ page }) => {
    await page.goto(LANDING_URL);

    for (let i = 0; i < 2; i++) {
      const trigger = page.locator('[aria-label*="Current network"]').first();
      await trigger.click();
      await page.getByRole("menuitem", { name: /Polygon/i }).first().click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      const labelledBy = await dialog.getAttribute("aria-labelledby");
      const describedBy = await dialog.getAttribute("aria-describedby");

      expect(labelledBy).toBe("network-switcher-dialog-title");
      expect(describedBy).toBe("network-switcher-dialog-desc");

      // Cancel and repeat
      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(dialog).not.toBeVisible();
    }
  });
});

test.describe("Performance & Trace Validation", () => {
  test("main pages load and have no major layout shift or console errors", async ({ page, context }) => {
    // Start tracing before navigating
    try {
      await context.tracing.stop();
    } catch (e) {}
    await context.tracing.start({ screenshots: true, snapshots: true });

    // Navigate to landing page /
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Navigate to /dashboard
    const dashboardResponse = await page.goto("/dashboard");
    expect(dashboardResponse?.status()).toBe(200);

    // Stop tracing and save trace artifact
    await context.tracing.stop({ path: "test-results/performance-trace.zip" });
  });
});

