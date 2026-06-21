import { expect, test } from "@playwright/test";

const SUPPORT_URL = "/help/support";
const ACCOUNT_MANAGEMENT_URL = "/help/support/accountManagement";

test.describe("Help/Support FAQ navigation", () => {
  test("renders FAQ categories and resolves the loading skeleton", async ({
    page,
  }) => {
    await page.goto(SUPPORT_URL);

    await expect(
      page.getByRole("heading", { name: "Help/Support" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Frequently Asked Questions" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Account Management/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Transaction Issues/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Security & Privacy/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Payment & Transfers/i }).first(),
    ).toBeVisible();

    await expect(
      page.getByRole("status", { name: /loading support content/i }),
    ).toHaveCount(0);
  });

  test("navigates to the account-management FAQ detail view", async ({
    page,
  }) => {
    await page.goto(SUPPORT_URL);

    await page
      .getByRole("link", { name: /Account Management/i })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`${ACCOUNT_MANAGEMENT_URL}$`));
    await expect(
      page.getByRole("link", { name: "Help/Support" }),
    ).toBeVisible();
    await expect(page.getByText("Account Management").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "How to Reset Your Password" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Password & Security" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("support tabs are keyboard reachable and do not reflect form input", async ({
    page,
  }) => {
    await page.goto(SUPPORT_URL);

    const clientFaqTab = page.getByRole("button", { name: "Client FAQ" });
    const contactSupportTab = page.getByRole("button", {
      name: "Contact Support",
    });

    await page.keyboard.press("Tab");
    await expect(clientFaqTab).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(contactSupportTab).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("heading", { name: "Contact Info & FAQ Details" }),
    ).toBeVisible();
    await page.getByLabel("First Name").fill("<script>alert(1)</script>");
    await page.getByLabel("Last Name").fill("Sullivan");
    await page.getByLabel("Email address").fill("maya@example.com");
    await page
      .getByLabel("We would like to hear from you")
      .fill("I need help with a transfer.");

    await expect(
      page.getByRole("button", { name: "Send Message" }),
    ).toBeEnabled();
    await expect(page.locator("script", { hasText: "alert(1)" })).toHaveCount(
      0,
    );
  });
});
