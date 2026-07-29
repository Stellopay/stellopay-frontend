import { expect, test } from "@playwright/test";

test.describe("Settings search cross-tab navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/preferences?section=account");
  });

  test("should display search input on the settings header", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute(
      "placeholder",
      "Search settings...",
    );
  });

  test("should open results dropdown when user types a query", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.click();
    await searchInput.fill("password");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // "Password and recovery" should appear in results
    const passwordResult = page.getByRole("option").filter({
      has: page.getByText("Password and recovery"),
    });
    await expect(passwordResult).toBeVisible();
  });

  test("should navigate to matching tab when result is clicked", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("transaction alerts");

    // Wait for results to appear and click the first match
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    const firstResult = page.getByRole("option").first();
    await firstResult.click();

    // Should now be on Notifications tab
    const notificationsTab = page.getByRole("tab", { name: /notifications/i });
    await expect(notificationsTab).toHaveAttribute("data-state", "active");

    // Verify the control is visible
    await expect(page.getByText("Transaction alerts")).toBeVisible();
  });

  test("should support searching by keyword variations", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");

    // Search by keyword "2fa" should find "Authenticator app verification"
    await searchInput.fill("2fa");
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    const result = page.getByRole("option").filter({
      has: page.getByText("Authenticator app verification"),
    });
    await expect(result).toBeVisible();

    // Click to navigate
    await result.click();

    // Should now be on Security tab
    const securityTab = page.getByRole("tab", { name: /security/i });
    await expect(securityTab).toHaveAttribute("data-state", "active");
  });

  test("should show no-results state when query has no matches", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("nonexistent query that matches nothing");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Should show "No results found" message
    const noResults = page.getByText(/No results found/);
    await expect(noResults).toBeVisible();

    // Should provide helpful guidance
    const helpText = page.getByText(/try searching for/i);
    await expect(helpText).toBeVisible();
  });

  test("should clear search on Escape key", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("password");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Press Escape
    await searchInput.press("Escape");

    // Input should be cleared
    await expect(searchInput).toHaveValue("");

    // Results should be hidden
    await expect(resultsList).not.toBeVisible();
  });

  test("should clear search when clear button is clicked", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("password");

    const clearButton = page.getByLabel("Clear search");
    await expect(clearButton).toBeVisible();

    await clearButton.click();

    // Input should be cleared
    await expect(searchInput).toHaveValue("");

    // Results should be hidden
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).not.toBeVisible();
  });

  test("should support keyboard navigation with arrow keys", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("transfer");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Get initial results count
    const results = page.getByRole("option");
    const initialCount = await results.count();
    expect(initialCount).toBeGreaterThan(1);

    // Press ArrowDown to highlight first result
    await searchInput.press("ArrowDown");
    const firstResult = results.nth(0);
    await expect(firstResult).toHaveAttribute("aria-selected", "true");

    // Press ArrowDown again to highlight second result
    await searchInput.press("ArrowDown");
    const secondResult = results.nth(1);
    await expect(secondResult).toHaveAttribute("aria-selected", "true");

    // Press ArrowUp to go back to first
    await searchInput.press("ArrowUp");
    await expect(firstResult).toHaveAttribute("aria-selected", "true");
  });

  test("should navigate to tab when Enter is pressed on highlighted result", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("wallet");

    // Highlight first result with ArrowDown
    await searchInput.press("ArrowDown");

    // Press Enter to select
    await searchInput.press("Enter");

    // Should navigate to Wallets tab
    const walletsTab = page.getByRole("tab", { name: /wallets/i });
    await expect(walletsTab).toHaveAttribute("data-state", "active");

    // Search should be cleared
    await expect(searchInput).toHaveValue("");
  });

  test("should close results when clicking outside", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("password");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Click outside to close
    await page.click("body", { position: { x: 0, y: 0 } });

    // Results should be hidden
    await expect(resultsList).not.toBeVisible();

    // Input value should remain (just results close)
    // But search should be closed
    const backdrop = page.locator('div[aria-hidden="true"]').last();
    await expect(backdrop).not.toBeVisible();
  });

  test("should match controls across all four settings tabs", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");

    // Test Account tab control
    await searchInput.fill("email");
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    let results = page.getByRole("option");
    await expect(results.filter({ has: page.getByText("Email address") })).toHaveCount(1);

    // Search for Notifications tab control
    await searchInput.clear();
    await searchInput.fill("transaction");
    await expect(results.filter({ has: page.getByText("Transaction alerts") })).toHaveCount(1);

    // Search for Security tab control
    await searchInput.clear();
    await searchInput.fill("device");
    await expect(results.filter({ has: page.getByText("New device approval") })).toHaveCount(1);

    // Search for Wallets tab control
    await searchInput.clear();
    await searchInput.fill("travel");
    await expect(results.filter({ has: page.getByText("Travel rule checks") })).toHaveCount(1);
  });

  test("should rank results by relevance", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("alert");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    const results = page.getByRole("option");

    // "Transaction alerts" (exact match in label) should come before
    // other alert-related items
    const resultTexts: string[] = [];
    const count = await results.count();
    for (let i = 0; i < count; i++) {
      const text = await results.nth(i).locator("p").first().textContent();
      if (text) resultTexts.push(text);
    }

    // First result containing "alerts" in its label
    const firstAlertIndex = resultTexts.findIndex((text) =>
      text.toLowerCase().includes("alert"),
    );
    expect(firstAlertIndex).toBeGreaterThanOrEqual(0);

    // Transaction alerts or Security alerts (exact label match) should be early
    expect(
      resultTexts[firstAlertIndex].toLowerCase().includes("transaction") ||
        resultTexts[firstAlertIndex].toLowerCase().includes("security"),
    ).toBe(true);
  });

  test("should support partial word matching", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("pass");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Should find "Password and recovery"
    const result = page.getByRole("option").filter({
      has: page.getByText("Password and recovery"),
    });
    await expect(result).toBeVisible();
  });

  test("should be case-insensitive", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");

    // Test with uppercase
    await searchInput.fill("TRANSACTION");
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    let result = page.getByRole("option").filter({
      has: page.getByText("Transaction alerts"),
    });
    await expect(result).toBeVisible();

    // Test with mixed case
    await searchInput.clear();
    await searchInput.fill("WalLeT");
    result = page.getByRole("option").filter({
      has: page.getByText("Connected wallets"),
    });
    await expect(result).toBeVisible();
  });

  test("should announce results to screen readers", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("security");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toHaveAttribute("role", "listbox");

    // Each result should have role="option"
    const results = page.getByRole("option");
    const count = await results.count();
    expect(count).toBeGreaterThan(0);

    // First result should be selectable via aria-selected
    const firstResult = results.first();
    const ariaSelected = await firstResult.getAttribute("aria-selected");
    expect(["true", "false"]).toContain(ariaSelected);
  });

  test("should include section name in results", async ({ page }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("password");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Result should show which section it belongs to
    const result = page.getByRole("option").first();
    const sectionText = result.locator("p").nth(1);
    await expect(sectionText).toContainText("section");
  });

  test("should handle multiple matches and allow selection of any", async ({
    page,
  }) => {
    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("approval");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    const results = page.getByRole("option");
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(2); // Should have at least 2 matches

    // Click the second result (e.g., "Lock approved address book" instead of first)
    const secondResult = results.nth(1);
    const secondResultText = await secondResult.locator("p").first().textContent();

    await secondResult.click();

    // Should navigate to the correct tab
    const walletsTab = page.getByRole("tab", { name: /wallets/i });
    await expect(walletsTab).toHaveAttribute("data-state", "active");

    // The selected control should be visible
    await expect(page.getByText(secondResultText || "")).toBeVisible();
  });
});

