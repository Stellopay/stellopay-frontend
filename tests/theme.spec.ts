import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for theme persistence across reloads and navigation.
 *
 * Guards the behavior of `context/theme-context.tsx`:
 * - Theme toggle applies dark class to <html>
 * - Theme persists in localStorage under key "theme"
 * - Persistence survives page reload
 * - Persistence survives navigation between routes
 * - Toggle back to light removes dark class
 *
 * Security: validates only "light" | "dark"
 * are ever written to localStorage.theme
 */

// ── Helpers ──────────────────────────────────────────────────

/**
 * Gets the current theme value from localStorage.
 * Returns null if not set.
 */
async function getStoredTheme(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('theme'));
}

/**
 * Gets the class list of the <html> element.
 */
async function getHtmlClasses(page: Page): Promise<string[]> {
  return page.evaluate(() => Array.from(document.documentElement.classList));
}

/**
 * Asserts theme is in dark mode:
 * - <html> has "dark" class
 * - localStorage.theme === "dark"
 */
async function assertDarkMode(page: Page): Promise<void> {
  const classes = await getHtmlClasses(page);
  expect(classes).toContain('dark');
  const stored = await getStoredTheme(page);
  expect(stored).toBe('dark');
}

/**
 * Asserts theme is in light mode:
 * - <html> does NOT have "dark" class
 * - localStorage.theme === "light" (or null for default)
 */
async function assertLightMode(page: Page): Promise<void> {
  const classes = await getHtmlClasses(page);
  expect(classes).not.toContain('dark');
  const stored = await getStoredTheme(page);
  expect(stored === 'light' || stored === null).toBe(true);
}

/**
 * Clicks the theme toggle button.
 * Uses data-testid for reliable selection across both landing and dashboard layouts.
 * Throws if button is not found or not visible.
 */
async function clickThemeToggle(page: Page): Promise<void> {
  const toggle = page.getByTestId('theme-toggle');
  
  if (!(await toggle.isVisible({ timeout: 5000 }).catch(() => false))) {
    throw new Error('Theme toggle button not found. Expected data-testid="theme-toggle"');
  }
  
  await toggle.click();
}

/**
 * Asserts localStorage.theme is only a valid value.
 * Security: prevents arbitrary strings being stored.
 */
async function assertValidThemeValue(page: Page): Promise<void> {
  const stored = await getStoredTheme(page);
  if (stored !== null) {
    expect(['light', 'dark']).toContain(stored);
  }
}

// ── Test Suites ───────────────────────────────────────────────

