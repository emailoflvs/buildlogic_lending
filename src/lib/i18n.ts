/**
 * List of supported locale codes.
 */
export const LOCALES = ['sk', 'en', 'ru'] as const;

/**
 * Union type of all supported locale codes.
 */
export type Locale = typeof LOCALES[number];

/**
 * The default locale served from the root path without a prefix.
 */
export const DEFAULT_LOCALE: Locale = 'sk';

function normalize(path: string): string {
  const qIdx = path.search(/[?#]/);
  const suffix = qIdx >= 0 ? path.slice(qIdx) : '';
  let p = qIdx >= 0 ? path.slice(0, qIdx) : path;
  if (!p.startsWith('/')) p = '/' + p;
  if (!p.endsWith('/')) p = p + '/';
  return p + suffix;
}

/**
 * Prefixes a site-internal path with the locale segment for non-default locales.
 * The default locale (`sk`) is served from root with no prefix.
 *
 * The `path` argument must be a site-internal path (pathname optionally followed by
 * `?query` and/or `#hash`). Arbitrary external URLs are not supported and will be
 * treated as relative paths.
 *
 * @example
 * localizePath('/', 'sk')          // '/'
 * localizePath('/privacy/', 'en')  // '/en/privacy/'
 * localizePath('privacy', 'en')    // '/en/privacy/' (auto-normalized)
 * localizePath('/contact?ref=x', 'ru') // '/ru/contact/?ref=x'
 */
export function localizePath(path: string, locale: Locale): string {
  const clean = normalize(path);
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}/`;
  return `/${locale}${clean}`;
}

/**
 * Generates alternate hreflang links for all supported locales.
 * Strips trailing slashes from the origin to avoid double slashes in URLs.
 *
 * @param path - The site-internal path (may include query/hash)
 * @param origin - The protocol and domain (trailing slash is optional)
 */
export function getAltHrefs(path: string, origin: string): Array<{ hreflang: string; href: string }> {
  const base = origin.replace(/\/+$/, '');
  const result = LOCALES.map((l) => ({
    hreflang: l,
    href: base + localizePath(path, l),
  }));
  result.push({ hreflang: 'x-default', href: base + localizePath(path, DEFAULT_LOCALE) });
  return result;
}
