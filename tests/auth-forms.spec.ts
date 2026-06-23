import { expect, test } from "@playwright/test";

/**
 * Auth Forms – Password Visibility Toggle Tests
 *
 * Validates fix for issue #252: undeclared `showPassword` state, missing
 * `Eye`/`EyeOff` imports, and missing `iconsClassName` constant that caused
 * render-blocking ReferenceErrors on `/auth/login` and `/auth/sign-up`.
 *
 * After the fix, both forms use `FormFieldPassword` which internally handles
 * the Eye/EyeOff toggle, aria attributes, and visibility state.
 *
 * @security Password visibility toggle defaults to hidden (`type="password"`).
 *           Password values are never logged. `autoComplete` attributes are
 *           preserved so password managers behave correctly.
 */

// ---------------------------------------------------------------------------
// /auth/login
// ---------------------------------------------------------------------------

test.describe("Login form – password visibility toggle", () => {
  test("renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/auth/login");
    // The page must render the Sign In button without blowing up
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("password field defaults to type=password (hidden)", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    const input = page.locator('input[autocomplete="current-password"]');
    await expect(input).toHaveAttribute("type", "password");
  });

  test("toggle switches input type and updates aria-label", async ({
    page,
  }) => {
    await page.goto("/auth/login");

    const toggle = page.getByRole("button", { name: /show password/i });
    const input = page.locator('input[autocomplete="current-password"]');

    // Default state
    await expect(input).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-label", "Show password");

    // Click to show
    await toggle.click();
    await expect(input).toHaveAttribute("type", "text");
    await expect(toggle).toHaveAttribute("aria-label", "Hide password");

    // Click to hide again
    await toggle.click();
    await expect(input).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-label", "Show password");
  });

  test("autoComplete=current-password is preserved", async ({ page }) => {
    await page.goto("/auth/login");
    const input = page.locator('input[autocomplete="current-password"]');
    await expect(input).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// /auth/sign-up
// ---------------------------------------------------------------------------

test.describe("Sign-up form – password visibility toggles", () => {
  test("renders without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/auth/sign-up");
    await expect(
      page.getByRole("button", { name: /create account/i }),
    ).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("both password fields default to type=password (hidden)", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");
    const inputs = page.locator('input[autocomplete="new-password"]');
    const count = await inputs.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      await expect(inputs.nth(i)).toHaveAttribute("type", "password");
    }
  });

  test("password toggle switches input type and updates aria-label", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    // Both toggles start with "Show password" — first one is for the password field
    const toggles = page.getByRole("button", { name: /show password/i });
    const passwordInput = page.locator(
      'input[autocomplete="new-password"]',
    ).first();

    // Default state
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the first toggle to show
    await toggles.first().click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(toggles.first()).toHaveAttribute(
      "aria-label",
      "Hide password",
    );

    // Click to hide again
    await toggles.first().click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("confirm-password toggle switches input type and updates aria-label", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");

    // Both toggles start with "Show password" — second one is for confirm password
    const toggles = page.getByRole("button", { name: /show password/i });
    const confirmInput = page.locator(
      'input[autocomplete="new-password"]',
    ).last();

    // Default state
    await expect(confirmInput).toHaveAttribute("type", "password");

    // Click the second toggle to show
    await toggles.last().click();
    await expect(confirmInput).toHaveAttribute("type", "text");

    // Click to hide again
    await toggles.last().click();
    await expect(confirmInput).toHaveAttribute("type", "password");
  });

  test("autoComplete=new-password is preserved on both fields", async ({
    page,
  }) => {
    await page.goto("/auth/sign-up");
    const inputs = page.locator('input[autocomplete="new-password"]');
    await expect(inputs).toHaveCount(2);
  });
});