test.describe('Theme toggle and persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for isolation
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // ── SUITE 1: Basic Toggle (2 tests) ──────────────────────

  test('toggles to dark mode and applies dark class', async ({ page }) => {
    // Proves: toggle function updates theme state and applies CSS class immediately
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Start in light mode (default)
    await assertLightMode(page);

    // Toggle to dark
    await clickThemeToggle(page);
    await page.waitForTimeout(100); // allow state update

    // Assert dark mode applied
    await assertDarkMode(page);
  });

  test('toggles back to light mode from dark', async ({ page }) => {
    // Proves: toggle is bidirectional and correctly reverts state
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark first
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertDarkMode(page);

    // Toggle back to light
    await clickThemeToggle(page);
    await page.waitForTimeout(100);

    // Assert light mode restored
    await assertLightMode(page);
  });

  // ── SUITE 2: Persistence After Reload (3 tests) ─────────

  test('dark mode persists after page reload', async ({ page }) => {
    // Proves: theme preference survives full page refresh and rehydration
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertDarkMode(page);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Dark mode must still be active
    await assertDarkMode(page);
  });

  test('light mode persists after page reload', async ({ page }) => {
    // Proves: explicitly set light mode also survives reload
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set to dark then back to light
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertLightMode(page);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Light mode must persist
    await assertLightMode(page);
  });

  test('localStorage theme value survives reload', async ({ page }) => {
    // Proves: localStorage is correctly written and not corrupted on reload
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set dark
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    const storedBefore = await getStoredTheme(page);
    expect(storedBefore).toBe('dark');

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // localStorage must still have dark
    const storedAfter = await getStoredTheme(page);
    expect(storedAfter).toBe('dark');
  });

  // ── SUITE 3: Persistence Across Routes (4 tests) ────────

  test('dark mode persists when navigating from / to /dashboard', async ({ page }) => {
    // Proves: theme state is maintained across client-side route navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle to dark on home page
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertDarkMode(page);

    // Navigate to /dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dark mode must persist on dashboard
    await assertDarkMode(page);
  });

  test('dark mode persists when navigating from /dashboard to /', async ({ page }) => {
    // Proves: theme state survives navigation in both directions
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Toggle dark on dashboard
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertDarkMode(page);

    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Dark mode must persist on home
    await assertDarkMode(page);
  });

  test('theme persists across / → /dashboard → reload → /', async ({ page }) => {
    // Proves: complex navigation sequence with reload maintains theme throughout
    // Start on home, toggle dark
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertDarkMode(page);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await assertDarkMode(page);

    // Reload on dashboard
    await page.reload();
    await page.waitForLoadState('networkidle');
    await assertDarkMode(page);

    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertDarkMode(page);
  });

  test('localStorage value persists across routes', async ({ page }) => {
    // Proves: localStorage key remains consistent across all navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Set dark
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    expect(await getStoredTheme(page)).toBe('dark');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // localStorage must still be dark
    expect(await getStoredTheme(page)).toBe('dark');
  });

  // ── SUITE 4: Toggle Back to Light Cross-Route (1 test) ───

  test('can toggle back to light on /dashboard and persists to /', async ({ page }) => {
    // Proves: toggle works on both pages and state syncs correctly
    // Set dark on home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertDarkMode(page);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await assertDarkMode(page);

    // Toggle back to light on dashboard
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertLightMode(page);

    // Navigate back to home — should still be light
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await assertLightMode(page);
  });

  // ── SUITE 5: Security Validation (2 tests) ──────────────

  test('localStorage.theme only contains valid values', async ({ page }) => {
    // Proves: security constraint that only "light"|"dark" are stored
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check initial state
    await assertValidThemeValue(page);

    // After toggle to dark
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertValidThemeValue(page);

    // After toggle back
    await clickThemeToggle(page);
    await page.waitForTimeout(100);
    await assertValidThemeValue(page);

    // After reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    await assertValidThemeValue(page);
  });

  test('no unexpected keys written to localStorage by theme system', async ({ page }) => {
    // Proves: theme system doesn't pollute localStorage with extra keys
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const keysBefore = await page.evaluate(() => Object.keys(localStorage));

    // Toggle theme
    await clickThemeToggle(page);
    await page.waitForTimeout(100);

    const keysAfter = await page.evaluate(() => Object.keys(localStorage));

    // The only new key should be "theme"
    const newKeys = keysAfter.filter(k => !keysBefore.includes(k));
    expect(newKeys).toEqual(['theme']);
  });

  // ── SUITE 6: Edge Cases (2 tests) ────────────────────────

  test('multiple rapid toggles settle on correct final state', async ({ page }) => {
    // Proves: rapid consecutive toggles don't cause race conditions or state corruption
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Rapid toggles (even number = 6 → back to light)
    for (let i = 0; i < 6; i++) {
      await clickThemeToggle(page);
      await page.waitForTimeout(50);
    }

    // Should be back in light mode
    await assertLightMode(page);
  });

  test('dark class applied before page is fully interactive', async ({ page }) => {
    // Proves: theme is restored from localStorage early enough to prevent flash
    // Set dark in localStorage before navigation
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));

    // Navigate — dark should be applied immediately
    await page.goto('/');

    // Check class is present early (before networkidle)
    await page.waitForLoadState('domcontentloaded');
    const classes = await getHtmlClasses(page);
    expect(classes).toContain('dark');
  });
});

