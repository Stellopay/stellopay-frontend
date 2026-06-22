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

test("destructive confirmation dialog is labeled and focus-managed", async ({
  page,
}) => {
  await page.goto("/settings/preferences?section=account");

  const trigger = page.getByRole("button", { name: "Deactivate account" });
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const input = page.getByLabel('Type "DEACTIVATE" to confirm');
  const confirmButton = page.getByRole("button", {
    name: "Confirm deactivation",
  });

  // Auto-focus: the field the user must fill is focused on open.
  await expect(input).toBeFocused();

  // ARIA wiring is present and starts in a valid, required state.
  await expect(input).toHaveAttribute("aria-required", "true");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(confirmButton).toBeDisabled();

  // Wrong token -> inline error, aria-invalid flips, error is described.
  await input.fill("nope");
  await expect(confirmButton).toBeDisabled();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  const errorMessage = dialog.getByRole("alert");
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText("doesn't match");
  const errorId = await errorMessage.getAttribute("id");
  expect(errorId).toBeTruthy();
  await expect(input).toHaveAttribute(
    "aria-describedby",
    new RegExp(errorId as string),
  );

  // Trailing-space token -> still rejected, with a whitespace-specific hint.
  await input.fill("DEACTIVATE ");
  await expect(confirmButton).toBeDisabled();
  await expect(dialog.getByRole("alert")).toContainText("extra spaces");

  // Wrong casing -> rejected, with a capitalization hint (case-sensitive match).
  await input.fill("deactivate");
  await expect(confirmButton).toBeDisabled();
  await expect(dialog.getByRole("alert")).toContainText("capitalization");

  // Exact token -> valid: error clears and confirm is enabled.
  await input.fill("DEACTIVATE");
  await expect(input).toHaveAttribute("aria-invalid", "false");
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await expect(confirmButton).toBeEnabled();

  // Escape cancels the dialog and restores focus to the trigger.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
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
