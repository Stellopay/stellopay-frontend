import path from "node:path";
import fs from "node:fs";
import { test, expect } from "@playwright/test";

const screenshotDirectory = path.join(process.cwd(), "design", "screenshots");

function ensureScreenshotDirectory() {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
}

/** Helper to navigate to a specific settings tab */
async function navigateToTab(page, tabName) {
  await page.getByRole("tab", { name: new RegExp(tabName, "i") }).click();
  await expect(page.getByRole("tabpanel", { name: new RegExp(tabName, "i") })).toBeVisible();
}

/** Helper to capture a screenshot */
async function capture(page, name) {
  await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`), fullPage: true });
}

/**
 * Notifications tab: toggle channels and save.
 */
test("notifications tab toggles and save flow", async ({ page }) => {
  ensureScreenshotDirectory();
  await page.goto("/settings/preferences?section=notifications");
  await navigateToTab(page, "notifications");

  // Assuming toggles are checkboxes or switches with accessible labels
  const emailToggle = page.getByLabel(/email notifications/i);
  const smsToggle = page.getByLabel(/sms notifications/i);
  const pushToggle = page.getByLabel(/push notifications/i);

  await emailToggle.setChecked(true);
  await smsToggle.setChecked(false);
  await pushToggle.setChecked(true);

  const saveButton = page.getByRole("button", { name: /save/i });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  // Verify a success toast/alert appears
  await expect(page.getByRole("alert")).toContainText(/settings saved/i);

  await capture(page, "settings-notifications-save");
});

/**
 * Security tab: password change validation and success.
 */
test("security tab password change validation and success", async ({ page }) => {
  ensureScreenshotDirectory();
  await page.goto("/settings/preferences?section=security");
  await navigateToTab(page, "security");

  const currentPwd = page.getByLabel(/current password/i);
  const newPwd = page.getByLabel(/new password/i);
  const confirmPwd = page.getByLabel(/confirm new password/i);
  const submit = page.getByRole("button", { name: /change password/i });

  // Wrong current password
  await currentPwd.fill("wrongPwd123");
  await newPwd.fill("Test123!");
  await confirmPwd.fill("Test123!");
  await submit.click();
  await expect(page.getByText(/incorrect current password/i)).toBeVisible();

  // Mismatched new passwords
  await currentPwd.fill("CorrectCurrent123!"); // fixture accepted password
  await newPwd.fill("Test123!");
  await confirmPwd.fill("Different123!");
  await submit.click();
  await expect(page.getByText(/passwords do not match/i)).toBeVisible();

  // Successful change
  await newPwd.fill("NewPass123!");
  await confirmPwd.fill("NewPass123!");
  await submit.click();
  await expect(page.getByText(/password updated successfully/i)).toBeVisible();

  await capture(page, "settings-security-password");
});

/**
 * Security tab: 2FA and login‑approval toggles.
 */
test("security tab 2FA and login‑approval toggles", async ({ page }) => {
  ensureScreenshotDirectory();
  await page.goto("/settings/preferences?section=security");
  await navigateToTab(page, "security");

  const twoFAToggle = page.getByRole("switch", { name: /two‑factor authentication/i });
  const approvalToggle = page.getByRole("switch", { name: /login approval/i });

  // Flip 2FA toggle and assert aria‑pressed changes
  const init2FA = await twoFAToggle.getAttribute("aria-pressed");
  await twoFAToggle.click();
  const after2FA = await twoFAToggle.getAttribute("aria-pressed");
  await expect(after2FA).not.toBe(init2FA);

  // Flip login‑approval toggle
  const initApproval = await approvalToggle.getAttribute("aria-pressed");
  await approvalToggle.click();
  const afterApproval = await approvalToggle.getAttribute("aria-pressed");
  await expect(afterApproval).not.toBe(initApproval);

  // Save if a save button exists for security settings
  const saveButton = page.getByRole("button", { name: /save security settings/i });
  if (await saveButton.isVisible()) {
    await saveButton.click();
    await expect(page.getByRole("alert")).toContainText(/settings saved/i);
  }

  await capture(page, "settings-security-toggles");
});
