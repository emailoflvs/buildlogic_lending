# BuildLogic Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready static landing for BuildLogic in Astro with three languages (SK/EN/RU), full GDPR/ePrivacy-compliant cookie consent, and Docker-based deployment.

**Architecture:** Astro 5 static site builds to `/dist`, served by nginx inside a single Docker container on port 4321. Content lives in JSON per section with `{ sk, en, ru }` blocks. Cookie consent is a self-hosted TypeScript module implementing Google Consent Mode v2 with four categories. Production domain (`buildlogic.eu`) sits behind a user-managed external reverse proxy.

**Tech Stack:** Astro 5.x · TypeScript · Vitest (unit) · Playwright (smoke) · Docker (node:22-alpine build → nginx:alpine serve) · nginx · self-hosted Inter + Roboto Condensed fonts.

**Spec:** `docs/superpowers/specs/2026-04-17-buildlogic-landing-design.md`

**Working directory:** `/home/doclogic_www/buildlogic_www/` (git repo `git@github.com:skomax/buildlogic_www.git`, currently contains only `docs/`).

**Dev URL:** `http://157.180.43.89:4321`

---

## Phase 1: Foundation

### Task 1: Initialize Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`, `src/pages/index.astro` (placeholder), `.gitignore`

- [ ] **Step 1: Initialize the Astro project non-interactively in repo root**

Run from `/home/doclogic_www/buildlogic_www/`:
```bash
npm create astro@latest . -- --template minimal --typescript strict --install --git no --skip-houston --yes
```
Expected: fresh minimal Astro project scaffolded alongside existing `docs/`. Accept overwrite of `.gitignore` if prompted.

- [ ] **Step 2: Verify install and dev server start**

Run:
```bash
npm run build
```
Expected: `dist/` produced, no errors.

- [ ] **Step 3: Configure Astro for i18n**

Overwrite `astro.config.mjs` with:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://buildlogic.eu',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: 'sk',
    locales: ['sk', 'en', 'ru'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
});
```

- [ ] **Step 4: Install sitemap integration**

```bash
npm install @astrojs/sitemap
```
Expected: added to dependencies.

- [ ] **Step 5: Replace default index.astro with placeholder**

Overwrite `src/pages/index.astro`:
```astro
---
const lang = Astro.currentLocale ?? 'sk';
---
<!doctype html>
<html lang={lang}>
<head><meta charset="utf-8"><title>BuildLogic</title></head>
<body><h1>BuildLogic — {lang}</h1></body>
</html>
```

- [ ] **Step 6: Verify build still works**

```bash
npm run build && ls dist/
```
Expected: `dist/index.html` exists and contains "BuildLogic — sk".

- [ ] **Step 7: Replace .gitignore with full version**

Overwrite `.gitignore`:
```
# dependencies
node_modules/

# astro
dist/
.astro/

# environment
.env
.env.local
.env.production
.env.*.local

# ide
.vscode/
.idea/

# os
.DS_Store
Thumbs.db

# workspace
.superpowers/
max/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# test
coverage/
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: init Astro project with i18n config"
```

---

### Task 2: Set up Vitest for unit tests

**Files:**
- Create: `vitest.config.ts`, `tests/unit/smoke.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest and types**

```bash
npm install -D vitest @types/node
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Add inside `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:unit": "vitest run",
```

- [ ] **Step 4: Write a smoke test at `tests/unit/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('passes a trivial check', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test**

```bash
npm run test
```
Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: add vitest for unit tests"
```

---

### Task 3: Set up Playwright for smoke tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Add preview/e2e scripts to package.json**

Add inside `"scripts"`:
```json
"preview": "astro preview --host 0.0.0.0 --port 4321",
"test:e2e": "playwright test"
```

- [ ] **Step 4: Write a smoke test at `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('home page loads with SK locale', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
});
```

- [ ] **Step 5: Build and run e2e**

```bash
npm run build && npm run test:e2e
```
Expected: 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: add playwright for e2e smoke tests"
```

---

### Task 4: Dockerize the project

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `.dockerignore`

- [ ] **Step 1: Create `Dockerfile`**

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 2: Create `.dockerignore`**

```
node_modules
dist
.astro
.git
.github
.superpowers
docs
tests
playwright-report
test-results
max
*.log
.env
.env.*
.vscode
.idea
```

- [ ] **Step 3: Create `nginx.conf`**

```nginx
server {
  listen 80 default_server;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_comp_level 6;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;

  location ~* ^/_astro/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location ~* ^/fonts/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ $uri.html /404.html;
    add_header Cache-Control "no-cache";
  }

  error_page 404 /404.html;
  location = /404.html { internal; }
}
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  buildlogic-landing:
    build: .
    container_name: buildlogic-landing
    ports:
      - "4321:80"
    restart: unless-stopped
```

- [ ] **Step 5: Build and run container**

```bash
docker compose up -d --build
```
Expected: container `buildlogic-landing` running, port 4321 bound.

- [ ] **Step 6: Verify it serves**

```bash
curl -sSf http://localhost:4321/ | grep -o "BuildLogic.*sk"
```
Expected: output contains `BuildLogic — sk`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "build: add Docker multi-stage image with nginx"
```

---

### Task 5: Add README and env example

**Files:**
- Create: `README.md`, `.env.example`

- [ ] **Step 1: Create `.env.example`**

```
# Leave empty to disable the respective tracker. No script loads when empty.
PUBLIC_GA4_ID=
PUBLIC_META_PIXEL_ID=
PUBLIC_LINKEDIN_PARTNER_ID=
```

- [ ] **Step 2: Create `README.md`**

```markdown
# BuildLogic Landing

Static landing for BuildLogic — SK/EN/RU, Astro, Docker.

## Quick start

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # produces dist/
npm run preview   # serves built dist/
```

## Docker (dev/staging)

```bash
docker compose up -d --build
# http://localhost:4321 or http://<server-ip>:4321
```

## Tests

```bash
npm run test         # unit (vitest)
npm run test:e2e     # e2e (playwright)
```

## Deploy to production

Same image; place behind external nginx/Caddy with TLS.
Example reverse-proxy config: `docs/deployment/nginx-reverse-proxy.conf.example`.

## Trackers

Set `.env` values from `.env.example`. Empty values disable the respective tracker. All loading gated by user consent (Google Consent Mode v2).

## Spec and plan

- `docs/superpowers/specs/2026-04-17-buildlogic-landing-design.md`
- `docs/superpowers/plans/2026-04-17-buildlogic-landing.md`
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README and env example"
```

---

## Phase 2: Layout & Visual Foundation

### Task 6: i18n helper library with unit tests

**Files:**
- Create: `src/lib/i18n.ts`, `tests/unit/i18n.test.ts`

- [ ] **Step 1: Write failing tests at `tests/unit/i18n.test.ts`**

```ts
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
});

describe('constants', () => {
  it('exposes locale list and default', () => {
    expect(LOCALES).toEqual(['sk', 'en', 'ru']);
    expect(DEFAULT_LOCALE).toBe('sk');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test
```
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `src/lib/i18n.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test
```
Expected: 4 tests passed (3 localizePath + 1 getAltHrefs + 1 constants = 5 actually; all pass).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(i18n): add locale URL helpers with tests"
```

---

### Task 7: Design tokens and global CSS

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  --bg: #f4efe7;
  --surface: #fffdfa;
  --surface-2: #fbf8f3;
  --card: #ffffff;
  --text: #1e2b33;
  --muted: #61717c;
  --line: #ddd3c4;
  --line-2: #ece4d8;
  --primary: #234f48;
  --primary-2: #1b3e38;
  --accent: #bf9461;
  --accent-soft: #efe3d3;
  --success: #347451;
  --warn: #c08a3e;
  --danger: #a84c49;
  --shadow: 0 18px 40px rgba(37, 40, 32, 0.08);
  --radius-xl: 28px;
  --radius-lg: 22px;
  --radius-md: 16px;
  --radius-sm: 12px;
  --container: 1180px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import './tokens.css';

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  background:
    linear-gradient(to right, rgba(191, 148, 97, 0.08) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(to bottom, rgba(191, 148, 97, 0.08) 1px, transparent 1px) 0 0 / 48px 48px,
    var(--bg);
  color: var(--text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
img, svg { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
button, input, textarea, select { font: inherit; color: inherit; }

.container {
  width: min(calc(100% - 32px), var(--container));
  margin-inline: auto;
}

.section { padding-block: var(--space-16); }

.eyebrow {
  display: inline-block;
  font-family: 'Roboto Condensed', 'Inter', sans-serif;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 4px 10px;
  border: 1px solid var(--accent);
  border-radius: 999px;
  background: var(--accent-soft);
}

h1, h2, h3 { letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
h1 { font-size: clamp(32px, 4.5vw, 54px); font-weight: 800; }
h2 { font-size: clamp(26px, 3.2vw, 40px); font-weight: 800; }
h3 { font-size: clamp(18px, 2vw, 22px); font-weight: 700; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 22px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 15px;
  line-height: 1;
  transition: all 0.15s;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
}
.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:hover { background: var(--primary-2); }
.btn-secondary {
  background: transparent;
  color: var(--primary);
  border-color: var(--primary);
}
.btn-secondary:hover { background: var(--primary); color: #fff; }
.btn-accent {
  background: var(--accent);
  color: var(--primary);
}
.btn-accent:hover { background: #a07d51; color: #fff; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: Build and verify no errors**

```bash
npm run build
```
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: add design tokens and global CSS"
```

---

### Task 8: Self-host Inter and Roboto Condensed fonts

**Files:**
- Create: `public/fonts/inter-*.woff2` (files), `public/fonts/roboto-condensed-700.woff2`, `src/styles/fonts.css`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Download Inter font files (400, 500, 600, 700, 800) and Roboto Condensed 700**

Run from `/home/doclogic_www/buildlogic_www/`:
```bash
mkdir -p public/fonts
# Use google-webfonts-helper format: download via gwfh.mranftl.com mirror
for w in 400 500 600 700 800; do
  curl -L -o "public/fonts/inter-${w}.woff2" \
    "https://gwfh.mranftl.com/api/fonts/inter?download=zip&subsets=cyrillic,latin,latin-ext&variants=${w}&formats=woff2" 2>/dev/null || true
done
# If gwfh is unavailable, fall back to https://fonts.bunny.net hashed URLs; document URL in commit.
```

If automated download fails, commit the project without fonts and add a dedicated TODO in `public/fonts/README.md`:
```md
Place woff2 files here:
- inter-400.woff2, inter-500.woff2, inter-600.woff2, inter-700.woff2, inter-800.woff2 — https://fonts.google.com/specimen/Inter
- roboto-condensed-700.woff2 — https://fonts.google.com/specimen/Roboto+Condensed
```

- [ ] **Step 2: Create `src/styles/fonts.css`**

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-800.woff2') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Roboto Condensed';
  src: url('/fonts/roboto-condensed-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 3: Import fonts in `src/styles/global.css`**

At the very top of `src/styles/global.css`, change the first line from:
```css
@import './tokens.css';
```
to:
```css
@import './fonts.css';
@import './tokens.css';
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: self-host Inter and Roboto Condensed fonts"
```

---

### Task 9: BaseLayout with head, hreflang, Consent Mode bootstrap

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import { getAltHrefs, type Locale, DEFAULT_LOCALE } from '../lib/i18n';

interface Props {
  title: string;
  description: string;
  path?: string;
}

const { title, description, path = '/' } = Astro.props;
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const site = Astro.site?.toString().replace(/\/$/, '') ?? 'https://buildlogic.eu';
const alts = getAltHrefs(path, site);
const canonical = alts.find((a) => a.hreflang === locale)?.href ?? site + path;
---
<!doctype html>
<html lang={locale}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {alts.map((a) => (
    <link rel="alternate" hreflang={a.hreflang} href={a.href} />
  ))}

  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:locale" content={locale} />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="preload" as="font" href="/fonts/inter-500.woff2" type="font/woff2" crossorigin />
  <link rel="preload" as="font" href="/fonts/inter-700.woff2" type="font/woff2" crossorigin />

  <!-- Google Consent Mode v2 bootstrap: default all denied until user consents -->
  <script is:inline>
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      personalization_storage: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      wait_for_update: 500
    });
  </script>
</head>
<body>
  <slot />
