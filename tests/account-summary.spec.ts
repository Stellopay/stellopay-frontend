import { test, expect } from '@playwright/test';

test.describe('Account Summary Page', () => {
  test('renders account summary card and address', async ({ page }) => {
    await page.goto('/account-summary');
    // Heading
    await expect(page.getByRole('heading', { name: /account summary/i })).toBeVisible();
    // Address copy button via aria-label
    const copyBtn = page.getByRole('button', { name: /copy address/i });
    await expect(copyBtn).toBeVisible();
    // Verify address text pattern (masked)
    const address = await page.getByText(/0x[0-9A-Za-z]+\.\.\.[0-9A-Za-z]+/).textContent();
    expect(address).toMatch(/^0x[0-9A-Za-z]+\.\.\.[0-9A-Za-z]+$/);
    // Click copy and verify toast
    await copyBtn.click();
    await expect(page.getByText('Copied!')).toBeVisible();
  });
});
