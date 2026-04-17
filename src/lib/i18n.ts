export const LOCALES = ['sk', 'en', 'ru'] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = 'sk';

function normalize(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/')) path = path + '/';
  return path;
}

export function localizePath(path: string, locale: Locale): string {
  const clean = normalize(path);
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}/`;
  return `/${locale}${clean}`;
}

export function getAltHrefs(path: string, origin: string): Array<{ hreflang: string; href: string }> {
  const result = LOCALES.map((l) => ({
    hreflang: l,
    href: origin + localizePath(path, l),
  }));
  result.push({ hreflang: 'x-default', href: origin + localizePath(path, DEFAULT_LOCALE) });
  return result;
}
