import { expect, test } from "@playwright/test";

test.describe("verify email page", () => {
  test("labels the verification code input and announces validation feedback", async ({
    page,
  }) => {
    await page.goto("/verify-email");

    const codeInput = page.getByLabel("Verification code");
    await expect(codeInput).toBeVisible();
    await expect(codeInput).toHaveAttribute("id", "verification-code");
    await expect(codeInput).toHaveAttribute("name", "verificationCode");
    await expect(codeInput).toHaveAttribute("inputmode", "numeric");
    await expect(codeInput).toHaveAttribute("required", "");
    await expect(codeInput).toHaveAttribute("aria-describedby", /verification-code-help/);

    await codeInput.fill("12ab345678");

    await expect(codeInput).toHaveValue("123456");
    await expect(
      page.getByText("Verification codes are 6 digits, so extra characters were removed.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
