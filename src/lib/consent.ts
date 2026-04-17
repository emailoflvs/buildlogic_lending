// Client-only module. Do not import from Astro frontmatter — uses localStorage directly.
// Consumed by src/components/CookieBanner.astro (via <script>) and src/lib/trackers.ts.

export const CONSENT_VERSION = 'v1';
export const CONSENT_KEY = 'bl_consent_v1';
export const TTL_MS = 13 * 30 * 24 * 60 * 60 * 1000; // ~13 months

export interface ConsentCategories {
  necessary: true;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}

export interface ConsentRecord {
  version: string;
  timestamp: number;
  categories: ConsentCategories;
}

export interface GtagConsent {
  ad_storage: 'granted' | 'denied';
  analytics_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  security_storage: 'granted' | 'denied';
}

export function saveConsent(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    categories: { ...categories, necessary: true },
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  return record;
}

export function loadConsent(): ConsentRecord | null {
  const raw = localStorage.getItem(CONSENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.timestamp !== 'number' ||
      !parsed.categories ||
      typeof parsed.categories.preferences !== 'boolean' ||
      typeof parsed.categories.statistics !== 'boolean' ||
      typeof parsed.categories.marketing !== 'boolean'
    ) {
      return null;
    }
    return parsed as ConsentRecord;
  } catch {
    return null;
  }
}

export function isExpired(timestamp: number, now: number = Date.now()): boolean {
  return now - timestamp > TTL_MS;
}

export function clearConsent(): void {
  localStorage.removeItem(CONSENT_KEY);
}

export function toGtagConsent(c: ConsentCategories): GtagConsent {
  return {
    analytics_storage: c.statistics ? 'granted' : 'denied',
    ad_storage: c.marketing ? 'granted' : 'denied',
    ad_user_data: c.marketing ? 'granted' : 'denied',
    ad_personalization: c.marketing ? 'granted' : 'denied',
    personalization_storage: c.preferences || c.marketing ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  };
}
