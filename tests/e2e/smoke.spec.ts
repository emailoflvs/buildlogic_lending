import { test, expect } from '@playwright/test';

test('home page loads with SK locale', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
});
