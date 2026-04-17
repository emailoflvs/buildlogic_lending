// Client-only module. Do not import from Astro frontmatter.
// Called after consent is saved/loaded to load GA4/Meta/LinkedIn scripts
// only if their respective category is granted AND the env ID is set.

import type { ConsentCategories } from './consent';

const GA4_ID = import.meta.env.PUBLIC_GA4_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.PUBLIC_META_PIXEL_ID as string | undefined;
const LINKEDIN_PARTNER_ID = import.meta.env.PUBLIC_LINKEDIN_PARTNER_ID as string | undefined;

const loaded = new Set<string>();

function loadScript(src: string, id: string): void {
  if (loaded.has(id)) return;
  loaded.add(id);
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  s.id = id;
  document.head.appendChild(s);
}

function initGA4(): void {
  if (!GA4_ID) return;
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, 'ga4-loader');
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { (window.dataLayer as unknown[]).push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID, { anonymize_ip: true });
}

function initMeta(): void {
  if (!META_PIXEL_ID) return;
  if (loaded.has('meta-pixel')) return;
  loaded.add('meta-pixel');
  // Standard Meta Pixel bootstrap (slim variant, typed for globals.d.ts).
  (function (f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    const t = b.createElement(e); t.async = true; t.src = v;
    const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  window.fbq?.('init', META_PIXEL_ID);
  window.fbq?.('track', 'PageView');
}

function initLinkedIn(): void {
  if (!LINKEDIN_PARTNER_ID) return;
  if (loaded.has('linkedin-insight')) return;
  loaded.add('linkedin-insight');
  window._linkedin_partner_id = LINKEDIN_PARTNER_ID;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);
  loadScript('https://snap.licdn.com/li.lms-analytics/insight.min.js', 'linkedin-insight');
}

export function initTrackers(cats: ConsentCategories): void {
  if (cats.statistics) initGA4();
  if (cats.marketing) { initMeta(); initLinkedIn(); }
}
