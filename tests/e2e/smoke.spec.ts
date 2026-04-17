import { test, expect } from '@playwright/test';

test.describe('home pages', () => {
  for (const [path, lang, title] of [
    ['/', 'sk', /BuildLogic/],
    ['/en/', 'en', /BuildLogic/],
    ['/ru/', 'ru', /BuildLogic/],
  ] as const) {
    test(`loads ${path} with lang=${lang}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('.brand-mark').first()).toContainText('BL');
      await expect(page.locator('#problem')).toBeVisible();
      await expect(page.locator('#workflow')).toBeVisible();
      await expect(page.locator('#pricing')).toBeVisible();
      await expect(page.locator('#faq')).toBeVisible();
      await expect(page.locator('#contact')).toBeVisible();
    });
  }
});

test.describe('cookie consent', () => {
  test('banner shows on first visit, hides after accept', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    const banner = page.locator('#cookie-banner');
    await page.waitForFunction(() => !document.getElementById('cookie-banner')?.hidden);
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: /Prijať všetko/i }).click();
    await expect(banner).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('bl_consent_v1'));
    expect(consent).toBeTruthy();
    const parsed = JSON.parse(consent!);
    expect(parsed.categories.statistics).toBe(true);
    expect(parsed.categories.marketing).toBe(true);
  });

  test('reject all records denied categories', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await page.waitForFunction(() => !document.getElementById('cookie-banner')?.hidden);
    await page.locator('#cookie-banner').getByRole('button', { name: /Odmietnuť všetko/i }).click();
    const parsed = await page.evaluate(() => JSON.parse(localStorage.getItem('bl_consent_v1')!));
    expect(parsed.categories.statistics).toBe(false);
    expect(parsed.categories.marketing).toBe(false);
    expect(parsed.categories.necessary).toBe(true);
  });
});

test.describe('language switcher', () => {
  test('switches from SK to EN', async ({ page }) => {
    await page.goto('/');
    // Dismiss the cookie banner so it does not intercept pointer events on the header
    await page.waitForFunction(() => !document.getElementById('cookie-banner')?.hidden);
    await page.locator('#cookie-banner').getByRole('button', { name: /Odmietnuť všetko/i }).click();
    await expect(page.locator('#cookie-banner')).toBeHidden();
    await page.locator('.lang-switcher a[lang=en]').click();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('policy pages', () => {
  for (const p of ['/privacy/', '/cookies/', '/en/privacy/', '/en/cookies/', '/ru/privacy/', '/ru/cookies/']) {
    test(`${p} loads`, async ({ page }) => {
      const resp = await page.goto(p);
      expect(resp?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});
