# BuildLogic Landing — Design Spec

**Date:** 2026-04-17
**Status:** Draft, awaiting user review
**Owner:** skomax

## Context and goal

Build a single-page landing for **BuildLogic** — a product that helps construction companies control materials, documents, deliveries, norms, performed volumes and remainders on a per-object / per-period basis.

The user already has four prototype templates (`buildlogic-landing-benchmark`, `construction-heavy`, `sales-design`, `sales-light`) with overlapping ideas but no single production-ready version. This spec consolidates the best pieces into one coherent landing and adds production-grade infrastructure (i18n, cookie consent, Docker, git).

**Primary market:** Slovakia (`.eu`), with English and Russian as additional audiences.
**Production domain:** `https://buildlogic.eu`.
**Dev/staging on this server:** `http://157.180.43.89:4321`.

## Goals

- Production-ready static landing, editable by a non-developer (content in JSON).
- Three languages: Slovak (default), English, Russian.
- Single visual theme (no light/dark toggle).
- Fully GDPR/ePrivacy-compliant cookie consent (April 2026 standards).
- Isolated Docker container, its own git repository.
- "Sales construction" tone — premium, credible, not overloaded.

## Non-goals (out of scope)

- Real form submission (demo-mode only — toast response).
- Wired GA4 / Meta Pixel / LinkedIn IDs (code scaffolded, IDs added later).
- Real product screenshots (styled HTML/SVG mockups instead).
- Blog, changelog, resources, customer portal.
- CI/CD pipeline (manual `git pull && docker compose up -d --build`).
- TLS on this dev server (HTTP on port 4321). Prod TLS handled externally.
- Testimonials / case studies (honest early-stage positioning instead).
- A/B tests, CMS, headless admin.

## Architecture

### Stack
- **Astro 5.x** with TypeScript.
- **Output:** static HTML (`output: 'static'`, no SSR).
- **Styles:** hand-written CSS using custom properties (no Tailwind — keeps output tiny and templates readable for the owner).
- **Fonts:** Inter (400–800) + Roboto Condensed (700), **self-hosted** under `/public/fonts/` (avoids Google CDN dependency and the analytics cookie Google sets on `fonts.googleapis.com`).
- **Docker:** multi-stage (`node:22-alpine` for build, `nginx:alpine` for serve).
- **Port on this server:** `4321` (Astro convention, verified free).

### Repository layout

```
buildlogic_www/
├── docs/superpowers/
│   ├── specs/       ← this spec
│   └── plans/       ← implementation plan (next step)
├── public/
│   ├── fonts/       ← self-hosted Inter + Roboto Condensed
│   ├── favicon/
│   └── og/          ← OG image per language
├── src/
│   ├── pages/
│   │   ├── index.astro              ← SK (default, no prefix)
│   │   ├── privacy.astro
│   │   ├── cookies.astro
│   │   ├── en/index.astro
│   │   ├── en/privacy.astro
│   │   ├── en/cookies.astro
│   │   ├── ru/index.astro
│   │   ├── ru/privacy.astro
│   │   └── ru/cookies.astro
│   ├── components/
│   │   ├── Header.astro
│   │   ├── LangSwitcher.astro
│   │   ├── Hero.astro
│   │   ├── RoleStrip.astro
│   │   ├── Problems.astro
│   │   ├── Overview.astro
│   │   ├── Workflow.astro
│   │   ├── Inside.astro
│   │   ├── Why.astro
│   │   ├── Pricing.astro
│   │   ├── FAQ.astro
│   │   ├── Contact.astro
│   │   ├── Footer.astro
│   │   ├── CookieBanner.astro
│   │   └── CookieSettings.astro
│   ├── layouts/
│   │   └── BaseLayout.astro         ← <head>, hreflang, consent-mode bootstrap
│   ├── content/                     ← single source of truth for all copy
│   │   ├── common.json              ← nav, buttons, footer
│   │   ├── hero.json
│   │   ├── problems.json
│   │   ├── overview.json
│   │   ├── workflow.json
│   │   ├── inside.json
│   │   ├── why.json
│   │   ├── pricing.json
│   │   ├── faq.json
│   │   ├── contact.json
│   │   ├── cookies.json
│   │   └── privacy.json
│   ├── lib/
│   │   ├── i18n.ts                  ← lang detection, URL helpers
│   │   ├── consent.ts               ← consent storage, Consent Mode v2
│   │   └── trackers.ts              ← GA4/Meta/LinkedIn loaders (stub-enabled)
│   ├── styles/
│   │   ├── tokens.css               ← palette, spacing, radii
│   │   └── global.css
│   └── env.d.ts
├── Dockerfile
├── docker-compose.yml
├── nginx.conf                       ← inside-container config
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

### Docker

**Dockerfile:**
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

**docker-compose.yml:**
```yaml
services:
  buildlogic-landing:
    build: .
    container_name: buildlogic-landing
    ports: ["4321:80"]
    restart: unless-stopped
