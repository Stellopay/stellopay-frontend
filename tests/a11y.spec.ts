import { test } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './axe-helper';

test.describe('Accessibility Compliance Suite', () => {
  test('landing page meets WCAG 2.1 AA standards', async ({ page }) => {
    await page.goto('/');
    await expectNoSeriousA11yViolations(page);
  });
});