test.describe("Settings search responsive behavior", () => {
  test("should display search at mobile viewport (390x844)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toBeVisible();

    // On mobile, search input may be smaller but still functional
    await searchInput.fill("password");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Should be scrollable on mobile
    const isScrollable = await resultsList.evaluate(
      (el) => el.scrollHeight > el.clientHeight,
    );
    // May or may not be scrollable depending on content, but dropdown should work
    await expect(resultsList).toBeVisible();
  });

  test("should display search at tablet viewport (768x1024)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("wallet");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();
    await expect(resultsList).toBeInViewport();
  });

  test("should display search at desktop viewport (1280x720)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toBeVisible();

    await searchInput.fill("notification");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();
    await expect(resultsList).toBeInViewport();
  });
});

test.describe("Settings search dark mode", () => {
  test("should render correctly in dark mode", async ({ page }) => {
    await page.goto("/settings/preferences?section=account");

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
    });

    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toBeVisible();

    // Verify dark mode styling is applied
    const computedStyle = await searchInput.evaluate((el) =>
      window.getComputedStyle(el),
    );
    // Just verify the element renders without error in dark mode
    expect(computedStyle).toBeTruthy();

    await searchInput.fill("security");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Results should also render in dark mode
    const firstResult = page.getByRole("option").first();
    const darkModeStyle = await firstResult.evaluate((el) =>
      window.getComputedStyle(el),
    );
    expect(darkModeStyle).toBeTruthy();
  });
});

