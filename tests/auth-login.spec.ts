import { expect, test } from "@playwright/test";

/**
 * End-to-end tests for the Login flow.
 * Validates form submission, Zod schema constraints, and UI feedback
 * such as loading spinners and error messages.
 * 
 * @security Uses fake credentials. Never logs entered passwords.
 */
test.describe("Login validation and submission", () => {
  test("empty submit shows zod errors", async ({ page }) => {
    await page.goto("/auth/login");
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();
    
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
  });

  test("invalid email rejected", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email address/i).fill("not-an-email");
    await page.getByLabel(/^password/i).fill("Valid123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  });

  test("loading spinner appears on submit", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email address/i).fill("test@example.com");
    await page.getByLabel(/^password/i).fill("Valid123!");
    
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await submitBtn.click();

    await expect(page.getByRole("button", { name: /signing in/i })).toBeVisible();
  });

  test("invalid credentials shows error", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email address/i).fill("error@example.com");
    await page.getByLabel(/^password/i).fill("Valid123!");
    
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText("Invalid email or password. Please try again.")).toBeVisible();
  });
});