```

**nginx.conf (inside container):**
- gzip on, plus brotli if available.
- `/assets/*` → immutable, 1-year cache.
- `/fonts/*` → immutable, 1-year cache.
- HTML → no-cache.
- Custom `404.html` fallback.
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), camera=(), microphone=()`.
- Baseline CSP that allows `'self'` and pre-authorizes Google Tag Manager / Meta / LinkedIn domains (gated at runtime by consent).

## i18n

- **Astro config:** `i18n: { locales: ['sk','en','ru'], defaultLocale: 'sk', routing: { prefixDefaultLocale: false } }`.
- **URL structure:**
  - `/` → SK
  - `/en/` → EN
  - `/ru/` → RU
- **Content model:** every piece of copy lives in `src/content/*.json` as `{ sk: {...}, en: {...}, ru: {...} }`. Components read the relevant locale. A non-developer can edit any text by opening the JSON.
- **Translation workflow:** draft translations (RU → SK and RU → EN) are produced during implementation. Each non-RU block is marked with `// needs-review` in JSON `_meta` field. User proofreads after launch.
- **Language switcher:** in header, three labels `SK | EN | RU`, active one styled with gold accent. Clicking navigates to the same section on the chosen language.
- **Language memory:** last chosen language stored in `localStorage` key `bl_lang`. Used **only** to highlight the switcher and as a hint for returning visitors — **no automatic redirect** based on `Accept-Language` or `localStorage`. Preserves clean SEO and respects user control.
- **SEO hreflang:** every page includes `<link rel="alternate" hreflang="sk|en|ru|x-default">`. `sitemap.xml` lists all three language versions.

## Cookie consent (GDPR / ePrivacy 2026)

### Scope
Self-hosted TypeScript implementation — no CookieBot/OneTrust subscription, no external dependency. Localized from `cookies.json`.

### Categories
| Category    | Default | Purpose                                              |
|-------------|---------|------------------------------------------------------|
| necessary   | on (locked) | session, `bl_lang`, `bl_consent_v1`              |
| preferences | off     | UI state (e.g. remembered FAQ open state)            |
| statistics  | off     | Google Analytics 4                                   |
| marketing   | off     | Meta Pixel, LinkedIn Insight Tag                     |

### Banner (first visit)
- Bottom sheet on desktop, full-screen modal on mobile.
- Short explanation + links to `/privacy` and `/cookies`.
- Three **equally weighted** buttons (same size, same visual prominence — 2026 DPA requirement): `Accept All` · `Reject All` · `Customize`.
- "Customize" opens a second screen with four toggles and a per-category cookie list.

### Google Consent Mode v2
- Before any tracker loads, `gtag('consent', 'default', {...})` sets everything to `denied`.
- After user decision, `gtag('consent', 'update', {...})` sets the correct values for: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`, `personalization_storage`, `functionality_storage`, `security_storage`.

### Storage
- `localStorage.bl_consent_v1` → `{ version, timestamp, categories: { necessary, preferences, statistics, marketing } }`.
- Validity: 13 months (ePrivacy norm). After expiry the banner re-shows.
- `version` allows invalidating old consents when categories or vendors change.

### Withdrawal
- "Cookie-nastavenia" / "Cookie settings" / "Настройки cookie" link in footer on every page, opens the same customize modal.

### Tracker scripts
- GA4, Meta Pixel, LinkedIn Insight — **stubs with ID from `.env`** (`PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_LINKEDIN_PARTNER_ID`).
- When `.env` value is empty, no script loads (safe default for early phase).
- Loading is gated by consent for the relevant category.

### Policy pages
- `/privacy`, `/en/privacy`, `/ru/privacy` — Privacy Policy (personal data processing, contact email, DPO if applicable).
- `/cookies`, `/en/cookies`, `/ru/cookies` — Cookie Policy with a full table: cookie name · purpose · duration · category · provider.
- Placeholder legal data (`[TODO: legal data]`) until user provides company IČO/DIČ/address.

## Visual language

### Palette (CSS custom properties in `tokens.css`)
```
--bg:          #f4efe7;
--surface:     #fffdfa;
--surface-2:   #fbf8f3;
--text:        #1e2b33;
--muted:       #61717c;
--line:        #ddd3c4;
--line-2:      #ece4d8;
--primary:     #234f48;
--primary-2:   #1b3e38;
--accent:      #bf9461;
--accent-soft: #efe3d3;
--success:     #347451;
--warn:        #c08a3e;
--danger:      #a84c49;
--shadow:      0 18px 40px rgba(37,40,32,0.08);
--radius-xl:   28px;
--radius-lg:   22px;
--radius-md:   16px;
--radius-sm:   12px;
--container:   1180px;
```

### Typography
- **Inter** 400/500/600/700/800 — all body, headings, UI.
- **Roboto Condensed** 700 — numeric metrics in dashboard mockup, section kickers `01 / 02 / 03`. Evokes an on-site tally sheet.
- Both self-hosted under `/public/fonts/` with `font-display: swap`.

### "Construction" accents (what we add on top of Sales-Design base)
- Faint 48×48px grid pattern on hero background (sand-colored lines, 8% opacity) — drafting-paper feel.
- Numeric kickers `01 / 02 / 03` before section titles in Roboto Condensed.
- Line-style icons, 1.5px stroke, primary color, no filled variants.
- Hero dashboard mockup with KPI cards + 5-step timeline — the visual anchor of the page.

### Motion
- Respect `prefers-reduced-motion: reduce`.
- Scroll-reveal: subtle fade + 8px translate up.
- Card hover: `translateY(-2px)` + shadow intensify.
- Workflow timeline: current step glows gold.
- No parallax, no auto-playing video, no intrusive interstitials.

## Page sections (the 12-section structure)

In order from top to bottom of the landing:

1. **Header + nav + language switcher.** Logo "BL", anchor links (`#problem`, `#workflow`, `#inside`, `#pricing`, `#faq`), primary CTA "Request demo", language switcher.
2. **Hero.** Eyebrow + H1 + lead paragraph + two CTAs + hero dashboard mockup (KPI cards + 5-step timeline + sample materials table).
3. **Role strip.** Single horizontal strip: "For: Owner · Director · Operations Manager · Site Manager".
4. **Problems (6 cards).** Pain points of construction companies drowning in paper/Excel chaos.
5. **Overview — what the manager sees.** Four KPI cards (documents / inflow / discrepancies / shortage) with explanation text.
6. **How it works (5-step scheme).** Interactive horizontal timeline: Documents → Check → Inflow → Remainders → Report. Clicking a step expands details.
7. **What's inside — modules.** Six module cards with stylized visual mockups (no real screenshots yet).
8. **Why BuildLogic.** Honest positioning: "not a big ERP, a focused working contour for one critical process".
9. **Pricing (3 tiers).** Start / Standard / Custom. Setup fee stated honestly as separate line.
10. **FAQ (accordion).** 6–8 Q&A: implementation time, customization, security/hosting, data migration, integrations, support.
11. **Contact — CTA form.** name · company · email · phone · message · consent checkbox · submit → demo-mode toast.
12. **Footer.** Contacts · Privacy · Cookies · Impressum · "Cookie settings" link · IČO/DIČ placeholders · © BuildLogic.

**Global, always present:**
- Cookie banner (first visit), then cookie settings modal on demand.
- `/privacy` and `/cookies` full pages for each language.

## Git workflow

- **Remote:** `git@github.com:skomax/buildlogic_www.git` (SSH, private).
- **Branch:** `main` (protected via GitHub UI — user configures).
- **Commits:** direct to `main` during solo phase. Switch to PRs when a second person joins.
- `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.env`, `.env.local`, `.superpowers/`, `max/` (user's source materials stay local).

## Deployment (dev → prod)

### On this server (dev/staging)
```bash
git clone git@github.com:skomax/buildlogic_www.git
cd buildlogic_www
docker compose up -d --build
# → http://157.180.43.89:4321
```

Re-deploy:
```bash
git pull && docker compose up -d --build
```

### On production (buildlogic.eu)
- Same Docker container behind user's existing external nginx/Caddy with Let's Encrypt TLS.
- Example reverse-proxy config lives in repo as `docs/deployment/nginx-reverse-proxy.conf.example`.
- Setup on prod server is **not automated in this spec** — user performs manually first time.

## Risks and open questions

- **Translation quality.** Draft SK/EN from RU will need human proof-reading before hard launch. Flagged in JSON `_meta.needs_review`.
- **Legal data.** Privacy and Cookies pages use `[TODO]` for company ID/address until provided.
- **CSP tuning.** Initial CSP is generous enough not to break GTM/Meta/LinkedIn when enabled. May need tightening once concrete script origins are confirmed.
- **Consent string for advertisers.** If Meta/LinkedIn require IAB TCF v2.2 signals (not just Google Consent Mode), a TCF-compatible layer may need to be added later. For April 2026, Google Consent Mode v2 + explicit category signals is the mainstream standard and what we implement.
- **Performance budget.** Target Lighthouse (mobile): LCP < 2.0s, CLS < 0.05, INP < 200ms, no render-blocking JS. Verified at end of implementation, not CI-gated.

## Approval

This spec will be reviewed by the user. After approval, the implementation plan is written via the `superpowers:writing-plans` skill.
