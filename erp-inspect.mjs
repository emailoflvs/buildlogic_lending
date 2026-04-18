import { chromium } from 'playwright';

const AUTO_LOGIN = 'https://erp.buildlogic.eu/api/auth/auto-login?key=DtIwcsA3qwumnUHYKGSX0aDI6vEbHobjgjn_0p5bzGk';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(AUTO_LOGIN, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

// dump all links with their hrefs, texts, and visibility
const all = await page.$$eval('a', (els) =>
  els.map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      href: el.getAttribute('href') || '',
      text: (el.textContent || '').trim().slice(0, 50),
      visible: rect.width > 0 && rect.height > 0,
    };
  }).filter((x) => x.href && x.text)
);
console.log(JSON.stringify(all, null, 2));
await browser.close();