</body>
</html>
```

- [ ] **Step 2: Update `src/pages/index.astro` to use BaseLayout**

Overwrite:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="BuildLogic — Kontrola materiálov na stavbe" description="BuildLogic pomáha stavebným firmám držať pod kontrolou objekt, dokumenty, príjem materiálu a zvyšky." path="/">
  <main class="container section">
    <h1>BuildLogic</h1>
    <p>Landing — under construction.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
grep -o 'hreflang="[a-z-]*"' dist/index.html | sort -u
```
Expected: shows `hreflang="en"`, `hreflang="ru"`, `hreflang="sk"`, `hreflang="x-default"`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(layout): add BaseLayout with hreflang and Consent Mode v2 bootstrap"
```

---

### Task 10: Header with language switcher

**Files:**
- Create: `src/components/LangSwitcher.astro`, `src/components/Header.astro`
- Create: `src/content/common.json` (minimal, will expand in Task 18)

- [ ] **Step 1: Create minimal `src/content/common.json`**

```json
{
  "sk": {
    "brand": "BuildLogic",
    "brand_sub": "Kontrola materiálov na stavbe",
    "nav": {
      "problem": "Problémy",
      "workflow": "Ako to funguje",
      "inside": "Čo je vnútri",
      "pricing": "Cenník",
      "faq": "FAQ"
    },
    "cta_primary": "Získať test",
    "cta_secondary": "Požiadať o demo"
  },
  "en": {
    "brand": "BuildLogic",
    "brand_sub": "Material control on site",
    "nav": {
      "problem": "Problems",
      "workflow": "How it works",
      "inside": "What's inside",
      "pricing": "Pricing",
      "faq": "FAQ"
    },
    "cta_primary": "Start free trial",
    "cta_secondary": "Request demo"
  },
  "ru": {
    "brand": "BuildLogic",
    "brand_sub": "Контроль материалов по объекту",
    "nav": {
      "problem": "Проблемы",
      "workflow": "Как работает",
      "inside": "Что внутри",
      "pricing": "Тарифы",
      "faq": "FAQ"
    },
    "cta_primary": "Получить тест",
    "cta_secondary": "Запросить демо"
  }
}
```

- [ ] **Step 2: Create `src/components/LangSwitcher.astro`**

```astro
---
import { LOCALES, localizePath, type Locale, DEFAULT_LOCALE } from '../lib/i18n';
interface Props { path?: string }
const { path = '/' } = Astro.props;
const current = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
---
<nav class="lang-switcher" aria-label="Language">
  {LOCALES.map((l) => (
    <a href={localizePath(path, l)} class:list={['lang', { active: l === current }]} lang={l} aria-current={l === current ? 'true' : undefined}>
      {l.toUpperCase()}
    </a>
  ))}
</nav>
<style>
  .lang-switcher { display: inline-flex; gap: 2px; border: 1px solid var(--line); border-radius: 10px; padding: 3px; background: var(--surface); }
  .lang { padding: 4px 8px; font-size: 12px; font-weight: 600; color: var(--muted); border-radius: 7px; letter-spacing: 0.05em; }
  .lang.active { color: var(--primary); background: var(--accent-soft); }
  .lang:hover:not(.active) { color: var(--text); }
</style>
```

- [ ] **Step 3: Create `src/components/Header.astro`**

```astro
---
import LangSwitcher from './LangSwitcher.astro';
import common from '../content/common.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';

interface Props { path?: string }
const { path = '/' } = Astro.props;
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = common[locale];
---
<header class="site-header" id="top">
  <div class="container header-inner">
    <a href={path === '/' ? '#top' : '/'} class="brand">
      <span class="brand-mark">BL</span>
      <span class="brand-copy">
        <strong>{t.brand}</strong>
        <small>{t.brand_sub}</small>
      </span>
    </a>

    <nav class="nav" aria-label="primary">
      <a href="#problem">{t.nav.problem}</a>
      <a href="#workflow">{t.nav.workflow}</a>
      <a href="#inside">{t.nav.inside}</a>
      <a href="#pricing">{t.nav.pricing}</a>
      <a href="#faq">{t.nav.faq}</a>
    </nav>

    <div class="header-actions">
      <LangSwitcher path={path} />
      <a href="#contact" class="btn btn-primary">{t.cta_primary}</a>
    </div>

    <button class="menu-toggle" aria-label="Menu" aria-expanded="false">☰</button>
  </div>
</header>

<style>
  .site-header {
    position: sticky; top: 0; z-index: 50;
    background: rgba(255, 253, 250, 0.9);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--line);
  }
  .header-inner {
    display: flex; align-items: center; justify-content: space-between;
    gap: var(--space-4); min-height: 80px;
  }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-mark {
    width: 44px; height: 44px; border-radius: 14px;
    background: linear-gradient(145deg, var(--primary), var(--primary-2));
    color: #fff; display: grid; place-items: center;
    font-weight: 800; font-size: 18px; letter-spacing: -0.04em;
    box-shadow: 0 10px 20px rgba(35, 79, 72, 0.18);
  }
  .brand-copy strong { display: block; font-size: 16px; font-weight: 800; letter-spacing: -0.02em; }
  .brand-copy small { display: block; font-size: 12px; color: var(--muted); }
  .nav { display: flex; gap: var(--space-5); }
  .nav a { font-size: 14px; color: var(--muted); font-weight: 500; }
  .nav a:hover { color: var(--text); }
  .header-actions { display: flex; gap: var(--space-3); align-items: center; }
  .menu-toggle { display: none; background: none; border: 1px solid var(--line); border-radius: 10px; width: 40px; height: 40px; font-size: 18px; }
  @media (max-width: 960px) {
    .nav { display: none; }
    .menu-toggle { display: inline-flex; align-items: center; justify-content: center; }
    .header-actions .btn { display: none; }
  }
</style>
```

- [ ] **Step 4: Wire Header into `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
---
<BaseLayout title="BuildLogic — Kontrola materiálov na stavbe" description="BuildLogic pomáha stavebným firmám držať pod kontrolou objekt, dokumenty, príjem materiálu a zvyšky." path="/">
  <Header path="/" />
  <main class="container section">
    <h1>BuildLogic</h1>
    <p>Landing — under construction.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 5: Build and verify header renders in 3 languages**

Create placeholder `src/pages/en/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
---
<BaseLayout title="BuildLogic — Material control on site" description="BuildLogic helps construction companies control objects, documents, material inflow and remainders." path="/">
  <Header path="/" />
  <main class="container section"><h1>BuildLogic</h1></main>
</BaseLayout>
```

Same for `src/pages/ru/index.astro` (description in Russian).

Build:
```bash
npm run build
grep -c "brand-mark" dist/index.html dist/en/index.html dist/ru/index.html
```
Expected: each file has exactly 1.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(components): add Header with language switcher"
```

---

### Task 11: Footer with policy links and cookie-settings button

**Files:**
- Create: `src/components/Footer.astro`
- Modify: `src/content/common.json` (add footer block)

- [ ] **Step 1: Extend `src/content/common.json` with footer strings**

Merge these keys inside each locale object:
```json
"footer": {
  "rights": "Všetky práva vyhradené",
  "privacy": "Ochrana osobných údajov",
  "cookies": "Cookies",
  "impressum": "Impressum",
  "cookie_settings": "Nastavenia cookies",
  "contact_email": "hello@buildlogic.eu",
  "legal_placeholder": "[TODO: IČO/DIČ/adresa]"
}
```

For `en`:
```json
"footer": {
  "rights": "All rights reserved",
  "privacy": "Privacy Policy",
  "cookies": "Cookies",
  "impressum": "Impressum",
  "cookie_settings": "Cookie settings",
  "contact_email": "hello@buildlogic.eu",
  "legal_placeholder": "[TODO: company ID / address]"
}
```

For `ru`:
```json
"footer": {
  "rights": "Все права защищены",
  "privacy": "Политика конфиденциальности",
  "cookies": "Файлы cookie",
  "impressum": "Реквизиты",
  "cookie_settings": "Настройки cookies",
  "contact_email": "hello@buildlogic.eu",
  "legal_placeholder": "[TODO: ИНН/адрес компании]"
}
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
import common from '../content/common.json';
import { localizePath, type Locale, DEFAULT_LOCALE } from '../lib/i18n';

const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = common[locale];
const year = new Date().getFullYear();
---
<footer class="site-footer">
  <div class="container footer-inner">
    <div class="f-brand">
      <span class="brand-mark">BL</span>
      <div>
        <strong>BuildLogic</strong>
        <p>{t.footer.legal_placeholder}</p>
      </div>
    </div>
    <nav class="f-links" aria-label="Legal">
      <a href={localizePath('/privacy/', locale)}>{t.footer.privacy}</a>
      <a href={localizePath('/cookies/', locale)}>{t.footer.cookies}</a>
      <button type="button" class="link-btn" data-cookie-settings>{t.footer.cookie_settings}</button>
      <a href={`mailto:${t.footer.contact_email}`}>{t.footer.contact_email}</a>
    </nav>
    <p class="f-copy">© {year} BuildLogic. {t.footer.rights}.</p>
  </div>
</footer>

