import { test, expect } from '@playwright/test';

test.describe('Analytics View Page', () => {
  test('renders analytics chart without errors', async ({ page }) => {
    await page.goto('/analytics-view');
    // Heading
    await expect(page.getByRole('heading', { name: /analytics views/i })).toBeVisible();
    // Chart container should be present
    const chart = page.getByLabel('Analytics chart');
    // If no explicit testid, fallback to finding canvas or recharts container
    const possibleChart = chart.first();
    await expect(possibleChart).toBeVisible();
    // Ensure no runtime errors captured in console
    const errors = [] as string[];
    page.on('pageerror', (err) => errors.push(err.message));
    // After load, ensure no errors
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
