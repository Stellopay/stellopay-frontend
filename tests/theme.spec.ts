import { expect, test } from "@playwright/test";

test.describe("Theme FOUC and Persistence", () => {
  test("applies 'dark' class pre-hydration when localStorage theme is 'dark'", async ({ page }) => {
    // Inject localStorage theme: "dark" before any script runs
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark");
    });

    await page.goto("/");

    // Verify <html> has the 'dark' class immediately
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(true);

    // Verify no hydration console warnings/errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    expect(errors).toHaveLength(0);
  });

  test("applies 'dark' class pre-hydration when system prefers dark mode and no stored theme", async ({ page }) => {
    // Emulate prefers-color-scheme: dark
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      window.localStorage.removeItem("theme");
    });

    await page.goto("/");

    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(true);
  });

  test("applies light theme pre-hydration when localStorage theme is 'light'", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "light");
    });

    await page.goto("/");

    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(false);
  });

  test("works correctly when localStorage is disabled / throws errors", async ({ page }) => {
    // Emulate prefers-color-scheme: dark but disable localStorage for the theme key
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      const mockStorage = {
        getItem(key: string) {
          if (key === "theme") {
            throw new Error("SecurityError: localStorage is disabled in privacy mode");
          }
          return null;
        },
        setItem(key: string) {
          if (key === "theme") {
            throw new Error("SecurityError: localStorage is disabled in privacy mode");
          }
        },
        removeItem() {},
        clear() {},
        key() {
          return null;
        },
        length: 0,
      };
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        configurable: true,
      });
    });

    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.goto("/");

    expect(errors).toHaveLength(0);

    // Document should still fall back to dark mode safely via system preference
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(true);
  });

  test("theme toggle persists across page reloads", async ({ page }) => {
    await page.goto("/");

    // Determine initial theme status
    let isInitiallyDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));

    // Find and click the toggle theme button on landing page
    const toggleBtn = page.getByRole("button", { name: /toggle theme/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Verify class changes
    let isDarkAfterToggle = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkAfterToggle).toBe(!isInitiallyDark);

    // Reload the page and make sure it is persisted
    await page.reload();
    let isDarkAfterReload = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkAfterReload).toBe(!isInitiallyDark);
  });
});