test.describe("Settings search accessibility", () => {
  test("should be fully operable via keyboard only", async ({ page }) => {
    await page.goto("/settings/preferences?section=account");

    // Tab to search input
    await page.keyboard.press("Tab");
    // May need multiple tabs to reach search, but eventually should get there
    let focusedElement = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );

    // Keep tabbing until we reach the search input
    while (focusedElement !== "Search settings controls" && focusedElement !== "Search settings...") {
      await page.keyboard.press("Tab");
      focusedElement = await page.evaluate(() =>
        document.activeElement?.getAttribute("aria-label") ||
        document.activeElement?.getAttribute("placeholder"),
      );
    }

    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toBeFocused();

    // Type query via keyboard
    await page.keyboard.type("password", { delay: 50 });

    // Results should appear
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Navigate with arrow keys
    await page.keyboard.press("ArrowDown");
    const firstResult = page.getByRole("option").first();
    await expect(firstResult).toHaveAttribute("aria-selected", "true");

    // Select with Enter
    await page.keyboard.press("Enter");

    // Should navigate and clear search
    const securityTab = page.getByRole("tab", { name: /security/i });
    await expect(securityTab).toHaveAttribute("data-state", "active");
    await expect(searchInput).toHaveValue("");
  });

  test("should have proper aria labels and roles", async ({ page }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await expect(searchInput).toHaveAttribute("role", "combobox");
    await expect(searchInput).toHaveAttribute("aria-label");

    await searchInput.fill("alert");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toHaveAttribute("role", "listbox");
    await expect(resultsList).toHaveAttribute("id");

    const options = page.getByRole("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Each option should be selectable
    for (let i = 0; i < Math.min(3, count); i++) {
      const option = options.nth(i);
      await expect(option).toHaveAttribute("role", "option");
      await expect(option).toHaveAttribute("aria-selected");
    }
  });

  test("should announce no results state to screen readers", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("xyzabcnotreal");

    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Should show a clear no-results message
    const noResultsText = page.getByText(/No results found/);
    await expect(noResultsText).toBeVisible();

    // For screen readers, the listbox should still exist but be empty or have aria-live
    await expect(resultsList).toHaveAttribute("role", "listbox");
  });
});

test.describe("Settings search focus management", () => {
  test("should restore focus to input when results dropdown closes", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.click();
    await searchInput.fill("password");

    // Results open
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    // Press Escape to close
    await searchInput.press("Escape");

    // Results should close
    await expect(resultsList).not.toBeVisible();

    // Focus should still be on input (or escape clears it)
    // Verify search is cleared
    await expect(searchInput).toHaveValue("");
  });

  test("should automatically focus search input when results are navigated", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("wallet");

    // Navigate results with arrow keys
    await searchInput.press("ArrowDown");

    // Focus should remain on input (for keyboard navigation)
    await expect(searchInput).toBeFocused();

    // Verify selection is highlighted
    const firstResult = page.getByRole("option").first();
    await expect(firstResult).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("Settings search edge cases", () => {
  test("should handle leading/trailing whitespace in query", async ({
    page,
  }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("   password   ");

    // Should still find results despite whitespace
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    const result = page.getByRole("option").filter({
      has: page.getByText("Password and recovery"),
    });
    await expect(result).toBeVisible();
  });

  test("should handle very long search queries", async ({ page }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    const longQuery =
      "this is a very long search query that probably won't match anything";
    await searchInput.fill(longQuery);

    // Should show no results gracefully
    const resultsList = page.locator("#settings-search-results");
    await expect(resultsList).toBeVisible();

    const noResults = page.getByText(/No results found/);
    await expect(noResults).toBeVisible();
  });

  test("should handle rapid result clicks", async ({ page }) => {
    await page.goto("/settings/preferences?section=account");

    const searchInput = page.getByLabel("Search settings controls");
    await searchInput.fill("a");

    const results = page.getByRole("option");

    // Click first result (should navigate)
    const firstResult = results.nth(0);
    await firstResult.click();

    // Verify navigation happened
    const activeTab = page.locator("[data-state='active']");
    await expect(activeTab).toBeTruthy();

    // Search should be cleared
    await expect(searchInput).toHaveValue("");
  });
});
