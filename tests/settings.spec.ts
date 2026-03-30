import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const screenshotDirectory = path.join(process.cwd(), "design", "screenshots");

function ensureScreenshotDirectory() {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
}

test("desktop settings navigation and destructive confirmation stay clear", async ({
  page,
}) => {
  ensureScreenshotDirectory();

  await page.goto("/settings/preferences?section=account");

  await expect(
    page.getByRole("heading", { name: "Settings that stay easy to scan" }),
  ).toBeVisible();

  await page.getByRole("tab", { name: /notifications/i }).click();
  await expect(page.getByText("Notification priorities")).toBeVisible();

  await page.getByRole("tab", { name: /wallets/i }).click();
  await expect(
    page.getByText("Connected wallets", { exact: true }),
  ).toBeVisible();

  await page.getByRole("tab", { name: /account/i }).click();
  await page.getByRole("button", { name: "Deactivate account" }).click();

  const confirmButton = page.getByRole("button", {
    name: "Confirm deactivation",
  });

  await expect(confirmButton).toBeDisabled();
  await page.getByLabel('Type "DEACTIVATE" to confirm').fill("DEACTIVATE");
  await expect(confirmButton).toBeEnabled();

  await page.screenshot({
    path: path.join(screenshotDirectory, "settings-desktop.png"),
    fullPage: true,
  });
});

test("mobile settings nav remains reachable", async ({ page }) => {
  ensureScreenshotDirectory();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings/preferences?section=security");

  await expect(
    page.getByRole("tablist", { name: "Settings sections" }),
  ).toBeVisible();
  await expect(page.getByText("Verification controls")).toBeVisible();

  await page.screenshot({
    path: path.join(screenshotDirectory, "settings-mobile.png"),
    fullPage: true,
  });
});
