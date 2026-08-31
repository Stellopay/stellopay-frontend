// End-to-end coverage for the WalletProvider context introduced in issue #271.
//
// Flow under test:
//   1. Visit the dashboard while disconnected. The address area should show a
//      Connect Wallet CTA and no synthetic address.
//   2. Click Connect Wallet. The dashboard address and the navbar address
//      should both reflect the same context-supplied address.
//   3. Open the network switcher and switch from Stellar to Polygon. The
//      confirmation dialog should appear; confirming should update the
//      network badge in the navbar.
//   4. Reload. The selected network should persist; the connection should
//      not (we never persist the address, per the security note in the issue).
//   5. Cancelling a network switch should leave the current network intact.

import { expect, test } from "@playwright/test";

const DASHBOARD_URL = "/dashboard";

// Each Playwright test runs in a fresh BrowserContext, so localStorage starts
// empty without any manual cleanup. The reload-persistence test below relies
// on that: clearing storage via addInitScript would also fire on reload and
// would defeat the very behavior the test is asserting.

test.describe("WalletProvider — connect/disconnect UX", () => {
  test("disconnected state shows a Connect Wallet CTA on the dashboard", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);

    const cta = page.getByTestId("account-overview-connect");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveText(/connect wallet/i);

    // The dashboard navbar should mirror the disconnected state.
    await expect(page.getByTestId("dashboard-navbar-connect")).toBeVisible();
    await expect(
      page.getByTestId("dashboard-navbar-address"),
    ).toHaveCount(0);
  });

  test("connecting populates the dashboard address from context", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);

    await page.getByTestId("account-overview-connect").click();

    const overview = page.getByTestId("account-overview-address");
    const navbar = page.getByTestId("dashboard-navbar-address");

    await expect(overview).toBeVisible();
    await expect(navbar).toBeVisible();

    // Both surfaces should display the same truncated address pulled from
    // the same context value.
    const overviewText = (await overview.textContent())?.trim();
    const navbarText = (await navbar.textContent())?.trim();
    expect(overviewText).toBeTruthy();
    expect(overviewText).toBe(navbarText);
    expect(overviewText).toMatch(/^G[A-Z0-9]{3}\.\.\.[A-Z0-9]{4}$/);
  });

  test("disconnect returns the UI to the Connect Wallet CTA", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);
    await page.getByTestId("account-overview-connect").click();
    await expect(page.getByTestId("dashboard-navbar-disconnect")).toBeVisible();

    await page.getByTestId("dashboard-navbar-disconnect").click();
    await expect(page.getByTestId("account-overview-connect")).toBeVisible();
    await expect(
      page.getByTestId("dashboard-navbar-address"),
    ).toHaveCount(0);
  });
});

// Skipped: the placeholder EVM networks (Polygon/BSC/etc) were removed from
// SUPPORTED_NETWORKS, leaving Stellar as the only network. There is no longer
// a second network to switch to, so the cross-network selection + persistence
// flow cannot be exercised end-to-end. Reinstate once real multichain support
// adds back additional networks.
test.describe.skip("WalletProvider — network selection drives shared state", () => {
  test("switching networks updates the navbar badge and persists across reloads", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(/Stellar/i);

    await trigger.click();
    await page
      .getByRole("menuitem", { name: /^Polygon/i })
      .click();

    // Confirmation dialog appears before the switch is committed.
    await page.getByTestId("confirm-network-switch").click();
    await expect(trigger).toHaveText(/Polygon/i);

    // Reload and confirm persistence. The selected network should still be
    // Polygon thanks to the localStorage hydration in WalletProvider.
    await page.reload();
    const triggerAfterReload = page
      .locator('[aria-label*="Current network"]')
      .first();
    await expect(triggerAfterReload).toHaveText(/Polygon/i);
  });

  test("cancelling the network switch leaves the current network intact", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);

    const trigger = page.locator('[aria-label*="Current network"]').first();
    await trigger.click();
    await page
      .getByRole("menuitem", { name: /^Polygon/i })
      .click();

    await page.getByRole("button", { name: /^Cancel$/ }).click();
    await expect(trigger).toHaveText(/Stellar/i);
  });
});

test.describe("WalletProvider — no secret material in the DOM", () => {
  test("nothing on the dashboard exposes a Stellar secret key", async ({
    page,
  }) => {
    await page.goto(DASHBOARD_URL);
    await page.getByTestId("account-overview-connect").click();

    const dom = await page.content();
    // Stellar secret keys start with S followed by 55 base32 characters.
    expect(dom).not.toMatch(/\bS[A-Z2-7]{55}\b/);
  });
});
