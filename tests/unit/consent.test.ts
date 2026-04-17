import { describe, it, expect, beforeEach } from 'vitest';
import { loadConsent, saveConsent, isExpired, toGtagConsent, CONSENT_VERSION, TTL_MS } from '../../src/lib/consent';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(k: string) { return this.store[k] ?? null; }
  setItem(k: string, v: string) { this.store[k] = v; }
  removeItem(k: string) { delete this.store[k]; }
  clear() { this.store = {}; }
}

beforeEach(() => {
  (global as any).localStorage = new MockStorage();
});

describe('saveConsent + loadConsent', () => {
  it('round-trips a consent object', () => {
    saveConsent({ necessary: true, preferences: false, statistics: true, marketing: false });
    const loaded = loadConsent();
    expect(loaded).not.toBeNull();
    expect(loaded!.categories.statistics).toBe(true);
    expect(loaded!.categories.marketing).toBe(false);
    expect(loaded!.version).toBe(CONSENT_VERSION);
  });

  it('returns null when nothing stored', () => {
    expect(loadConsent()).toBeNull();
  });

  it('returns null when stored version differs', () => {
    localStorage.setItem('bl_consent_v1', JSON.stringify({ version: 'wrong', timestamp: Date.now(), categories: {} }));
    expect(loadConsent()).toBeNull();
  });

  it('forces necessary: true even if caller bypasses type system', () => {
    saveConsent({ necessary: true as any, preferences: false, statistics: false, marketing: false });
    const stored = JSON.parse(localStorage.getItem('bl_consent_v1')!);
    expect(stored.categories.necessary).toBe(true);
  });

  it('returns null when categories shape is tampered', () => {
    localStorage.setItem('bl_consent_v1', JSON.stringify({
      version: 'v1',
      timestamp: Date.now(),
      categories: null,
    }));
    expect(loadConsent()).toBeNull();

    localStorage.setItem('bl_consent_v1', JSON.stringify({
      version: 'v1',
      timestamp: Date.now(),
      categories: { necessary: true, preferences: 'yes', statistics: true, marketing: false },
    }));
    expect(loadConsent()).toBeNull();
  });
});

describe('isExpired', () => {
  it('returns false for fresh consent', () => {
    expect(isExpired(Date.now() - 1000)).toBe(false);
  });
  it('returns true past TTL', () => {
    expect(isExpired(Date.now() - TTL_MS - 1000)).toBe(true);
  });
});

describe('toGtagConsent', () => {
  it('denies everything when all categories are false', () => {
    const g = toGtagConsent({ necessary: true, preferences: false, statistics: false, marketing: false });
    expect(g.analytics_storage).toBe('denied');
    expect(g.ad_storage).toBe('denied');
    expect(g.ad_user_data).toBe('denied');
    expect(g.ad_personalization).toBe('denied');
    expect(g.personalization_storage).toBe('denied');
    expect(g.functionality_storage).toBe('granted');
    expect(g.security_storage).toBe('granted');
  });
  it('grants statistics when enabled', () => {
    const g = toGtagConsent({ necessary: true, preferences: false, statistics: true, marketing: false });
    expect(g.analytics_storage).toBe('granted');
    expect(g.ad_storage).toBe('denied');
  });
  it('grants marketing when enabled', () => {
    const g = toGtagConsent({ necessary: true, preferences: true, statistics: false, marketing: true });
    expect(g.ad_storage).toBe('granted');
    expect(g.ad_user_data).toBe('granted');
    expect(g.ad_personalization).toBe('granted');
    expect(g.personalization_storage).toBe('granted');
  });
});
