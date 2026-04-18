import { chromium } from 'playwright';

const AUTO_LOGIN = 'https://erp.buildlogic.eu/api/auth/auto-login?key=DtIwcsA3qwumnUHYKGSX0aDI6vEbHobjgjn_0p5bzGk';
const OUT = '/tmp/erp-refs';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(AUTO_LOGIN, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

// First: click each section in sidebar to EXPAND (they have chevron)
const sections = ['Склад', 'Калькуляція робіт', "Об'єкти", 'Облік робіт та матеріалів', 'Персонал', 'Довідники'];

for (const s of sections) {
  try {
    await page.locator('li').filter({ hasText: new RegExp('^' + s.replace(/[()'ʼ]/g,'.') + '$') }).first().click({ timeout: 3000 });
    await page.waitForTimeout(500);
  } catch (e) {
    console.log('cannot expand', s, e.message.slice(0, 50));
  }
}
await page.screenshot({ path: `${OUT}/10-menu-expanded.png` });

// Now list all <li> items in the sidebar after expansion
const items = await page.evaluate(() => {
  const els = document.querySelectorAll('li');
  const out = [];
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.x < 260 && r.y > 60 && r.y < 800) {
      const t = (el.textContent || '').trim();
      if (t.length > 2 && t.length < 60) {
        out.push({ text: t, y: Math.round(r.y), h: Math.round(r.height) });
      }
    }
  });
  return out;
});
console.log('MENU_ITEMS', JSON.stringify(items, null, 2));

// Use dashboard module tiles instead — these are simpler links
const tiles = ['Склад', 'Калькуляція робіт', "Об'єкти", 'Персонал', 'Облік робіт та матері', 'Розпізнавання докум', 'SmartReco'];

for (const [i, name] of tiles.entries()) {
  try {
    await page.goto(AUTO_LOGIN, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    // click tile by partial text
    const tile = page.locator('main').getByText(new RegExp(name.replace(/[()'ʼ]/g,'.'), 'i')).first();
    await tile.click({ timeout: 3000 });
    await page.waitForTimeout(1500);
    const url = page.url();
    console.log(`tile[${i}] "${name}" -> ${url}`);
    await page.screenshot({ path: `${OUT}/tile-${String(i).padStart(2,'0')}-${name.replace(/[^\w]/g,'_').slice(0,20)}.png` });
  } catch (e) {
    console.log(`tile[${i}] "${name}" FAIL:`, e.message.slice(0, 80));
  }
}

await browser.close();
