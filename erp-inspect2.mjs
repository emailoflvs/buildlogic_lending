import { chromium } from 'playwright';

const AUTO_LOGIN = 'https://erp.buildlogic.eu/api/auth/auto-login?key=DtIwcsA3qwumnUHYKGSX0aDI6vEbHobjgjn_0p5bzGk';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(AUTO_LOGIN, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

// Inspect left sidebar: what sits in the region x=0..260
const elements = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('button, [role="button"], [role="menuitem"], [role="tab"], a, li, span, div').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.x < 260 && r.y > 60 && r.y < 500 && r.width > 50 && r.height > 20) {
      const t = (el.textContent || '').trim();
      if (t.length > 2 && t.length < 40) {
        out.push({ tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || '', text: t, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
  });
  // dedupe by text+y
  const seen = new Set();
  return out.filter((e) => {
    const k = e.text + '|' + e.y;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
});
console.log(JSON.stringify(elements, null, 2));
await browser.close();
