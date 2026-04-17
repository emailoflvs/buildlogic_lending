import { describe, it, expect } from 'vitest';
import { localizePath, getAltHrefs, LOCALES, DEFAULT_LOCALE } from '../../src/lib/i18n';

describe('localizePath', () => {
  it('returns root-relative path for default locale', () => {
    expect(localizePath('/', 'sk')).toBe('/');
    expect(localizePath('/privacy/', 'sk')).toBe('/privacy/');
  });

  it('adds locale prefix for non-default locales', () => {
    expect(localizePath('/', 'en')).toBe('/en/');
    expect(localizePath('/privacy/', 'en')).toBe('/en/privacy/');
    expect(localizePath('/cookies/', 'ru')).toBe('/ru/cookies/');
  });

  it('normalizes trailing slashes', () => {
    expect(localizePath('/privacy', 'en')).toBe('/en/privacy/');
    expect(localizePath('privacy', 'en')).toBe('/en/privacy/');
  });

  it('preserves query and hash', () => {
    expect(localizePath('/contact?ref=x', 'ru')).toBe('/ru/contact/?ref=x');
    expect(localizePath('/faq#q1', 'en')).toBe('/en/faq/#q1');
    expect(localizePath('/', 'sk')).toBe('/');
  });
});

describe('getAltHrefs', () => {
  it('returns hreflang map for all locales plus x-default', () => {
    const result = getAltHrefs('/', 'https://buildlogic.eu');
    expect(result).toEqual([
      { hreflang: 'sk', href: 'https://buildlogic.eu/' },
      { hreflang: 'en', href: 'https://buildlogic.eu/en/' },
      { hreflang: 'ru', href: 'https://buildlogic.eu/ru/' },
      { hreflang: 'x-default', href: 'https://buildlogic.eu/' },
    ]);
  });

  it('handles subpath and tolerates trailing-slash origin', () => {
    const result = getAltHrefs('/privacy/', 'https://buildlogic.eu/');
    expect(result).toEqual([
      { hreflang: 'sk', href: 'https://buildlogic.eu/privacy/' },
      { hreflang: 'en', href: 'https://buildlogic.eu/en/privacy/' },
      { hreflang: 'ru', href: 'https://buildlogic.eu/ru/privacy/' },
      { hreflang: 'x-default', href: 'https://buildlogic.eu/privacy/' },
    ]);
  });
});

describe('constants', () => {
  it('exposes locale list and default', () => {
    expect(LOCALES).toEqual(['sk', 'en', 'ru']);
    expect(DEFAULT_LOCALE).toBe('sk');
  });
});
