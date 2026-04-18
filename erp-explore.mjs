import { chromium } from 'playwright';

const AUTO_LOGIN = 'https://erp.buildlogic.eu/api/auth/auto-login?key=DtIwcsA3qwumnUHYKGSX0aDI6vEbHobjgjn_0p5bzGk';
const OUT = '/tmp/erp-refs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

console.log('-> auto-login');
await page.goto(AUTO_LOGIN, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);
console.log('landed at', page.url());

// first screenshot after login
await page.screenshot({ path: `${OUT}/00-after-login.png`, fullPage: false });

// Inspect DOM: list sidebar links / menu items
const links = await page.$$eval('a, [role="menuitem"], nav li', (els) => {
  return els.slice(0, 80).map((el) => ({
    text: (el.textContent || '').trim().slice(0, 60),
    href: el.getAttribute('href') || '',
    role: el.getAttribute('role') || el.tagName.toLowerCase(),
  })).filter((x) => x.text.length > 0 && x.text.length < 60);
});
console.log('---LINKS---');
console.log(JSON.stringify(links, null, 2));

await browser.close();
