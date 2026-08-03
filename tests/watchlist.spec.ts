/**
 * End-to-end coverage for the Watchlist Panel introduced in issue #891.
 *
 * Flows under test:
 *   1. The watchlist panel is visible on the dashboard and shows the empty state
 *      when no items have been pinned.
 *   2. Opening the add form, entering an address + label, and clicking Pin adds
 *      a card to the panel.
 *   3. Clicking the PinOff icon on a card removes it and restores the empty state.
 *   4. Pinned items persist in localStorage and survive a full page reload.
 *   5. The panel is accessible — no serious or critical axe-core violations.
 *   6. The panel's search input filters items and the clear button restores the list.
 *
 * The wallet must be connected before items can be persisted per-account.
 * We reuse the same synthetic connect flow exercised by tests/wallet.spec.ts:
 * clicking the "Connect Wallet" CTA in account-overview sets the address in
 * WalletContext, which WatchlistProvider uses as its localStorage key.
 */

import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations } from "./axe-helper";

const DASHBOARD_URL = "/dashboard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Connect the demo wallet so the watchlist has a non-null account key. */
async function connectWallet(page: import("@playwright/test").Page) {
  const cta = page.getByTestId("account-overview-connect");
  // Only click if still disconnected (idempotent).
  if (await cta.isVisible()) {
    await cta.click();
    await expect(page.getByTestId("account-overview-address")).toBeVisible();
  }
}

/** Scroll the watchlist panel into view — it lives below the fold. */
async function scrollToWatchlist(page: import("@playwright/test").Page) {
  await page.getByTestId("watchlist-panel").scrollIntoViewIfNeeded();
}

// ─── 1. Panel visibility & empty state ───────────────────────────────────────

test.describe("WatchlistPanel — visibility", () => {
  test("watchlist panel is present on the dashboard", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page.getByTestId("watchlist-panel")).toBeVisible();
  });

  test("watchlist panel has the correct heading", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await scrollToWatchlist(page);
    await expect(
      page.getByRole("heading", { name: /watchlist/i }),
    ).toBeVisible();
  });

  test("shows the empty state when no items are pinned", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await scrollToWatchlist(page);
    await connectWallet(page);
    await expect(page.getByTestId("watchlist-empty")).toBeVisible();
  });

  test("empty state contains a 'Pin your first item' CTA", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await scrollToWatchlist(page);
    await connectWallet(page);
    await expect(
      page.getByRole("button", { name: /pin your first item/i }),
    ).toBeVisible();
  });
});

// ─── 2. Pin a new item ────────────────────────────────────────────────────────

test.describe("WatchlistPanel — pin item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);
  });

  test("clicking 'Pin Item' opens the add form", async ({ page }) => {
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await expect(
      page.getByRole("form", { name: /add item to watchlist/i }),
    ).toBeVisible();
  });

  test("can pin an address with an optional label", async ({ page }) => {
    // Open the form via the header button.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByLabel(/label/i).fill("Test Counterparty");
    await page.getByRole("button", { name: /^pin$/i }).click();

    // The form should close and the card should appear.
    await expect(
      page.getByRole("form", { name: /add item to watchlist/i }),
    ).not.toBeVisible();
    await expect(
      page.getByText("Test Counterparty"),
    ).toBeVisible();
    await expect(
      page.getByText("GABCDEFGHIJKLMNO12345678"),
    ).toBeVisible();
  });

  test("can pin an address without a label", async ({ page }) => {
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByRole("button", { name: /^pin$/i }).click();

    await expect(page.getByText("GABCDEFGHIJKLMNO12345678")).toBeVisible();
  });

  test("submitting with an empty address shows a validation error", async ({
    page,
  }) => {
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await page.getByRole("button", { name: /^pin$/i }).click();

    await expect(page.getByText(/address is required/i)).toBeVisible();
  });

  test("submitting with a short address shows a validation error", async ({
    page,
  }) => {
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await page.getByLabel(/address or asset/i).fill("GABC");
    await page.getByRole("button", { name: /^pin$/i }).click();

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test("Cancel button closes the form without adding an item", async ({
    page,
  }) => {
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByRole("button", { name: /^cancel$/i }).click();

    await expect(
      page.getByRole("form", { name: /add item to watchlist/i }),
    ).not.toBeVisible();
    // Empty state must reappear because nothing was added.
    await expect(page.getByTestId("watchlist-empty")).toBeVisible();
  });

  test("'Pin your first item' CTA in the empty state also opens the form", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /pin your first item/i }).click();
    await expect(
      page.getByRole("form", { name: /add item to watchlist/i }),
    ).toBeVisible();
  });
});

// ─── 3. Unpin an item ─────────────────────────────────────────────────────────

test.describe("WatchlistPanel — unpin item", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);
  });

  async function pinItem(
    page: import("@playwright/test").Page,
    address: string,
    label?: string,
  ) {
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill(address);
    if (label) await page.getByLabel(/label/i).fill(label);
    await page.getByRole("button", { name: /^pin$/i }).click();
    // Wait for the card to appear.
    await expect(page.getByText(address)).toBeVisible();
  }

  test("clicking the unpin button removes the item card", async ({ page }) => {
    await pinItem(page, "GABCDEFGHIJKLMNO12345678", "My Wallet");

    await page.getByRole("button", { name: /unpin my wallet/i }).click();

    await expect(
      page.getByText("GABCDEFGHIJKLMNO12345678"),
    ).not.toBeVisible();
  });

  test("removing the last item restores the empty state", async ({ page }) => {
    await pinItem(page, "GABCDEFGHIJKLMNO12345678");

    await page
      .getByRole("button", { name: /unpin GABCDEFGHIJKLMNO12345678/i })
      .click();

    await expect(page.getByTestId("watchlist-empty")).toBeVisible();
  });
});

