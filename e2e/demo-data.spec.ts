import { expect, test } from "@playwright/test";

test("landing page renders illustrative demo stats badge and config stats", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Illustrative Demo Data").first()).toBeVisible();
  await expect(page.getByText("Transaction Volume").first()).toBeVisible();
  await expect(page.getByText("Active Users").first()).toBeVisible();
  await expect(page.getByText("Uptime").first()).toBeVisible();
});

test("account preferences renders demo data badge and placeholder info", async ({ page }) => {
  await page.goto("/settings/preferences?section=account");
  await expect(page.getByText("Demo Data").first()).toBeVisible();
  await expect(page.locator("#first-name")).toHaveValue("Demo");
  await expect(page.locator("#last-name")).toHaveValue("User");
  await expect(page.locator("#email-address")).toHaveValue("user@example.com");

  // Advanced fields
  await page.getByText("Show advanced identity and billing fields").click();
  await expect(page.locator("#legal-name")).toHaveValue("Demo Labs Inc.");
  await expect(page.locator("#billing-country")).toHaveValue("United States");
});

test("security preferences renders placeholder recovery contacts", async ({ page }) => {
  await page.goto("/settings/preferences?section=security");
  await expect(page.getByText("Demo Data").first()).toBeVisible();
  await page.getByText("Show recovery methods").click();
  await expect(page.getByText("Primary email: user@example.com")).toBeVisible();
  await expect(page.getByText("Backup contact: +1 555 0100")).toBeVisible();
});

test("wallets section renders redacted placeholder addresses", async ({ page }) => {
  await page.goto("/settings/preferences?section=wallets");
  await expect(page.getByText("Demo Data").first()).toBeVisible();
  await expect(page.getByText("Address: GB-REDACTED-DEMO-STELLAR-ADDRESS-XXXX")).toBeVisible();
  await expect(page.getByText("Address: 0x-REDACTED-DEMO-STARKNET-ADDRESS-XXXX")).toBeVisible();
});
