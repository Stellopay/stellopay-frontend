import { expect, test } from "@playwright/test";

const VERIFY_EMAIL_URL = "/verify-email";

// The verification code is entered through six single-character OTP boxes.
// Each box exposes an accessible label "Verification code character N".
const fillCode = async (
  page: import("@playwright/test").Page,
  digits: string,
) => {
  for (let i = 0; i < digits.length; i += 1) {
    await page
      .getByLabel(`Verification code character ${i + 1}`)
      .fill(digits[i]);
  }
};

test.describe("Verify email - code input", () => {
  test("renders the form without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto(VERIFY_EMAIL_URL);
    await expect(
      page.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("code boxes are reachable by label and expose accessibility attributes", async ({
    page,
  }) => {
    await page.goto(VERIFY_EMAIL_URL);
    const firstBox = page.getByLabel("Verification code character 1");

    await expect(firstBox).toBeVisible();
    await expect(firstBox).toHaveAttribute("autocomplete", "one-time-code");
    await expect(firstBox).toHaveAttribute(
      "aria-describedby",
      "verification-code-help",
    );
    await expect(firstBox).toHaveAttribute("aria-invalid", "false");
  });

  test("Continue button is disabled when code is empty", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeDisabled();
  });

  test("Continue button is disabled with short code (< 6 digits)", async ({
    page,
  }) => {
    await page.goto(VERIFY_EMAIL_URL);
    await fillCode(page, "123");
    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeDisabled();
  });

  test("Continue button is enabled with 6-digit code", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    await fillCode(page, "123456");
    const continueBtn = page.getByRole("button", { name: /continue/i });
    await expect(continueBtn).toBeEnabled();
  });

  test("shows error for invalid verification code", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    await fillCode(page, "000000");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("status")).toContainText(
      /invalid verification code/i,
    );
    await expect(page.locator("#verification-code-error")).toContainText(
      /invalid verification code/i,
    );
  });

  test("shows success for correct verification code (123456)", async ({
    page,
  }) => {
    await page.goto(VERIFY_EMAIL_URL);
    await fillCode(page, "123456");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("status")).toContainText(
      /email verified successfully/i,
    );
  });

  test("Continue button shows loading state during verification", async ({
    page,
  }) => {
    await page.goto(VERIFY_EMAIL_URL);
    await fillCode(page, "123456");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(
      page.getByRole("button", { name: /verifying/i }),
    ).toBeVisible();
  });

  test("Continue button is disabled during verification", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    await fillCode(page, "123456");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(
      page.getByRole("button", { name: /verifying/i }),
    ).toBeDisabled();
  });
});

test.describe("Verify email - resend action", () => {
  test("Resend button triggers loading state then success message", async ({
    page,
  }) => {
    await page.goto(VERIFY_EMAIL_URL);
    const resendBtn = page.getByRole("button", { name: /resend/i });

    await resendBtn.click();
    await expect(page.getByRole("button", { name: /sending/i })).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      /verification code resent/i,
    );
    await expect(page.getByRole("button", { name: /resend/i })).toBeVisible();
  });

  test("Resend button is disabled during loading", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    const resendBtn = page.getByRole("button", { name: /resend/i });
    await resendBtn.click();
    const sendingBtn = page.getByRole("button", { name: /sending/i });
    await expect(sendingBtn).toBeDisabled();
  });
});

test.describe("Verify email - navigation", () => {
  test("close button is visible with correct aria-label", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    const closeBtn = page.getByRole("button", { name: /close/i });
    await expect(closeBtn).toBeVisible();
  });

  test("go back button is visible", async ({ page }) => {
    await page.goto(VERIFY_EMAIL_URL);
    const goBackBtn = page.getByRole("button", { name: /go back/i });
    await expect(goBackBtn).toBeVisible();
  });
});
