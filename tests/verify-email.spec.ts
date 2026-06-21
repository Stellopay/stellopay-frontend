import { expect, test } from "@playwright/test";

test.describe("Verify email code input", () => {
  test("code input is labeled, described, and validates while typing", async ({
    page,
  }) => {
    await page.goto("/verify-email");

    const codeInput = page.getByLabel("Verification code");

    await expect(codeInput).toBeVisible();
    await expect(codeInput).toHaveAttribute("id", "verification-code");
    await expect(codeInput).toHaveAttribute("name", "verificationCode");
    await expect(codeInput).toHaveAttribute(
      "aria-describedby",
      /verification-code-help/,
    );
    await expect(codeInput).toHaveAttribute("required", "");

    await codeInput.fill("12");
    await expect(page.getByText("Enter all 6 digits.")).toBeVisible();
    await expect(codeInput).toHaveAttribute("aria-invalid", "true");

    await codeInput.fill("123456");
    await expect(codeInput).toHaveValue("123456");
    await expect(codeInput).toHaveAttribute("aria-invalid", "false");
  });

  test("code input filters non-numeric input and reports truncated paste", async ({
    page,
  }) => {
    await page.goto("/verify-email");

    const codeInput = page.getByLabel("Verification code");

    await codeInput.fill("abc");
    await expect(codeInput).toHaveValue("");
    await expect(
      page.getByText("Use numbers only for the verification code."),
    ).toBeVisible();

    await codeInput.focus();
    await codeInput.evaluate((input) => {
      const clipboard = new DataTransfer();
      clipboard.setData("text/plain", "123456789");
      input.dispatchEvent(
        new ClipboardEvent("paste", {
          bubbles: true,
          cancelable: true,
          clipboardData: clipboard,
        }),
      );
    });

    await expect(codeInput).toHaveValue("123456");
    await expect(
      page.getByText("Verification codes are 6 digits. Extra digits were ignored."),
    ).toBeVisible();
  });
});