<style>
  .site-footer {
    background: var(--primary);
    color: #e9efe8;
    padding: var(--space-12) 0 var(--space-8);
    margin-top: var(--space-16);
  }
  .footer-inner {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-8);
    align-items: start;
  }
  .f-brand { display: flex; gap: var(--space-3); align-items: flex-start; }
  .f-brand .brand-mark {
    width: 44px; height: 44px; border-radius: 14px;
    background: var(--accent); color: var(--primary);
    display: grid; place-items: center;
    font-weight: 800; font-size: 18px;
  }
  .f-brand strong { color: #fff; font-size: 16px; }
  .f-brand p { margin: 4px 0 0; font-size: 12px; color: #c2d1cd; }
  .f-links {
    display: flex; gap: var(--space-5); flex-wrap: wrap; justify-content: flex-end;
  }
  .f-links a, .link-btn {
    color: #e9efe8; font-size: 14px; background: none; border: none; cursor: pointer; padding: 0;
  }
  .f-links a:hover, .link-btn:hover { color: var(--accent); }
  .f-copy {
    grid-column: 1 / -1;
    margin: 0;
    padding-top: var(--space-6);
    border-top: 1px solid rgba(255,255,255,0.1);
    font-size: 12px; color: #c2d1cd;
  }
  @media (max-width: 720px) {
    .footer-inner { grid-template-columns: 1fr; }
    .f-links { justify-content: flex-start; }
  }
</style>
```

- [ ] **Step 3: Add Footer to `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/ru/index.astro`**

After `</main>` and before `</BaseLayout>` in each of the three files:
```astro
  <Footer />
```
Add import at top of each:
```astro
import Footer from '../components/Footer.astro';
```
(Adjust relative path to `../../components/Footer.astro` for en and ru pages.)

- [ ] **Step 4: Build**

```bash
npm run build
grep -c "data-cookie-settings" dist/index.html dist/en/index.html dist/ru/index.html
```
Expected: each outputs 1.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(components): add Footer with policy links"
```

---

## Phase 3: Cookie Consent System

### Task 12: Consent storage library with unit tests

**Files:**
- Create: `src/lib/consent.ts`, `tests/unit/consent.test.ts`

- [ ] **Step 1: Write failing tests at `tests/unit/consent.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
```

- [ ] **Step 2: Run to verify fail**

```bash
npm run test
```
Expected: FAIL with "Cannot find module '../../src/lib/consent'".

- [ ] **Step 3: Implement `src/lib/consent.ts`**

```ts
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
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
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
```

- [ ] **Step 4: Run to verify pass**

```bash
npm run test
```
Expected: all consent tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(consent): add storage library with Gtag mapping"
```

---

### Task 13: CookieBanner component and initialization script

**Files:**
- Create: `src/components/CookieBanner.astro`, `src/content/cookies.json`
- Modify: `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/ru/index.astro`

- [ ] **Step 1: Create minimal `src/content/cookies.json` (copy text only)**

```json
{
  "sk": {
    "banner_title": "Používame cookies",
    "banner_body": "Na zlepšenie stránky používame cookies. Nevyhnutné sú vždy zapnuté. Ostatné môžete povoliť alebo odmietnuť.",
    "accept_all": "Prijať všetko",
    "reject_all": "Odmietnuť všetko",
    "customize": "Prispôsobiť",
    "more_info": "Viac o cookies",
    "privacy": "Ochrana údajov",
    "categories": {
      "necessary": { "title": "Nevyhnutné", "body": "Základná funkčnosť stránky. Nedajú sa vypnúť." },
      "preferences": { "title": "Preferencie", "body": "Uloženie vášho výberu jazyka a UI stavu." },
      "statistics": { "title": "Štatistiky", "body": "Anonymizovaná analytika (Google Analytics)." },
      "marketing": { "title": "Marketing", "body": "Pixely pre kampane (Meta, LinkedIn)." }
    },
    "save_selection": "Uložiť výber"
  },
  "en": {
    "banner_title": "We use cookies",
    "banner_body": "We use cookies to improve the site. Necessary ones are always on. You can accept or reject the rest.",
    "accept_all": "Accept all",
    "reject_all": "Reject all",
    "customize": "Customize",
    "more_info": "More about cookies",
    "privacy": "Privacy",
    "categories": {
      "necessary": { "title": "Necessary", "body": "Core site functionality. Cannot be disabled." },
      "preferences": { "title": "Preferences", "body": "Remember your language and UI choices." },
      "statistics": { "title": "Statistics", "body": "Anonymized analytics (Google Analytics)." },
      "marketing": { "title": "Marketing", "body": "Campaign pixels (Meta, LinkedIn)." }
    },
    "save_selection": "Save selection"
  },
  "ru": {
    "banner_title": "Мы используем cookies",
    "banner_body": "Cookies нужны для работы сайта. Необходимые всегда включены. Остальное — по вашему выбору.",
    "accept_all": "Принять все",
    "reject_all": "Отклонить все",
    "customize": "Настроить",
    "more_info": "Подробнее о cookies",
    "privacy": "Конфиденциальность",
    "categories": {
      "necessary": { "title": "Необходимые", "body": "Базовая работа сайта. Нельзя отключить." },
      "preferences": { "title": "Предпочтения", "body": "Сохранение языка и UI-состояний." },
      "statistics": { "title": "Статистика", "body": "Анонимная аналитика (Google Analytics)." },
      "marketing": { "title": "Маркетинг", "body": "Пиксели рекламных кампаний (Meta, LinkedIn)." }
    },
    "save_selection": "Сохранить выбор"
  }
}
```

- [ ] **Step 2: Create `src/components/CookieBanner.astro`**

```astro
---
import cookies from '../content/cookies.json';
import common from '../content/common.json';
import { localizePath, type Locale, DEFAULT_LOCALE } from '../lib/i18n';

const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = cookies[locale];
const c = common[locale];
---
<div id="cookie-banner" class="cookie-banner" hidden>
  <div class="cb-inner">
    <div class="cb-text">
      <h3>{t.banner_title}</h3>
      <p>{t.banner_body}
        <a href={localizePath('/cookies/', locale)}>{t.more_info}</a> ·
        <a href={localizePath('/privacy/', locale)}>{t.privacy}</a>
      </p>
    </div>
    <div class="cb-actions">
      <button type="button" class="btn btn-secondary" data-consent="reject">{t.reject_all}</button>
      <button type="button" class="btn btn-secondary" data-consent="customize">{t.customize}</button>
      <button type="button" class="btn btn-primary" data-consent="accept">{t.accept_all}</button>
    </div>
  </div>
</div>

<div id="cookie-modal" class="cookie-modal" hidden aria-modal="true" role="dialog">
  <div class="cm-backdrop" data-consent="close"></div>
  <div class="cm-panel">
    <header class="cm-head">
      <h3>{t.customize}</h3>
      <button type="button" class="cm-close" data-consent="close" aria-label="Close">×</button>
    </header>
    <div class="cm-body">
      {['necessary', 'preferences', 'statistics', 'marketing'].map((k) => (
        <label class="cm-row" data-category={k}>
          <div class="cm-copy">
            <strong>{t.categories[k].title}</strong>
            <span>{t.categories[k].body}</span>
          </div>
          <input type="checkbox" class="cm-toggle" data-cat={k} checked={k === 'necessary'} disabled={k === 'necessary'} />
        </label>
      ))}
    </div>
    <footer class="cm-foot">
      <button type="button" class="btn btn-secondary" data-consent="reject">{t.reject_all}</button>
      <button type="button" class="btn btn-secondary" data-consent="save">{t.save_selection}</button>
      <button type="button" class="btn btn-primary" data-consent="accept">{t.accept_all}</button>
    </footer>
  </div>
</div>

<script>
  import { loadConsent, saveConsent, isExpired, toGtagConsent, type ConsentCategories } from '../lib/consent';

  function updateGtag(cats: ConsentCategories) {
    const g = toGtagConsent(cats);
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('consent', 'update', g);
    }
  }

  function closeAll() {
    const banner = document.getElementById('cookie-banner');
    const modal = document.getElementById('cookie-modal');
    if (banner) banner.hidden = true;
    if (modal) modal.hidden = true;
  }

  function openBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.hidden = false;
  }
  function openModal() {
    const banner = document.getElementById('cookie-banner');
    const modal = document.getElementById('cookie-modal');
    if (banner) banner.hidden = true;
    if (modal) modal.hidden = false;
  }

  function applyToggles(cats: ConsentCategories) {
    document.querySelectorAll<HTMLInputElement>('.cm-toggle').forEach((el) => {
      const k = el.dataset.cat as keyof ConsentCategories | undefined;
      if (!k) return;
      if (k === 'necessary') { el.checked = true; return; }
      el.checked = Boolean(cats[k]);
    });
  }

  function readToggles(): ConsentCategories {
    const cats: ConsentCategories = { necessary: true, preferences: false, statistics: false, marketing: false };
    document.querySelectorAll<HTMLInputElement>('.cm-toggle').forEach((el) => {
      const k = el.dataset.cat as keyof ConsentCategories | undefined;
      if (!k || k === 'necessary') return;
      cats[k] = el.checked;
    });
    return cats;
  }

  function handleAction(action: string) {
    if (action === 'accept') {
      const cats: ConsentCategories = { necessary: true, preferences: true, statistics: true, marketing: true };
      saveConsent(cats); updateGtag(cats); closeAll();
    } else if (action === 'reject') {
      const cats: ConsentCategories = { necessary: true, preferences: false, statistics: false, marketing: false };
      saveConsent(cats); updateGtag(cats); closeAll();
    } else if (action === 'customize') {
      const existing = loadConsent()?.categories ?? { necessary: true as const, preferences: false, statistics: false, marketing: false };
      applyToggles(existing);
      openModal();
    } else if (action === 'save') {
      const cats = readToggles();
      saveConsent(cats); updateGtag(cats); closeAll();
    } else if (action === 'close') {
      closeAll();
    }
  }

  document.addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const btn = target.closest('[data-consent]') as HTMLElement | null;
    if (btn) {
      ev.preventDefault();
      handleAction(btn.dataset.consent || '');
      return;
    }
    const ctrl = target.closest('[data-cookie-settings]') as HTMLElement | null;
    if (ctrl) {
      ev.preventDefault();
      handleAction('customize');
    }
  });

  // On load: show banner if no consent or expired
  const existing = loadConsent();
  if (!existing || isExpired(existing.timestamp)) {
    openBanner();
  } else {
    updateGtag(existing.categories);
  }
</script>

<style>
  .cookie-banner {
    position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 100;
    background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: var(--space-5);
    max-width: 960px; margin: 0 auto;
  }
  .cb-inner { display: grid; grid-template-columns: 1fr auto; gap: var(--space-5); align-items: center; }
  .cb-text h3 { font-size: 18px; margin: 0 0 6px; color: var(--primary); }
  .cb-text p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.55; }
  .cb-text a { color: var(--primary); text-decoration: underline; }
  .cb-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .cb-actions .btn { padding: 10px 16px; font-size: 13px; }

  .cookie-modal { position: fixed; inset: 0; z-index: 110; display: grid; place-items: center; padding: 20px; }
  .cm-backdrop { position: absolute; inset: 0; background: rgba(20, 30, 30, 0.5); }
  .cm-panel {
    position: relative;
    background: var(--surface); border-radius: var(--radius-lg);
    max-width: 620px; width: 100%;
    display: flex; flex-direction: column;
    max-height: 85vh; overflow: hidden;
    box-shadow: var(--shadow);
  }
  .cm-head, .cm-foot { padding: var(--space-5); border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
  .cm-foot { border-bottom: none; border-top: 1px solid var(--line); flex-wrap: wrap; }
  .cm-close { background: none; border: none; font-size: 26px; line-height: 1; cursor: pointer; color: var(--muted); }
  .cm-body { overflow-y: auto; padding: var(--space-4) var(--space-5); }
  .cm-row { display: flex; gap: var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--line-2); align-items: center; }
  .cm-row:last-child { border-bottom: none; }
  .cm-copy { flex: 1; min-width: 0; }
  .cm-copy strong { display: block; color: var(--text); font-size: 15px; }
  .cm-copy span { display: block; font-size: 13px; color: var(--muted); margin-top: 2px; }
  .cm-toggle { width: 20px; height: 20px; accent-color: var(--primary); }
  @media (max-width: 640px) {
    .cb-inner { grid-template-columns: 1fr; }
    .cb-actions { justify-content: stretch; }
    .cb-actions .btn { flex: 1; }
  }
</style>
```

- [ ] **Step 3: Add CookieBanner below Footer in all three index pages**

In `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/ru/index.astro`, add import at top:
```astro
import CookieBanner from '../components/CookieBanner.astro';
```
(Adjust path for en/ru.)

Below `<Footer />` add:
```astro
<CookieBanner />
```

- [ ] **Step 4: Build and run container, verify banner shows**

```bash
npm run build
docker compose up -d --build
```
Open `http://157.180.43.89:4321/` in a browser (or visit `/ru/` and `/en/`). Expected: banner appears on first visit. Click "Reject all" → banner closes, `localStorage.bl_consent_v1` set.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(consent): add cookie banner and customize modal"
```

---

### Task 14: Tracker loaders (GA4, Meta Pixel, LinkedIn Insight)

**Files:**
- Create: `src/lib/trackers.ts`
- Modify: `src/components/CookieBanner.astro` (call `initTrackers` after consent update)

- [ ] **Step 1: Create `src/lib/trackers.ts`**

```ts
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
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date());
  w.gtag('config', GA4_ID, { anonymize_ip: true });
}

