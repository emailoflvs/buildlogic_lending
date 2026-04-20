import { test, expect, devices } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iphone-se',      ...devices['iPhone SE'] },        // 375×667
  { name: 'iphone-12',      ...devices['iPhone 12'] },        // 390×844
  { name: 'iphone-14-pro',  ...devices['iPhone 14 Pro'] },    // 393×852
  { name: 'pixel-5',        ...devices['Pixel 5'] },          // 393×851
  { name: 'galaxy-s9',      ...devices['Galaxy S9+'] },       // 320×658
  { name: 'ipad-mini',      ...devices['iPad Mini'] },        // 768×1024
  { name: 'ipad-pro-11',    ...devices['iPad Pro 11'] },      // 834×1194
  { name: 'desktop-1280',   viewport: { width: 1280, height: 800 }, userAgent: 'Desktop 1280' },
];

const ROUTES = ['/ru/', '/en/', '/'];

const SECTION_IDS = ['hero', 'problem', 'workflow', 'inside', 'why', 'pricing', 'faq', 'contact'];

for (const vp of VIEWPORTS) {
  test.describe(`Responsive · ${vp.name}`, () => {
    test.use({
      viewport: vp.viewport,
      userAgent: vp.userAgent,
      deviceScaleFactor: (vp as any).deviceScaleFactor ?? 1,
      isMobile: (vp as any).isMobile ?? false,
      hasTouch: (vp as any).hasTouch ?? false,
    });

    for (const route of ROUTES) {
      test(`no horizontal overflow on ${route}`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto(route, { waitUntil: 'networkidle' });

        // Check body doesn't overflow viewport horizontally
        const overflow = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          return { docWidth, innerWidth, overflow: docWidth - innerWidth };
        });

        expect.soft(
          overflow.overflow,
          `Horizontal overflow detected: docWidth=${overflow.docWidth}, innerWidth=${overflow.innerWidth}`
        ).toBeLessThanOrEqual(1);

        // Check no console errors
        expect.soft(
          consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('robots.txt')),
          `Console errors: ${consoleErrors.join('\n')}`
        ).toHaveLength(0);
      });

      test(`screenshots per section on ${route}`, async ({ page }, testInfo) => {
        await page.goto(route, { waitUntil: 'networkidle' });
        // Wait for fonts + animations to settle
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);

        // Full-page screenshot
        const safeRoute = route.replace(/\//g, '_');
        const outDir = `tests/e2e/responsive-screenshots/${vp.name}`;
        await page.screenshot({
          path: `${outDir}/full${safeRoute || '_root'}.png`,
          fullPage: true,
        });

        // Per-section clipped screenshots
        for (const id of SECTION_IDS) {
          const el = page.locator(`#${id}`).first();
          const exists = await el.count();
          if (!exists) continue;
          await el
            .screenshot({ path: `${outDir}/section-${id}${safeRoute || '_root'}.png` })
            .catch(() => {/* skip if not renderable */});
        }
      });

      test(`key sections visible and readable on ${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: 'networkidle' });

        // Hero: H1 + CTA must be visible without clipping
        const h1 = page.locator('.hero h1').first();
        await expect(h1).toBeVisible();
        const h1Box = await h1.boundingBox();
        expect.soft(h1Box?.width, 'H1 should have positive width').toBeGreaterThan(0);

        // Hero KPI card must exist and fit on screen horizontally
        const kpi = page.locator('.hero-kpi').first();
        if ((await kpi.count()) > 0) {
          const box = await kpi.boundingBox();
          if (box) {
            expect.soft(
              box.x + box.width,
              `Hero KPI card right edge (${box.x + box.width}) exceeds viewport (${vp.viewport!.width})`
            ).toBeLessThanOrEqual(vp.viewport!.width + 1);
          }
        }

        // Inside bento must not overflow
        const bento = page.locator('.bento').first();
        if ((await bento.count()) > 0) {
          const box = await bento.boundingBox();
          if (box) {
            expect.soft(
              box.x + box.width,
              `Bento grid right edge (${box.x + box.width}) exceeds viewport (${vp.viewport!.width})`
            ).toBeLessThanOrEqual(vp.viewport!.width + 1);
          }
        }

        // CTA (primary) must be clickable-sized (>=40px high for touch)
        const primaryCta = page.locator('.btn-primary').first();
        if ((await primaryCta.count()) > 0) {
          const ctaBox = await primaryCta.boundingBox();
          if (ctaBox) {
            expect.soft(
              ctaBox.height,
              `Primary CTA height ${ctaBox.height}px smaller than 40px touch target`
            ).toBeGreaterThanOrEqual(40);
          }
        }
      });
    }
  });
}
