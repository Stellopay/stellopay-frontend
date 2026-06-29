import { expect, test } from "@playwright/test";

/**
 * End-to-end tests for the Sign-Up flow.
 * Asserts live password requirement indicators, matching validation,
 * Terms of Service requirement, and successful submission behavior.
 * 
 * @security Uses fake credentials. Never logs entered passwords.
 */
test.describe("Sign-up validation and submission", () => {
  test("password-requirements indicators update live", async ({ page }) => {
    await page.goto("/auth/sign-up");
    
    const passwordInput = page.locator('input[autocomplete="new-password"]').first();
    
    // Type something to show the indicator box
    await passwordInput.fill("a");
    
    const reqBox = page.getByRole("region", { name: /password requirements/i });
    await expect(reqBox).toBeVisible();
    
    await expect(reqBox.getByText("At least 8 characters")).toBeVisible();
    
    // Fill a strong password
    await passwordInput.fill("StrongPass1!");
    
    // Check if the "Password is strong and secure." message appears
    await expect(page.getByText("Password is strong and secure.")).toBeVisible();
  });

  test("password meeting some-but-not-all rules is rejected", async ({ page }) => {
    await page.goto("/auth/sign-up");
    
    await page.getByLabel(/full name/i).fill("Jane Doe");
    await page.getByLabel(/email address/i).fill("test@example.com");
    
    const passwords = page.locator('input[autocomplete="new-password"]');
    // Meets length > 8, but missing uppercase and special char
    await passwords.first().fill("weakpassword");
    await passwords.last().fill("weakpassword");
    
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: /create account/i }).click();
    
    // Should show error for missing uppercase
    await expect(page.getByText("Password must include at least one uppercase letter.")).toBeVisible();
  });

  test("mismatch shows the Passwords don't match error", async ({ page }) => {
    await page.goto("/auth/sign-up");
    
    await page.getByLabel(/full name/i).fill("Jane Doe");
    await page.getByLabel(/email address/i).fill("test@example.com");
    
    const passwords = page.locator('input[autocomplete="new-password"]');
    await passwords.first().fill("StrongPass1!");
    await passwords.last().fill("DifferentPass2@");
    
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: /create account/i }).click();
    
    await expect(page.getByText("Passwords don't match")).toBeVisible();
  });

  test("whitespace-only name is rejected", async ({ page }) => {
    await page.goto("/auth/sign-up");
    
    await page.getByLabel(/full name/i).fill("   ");
    await page.getByLabel(/email address/i).fill("test@example.com");
    
    const passwords = page.locator('input[autocomplete="new-password"]');
    await passwords.first().fill("StrongPass1!");
    await passwords.last().fill("StrongPass1!");
    
    await page.getByRole("checkbox").click();
    
    await page.getByRole("button", { name: /create account/i }).click();
    
    await expect(page.getByText("Full name must be at least 2 characters.")).toBeVisible();
  });

  test("terms checkbox required", async ({ page }) => {
    await page.goto("/auth/sign-up");
    
    await page.getByLabel(/full name/i).fill("Jane Doe");
    await page.getByLabel(/email address/i).fill("test@example.com");
    
    const passwords = page.locator('input[autocomplete="new-password"]');
    await passwords.first().fill("StrongPass1!");
    await passwords.last().fill("StrongPass1!");
    
    // Do NOT check terms
    await page.getByRole("button", { name: /create account/i }).click();
    
    await expect(page.getByText("You must agree to the terms and conditions.")).toBeVisible();
  });

  test("success opens the email modal", async ({ page }) => {
    await page.goto("/auth/sign-up");
    
    await page.getByLabel(/full name/i).fill("Jane Doe");
    await page.getByLabel(/email address/i).fill("success@example.com");
    
    const passwords = page.locator('input[autocomplete="new-password"]');
    await passwords.first().fill("StrongPass1!");
    await passwords.last().fill("StrongPass1!");
    
    await page.getByRole("checkbox").click();
    
    await page.getByRole("button", { name: /create account/i }).click();
    
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: /check your email/i })).toBeVisible();
    await expect(dialog).toContainText("success@example.com");
  });
});