function initMeta(): void {
  if (!META_PIXEL_ID) return;
  if (loaded.has('meta-pixel')) return;
  loaded.add('meta-pixel');
  const w = window as any;
  (function (f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    const t = b.createElement(e); t.async = true; t.src = v; const s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(w, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  w.fbq('init', META_PIXEL_ID);
  w.fbq('track', 'PageView');
}

function initLinkedIn(): void {
  if (!LINKEDIN_PARTNER_ID) return;
  if (loaded.has('linkedin-insight')) return;
  loaded.add('linkedin-insight');
  const w = window as any;
  w._linkedin_partner_id = LINKEDIN_PARTNER_ID;
  w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
  w._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);
  loadScript('https://snap.licdn.com/li.lms-analytics/insight.min.js', 'linkedin-insight');
}

export function initTrackers(cats: ConsentCategories): void {
  if (cats.statistics) initGA4();
  if (cats.marketing) { initMeta(); initLinkedIn(); }
}
```

- [ ] **Step 2: Wire `initTrackers` into CookieBanner script**

In `src/components/CookieBanner.astro`, edit the `<script>` block: add an import next to the consent imports:
```ts
import { initTrackers } from '../lib/trackers';
```

Inside `handleAction` — after every `updateGtag(cats)` call, also call `initTrackers(cats)`. There are three such spots (accept / reject / save). Adjust the "on load" section at the bottom similarly:
```ts
if (!existing || isExpired(existing.timestamp)) {
  openBanner();
} else {
  updateGtag(existing.categories);
  initTrackers(existing.categories);
}
```

- [ ] **Step 3: Build (trackers remain inert because env is empty)**

```bash
npm run build
grep -c "googletagmanager" dist/index.html || echo "absent-in-html (expected)"
```
Expected: no GTM script in HTML (script loads client-side only after consent, and only if env ID is set).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(trackers): add GA4/Meta/LinkedIn loaders gated by consent and env"
```

---

## Phase 4: Content model

### Task 15: Seed section content JSON with RU text from templates + EN/SK drafts

**Files:**
- Create: `src/content/hero.json`, `src/content/problems.json`, `src/content/overview.json`, `src/content/workflow.json`, `src/content/inside.json`, `src/content/why.json`, `src/content/pricing.json`, `src/content/faq.json`, `src/content/contact.json`

For every file, each locale block carries a `_meta: { needs_review: true }` flag for `sk` and `en` drafts (to be removed after human proofreading).

- [ ] **Step 1: Create `src/content/hero.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Pre majiteľov, riaditeľov a vedúcich stavby",
    "title": "Poriadok v materiáloch na každom objekte",
    "lead": "BuildLogic pomáha stavebnej firme držať pod kontrolou objekt, obdobie, dokumenty, príjem materiálu, normy, vykonané objemy, zvyšky a záverečnú správu — bez ručného chaosu a bez ťažkého systému na všetko naraz.",
    "cta_primary": "Získať 14-dňový test",
    "cta_secondary": "Pozrieť, ako to funguje",
    "note": "Pokojný štart na štandardnej logike. Ak má firma svoj poriadok — BuildLogic sa dá prispôsobiť hlbšie."
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "For owners, directors and site managers",
    "title": "Order in materials on every site",
    "lead": "BuildLogic helps a construction company keep the object, period, documents, material inflow, norms, performed volumes, remainders and final report under one working roof — without manual mess and without a heavy all-in-one system.",
    "cta_primary": "Start 14-day trial",
    "cta_secondary": "See how it works",
    "note": "Calm start on the standard logic. If your company has its own rules — BuildLogic can be tuned deeper."
  },
  "ru": {
    "eyebrow": "Для владельцев, директоров и руководителей объектов",
    "title": "Порядок в материалах по каждому объекту",
    "lead": "BuildLogic помогает держать под контролем документы, приход материалов, нормы, выполненные объёмы, остатки и итоговую картину по объекту — без ручной путаницы и без тяжёлой системы ради всего сразу.",
    "cta_primary": "Получить 14 дней теста",
    "cta_secondary": "Посмотреть, как это работает",
    "note": "Спокойный старт на стандартной логике. Если у компании свой порядок документов и контроля, BuildLogic можно настроить глубже под реальную работу."
  }
}
```

- [ ] **Step 2: Create `src/content/problems.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "title": "Na stavbe sa peniaze nestrácajú iba v objemoch. Často — v chaose.",
    "lead": "Keď dokumenty, príjem, normy, zvyšky a fakt na objekte žijú oddelene, manažér vidí obraz neskoro. Zvyčajne vtedy, keď už problém stál peniaze.",
    "cards": [
      { "title": "Dokumenty sú — jasnosť nie", "body": "Faktúry sú nahrané, ale nie je jasné, čo sa v skutočnosti deje s materiálom na objekte." },
      { "title": "Príjem jedno, fakt druhé", "body": "Dodávka prešla, potom začína ručná kontrola a hádanie, kde sa čísla rozišli." },
      { "title": "Zvyšky počítajú neskoro", "body": "Keď sa zvyšky robia ručne, manažér vidí obraz až po momente, kedy sa malo rozhodnúť." },
      { "title": "Chyby v riadkoch dokumentu", "body": "Zlá položka ide ďalej v procese a premení sa na extra ručnú prácu." },
      { "title": "Nedostatok v nevhodnom momente", "body": "Problém vychádza až na objekte, nie vopred, keď sa dá v pokoji vyriešiť." },
      { "title": "Niet jednej dôveryhodnej správy", "body": "Každý má svoje čísla. Manažér potrebuje jedno pracovné miesto kontroly." }
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "title": "On site, money leaks aren't only in volumes. Often — in mess.",
    "lead": "When documents, inflow, norms, remainders and actuals on the object live separately, the manager sees the picture too late. Usually when the problem already cost money.",
    "cards": [
      { "title": "Documents are there — clarity isn't", "body": "Invoices are uploaded, but what really happens with materials on the object stays unclear." },
      { "title": "Inflow says one thing, actuals another", "body": "Delivery went through, then manual checks and guessing where numbers diverged." },
      { "title": "Remainders are counted too late", "body": "When remainders are manual, the manager sees them after the decision was needed." },
      { "title": "Document line errors caught late", "body": "A wrong row travels further in the process and becomes extra manual work." },
      { "title": "Shortage surfaces at a bad moment", "body": "The gap becomes visible on site, not in advance when it could be handled calmly." },
      { "title": "No single report that's trusted", "body": "Everyone has their own numbers. A manager needs one working source of truth." }
    ]
  },
  "ru": {
    "title": "На стройке деньги теряются не только в объёмах. Часто — в беспорядке.",
    "lead": "Когда документы, приход материалов, нормы, остатки и факт по объекту живут отдельно, руководитель получает картину слишком поздно. Обычно уже в момент, когда проблема стала дорогой.",
    "cards": [
      { "title": "Документы есть, ясности нет", "body": "Фактуры загружены, но по объекту всё равно непонятно, что реально происходит с материалами." },
      { "title": "По приходу одно, по факту другое", "body": "Поставка прошла, а дальше начинаются ручные сверки, догадки и поиск, где разошлись цифры." },
      { "title": "Остатки считают с опозданием", "body": "Когда остатки собирают вручную, руководитель видит картину уже после того, как решение надо было принять." },
      { "title": "Ошибки в строках документа замечают поздно", "body": "Неправильная строка уходит дальше по процессу и потом превращается в лишнюю ручную работу." },
      { "title": "Нехватка всплывает в неудобный момент", "body": "Проблема становится видна уже на объекте, а не заранее, когда её можно спокойно отработать." },
      { "title": "Нет одного отчёта, которому доверяют", "body": "У каждого свои цифры. Но у руководителя должна быть одна рабочая точка контроля." }
    ]
  }
}
```

- [ ] **Step 3: Create `src/content/overview.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Čo vidí manažér",
    "title": "Jeden pracovný obrys — celý objekt v číslach",
    "lead": "Štyri KPI, ktoré manažérovi stačia, aby pochopil stav objektu za pár sekúnd.",
    "cards": [
      { "label": "Dokumenty", "value": "26", "hint": "4 riadky čakajú na kontrolu" },
      { "label": "Príjem materiálu", "value": "128 460 €", "hint": "za aktuálne obdobie" },
      { "label": "Rozdiely", "value": "8", "hint": "potrebná kontrola" },
      { "label": "Nedostatok", "value": "3", "hint": "vyžaduje rozhodnutie" }
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "What the manager sees",
    "title": "One working contour — the whole object in numbers",
    "lead": "Four KPIs are enough for a manager to understand the state of the object in seconds.",
    "cards": [
      { "label": "Documents", "value": "26", "hint": "4 lines waiting for check" },
      { "label": "Material inflow", "value": "€128,460", "hint": "for the current period" },
      { "label": "Discrepancies", "value": "8", "hint": "reconciliation needed" },
      { "label": "Shortage", "value": "3", "hint": "decision required" }
    ]
  },
  "ru": {
    "eyebrow": "Что видно руководителю",
    "title": "Один рабочий контур — весь объект в цифрах",
    "lead": "Четырёх KPI достаточно руководителю, чтобы за секунды понять состояние объекта.",
    "cards": [
      { "label": "Документы", "value": "26", "hint": "4 строки ждут проверки" },
      { "label": "Приход материалов", "value": "128 460 €", "hint": "по текущему периоду" },
      { "label": "Расхождения", "value": "8", "hint": "нужна сверка" },
      { "label": "Нехватка", "value": "3", "hint": "требует решения" }
    ]
  }
}
```

- [ ] **Step 4: Create `src/content/workflow.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Ako to funguje",
    "title": "Päť krokov od dokumentu po záverečnú správu",
    "steps": [
      { "n": "01", "title": "Dokumenty", "body": "Faktúry, dodacie listy a zmluvy sú na jednom mieste, napojené na objekt a obdobie." },
      { "n": "02", "title": "Kontrola riadkov", "body": "Každý riadok dokumentu sa skontroluje a priradí k materiálu a normám." },
      { "n": "03", "title": "Príjem", "body": "Príjem materiálu sa porovná s dokumentmi, rozdiely sú viditeľné okamžite." },
      { "n": "04", "title": "Zvyšky", "body": "Zvyšky sa prepočítavajú po každej operácii, bez ručnej inventúry." },
      { "n": "05", "title": "Záverečná správa", "body": "Jedna správa, ktorej manažér verí — materiály, pohyby, odchýlky a výsledok." }
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "How it works",
    "title": "Five steps from document to final report",
    "steps": [
      { "n": "01", "title": "Documents", "body": "Invoices, delivery notes and contracts live in one place, tied to object and period." },
      { "n": "02", "title": "Line check", "body": "Every document line is checked and mapped to a material and norms." },
      { "n": "03", "title": "Inflow", "body": "Material inflow is reconciled with documents; discrepancies are visible immediately." },
      { "n": "04", "title": "Remainders", "body": "Remainders recalculate after every operation — no manual inventory." },
      { "n": "05", "title": "Final report", "body": "One report the manager trusts — materials, movements, deviations and outcome." }
    ]
  },
  "ru": {
    "eyebrow": "Как это работает",
    "title": "Пять шагов от документа до итогового отчёта",
    "steps": [
      { "n": "01", "title": "Документы", "body": "Фактуры, накладные и договоры в одном месте, привязаны к объекту и периоду." },
      { "n": "02", "title": "Проверка строк", "body": "Каждая строка документа проверяется и сопоставляется с материалом и нормами." },
      { "n": "03", "title": "Приход", "body": "Приход материалов сверяется с документами; расхождения видны сразу." },
      { "n": "04", "title": "Остатки", "body": "Остатки пересчитываются после каждой операции — без ручной инвентаризации." },
      { "n": "05", "title": "Итоговый отчёт", "body": "Один отчёт, которому доверяет руководитель — материалы, движения, отклонения и результат." }
    ]
  }
}
```

- [ ] **Step 5: Create `src/content/inside.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Čo je vnútri systému",
    "title": "Šesť modulov, ktoré riešia jeden kontrolný obrys",
    "modules": [
      { "title": "Karta objektu", "body": "Samostatný pracovný priestor na objekt, obdobie a zodpovedných ľudí." },
      { "title": "Dokumenty", "body": "Upload a správa dokumentov s kontrolou riadkov a väzbou na materiály." },
      { "title": "Normy a objemy", "body": "Normatívne množstvá a vykonané objemy pre výpočet zvyškov a odchýlok." },
      { "title": "Príjem materiálu", "body": "Evidencia príjmu s porovnaním proti dokumentom a normatívom." },
      { "title": "Zvyšky", "body": "Automatický prepočet po každej operácii, bez ručnej inventúry." },
      { "title": "Záverečná správa", "body": "Jediná správa pre manažéra so všetkými dôležitými číslami a odchýlkami." }
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "What's inside the system",
    "title": "Six modules solving one control contour",
    "modules": [
      { "title": "Object card", "body": "Dedicated workspace per object, period and responsible people." },
      { "title": "Documents", "body": "Upload and management with line-level checks and material mapping." },
      { "title": "Norms and volumes", "body": "Normative quantities and performed volumes for remainder and deviation math." },
      { "title": "Material inflow", "body": "Inflow register cross-checked against documents and norms." },
      { "title": "Remainders", "body": "Automatic recalculation after every operation — no manual inventory." },
      { "title": "Final report", "body": "One report for the manager with every number that matters and the deviations." }
    ]
  },
  "ru": {
    "eyebrow": "Что внутри системы",
    "title": "Шесть модулей, закрывающих один контур контроля",
    "modules": [
      { "title": "Карточка объекта", "body": "Отдельное рабочее пространство по объекту, периоду и ответственным." },
      { "title": "Документы", "body": "Загрузка и ведение с построчной проверкой и привязкой к материалам." },
      { "title": "Нормы и объёмы", "body": "Нормативы и выполненные объёмы для расчёта остатков и отклонений." },
      { "title": "Приход материалов", "body": "Учёт прихода со сверкой против документов и нормативов." },
      { "title": "Остатки", "body": "Автоматический пересчёт после каждой операции — без ручной инвентаризации." },
      { "title": "Итоговый отчёт", "body": "Один отчёт для руководителя со всеми важными цифрами и отклонениями." }
    ]
  }
}
```

- [ ] **Step 6: Create `src/content/why.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Prečo BuildLogic",
    "title": "Nie je to veľká ERP. Je to jeden pracovný obrys, ktorý naozaj funguje.",
    "body": "BuildLogic nesľubuje pokryť celý biznis naraz. Pomáha navodiť poriadok v jednom kritickom obryse — materiály, dokumenty, zvyšky, výkazy po objekte. Práve to väčšinou rozhoduje o marži.",
    "bullets": [
      "Rýchly štart na štandardnej logike",
      "Prispôsobenie, keď má firma svoj vlastný poriadok",
      "Bez prísľubu \"systém na všetko\""
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "Why BuildLogic",
    "title": "Not a big ERP. One working contour that actually works.",
    "body": "BuildLogic doesn't promise to cover the whole business at once. It brings order to one critical contour — materials, documents, remainders and reports per object. That's usually what decides margin.",
    "bullets": [
      "Fast start on the standard logic",
      "Deeper tuning when the company has its own rules",
      "No promise of a \"system for everything\""
    ]
  },
  "ru": {
    "eyebrow": "Почему BuildLogic",
    "title": "Это не большая ERP. Это один рабочий контур, который действительно работает.",
    "body": "BuildLogic не обещает закрыть весь бизнес сразу. Он помогает навести порядок в одном критичном контуре стройки — материалы, документы, остатки, отчёты по объекту. Именно это обычно решает маржу.",
    "bullets": [
      "Быстрый старт на стандартной логике",
      "Глубокая настройка, если у компании свой порядок",
      "Без обещаний «система на всё»"
    ]
  }
}
```

- [ ] **Step 7: Create `src/content/pricing.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Cenník",
    "title": "Transparentná cena. Spustenie je samostatná položka.",
    "tiers": [
      {
        "name": "Start",
        "price": "od 99 €/mes.",
        "tagline": "Jeden objekt, štandardná logika.",
        "features": ["Karta objektu", "Dokumenty a línie", "Základný príjem a zvyšky", "E-mail podpora"],
        "cta": "Začať test"
      },
      {
        "name": "Standard",
        "price": "od 249 €/mes.",
        "tagline": "Viac objektov, roly a prehľady.",
        "features": ["Všetko zo Start", "Viaceré objekty súčasne", "Normy a odchýlky", "Záverečná správa", "Roly a prístupy"],
        "cta": "Hovoriť s nami",
        "recommended": true
      },
      {
        "name": "Custom",
        "price": "na mieru",
        "tagline": "Keď má firma svoj poriadok.",
        "features": ["Všetko zo Standard", "Hlbšie prispôsobenie", "Integrácie s interným softvérom", "Dedikovaná podpora"],
        "cta": "Požiadať o demo"
      }
    ],
    "note": "Spustenie a prvotné nastavenie sú samostatnou položkou — priznávame to otvorene."
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "Pricing",
    "title": "Transparent price. Setup is a separate line.",
    "tiers": [
      {
        "name": "Start",
        "price": "from €99/mo",
        "tagline": "Single object, standard logic.",
        "features": ["Object card", "Documents and lines", "Basic inflow and remainders", "Email support"],
        "cta": "Start trial"
      },
      {
        "name": "Standard",
        "price": "from €249/mo",
        "tagline": "Several objects, roles and reports.",
        "features": ["Everything in Start", "Multiple objects at once", "Norms and deviations", "Final report", "Roles and access"],
        "cta": "Talk to us",
        "recommended": true
      },
      {
        "name": "Custom",
        "price": "by agreement",
        "tagline": "When the company has its own rules.",
        "features": ["Everything in Standard", "Deeper tuning", "Integrations with internal software", "Dedicated support"],
        "cta": "Request demo"
      }
    ],
    "note": "Setup and initial configuration are billed separately — we're upfront about it."
  },
  "ru": {
    "eyebrow": "Тарифы",
    "title": "Прозрачная цена. Запуск — отдельной строкой.",
    "tiers": [
      {
        "name": "Start",
        "price": "от 99 €/мес",
        "tagline": "Один объект, стандартная логика.",
        "features": ["Карточка объекта", "Документы и строки", "Базовый приход и остатки", "Поддержка по email"],
        "cta": "Начать тест"
      },
      {
        "name": "Standard",
        "price": "от 249 €/мес",
        "tagline": "Несколько объектов, роли и отчёты.",
        "features": ["Всё из Start", "Несколько объектов параллельно", "Нормы и отклонения", "Итоговый отчёт", "Роли и доступы"],
        "cta": "Поговорить",
        "recommended": true
      },
      {
        "name": "Custom",
        "price": "по запросу",
        "tagline": "Когда у компании свой порядок.",
        "features": ["Всё из Standard", "Глубокая настройка", "Интеграции с внутренним софтом", "Выделенная поддержка"],
        "cta": "Запросить демо"
      }
    ],
    "note": "Запуск и первичная настройка оплачиваются отдельно — говорим об этом открыто."
  }
}
```

- [ ] **Step 8: Create `src/content/faq.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "FAQ",
    "title": "Najčastejšie otázky",
    "items": [
      { "q": "Ako dlho trvá zavedenie?", "a": "Štandardná verzia je pripravená za pár dní. Hlbšie prispôsobenie sa dohaduje samostatne." },
      { "q": "Dajú sa importovať naše staré dáta?", "a": "Áno — podporujeme import dokumentov a materiálov z Excelu a hlavných účtovných systémov." },
      { "q": "Kde sú uložené dáta?", "a": "EU (Nemecko/Frankfurt). Šifrovanie v pokoji aj pri prenose. Zálohy každý deň." },
      { "q": "Integrácie s iným softvérom?", "a": "Dostupné cez API v tarife Custom. V Start/Standard sú hotové exporty a importy." },
      { "q": "Čo ak naše procesy nevojdú do štandardu?", "a": "Práve to je Custom — upravíme systém tak, aby sedel na vaše reálne procesy." },
      { "q": "Akú podporu poskytujete?", "a": "Start — email. Standard — email + rýchla reakcia. Custom — dedikovaný manažér." }
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "FAQ",
    "title": "Frequently asked questions",
    "items": [
      { "q": "How long does onboarding take?", "a": "Standard setup is ready within a few days. Deeper tuning is negotiated separately." },
      { "q": "Can we import our legacy data?", "a": "Yes — documents and materials can be imported from Excel and major accounting systems." },
      { "q": "Where is data stored?", "a": "EU (Frankfurt). Encrypted at rest and in transit. Daily backups." },
      { "q": "Integrations with other software?", "a": "Available via API on the Custom plan. Start/Standard include ready imports and exports." },
      { "q": "What if our processes don't fit the standard?", "a": "That's exactly what Custom is for — we tune the system to your real processes." },
      { "q": "What support do you provide?", "a": "Start — email. Standard — email + quick turnaround. Custom — dedicated manager." }
    ]
  },
  "ru": {
    "eyebrow": "FAQ",
    "title": "Частые вопросы",
    "items": [
      { "q": "Сколько занимает внедрение?", "a": "Стандартная версия готова за несколько дней. Глубокая настройка обсуждается отдельно." },
      { "q": "Можно импортировать старые данные?", "a": "Да — поддерживаем импорт документов и материалов из Excel и основных учётных систем." },
      { "q": "Где хранятся данные?", "a": "ЕС (Франкфурт). Шифрование в покое и при передаче. Ежедневные бэкапы." },
      { "q": "Интеграции с другим софтом?", "a": "Через API — в тарифе Custom. В Start/Standard — готовые экспорты и импорты." },
      { "q": "Что если наши процессы не укладываются в стандарт?", "a": "Именно для этого Custom — настроим систему под ваши реальные процессы." },
      { "q": "Какая поддержка?", "a": "Start — email. Standard — email + быстрый ответ. Custom — выделенный менеджер." }
    ]
  }
}
```

- [ ] **Step 9: Create `src/content/contact.json`**

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Ďalší krok",
    "title": "Ukážeme BuildLogic na vašich objektoch",
    "lead": "Vyplňte formulár — ozveme sa do jedného pracovného dňa.",
    "fields": { "name": "Meno", "company": "Firma", "email": "E-mail", "phone": "Telefón", "message": "Správa" },
    "consent": "Súhlasím so spracovaním osobných údajov podľa Ochrany osobných údajov.",
    "submit": "Odoslať",
    "success": "Ďakujeme! Ozveme sa čoskoro."
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "Next step",
    "title": "We'll show BuildLogic on your sites",
    "lead": "Fill in the form — we'll get back within one business day.",
    "fields": { "name": "Name", "company": "Company", "email": "Email", "phone": "Phone", "message": "Message" },
    "consent": "I agree to processing of my personal data as per Privacy Policy.",
    "submit": "Send",
    "success": "Thank you! We'll be in touch shortly."
  },
  "ru": {
    "eyebrow": "Следующий шаг",
    "title": "Покажем BuildLogic на ваших объектах",
    "lead": "Заполните форму — ответим в течение одного рабочего дня.",
    "fields": { "name": "Имя", "company": "Компания", "email": "Email", "phone": "Телефон", "message": "Сообщение" },
    "consent": "Согласен на обработку персональных данных согласно Политике конфиденциальности.",
    "submit": "Отправить",
    "success": "Спасибо! Скоро свяжемся."
  }
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(content): seed section JSONs with RU base + SK/EN drafts"
```

---

## Phase 5: Landing Sections

Each section component follows the same pattern: import content JSON, pick locale, render with tokens-based styles. Sections 16–24 below are ordered from top to bottom of the page.

### Task 16: Hero section

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`, `src/pages/en/index.astro`, `src/pages/ru/index.astro`

- [ ] **Step 1: Create `src/components/Hero.astro`**

```astro
---
import hero from '../content/hero.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = hero[locale];
---
<section class="hero section">
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">{t.eyebrow}</span>
      <h1>{t.title}</h1>
      <p class="hero-lead">{t.lead}</p>
      <div class="hero-actions">
        <a href="#contact" class="btn btn-primary">{t.cta_primary}</a>
        <a href="#workflow" class="btn btn-secondary">{t.cta_secondary}</a>
      </div>
      <p class="hero-note">{t.note}</p>
    </div>

    <div class="hero-visual" aria-hidden="true">
      <div class="dash">
        <div class="dash-top">
          <span class="label">OBJEKT</span>
          <span class="label">APRÍL 2026</span>
        </div>
        <div class="dash-head">
          <p class="dash-obj-label">Pracovný obrys objektu</p>
          <h2>Bytový dom / Blok B</h2>
          <span class="status">Kontrola aktívna</span>
        </div>
        <div class="kpis">
          <article><p>Dokumenty</p><strong>26</strong><small>4 riadky na kontrolu</small></article>
          <article><p>Príjem</p><strong>128 460 €</strong><small>za obdobie</small></article>
          <article class="warn"><p>Rozdiely</p><strong>8</strong><small>potrebná kontrola</small></article>
          <article class="alert"><p>Nedostatok</p><strong>3</strong><small>vyžaduje rozhodnutie</small></article>
        </div>
        <div class="timeline">
          <div class="step done"><b>01</b><span>Dokumenty</span></div>
          <div class="step done"><b>02</b><span>Kontrola</span></div>
          <div class="step done"><b>03</b><span>Príjem</span></div>
          <div class="step current"><b>04</b><span>Zvyšky</span></div>
          <div class="step"><b>05</b><span>Správa</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero-grid {
    display: grid; grid-template-columns: 1.05fr 1fr; gap: var(--space-12); align-items: center;
  }
  .hero-copy h1 { margin-top: var(--space-4); }
  .hero-lead { font-size: 18px; color: var(--muted); margin-top: var(--space-4); line-height: 1.6; }
  .hero-actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); flex-wrap: wrap; }
  .hero-note { font-size: 13px; color: var(--muted); margin-top: var(--space-5); max-width: 520px; }

  .dash {
    background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-xl);
    padding: var(--space-5); box-shadow: var(--shadow);
  }
  .dash-top { display: flex; justify-content: space-between; font-family: 'Roboto Condensed', sans-serif; font-size: 11px; letter-spacing: 0.15em; color: var(--muted); }
  .dash-head { margin-top: var(--space-3); position: relative; padding-right: 140px; }
  .dash-obj-label { color: var(--muted); font-size: 12px; margin: 0; }
  .dash-head h2 { font-size: 22px; margin-top: 2px; }
  .status { position: absolute; right: 0; top: 0; padding: 6px 10px; border-radius: 999px; background: var(--accent-soft); color: var(--primary); font-size: 12px; font-weight: 600; }

  .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-top: var(--space-5); }
  .kpis article { padding: var(--space-4); border-radius: var(--radius-md); background: var(--surface-2); border: 1px solid var(--line-2); }
  .kpis article p { margin: 0; font-size: 12px; color: var(--muted); }
  .kpis article strong { display: block; font-family: 'Roboto Condensed', sans-serif; font-size: 24px; color: var(--primary); margin-top: 4px; }
  .kpis article small { display: block; font-size: 11px; color: var(--muted); margin-top: 4px; }
  .kpis article.warn strong { color: var(--warn); }
  .kpis article.alert strong { color: var(--danger); }

  .timeline { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2); margin-top: var(--space-5); }
  .step { text-align: center; padding: var(--space-3); border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--line-2); opacity: 0.55; }
  .step b { display: block; font-family: 'Roboto Condensed', sans-serif; font-size: 16px; color: var(--muted); }
  .step span { display: block; font-size: 11px; color: var(--muted); margin-top: 3px; }
  .step.done { opacity: 1; }
  .step.done b { color: var(--primary); }
  .step.current { opacity: 1; background: var(--accent-soft); border-color: var(--accent); box-shadow: 0 0 0 3px rgba(191,148,97,0.15); }
  .step.current b { color: var(--accent); }

  @media (max-width: 960px) {
    .hero-grid { grid-template-columns: 1fr; }
    .dash-head { padding-right: 0; }
    .status { position: static; display: inline-block; margin-top: var(--space-2); }
  }
</style>
```

- [ ] **Step 2: Wire Hero into all three index pages**

Add import `import Hero from '../components/Hero.astro';` (adjust path for en/ru). Replace the placeholder `<h1>BuildLogic</h1>` block with:
```astro
<Hero />
```

- [ ] **Step 3: Build and verify**

```bash
npm run build
grep -c "hero-grid" dist/index.html dist/en/index.html dist/ru/index.html
```
Expected: each outputs 1.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(sections): add Hero with dashboard mockup"
```

---

### Task 17: RoleStrip section

**Files:**
- Create: `src/components/RoleStrip.astro`
- Modify: `src/content/common.json` (add roles block)
- Modify: pages

- [ ] **Step 1: Add roles block to `common.json` for each locale**

For `sk`:
```json
"roles": { "label": "Komu to najviac pomôže", "items": ["Majiteľ", "Riaditeľ", "Operatívny manažér", "Vedúci objektu", "Zodpovedný za materiál"] }
```
For `en`:
```json
"roles": { "label": "Who benefits most", "items": ["Owner", "Director", "Operations manager", "Site manager", "Materials lead"] }
```
For `ru`:
```json
"roles": { "label": "Кому особенно полезно", "items": ["Владелец", "Директор", "Операционный руководитель", "Руководитель объекта", "Ответственный за материалы"] }
```

- [ ] **Step 2: Create `src/components/RoleStrip.astro`**

```astro
---
import common from '../content/common.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = common[locale].roles;
---
<section class="role-strip">
  <div class="container role-inner">
    <span class="role-label">{t.label}:</span>
    <ul class="role-chips">
      {t.items.map((it) => <li>{it}</li>)}
    </ul>
  </div>
</section>

<style>
  .role-strip { background: var(--surface); border-block: 1px solid var(--line); padding: var(--space-5) 0; }
  .role-inner { display: flex; gap: var(--space-5); align-items: center; flex-wrap: wrap; }
  .role-label { font-size: 13px; color: var(--muted); font-weight: 600; }
  .role-chips { list-style: none; padding: 0; margin: 0; display: flex; gap: var(--space-2); flex-wrap: wrap; }
  .role-chips li { background: var(--accent-soft); color: var(--primary); padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; }
</style>
```

- [ ] **Step 3: Add `<RoleStrip />` after `<Hero />` in all three index pages**

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add RoleStrip"
```

---

### Task 18: Problems section (6 pain cards)

**Files:**
- Create: `src/components/Problems.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Problems.astro`**

```astro
---
import problems from '../content/problems.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = problems[locale];
---
<section class="section" id="problem">
  <div class="container">
    <div class="head">
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
    </div>
    <div class="grid">
      {t.cards.map((c) => (
        <article class="card">
          <strong>{c.title}</strong>
          <p>{c.body}</p>
        </article>
      ))}
    </div>
  </div>
</section>

<style>
  .head { max-width: 720px; margin: 0 auto var(--space-12); text-align: center; }
  .head h2 { margin-bottom: var(--space-4); }
  .head p { color: var(--muted); font-size: 16px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
  .card {
    background: var(--surface); border: 1px solid var(--line);
    padding: var(--space-6); border-radius: var(--radius-lg);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .card strong { color: var(--primary); font-size: 16px; display: block; margin-bottom: var(--space-2); }
  .card p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.55; }
  @media (max-width: 960px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Add `<Problems />` after `<RoleStrip />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Problems grid"
```

---

### Task 19: Overview section (4 KPI cards)

**Files:**
- Create: `src/components/Overview.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Overview.astro`**

```astro
---
import overview from '../content/overview.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = overview[locale];
---
<section class="section overview">
  <div class="container">
    <div class="head">
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
    </div>
    <div class="kpis">
      {t.cards.map((c, i) => (
        <article class="kpi">
          <span class="kpi-num">{String(i+1).padStart(2,'0')}</span>
          <p class="kpi-label">{c.label}</p>
          <strong class="kpi-value">{c.value}</strong>
          <small class="kpi-hint">{c.hint}</small>
        </article>
      ))}
    </div>
  </div>
</section>

<style>
  .overview { background: var(--primary); color: #e9efe8; }
  .head { text-align: center; max-width: 760px; margin: 0 auto var(--space-12); }
  .head .eyebrow { background: transparent; color: var(--accent); border-color: var(--accent); }
  .head h2 { color: #fff; margin-block: var(--space-4); }
  .head p { color: #c2d1cd; font-size: 16px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
  .kpi {
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    padding: var(--space-5); border-radius: var(--radius-lg); position: relative;
  }
  .kpi-num { font-family: 'Roboto Condensed', sans-serif; font-size: 12px; color: var(--accent); letter-spacing: 0.15em; }
  .kpi-label { margin: var(--space-2) 0 0; font-size: 13px; color: #c2d1cd; }
  .kpi-value { display: block; font-family: 'Roboto Condensed', sans-serif; font-size: 32px; color: #fff; margin-top: var(--space-2); }
  .kpi-hint { display: block; font-size: 12px; color: #c2d1cd; margin-top: var(--space-2); }
  @media (max-width: 960px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
</style>
```

- [ ] **Step 2: Add `<Overview />` after `<Problems />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Overview KPI panel"
```

---

### Task 20: Workflow section (5-step interactive timeline)

**Files:**
- Create: `src/components/Workflow.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Workflow.astro`**

```astro
---
import workflow from '../content/workflow.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = workflow[locale];
---
<section class="section" id="workflow">
  <div class="container">
    <div class="head">
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
    </div>

    <div class="wf-wrap">
      <div class="wf-steps" role="tablist">
        {t.steps.map((s, i) => (
          <button type="button" class:list={['wf-step', { active: i === 0 }]} data-idx={i} role="tab">
            <b>{s.n}</b>
            <span>{s.title}</span>
          </button>
        ))}
      </div>
      <div class="wf-panels">
        {t.steps.map((s, i) => (
          <article class:list={['wf-panel', { active: i === 0 }]} data-idx={i}>
            <span class="wf-num">{s.n}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  </div>
</section>

<script>
  function bind() {
    const steps = document.querySelectorAll<HTMLButtonElement>('.wf-step');
    const panels = document.querySelectorAll<HTMLElement>('.wf-panel');
    steps.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = btn.dataset.idx;
        steps.forEach((b) => b.classList.toggle('active', b.dataset.idx === idx));
        panels.forEach((p) => p.classList.toggle('active', p.dataset.idx === idx));
      });
    });
  }
  bind();
</script>

<style>
  .head { max-width: 720px; margin: 0 auto var(--space-12); text-align: center; }
  .head h2 { margin-top: var(--space-4); }

  .wf-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-8); }
  .wf-steps { display: grid; grid-template-columns: 1fr; gap: var(--space-2); }
  .wf-step {
    display: grid; grid-template-columns: auto 1fr; gap: var(--space-3); align-items: center;
    padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--radius-md);
    background: var(--surface); cursor: pointer; text-align: left;
  }
  .wf-step:hover { border-color: var(--accent); }
  .wf-step.active { border-color: var(--accent); background: var(--accent-soft); box-shadow: 0 0 0 3px rgba(191,148,97,0.15); }
  .wf-step b { font-family: 'Roboto Condensed', sans-serif; font-size: 18px; color: var(--accent); }
  .wf-step span { font-weight: 600; font-size: 15px; color: var(--primary); }

  .wf-panels { position: relative; min-height: 260px; }
  .wf-panel {
    position: absolute; inset: 0; background: var(--surface); border: 1px solid var(--line);
    border-radius: var(--radius-lg); padding: var(--space-8);
    opacity: 0; transition: opacity 0.2s; pointer-events: none;
  }
  .wf-panel.active { opacity: 1; pointer-events: auto; }
  .wf-num { font-family: 'Roboto Condensed', sans-serif; font-size: 48px; color: var(--accent); display: block; line-height: 1; }
  .wf-panel h3 { margin-top: var(--space-3); color: var(--primary); }
  .wf-panel p { margin-top: var(--space-3); color: var(--muted); font-size: 16px; line-height: 1.6; }

  @media (max-width: 960px) { .wf-wrap { grid-template-columns: 1fr; } .wf-panels { min-height: 0; } .wf-panel { position: static; opacity: 1; pointer-events: auto; display: none; } .wf-panel.active { display: block; } }
</style>
```

- [ ] **Step 2: Add `<Workflow />` after `<Overview />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Workflow interactive timeline"
```

---

### Task 21: Inside section (6 modules with styled SVG mockups)

**Files:**
- Create: `src/components/Inside.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Inside.astro`**

```astro
---
import inside from '../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = inside[locale];
---
<section class="section" id="inside">
  <div class="container">
    <div class="head">
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
    </div>

    <div class="grid">
      {t.modules.map((m, i) => (
        <article class="mod">
          <div class="mod-mock" aria-hidden="true">
            <div class="mock-bar"></div>
            <div class="mock-bar w2"></div>
            <div class="mock-bar w3"></div>
            <div class="mock-pill"><span></span></div>
          </div>
          <span class="mod-num">{String(i+1).padStart(2,'0')}</span>
          <h3>{m.title}</h3>
          <p>{m.body}</p>
        </article>
      ))}
    </div>
  </div>
</section>

<style>
  .head { max-width: 760px; margin: 0 auto var(--space-12); text-align: center; }
  .head h2 { margin-top: var(--space-4); }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
  .mod {
    background: var(--surface); border: 1px solid var(--line); padding: var(--space-5);
    border-radius: var(--radius-lg); transition: transform 0.15s, box-shadow 0.15s;
  }
  .mod:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  .mod-mock {
    background: var(--primary); border-radius: var(--radius-md); padding: var(--space-4);
    height: 120px; display: flex; flex-direction: column; gap: 8px;
  }
  .mock-bar { height: 10px; background: rgba(255,255,255,0.25); border-radius: 4px; width: 80%; }
  .mock-bar.w2 { width: 60%; background: rgba(191,148,97,0.65); }
  .mock-bar.w3 { width: 45%; background: rgba(255,255,255,0.18); }
  .mock-pill { margin-top: auto; height: 20px; background: rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
  .mock-pill span { display: block; width: 55%; height: 100%; background: var(--accent); }
  .mod-num { display: block; font-family: 'Roboto Condensed', sans-serif; color: var(--accent); font-size: 13px; margin-top: var(--space-4); letter-spacing: 0.15em; }
  .mod h3 { color: var(--primary); margin-top: var(--space-2); }
  .mod p { color: var(--muted); margin-top: var(--space-2); font-size: 14px; line-height: 1.55; }
  @media (max-width: 960px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Add `<Inside />` after `<Workflow />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Inside modules with styled mockups"
```

---

### Task 22: Why section

**Files:**
- Create: `src/components/Why.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Why.astro`**

```astro
---
import why from '../content/why.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = why[locale];
---
<section class="section">
  <div class="container why-grid">
    <div>
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
    </div>
    <div>
      <p class="why-body">{t.body}</p>
      <ul class="why-list">
        {t.bullets.map((b) => <li>{b}</li>)}
      </ul>
    </div>
  </div>
</section>

<style>
  .why-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--space-12); align-items: start; }
  .why-grid h2 { margin-top: var(--space-4); }
  .why-body { color: var(--muted); font-size: 17px; line-height: 1.65; }
  .why-list { margin-top: var(--space-6); padding: 0; list-style: none; display: grid; gap: var(--space-3); }
  .why-list li {
    padding-left: var(--space-6); position: relative; color: var(--text); font-size: 15px;
  }
  .why-list li::before {
    content: ''; position: absolute; left: 0; top: 8px; width: 10px; height: 10px;
    background: var(--accent); border-radius: 50%;
  }
  @media (max-width: 960px) { .why-grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Add `<Why />` after `<Inside />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Why BuildLogic"
```

---

### Task 23: Pricing section

**Files:**
- Create: `src/components/Pricing.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Pricing.astro`**

```astro
---
import pricing from '../content/pricing.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = pricing[locale];
---
<section class="section" id="pricing">
  <div class="container">
    <div class="head">
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
    </div>
    <div class="tiers">
      {t.tiers.map((tier) => (
        <article class:list={['tier', { recommended: tier.recommended }]}>
          {tier.recommended && <span class="badge">★</span>}
          <h3>{tier.name}</h3>
          <p class="tier-price">{tier.price}</p>
          <p class="tier-tag">{tier.tagline}</p>
          <ul>
            {tier.features.map((f) => <li>{f}</li>)}
          </ul>
          <a href="#contact" class:list={['btn', tier.recommended ? 'btn-primary' : 'btn-secondary']}>{tier.cta}</a>
        </article>
      ))}
    </div>
    <p class="note">{t.note}</p>
  </div>
</section>

<style>
  .head { text-align: center; max-width: 760px; margin: 0 auto var(--space-12); }
  .head h2 { margin-top: var(--space-4); }
  .tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); align-items: stretch; }
  .tier {
    background: var(--surface); border: 1px solid var(--line); padding: var(--space-8);
    border-radius: var(--radius-lg); display: flex; flex-direction: column;
    position: relative;
  }
  .tier.recommended { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(191,148,97,0.12); }
  .badge { position: absolute; top: -12px; right: var(--space-6); background: var(--accent); color: var(--primary); font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
  .tier h3 { color: var(--primary); }
  .tier-price { font-family: 'Roboto Condensed', sans-serif; font-size: 28px; color: var(--primary); margin-top: var(--space-3); font-weight: 700; }
  .tier-tag { color: var(--muted); font-size: 14px; margin-top: var(--space-2); }
  .tier ul { list-style: none; padding: 0; margin: var(--space-5) 0 var(--space-6); display: grid; gap: var(--space-2); flex: 1; }
  .tier li { font-size: 14px; padding-left: 20px; position: relative; color: var(--text); }
  .tier li::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
  .note { text-align: center; color: var(--muted); font-size: 13px; margin-top: var(--space-8); }
  @media (max-width: 960px) { .tiers { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Add `<Pricing />` after `<Why />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Pricing tiers"
```

---

### Task 24: FAQ accordion

**Files:**
- Create: `src/components/FAQ.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/FAQ.astro`**

```astro
---
import faq from '../content/faq.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = faq[locale];
---
<section class="section" id="faq">
  <div class="container faq-wrap">
    <div class="head">
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
    </div>
    <div class="faq-list">
      {t.items.map((item, i) => (
        <details class="faq-item">
          <summary>
            <span class="q-num">{String(i+1).padStart(2,'0')}</span>
            <span class="q-text">{item.q}</span>
            <span class="q-icon" aria-hidden="true">+</span>
          </summary>
          <div class="faq-body">{item.a}</div>
        </details>
      ))}
    </div>
  </div>
</section>

<style>
  .faq-wrap { max-width: 820px; margin: 0 auto; }
  .head { text-align: center; margin-bottom: var(--space-12); }
  .head h2 { margin-top: var(--space-4); }
  .faq-list { display: grid; gap: var(--space-3); }
  .faq-item { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; }
  .faq-item summary { list-style: none; padding: var(--space-5); cursor: pointer; display: grid; grid-template-columns: auto 1fr auto; gap: var(--space-4); align-items: center; }
  .faq-item summary::-webkit-details-marker { display: none; }
  .q-num { font-family: 'Roboto Condensed', sans-serif; color: var(--accent); font-size: 13px; letter-spacing: 0.15em; }
  .q-text { color: var(--primary); font-weight: 600; font-size: 16px; }
  .q-icon { color: var(--accent); font-size: 22px; line-height: 1; transition: transform 0.2s; }
  .faq-item[open] .q-icon { transform: rotate(45deg); }
  .faq-body { padding: 0 var(--space-5) var(--space-5); color: var(--muted); font-size: 15px; line-height: 1.65; }
</style>
```

- [ ] **Step 2: Add `<FAQ />` after `<Pricing />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add FAQ accordion"
```

---

### Task 25: Contact form (demo-mode)

**Files:**
- Create: `src/components/Contact.astro`
- Modify: pages

- [ ] **Step 1: Create `src/components/Contact.astro`**

```astro
---
import contact from '../content/contact.json';
import common from '../content/common.json';
import { localizePath, type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = contact[locale];
const c = common[locale];
---
<section class="section contact-sec" id="contact">
  <div class="container contact-grid">
    <div>
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
      <p class="c-lead">{t.lead}</p>
    </div>

    <form class="c-form" data-demo-form>
      <label><span>{t.fields.name}</span><input type="text" name="name" required /></label>
      <label><span>{t.fields.company}</span><input type="text" name="company" /></label>
      <label><span>{t.fields.email}</span><input type="email" name="email" required /></label>
      <label><span>{t.fields.phone}</span><input type="tel" name="phone" /></label>
      <label class="full"><span>{t.fields.message}</span><textarea name="message" rows="4"></textarea></label>
      <label class="consent full">
        <input type="checkbox" required />
        <span>{t.consent} <a href={localizePath('/privacy/', locale)}>{c.footer.privacy}</a>.</span>
      </label>
      <button type="submit" class="btn btn-primary full">{t.submit}</button>
      <p class="c-success" hidden data-success>{t.success}</p>
    </form>
  </div>
</section>

<script>
  document.querySelectorAll<HTMLFormElement>('[data-demo-form]').forEach((f) => {
    f.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const s = f.querySelector<HTMLElement>('[data-success]');
      if (s) s.hidden = false;
      f.reset();
    });
  });
</script>

<style>
  .contact-sec { background: var(--primary); color: #e9efe8; }
  .contact-sec .eyebrow { background: transparent; color: var(--accent); border-color: var(--accent); }
  .contact-sec h2 { color: #fff; margin-top: var(--space-4); }
  .contact-grid { display: grid; grid-template-columns: 1fr 1.1fr; gap: var(--space-12); align-items: start; }
  .c-lead { color: #c2d1cd; margin-top: var(--space-4); font-size: 16px; }
  .c-form {
    background: var(--surface); color: var(--text);
    padding: var(--space-8); border-radius: var(--radius-lg);
    display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
  }
  .c-form .full { grid-column: 1 / -1; }
  .c-form label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--muted); font-weight: 500; }
  .c-form input, .c-form textarea {
    padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm);
    background: var(--surface-2); color: var(--text); font-size: 14px;
  }
  .c-form input:focus, .c-form textarea:focus { outline: 2px solid var(--accent); border-color: var(--accent); }
  .consent { flex-direction: row; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--text); font-weight: 400; }
  .consent a { color: var(--primary); text-decoration: underline; }
  .c-success { margin: 0; padding: 12px; background: var(--accent-soft); color: var(--primary); border-radius: var(--radius-sm); text-align: center; font-weight: 600; }
  @media (max-width: 960px) { .contact-grid { grid-template-columns: 1fr; } .c-form { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Add `<Contact />` after `<FAQ />` in all three index pages**

- [ ] **Step 3: Build and commit**

```bash
npm run build
git add -A
git commit -m "feat(sections): add Contact form in demo-mode"
```

---

## Phase 6: Policy pages

### Task 26: /privacy page for all three languages

**Files:**
- Create: `src/content/privacy.json`, `src/pages/privacy.astro`, `src/pages/en/privacy.astro`, `src/pages/ru/privacy.astro`
- Create: `src/components/ProsePage.astro`

- [ ] **Step 1: Create `src/content/privacy.json`**

```json
{
  "sk": {
    "title": "Ochrana osobných údajov",
    "last_updated": "17. 4. 2026",
    "blocks": [
      { "h": "Kto spracúva údaje", "p": "Prevádzkovateľom je BuildLogic s.r.o., [TODO: IČO/DIČ/adresa]." },
      { "h": "Aké údaje zbierame", "p": "Kontaktný formulár — meno, e-mail, firma, telefón a správa. Technické logy servera pre bezpečnosť." },
      { "h": "Na aký účel", "p": "Odpoveď na vašu žiadosť, ukážka produktu a komunikácia v rámci obchodného procesu." },
      { "h": "Ako dlho", "p": "Kontaktné údaje do 24 mesiacov od posledného kontaktu alebo do odvolania súhlasu." },
      { "h": "Cookies", "p": "Detaily — na stránke /cookies/." },
      { "h": "Vaše práva", "p": "Prístup, oprava, výmaz, prenositeľnosť, obmedzenie spracúvania, námietka. Kontakt: hello@buildlogic.eu." }
    ]
  },
  "en": {
    "title": "Privacy Policy",
    "last_updated": "April 17, 2026",
    "blocks": [
      { "h": "Data controller", "p": "BuildLogic s.r.o., [TODO: company ID/address]." },
      { "h": "What we collect", "p": "Contact form — name, email, company, phone, message. Server technical logs for security." },
      { "h": "Purpose", "p": "Responding to your request, product demos and commercial communication." },
      { "h": "Retention", "p": "Contact data up to 24 months from last contact or until withdrawal of consent." },
      { "h": "Cookies", "p": "See /cookies/ for details." },
      { "h": "Your rights", "p": "Access, rectification, erasure, portability, restriction of processing, objection. Contact: hello@buildlogic.eu." }
    ]
  },
  "ru": {
    "title": "Политика конфиденциальности",
    "last_updated": "17 апреля 2026",
    "blocks": [
      { "h": "Кто обрабатывает данные", "p": "BuildLogic s.r.o., [TODO: ИНН/адрес компании]." },
      { "h": "Какие данные собираем", "p": "Контактная форма — имя, email, компания, телефон, сообщение. Технические логи сервера для безопасности." },
      { "h": "Цель", "p": "Ответ на запрос, демо продукта и коммерческая коммуникация." },
      { "h": "Срок хранения", "p": "Контактные данные до 24 месяцев с последнего контакта или до отзыва согласия." },
      { "h": "Cookies", "p": "Подробнее — на странице /cookies/." },
      { "h": "Ваши права", "p": "Доступ, исправление, удаление, переносимость, ограничение обработки, возражение. Контакт: hello@buildlogic.eu." }
    ]
  }
}
```

- [ ] **Step 2: Create `src/components/ProsePage.astro`** (shared prose layout)

```astro
---
interface Props { title: string; lastUpdated: string; blocks: Array<{ h: string; p: string }> }
const { title, lastUpdated, blocks } = Astro.props;
---
<main class="container prose-wrap section">
  <h1>{title}</h1>
  <p class="meta">{lastUpdated}</p>
  {blocks.map((b) => (
    <section class="prose-block">
      <h2>{b.h}</h2>
      <p>{b.p}</p>
    </section>
  ))}
</main>

<style>
  .prose-wrap { max-width: 760px; }
  .meta { color: var(--muted); font-size: 13px; }
  .prose-block { margin-top: var(--space-8); }
  .prose-block h2 { color: var(--primary); font-size: 20px; margin-bottom: var(--space-3); }
  .prose-block p { color: var(--text); line-height: 1.7; font-size: 15px; }
</style>
```

- [ ] **Step 3: Create `src/pages/privacy.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import CookieBanner from '../components/CookieBanner.astro';
import ProsePage from '../components/ProsePage.astro';
import privacy from '../content/privacy.json';
import common from '../content/common.json';
const t = privacy.sk;
---
<BaseLayout title={`${t.title} — BuildLogic`} description={common.sk.brand_sub} path="/privacy/">
  <Header path="/privacy/" />
  <ProsePage title={t.title} lastUpdated={t.last_updated} blocks={t.blocks} />
  <Footer />
  <CookieBanner />
</BaseLayout>
```

- [ ] **Step 4: Create `src/pages/en/privacy.astro` and `src/pages/ru/privacy.astro`** (analogous, with `privacy.en` / `privacy.ru` and `common.en.brand_sub` / `common.ru.brand_sub`)

- [ ] **Step 5: Build and verify routes**

```bash
npm run build
ls dist/privacy/ dist/en/privacy/ dist/ru/privacy/
```
Expected: `index.html` in each.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pages): add Privacy Policy in 3 languages"
```

---

### Task 27: /cookies page with category table

**Files:**
- Create: `src/content/cookies-policy.json`, `src/pages/cookies.astro`, `src/pages/en/cookies.astro`, `src/pages/ru/cookies.astro`
- Create: `src/components/CookieTable.astro`

- [ ] **Step 1: Create `src/content/cookies-policy.json`**

```json
{
  "sk": {
    "title": "Cookies",
    "last_updated": "17. 4. 2026",
    "intro": "Táto stránka vysvetľuje, aké cookies BuildLogic používa a ako ich spravovať.",
    "categories": {
      "necessary": "Nevyhnutné",
      "preferences": "Preferencie",
      "statistics": "Štatistiky",
      "marketing": "Marketing"
    },
    "columns": { "name": "Názov", "purpose": "Účel", "duration": "Trvanie", "category": "Kategória", "provider": "Poskytovateľ" },
    "rows": [
      { "name": "bl_consent_v1", "purpose": "Uloženie vášho súhlasu s cookies.", "duration": "13 mesiacov", "category": "necessary", "provider": "buildlogic.eu" },
      { "name": "bl_lang", "purpose": "Uloženie naposledy vybraného jazyka.", "duration": "1 rok", "category": "preferences", "provider": "buildlogic.eu" },
      { "name": "_ga, _ga_*", "purpose": "Google Analytics 4 — anonymizovaná analytika.", "duration": "2 roky", "category": "statistics", "provider": "Google" },
      { "name": "_fbp", "purpose": "Meta Pixel — konverzie a retargeting.", "duration": "90 dní", "category": "marketing", "provider": "Meta" },
      { "name": "li_*, bcookie, lidc", "purpose": "LinkedIn Insight Tag — konverzie a retargeting.", "duration": "do 2 rokov", "category": "marketing", "provider": "LinkedIn" }
    ],
    "controls": "Svoj výber môžete kedykoľvek zmeniť cez tlačidlo \"Nastavenia cookies\" v päte stránky."
  },
  "en": {
    "title": "Cookies",
    "last_updated": "April 17, 2026",
    "intro": "This page explains what cookies BuildLogic uses and how to manage them.",
    "categories": {
      "necessary": "Necessary",
      "preferences": "Preferences",
      "statistics": "Statistics",
      "marketing": "Marketing"
    },
    "columns": { "name": "Name", "purpose": "Purpose", "duration": "Duration", "category": "Category", "provider": "Provider" },
    "rows": [
      { "name": "bl_consent_v1", "purpose": "Stores your cookie consent decision.", "duration": "13 months", "category": "necessary", "provider": "buildlogic.eu" },
      { "name": "bl_lang", "purpose": "Stores the last selected language.", "duration": "1 year", "category": "preferences", "provider": "buildlogic.eu" },
      { "name": "_ga, _ga_*", "purpose": "Google Analytics 4 — anonymized analytics.", "duration": "2 years", "category": "statistics", "provider": "Google" },
      { "name": "_fbp", "purpose": "Meta Pixel — conversions and retargeting.", "duration": "90 days", "category": "marketing", "provider": "Meta" },
      { "name": "li_*, bcookie, lidc", "purpose": "LinkedIn Insight — conversions and retargeting.", "duration": "up to 2 years", "category": "marketing", "provider": "LinkedIn" }
    ],
    "controls": "You can change your choice anytime via the \"Cookie settings\" link in the footer."
  },
  "ru": {
    "title": "Файлы cookie",
    "last_updated": "17 апреля 2026",
    "intro": "Эта страница объясняет, какие cookies использует BuildLogic и как ими управлять.",
    "categories": {
      "necessary": "Необходимые",
      "preferences": "Предпочтения",
      "statistics": "Статистика",
      "marketing": "Маркетинг"
    },
    "columns": { "name": "Имя", "purpose": "Назначение", "duration": "Срок", "category": "Категория", "provider": "Провайдер" },
    "rows": [
      { "name": "bl_consent_v1", "purpose": "Сохранение вашего выбора согласия.", "duration": "13 месяцев", "category": "necessary", "provider": "buildlogic.eu" },
      { "name": "bl_lang", "purpose": "Сохранение последнего выбранного языка.", "duration": "1 год", "category": "preferences", "provider": "buildlogic.eu" },
      { "name": "_ga, _ga_*", "purpose": "Google Analytics 4 — анонимная аналитика.", "duration": "2 года", "category": "statistics", "provider": "Google" },
      { "name": "_fbp", "purpose": "Meta Pixel — конверсии и ретаргетинг.", "duration": "90 дней", "category": "marketing", "provider": "Meta" },
      { "name": "li_*, bcookie, lidc", "purpose": "LinkedIn Insight — конверсии и ретаргетинг.", "duration": "до 2 лет", "category": "marketing", "provider": "LinkedIn" }
    ],
    "controls": "Вы можете изменить выбор в любой момент через кнопку \"Настройки cookies\" в футере."
  }
}
```

- [ ] **Step 2: Create `src/components/CookieTable.astro`**

```astro
---
interface Row { name: string; purpose: string; duration: string; category: string; provider: string }
interface Props {
  columns: { name: string; purpose: string; duration: string; category: string; provider: string };
  categories: Record<string, string>;
  rows: Row[];
}
const { columns, categories, rows } = Astro.props;
---
<table class="ck-table">
  <thead>
    <tr>
      <th>{columns.name}</th>
      <th>{columns.purpose}</th>
      <th>{columns.duration}</th>
      <th>{columns.category}</th>
      <th>{columns.provider}</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((r) => (
      <tr>
        <td><code>{r.name}</code></td>
        <td>{r.purpose}</td>
        <td>{r.duration}</td>
        <td><span class={`cat cat-${r.category}`}>{categories[r.category]}</span></td>
        <td>{r.provider}</td>
      </tr>
    ))}
  </tbody>
</table>

<style>
  .ck-table { width: 100%; border-collapse: collapse; margin-top: var(--space-8); font-size: 14px; }
  .ck-table th, .ck-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }
  .ck-table th { background: var(--surface-2); font-weight: 600; color: var(--primary); font-size: 13px; }
  .ck-table code { background: var(--surface-2); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  .cat { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .cat-necessary { background: #e9f2eb; color: var(--success); }
  .cat-preferences { background: #eaf0ef; color: var(--primary); }
  .cat-statistics { background: #fbf0de; color: var(--warn); }
  .cat-marketing { background: #f8e3e1; color: var(--danger); }
  @media (max-width: 760px) { .ck-table { font-size: 12px; } .ck-table th, .ck-table td { padding: 8px; } }
</style>
```

- [ ] **Step 3: Create `src/pages/cookies.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import CookieBanner from '../components/CookieBanner.astro';
import CookieTable from '../components/CookieTable.astro';
import policy from '../content/cookies-policy.json';
import common from '../content/common.json';
const t = policy.sk;
---
<BaseLayout title={`${t.title} — BuildLogic`} description={common.sk.brand_sub} path="/cookies/">
  <Header path="/cookies/" />
  <main class="container section" style="max-width: 820px;">
    <h1>{t.title}</h1>
    <p class="meta">{t.last_updated}</p>
    <p>{t.intro}</p>
    <CookieTable columns={t.columns} categories={t.categories} rows={t.rows} />
    <p style="margin-top: var(--space-8); color: var(--muted);">{t.controls}</p>
  </main>
  <Footer />
  <CookieBanner />
</BaseLayout>

<style>
  .meta { color: var(--muted); font-size: 13px; }
</style>
```

- [ ] **Step 4: Create `src/pages/en/cookies.astro` and `src/pages/ru/cookies.astro`** (swap locale for `policy.en`/`policy.ru`).

- [ ] **Step 5: Build**

```bash
npm run build
ls dist/cookies/ dist/en/cookies/ dist/ru/cookies/
```
Expected: `index.html` in each.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pages): add Cookies Policy with cookie table in 3 languages"
```

---

## Phase 7: Smoke tests, SEO, polish

### Task 28: Playwright smoke tests for home + cookie flow

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Replace `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.describe('home pages', () => {
  for (const [path, lang, title] of [
    ['/', 'sk', /BuildLogic/],
    ['/en/', 'en', /BuildLogic/],
    ['/ru/', 'ru', /BuildLogic/],
  ] as const) {
    test(`loads ${path} with lang=${lang}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page).toHaveTitle(title);
      await expect(page.locator('.brand-mark').first()).toContainText('BL');
      await expect(page.locator('#problem')).toBeVisible();
      await expect(page.locator('#workflow')).toBeVisible();
      await expect(page.locator('#pricing')).toBeVisible();
      await expect(page.locator('#faq')).toBeVisible();
      await expect(page.locator('#contact')).toBeVisible();
    });
  }
});

test.describe('cookie consent', () => {
  test('banner shows on first visit, hides after accept', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible();
    await page.getByRole('button', { name: /Prijať všetko/i }).click();
    await expect(banner).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('bl_consent_v1'));
    expect(consent).toBeTruthy();
    const parsed = JSON.parse(consent!);
    expect(parsed.categories.statistics).toBe(true);
    expect(parsed.categories.marketing).toBe(true);
  });

  test('reject all records denied categories', async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await page.getByRole('button', { name: /Odmietnuť všetko/i }).click();
    const parsed = await page.evaluate(() => JSON.parse(localStorage.getItem('bl_consent_v1')!));
    expect(parsed.categories.statistics).toBe(false);
    expect(parsed.categories.marketing).toBe(false);
    expect(parsed.categories.necessary).toBe(true);
  });
});

test.describe('language switcher', () => {
  test('switches from SK to EN', async ({ page }) => {
    await page.goto('/');
    await page.locator('.lang-switcher a[lang=en]').click();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('policy pages', () => {
  for (const p of ['/privacy/', '/cookies/', '/en/privacy/', '/en/cookies/', '/ru/privacy/', '/ru/cookies/']) {
    test(`${p} loads`, async ({ page }) => {
      const resp = await page.goto(p);
      expect(resp?.status()).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});
```

- [ ] **Step 2: Run tests**

```bash
npm run build && npm run test:e2e
```
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test(e2e): cover home pages, cookie flow, lang switcher, policy pages"
```

---

### Task 29: Verify sitemap + hreflang in build output

**Files:**
- none to create; verification and commit only.

- [ ] **Step 1: Confirm `@astrojs/sitemap` wired in `astro.config.mjs`** (from Task 1). Run:

```bash
npm run build
ls dist/sitemap*.xml
```
Expected: `sitemap-index.xml` and at least one sub-sitemap. If missing, re-add `integrations: [sitemap()]` to `astro.config.mjs`.

- [ ] **Step 2: Verify hreflang presence**

```bash
grep -c 'rel="alternate"' dist/index.html dist/en/index.html dist/ru/index.html
```
Expected: ≥ 4 per file (sk, en, ru, x-default).

- [ ] **Step 3: Add `robots.txt` at `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://buildlogic.eu/sitemap-index.xml
```

- [ ] **Step 4: Build + verify**

```bash
npm run build
cat dist/robots.txt
```
Expected: the robots.txt content from step 3.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "seo: add robots.txt and verify sitemap/hreflang"
```

---

### Task 30: Deployment docs and nginx reverse-proxy example

**Files:**
- Create: `docs/deployment/nginx-reverse-proxy.conf.example`
- Modify: `README.md`

- [ ] **Step 1: Create `docs/deployment/nginx-reverse-proxy.conf.example`**

```nginx
# Example reverse proxy for buildlogic.eu — user runs on prod host.
# Assumes Let's Encrypt certbot already configured for buildlogic.eu.

server {
  listen 443 ssl http2;
  server_name buildlogic.eu www.buildlogic.eu;

  ssl_certificate     /etc/letsencrypt/live/buildlogic.eu/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/buildlogic.eu/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location / {
    proxy_pass http://127.0.0.1:4321;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name buildlogic.eu www.buildlogic.eu;
  return 301 https://buildlogic.eu$request_uri;
}
```

- [ ] **Step 2: Add a deployment section to `README.md`**

Append:
```markdown

## Production deployment (buildlogic.eu)

1. On the production host: clone repo, `docker compose up -d --build`. Container listens on `127.0.0.1:4321`.
2. Put the reverse-proxy config from `docs/deployment/nginx-reverse-proxy.conf.example` into `/etc/nginx/sites-available/buildlogic.eu.conf`, symlink into `sites-enabled/`, and reload nginx.
3. Provision TLS via certbot (`certbot --nginx -d buildlogic.eu -d www.buildlogic.eu`).
4. Update `.env` on the host with real tracker IDs (GA4 / Meta / LinkedIn) and rebuild.
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add nginx reverse-proxy example and prod deploy notes"
```

---

### Task 31: CSP tightening + final Lighthouse check

**Files:**
- Modify: `nginx.conf`

- [ ] **Step 1: Add baseline CSP to `nginx.conf`**

Inside the `server {}` block, just after the existing `add_header` lines, add:
```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://snap.licdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com https://www.facebook.com https://px.ads.linkedin.com; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://*.facebook.com https://px.ads.linkedin.com; frame-ancestors 'none'; base-uri 'self';" always;
```

(Note: `'unsafe-inline'` on `script-src` is required for the inline Consent Mode v2 bootstrap and the per-section scripts emitted by Astro. Tightening via nonces is a future task.)

- [ ] **Step 2: Rebuild container**

```bash
docker compose up -d --build
curl -sI http://localhost:4321/ | grep -i "content-security"
```
Expected: CSP header present.

- [ ] **Step 3: Run Lighthouse against local container**

```bash
npx --yes lighthouse http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless --no-sandbox" --output=json --output-path=./lighthouse-report.json --preset=desktop 2>/dev/null
node -e "const r=require('./lighthouse-report.json'); ['performance','accessibility','best-practices','seo'].forEach(k=>console.log(k, r.categories[k].score));"
```
Expected: all ≥ 0.9 (performance ideally ≥ 0.95). If accessibility score < 0.95, scan the report for specific issues and fix before committing.

- [ ] **Step 4: Remove lighthouse report from repo**

```bash
rm -f lighthouse-report.json
```

- [ ] **Step 5: Commit**

```bash
git add nginx.conf
git commit -m "security: add baseline CSP to nginx config"
```

---

### Task 32: Final verification and tag

**Files:**
- None new.

- [ ] **Step 1: Run full verification**

```bash
npm run test          # unit
npm run build         # production build
npm run test:e2e      # e2e smoke
docker compose up -d --build
curl -sf http://localhost:4321/ > /dev/null
curl -sf http://localhost:4321/en/ > /dev/null
curl -sf http://localhost:4321/ru/ > /dev/null
curl -sf http://localhost:4321/privacy/ > /dev/null
curl -sf http://localhost:4321/cookies/ > /dev/null
```
Expected: all pass, all curl commands return 0 exit.

- [ ] **Step 2: Verify at `http://157.180.43.89:4321/` from a browser**

Confirm manually: page renders, header is visible, cookie banner shows on first visit, "Reject all" hides it, refresh does not re-open it, language switcher works, all three languages render, policy pages render.

- [ ] **Step 3: Tag release**

```bash
git tag -a v0.1.0 -m "First working landing: SK/EN/RU, GDPR consent, Docker"
git push --tags
```

- [ ] **Step 4: Final commit of any uncommitted artifacts**

```bash
git status
```
Expected: clean working tree.

---

## Self-review (performed before handoff)

1. **Spec coverage:** every spec section maps to at least one task. Repository layout (Task 1), Docker (Task 4), i18n (Tasks 1, 6, 10), consent system (Tasks 12–14), tokens + fonts (Tasks 7, 8), layout (Tasks 9–11), 12 sections (Tasks 16–25 + Header + Footer + CookieBanner), policy pages (Tasks 26, 27), SEO (Task 29), deploy (Task 30), security headers / CSP (Task 31), tests (Tasks 2, 3, 28). No gap found.

2. **Placeholder scan:** `[TODO: legal data]` / `[TODO: company ID/address]` appear inside `common.json` and `privacy.json` by design — documented in the spec as open items the user supplies. `_meta.needs_review` flags mark draft translations — also intentional. No other TODOs.

3. **Type consistency:** `ConsentCategories`, `ConsentRecord`, `GtagConsent`, `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `localizePath`, `getAltHrefs`, `loadConsent`, `saveConsent`, `isExpired`, `toGtagConsent`, `initTrackers` all referenced consistently across tasks.

4. **Execution notes:**
   - Tasks 1–5 set up foundation and must run first, in order.
   - Tasks 6–11 (layout + i18n) are ordered dependencies; later tasks assume `Header`, `Footer`, `BaseLayout` exist.
   - Tasks 12–14 (consent) depend on 9 (BaseLayout) and 11 (Footer).
   - Tasks 16–25 (sections) can be parallelized — they're independent components.
   - Tasks 26–27 (policy pages) depend on 9, 10, 11, 13.
   - Tasks 28–32 (polish) are strictly end-of-sequence.

---
