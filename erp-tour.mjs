import { chromium } from 'playwright';

const AUTO_LOGIN = 'https://erp.buildlogic.eu/api/auth/auto-login?key=DtIwcsA3qwumnUHYKGSX0aDI6vEbHobjgjn_0p5bzGk';
const OUT = '/tmp/erp-refs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(AUTO_LOGIN, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);

// click each sidebar section to expand, screenshot, then explore sub-pages
const sections = [
  { label: 'Склад', out: '01-sklad' },
  { label: 'Калькуляція', out: '02-calc' },
  { label: "Об'єкти", out: '03-objects' },
  { label: 'Облік робіт', out: '04-oblik' },
  { label: 'Персонал', out: '05-personal' },
  { label: 'Довідники', out: '06-dovidnyk' },
];

for (const s of sections) {
  try {
    const loc = page.locator('aside').getByText(s.label, { exact: false }).first();
    await loc.click({ timeout: 3000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${s.out}-expanded.png` });
    console.log('expanded', s.label, '-> url:', page.url());
  } catch (e) {
    console.log('skip', s.label, e.message);
  }
}

// Try deep-linking to common ERP URLs based on menu structure
const deepUrls = [
  '/uk/warehouse',
  '/uk/warehouse/materials',
  '/uk/warehouse/receipts',
  '/uk/warehouse/stock',
  '/uk/objects',
  '/uk/objects/list',
  '/uk/work-log',
  '/uk/work-log/documents',
  '/uk/calculations',
  '/uk/personnel',
  '/uk/smartreco',
  '/uk/documents',
];

for (const u of deepUrls) {
  try {
    await page.goto('https://erp.buildlogic.eu' + u, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(600);
    const title = await page.title();
    console.log('->', u, '|', title, '|', page.url());
    await page.screenshot({ path: `${OUT}/deep-${u.replace(/[\/]/g, '_')}.png` });
  } catch (e) {
    console.log('fail', u, e.message.slice(0, 80));
  }
}

await browser.close();