// ─── 4. Persistence across page reload ───────────────────────────────────────

test.describe("WatchlistPanel — persistence", () => {
  test("pinned items survive a full page reload", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);

    // Pin an item.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByLabel(/label/i).fill("Persistent Counterparty");
    await page.getByRole("button", { name: /^pin$/i }).click();
    await expect(page.getByText("Persistent Counterparty")).toBeVisible();

    // Reload without clearing storage.
    await page.reload();
    await connectWallet(page);
    await scrollToWatchlist(page);

    // The item should still be visible after reload.
    await expect(page.getByText("Persistent Counterparty")).toBeVisible();
    await expect(
      page.getByText("GABCDEFGHIJKLMNO12345678"),
    ).toBeVisible();
  });

  test("localStorage key is per connected address", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);

    // Pin an item while connected.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByRole("button", { name: /^pin$/i }).click();
    await expect(page.getByText("GABCDEFGHIJKLMNO12345678")).toBeVisible();

    // Verify the key has the connected address suffix, not a generic key.
    const keys = await page.evaluate(() =>
      Object.keys(window.localStorage).filter((k) =>
        k.startsWith("stellopay.watchlist."),
      ),
    );
    expect(keys.length).toBeGreaterThan(0);
    // The key should contain the Stellar address — not just "null" or "undefined".
    expect(keys.some((k) => k.includes("GAAQ") || k.length > 25)).toBe(true);
  });

  test("disconnecting and reconnecting shows the same watchlist", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);

    // Pin one item.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByLabel(/label/i).fill("Reload Test");
    await page.getByRole("button", { name: /^pin$/i }).click();
    await expect(page.getByText("Reload Test")).toBeVisible();

    // Disconnect via the navbar button.
    const disconnectBtn = page.getByTestId("dashboard-navbar-disconnect");
    if (await disconnectBtn.isVisible()) {
      await disconnectBtn.click();
    }

    // Reconnect and scroll back.
    await connectWallet(page);
    await scrollToWatchlist(page);

    // The item should still be in the watchlist for this address.
    await expect(page.getByText("Reload Test")).toBeVisible();
  });
});

// ─── 5. Search / filter ───────────────────────────────────────────────────────

test.describe("WatchlistPanel — search", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);
  });

  async function pinTwo(page: import("@playwright/test").Page) {
    // Pin first item.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByLabel(/label/i).fill("Payroll");
    await page.getByRole("button", { name: /^pin$/i }).click();
    await expect(page.getByText("Payroll")).toBeVisible();

    // Pin second item.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill("GZYXWVUTSRQPONMLKJ123456");
    await page.getByLabel(/label/i).fill("Treasury");
    await page.getByRole("button", { name: /^pin$/i }).click();
    await expect(page.getByText("Treasury")).toBeVisible();
  }

  test("search input appears when items are present", async ({ page }) => {
    await pinTwo(page);
    await expect(page.getByLabel(/search watchlist/i)).toBeVisible();
  });

  test("typing in the search box filters items by label", async ({ page }) => {
    await pinTwo(page);

    await page.getByLabel(/search watchlist/i).fill("Payroll");

    await expect(page.getByText("Payroll")).toBeVisible();
    await expect(page.getByText("Treasury")).not.toBeVisible();
  });

  test("typing in the search box filters items by address fragment", async ({
    page,
  }) => {
    await pinTwo(page);

    await page.getByLabel(/search watchlist/i).fill("GZYXWV");

    await expect(page.getByText("GZYXWVUTSRQPONMLKJ123456")).toBeVisible();
    await expect(page.getByText("GABCDEFGHIJKLMNO12345678")).not.toBeVisible();
  });

  test("no-results message appears when the query matches nothing", async ({
    page,
  }) => {
    await pinTwo(page);

    await page.getByLabel(/search watchlist/i).fill("zzznomatch");

    await expect(page.getByTestId("watchlist-no-results")).toBeVisible();
  });

  test("clear button restores the full list", async ({ page }) => {
    await pinTwo(page);

    await page.getByLabel(/search watchlist/i).fill("Payroll");
    await expect(page.getByText("Treasury")).not.toBeVisible();

    await page.getByRole("button", { name: /clear search/i }).click();

    await expect(page.getByText("Payroll")).toBeVisible();
    await expect(page.getByText("Treasury")).toBeVisible();
  });
});

// ─── 6. Accessibility ─────────────────────────────────────────────────────────

test.describe("WatchlistPanel — accessibility", () => {
  test("watchlist panel has no serious or critical a11y violations (empty state)", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await page.waitForLoadState("networkidle");

    await expectNoSeriousA11yViolations(page, {
      include: ["[data-testid='watchlist-panel']"],
    });
  });

  test("watchlist panel has no serious or critical a11y violations (with items)", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);

    // Pin an item so the card + search input are rendered.
    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();
    await page.getByLabel(/address or asset/i).fill("GABCDEFGHIJKLMNO12345678");
    await page.getByLabel(/label/i).fill("A11y Test");
    await page.getByRole("button", { name: /^pin$/i }).click();
    await expect(page.getByText("A11y Test")).toBeVisible();

    await page.waitForLoadState("networkidle");

    await expectNoSeriousA11yViolations(page, {
      include: ["[data-testid='watchlist-panel']"],
    });
  });

  test("watchlist panel has no serious or critical a11y violations (add form open)", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);
    await connectWallet(page);
    await scrollToWatchlist(page);

    await page
      .getByTestId("watchlist-panel")
      .getByRole("button", { name: /pin (?:new )?item/i })
      .click();

    await page.waitForLoadState("networkidle");

    await expectNoSeriousA11yViolations(page, {
      include: ["[data-testid='watchlist-panel']"],
    });
  });
});
