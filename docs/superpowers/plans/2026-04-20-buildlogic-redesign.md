# BuildLogic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved redesign to `buildlogic.eu` Astro site: new palette + typography, Hero «Живой объект» with D-background and interactive KPI card, bento Inside section with EU content, sticky-preview Workflow, rephrased Why manifesto (no «ERP»), iso-grid Problems.

**Architecture:** Incremental refactor of existing Astro components. New design tokens first (so every component reads updated variables), then content JSONs (so text is EU-adapted before components consume it), then major component rewrites (Hero, Inside, Workflow, Why), then polish (Problems bg, Pricing/FAQ/Contact/Footer).

**Tech Stack:** Astro 4, CSS Custom Properties, inline SVG for backgrounds, vanilla JS in `<script>` tags for interactivity (no React/Vue). `i18n` via per-locale JSON.

**Spec reference:** `docs/superpowers/specs/2026-04-20-buildlogic-redesign-design.md`

---

## File Structure

**New files:**
- `src/components/hero/HeroBg.astro` — D-background SVG fragment (axes, floor plan, crane, excavator)
- `src/components/hero/HeroKpi.astro` — interactive KPI card with 5-step cycling
- `src/components/inside/InsideBoq.astro` — BoQ-table mini-interface
- `src/components/inside/InsideShortage.astro` — shortage list mini-interface
- `src/components/inside/InsideFlow.astro` — flow chips
- `src/components/inside/InsideDocs.astro` — document format boxes
- `src/components/inside/InsideRoles.astro` — role pills
- `src/components/inside/InsideStock.astro` — stock progress bars
- `src/components/inside/InsideConnector.astro` — final green connector bar

**Modified files:**
- `src/styles/tokens.css` — full palette replacement
- `src/styles/fonts.css` — add Fraunces/Inter Tight/JetBrains Mono
- `src/styles/global.css` — update typography rules to use new fonts
- `src/content/hero.json` — new copy («Контроль стройки в одном рабочем контуре»), audience chips
- `src/content/illus.json` — KPI card step data (5 steps × 3 languages × tiles)
- `src/content/inside.json` — EU-adapted module content + BoQ/stock data
- `src/content/why.json` — rephrase without «ERP»
- `src/content/problems.json` — audit for «ERP» mentions
- `src/content/workflow.json` — no structural change, audit copy
- `src/components/Hero.astro` — compose HeroBg + HeroKpi
- `src/components/Inside.astro` — bento grid composing new Inside* children
- `src/components/Workflow.astro` — already has tab layout; polish number sizes + fonts
- `src/components/Why.astro` — corner marks, dark-green styling
- `src/components/Problems.astro` — iso-grid background
- `src/components/Header.astro` — blur + pill lang switcher (only if not already)
- `src/components/Pricing.astro` — EUR format, popular badge polish
- `src/components/FAQ.astro` — +/× animated icon
- `src/components/Contact.astro` — dark-green bg, 2×2 form grid
- `src/components/Footer.astro` — compact layout polish

---

## Phase 1 — Foundation (tokens, fonts, typography)

### Task 1: Replace palette tokens

**Files:**
- Modify: `src/styles/tokens.css` (full rewrite)

- [ ] **Step 1: Write new tokens**

Replace the full content of `src/styles/tokens.css` with:

```css
:root {
  /* ====== Palette ====== */
  --bl-green-deep: #1f3b34;
  --bl-green: #2a4a42;
  --bl-green-ink: #eef1ea;
  --bl-paper: #f3ede0;
  --bl-paper-2: #eee6d4;
  --bl-accent: #c98e4f;
  --bl-accent-soft: #e7c89a;
  --bl-accent-ink: #8a5a2a;
  --bl-def: #c75252;
  --bl-def-bg: #fceeea;
  --bl-ok: #3f8a5a;
  --bl-ok-bg: #e7f1e7;
  --bl-ink: #1f3b34;
  --bl-ink-2: #3a4945;
  --bl-muted: #6b7a74;
  --bl-card: #ffffff;
  --bl-card-stroke: #d9d1bf;

  /* ====== Legacy aliases (keep until full migration) ====== */
  --bg: var(--bl-paper);
  --surface: var(--bl-card);
  --surface-2: var(--bl-paper-2);
  --card: var(--bl-card);
  --text: var(--bl-ink);
  --muted: var(--bl-muted);
  --line: var(--bl-card-stroke);
  --line-2: var(--bl-paper-2);
  --primary: var(--bl-green);
  --primary-2: var(--bl-green-deep);
  --accent: var(--bl-accent);
  --accent-soft: var(--bl-accent-soft);
  --success: var(--bl-ok);
  --warn: var(--bl-accent-ink);
  --danger: var(--bl-def);

  /* ====== Typography ====== */
  --bl-font-display: 'Fraunces', Georgia, serif;
  --bl-font-body: 'Inter Tight', 'Inter', system-ui, sans-serif;
  --bl-font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* ====== Motion ====== */
  --bl-ease: cubic-bezier(.2,.7,.2,1);

  /* ====== Layout (unchanged) ====== */
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

- [ ] **Step 2: Verify Astro still builds**

Run: `cd /home/doclogic_www/buildlogic_www && npm run build 2>&1 | tail -20`
Expected: "Complete!" or similar; no CSS errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "style(tokens): replace palette + add typography/motion tokens

New bl-* token prefix for redesign. Legacy aliases (--bg, --accent, --primary,
etc.) point at new tokens so existing components keep rendering until migrated."
```

---

### Task 2: Add new font families via Google Fonts

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (add `<link>` tags in `<head>`)

- [ ] **Step 1: Find the `<head>` block**

Read: `src/layouts/BaseLayout.astro`. Locate the `<head>` section.

- [ ] **Step 2: Add Google Fonts `<link>` tags**

Inside `<head>`, before the existing CSS imports, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -10`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "chore(fonts): add Fraunces, Inter Tight, JetBrains Mono from Google Fonts"
```

---

### Task 3: Update global typography rules

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Update `body`, headings, `.eyebrow`, `.btn` to use new font variables**

Replace lines 8-20 (body rules) of `src/styles/global.css` with:

```css
body {
  margin: 0;
  font-family: var(--bl-font-body);
  background: var(--bl-paper);
  color: var(--bl-ink);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
```

Replace lines 31-48 (eyebrow, headings) with:

```css
.eyebrow {
  display: inline-block;
  font-family: var(--bl-font-mono);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--bl-accent-ink);
  padding: 5px 12px;
  border: 1px solid rgba(201, 142, 79, 0.5);
  border-radius: 999px;
  background: rgba(243, 237, 224, 0.8);
}

h1, h2, h3 {
  letter-spacing: -0.02em;
  line-height: 1.08;
  margin: 0;
  font-family: var(--bl-font-display);
  font-weight: 500;
  color: var(--bl-ink);
}
h1 { font-size: clamp(40px, 5.5vw, 64px); }
h2 { font-size: clamp(30px, 3.8vw, 46px); }
h3 { font-size: clamp(18px, 2vw, 22px); font-weight: 500; }
```

- [ ] **Step 2: Run build and preview**

```bash
npm run dev -- --host 0.0.0.0 &
sleep 3
curl -s http://localhost:4321/ru/ | head -20
```

Expected: HTML returns; no build errors in terminal.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "style(global): switch typography to Fraunces/Inter Tight/JetBrains Mono"
```

---

## Phase 2 — Content updates (EU adaptation + no-ERP)

### Task 4: Rewrite `why.json` — remove «ERP» in all three languages

**Files:**
- Modify: `src/content/why.json` (full rewrite)

- [ ] **Step 1: Replace file content**

Write this to `src/content/why.json`:

```json
{
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Prečo BuildLogic",
    "title": "Nie je to desať modulov. Je to jeden pracovný obrys, ktorý naozaj funguje.",
    "body": "BuildLogic nesľubuje pokryť celý biznis naraz. Pomáha navodiť poriadok v jednom kritickom obryse — materiály, dokumenty, zvyšky, výkazy po objekte. Práve to väčšinou rozhoduje o marži.",
    "bullets": [
      "Rýchly štart na štandardnej logike",
      "Prispôsobenie, keď má firma svoj vlastný poriadok",
      "Žiadne sľuby „systém na všetko\""
    ]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "Why BuildLogic",
    "title": "Not ten modules. One working contour that actually works.",
    "body": "BuildLogic doesn't promise to cover the whole business at once. It brings order to one critical contour — materials, documents, remainders and reports per object. That's usually what decides the margin.",
    "bullets": [
      "Fast start on the standard logic",
      "Deeper tuning when the company has its own rules",
      "No promise of a \"system for everything\""
    ]
  },
  "ru": {
    "eyebrow": "Почему BuildLogic",
    "title": "Это не десять модулей. Это один рабочий контур, который действительно работает.",
    "body": "BuildLogic не обещает закрыть весь бизнес сразу. Он наводит порядок в одном критичном контуре стройки — материалы, документы, остатки, отчёты по объекту. Именно это обычно решает маржу.",
    "bullets": [
      "Быстрый старт на стандартной логике",
      "Глубокая настройка, если у компании свой порядок",
      "Без обещаний «система на всё»"
    ]
  }
}
```

- [ ] **Step 2: Grep for any remaining «ERP» mentions**

Run: `grep -rn 'ERP\|ЕРП' src/content/ src/components/`
Expected: no matches.

- [ ] **Step 3: Commit**

```bash
git add src/content/why.json
git commit -m "content(why): rephrase manifesto without \"ERP\" across RU/SK/EN

Align with product positioning: BuildLogic is not an ERP. Replace
title \"Not a big ERP\" with \"Not ten modules\" in all locales."
```

---

### Task 5: Rewrite `hero.json` — new title, lead, chips, notes

**Files:**
- Modify: `src/content/hero.json` (full rewrite)

- [ ] **Step 1: Replace file content**

Write this to `src/content/hero.json`:

```json
{
  "ru": {
    "eyebrow": "Порядок, не хаос",
    "title_1": "Контроль стройки",
    "title_2": "в одном рабочем контуре.",
    "lead": "Объекты, материалы, документы и отчёты — без десяти Excel-файлов и бесконечных пересылок. Система подстраивается под роль, не наоборот.",
    "cta_primary": "Начать бесплатно",
    "cta_secondary": "Посмотреть демо",
    "note": "14 дней на всё. Без привязки карты.",
    "audience_label": "Особенно полезно:",
    "audience_chips": ["Владельцу", "Директору", "Прорабу", "Снабженцу", "Бухгалтеру"]
  },
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Poriadok, nie chaos",
    "title_1": "Kontrola stavby",
    "title_2": "v jednom pracovnom obryse.",
    "lead": "Objekty, materiály, dokumenty a reporty — bez desiatich Excel-ov a nekonečného preposielania. Systém sa prispôsobuje roli, nie naopak.",
    "cta_primary": "Začať zdarma",
    "cta_secondary": "Pozrieť demo",
    "note": "14 dní na všetko. Bez platobnej karty.",
    "audience_label": "Zvlášť užitočné pre:",
    "audience_chips": ["Majiteľa", "Riaditeľa", "Stavbyvedúceho", "Nákupcu", "Účtovníka"]
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "Order, not chaos",
    "title_1": "Construction control",
    "title_2": "in one working contour.",
    "lead": "Objects, materials, documents and reports — without ten Excel files and endless email chains. The system adapts to the role, not the other way around.",
    "cta_primary": "Start for free",
    "cta_secondary": "See demo",
    "note": "14 days of everything. No credit card.",
    "audience_label": "Especially useful for:",
    "audience_chips": ["Owner", "Director", "Site manager", "Procurement", "Accounting"]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content/hero.json
git commit -m "content(hero): new copy for redesign

Split title into two lines, add audience chips, note, and three-locale
version of \"Construction control in one working contour\"."
```

---

### Task 6: Add KPI card step data to `illus.json`

**Files:**
- Modify: `src/content/illus.json`

- [ ] **Step 1: Read existing illus.json to understand schema**

Run: `cat src/content/illus.json | head -80`

- [ ] **Step 2: Add `hero_steps` object for each locale**

For each locale (`ru`, `sk`, `en`) in `src/content/illus.json`, add a `hero_steps` array. Merge into the existing object — do not destroy other keys.

Add this structure under each locale:

```json
"hero_steps": [
  {
    "label": "Документы",
    "title": "Residential / Block V",
    "status": "Документы в работе",
    "tiles": [
      { "l": "Всего", "n": "26", "h": "документов за период" },
      { "l": "На проверке", "n": "4", "h": "ожидают сверки", "mod": "accent" },
      { "l": "Утверждены", "n": "22", "h": "прошли контроль", "mod": "ok" },
      { "l": "Просрочены", "n": "2", "h": "требуют внимания", "mod": "warn" }
    ]
  },
  {
    "label": "Сверка",
    "title": "Residential / Block V",
    "status": "Сверка активна",
    "tiles": [
      { "l": "Расхождения", "n": "8", "h": "нужна сверка", "mod": "accent" },
      { "l": "По норме", "n": "118", "h": "из 126 позиций", "mod": "ok" },
      { "l": "По сумме", "n": "3 210 €", "h": "отклонение", "mod": "accent" },
      { "l": "Решено", "n": "5", "h": "за смену", "mod": "ok" }
    ]
  },
  {
    "label": "Приход",
    "title": "Residential / Block V",
    "status": "Приход материалов",
    "tiles": [
      { "l": "Принято", "n": "128 460 €", "h": "за апрель" },
      { "l": "Поставок", "n": "17", "h": "с начала месяца" },
      { "l": "Ждём", "n": "3", "h": "в пути", "mod": "accent" },
      { "l": "Отклонено", "n": "1", "h": "возврат", "mod": "warn" }
    ]
  },
  {
    "label": "Склад",
    "title": "Residential / Block V",
    "status": "Склад объекта",
    "tiles": [
      { "l": "Позиций", "n": "42", "h": "на складе" },
      { "l": "Нехватка", "n": "3", "h": "требует заказа", "mod": "warn" },
      { "l": "С запасом", "n": "31", "h": "на 14 дней+", "mod": "ok" },
      { "l": "Заморожено", "n": "12 740 €", "h": "неликвид", "mod": "accent" }
    ]
  },
  {
    "label": "Отчёт",
    "title": "Residential / Block V",
    "status": "Отчёт готов",
    "tiles": [
      { "l": "Итог", "n": "128 460 €", "h": "приход апрель" },
      { "l": "Расход", "n": "104 120 €", "h": "списано в работу" },
      { "l": "Экономия", "n": "4 820 €", "h": "vs план", "mod": "ok" },
      { "l": "Дней на отчёт", "n": "0", "h": "формируется авто", "mod": "ok" }
    ]
  }
]
```

For `sk` locale, translate labels/statuses to Slovak: `Dokumenty / Kontrola / Príjem / Sklad / Report`, tile labels `Spolu / Na kontrole / Schválené / Po termíne`, etc. (use mirror translations from VariantB.jsx `STEP_CONTENT.sk` as reference — `max/example/buildlogic_unpacked/src/VariantB.jsx:105-115`).

For `en` locale, use English from `STEP_CONTENT.en` in the same file (line 117-127).

- [ ] **Step 3: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/content/illus.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add src/content/illus.json
git commit -m "content(illus): add 5-step KPI data for hero card

Per-locale step labels, status pill text, and 4 tiles each (RU/SK/EN).
Data powers the cycling animation in the new Hero KPI card."
```

---

### Task 7: Audit `problems.json` and `workflow.json` for «ERP» mentions

**Files:**
- Modify (if needed): `src/content/problems.json`, `src/content/workflow.json`

- [ ] **Step 1: Grep both files**

Run: `grep -niE 'ERP|ЕРП' src/content/problems.json src/content/workflow.json`
Expected (if clean): no output.

- [ ] **Step 2: If any match — rephrase inline**

Replace any «ERP» with «большая система», «big system», «veľký systém» depending on context. Apply the same pattern used in `why.json`.

- [ ] **Step 3: If any changes — commit**

```bash
git add src/content/problems.json src/content/workflow.json
git commit -m "content: remove \"ERP\" mentions from problems/workflow copy"
```

If no changes — skip the commit.

---

### Task 8: Rewrite `inside.json` — EU content for 6 bento cards

**Files:**
- Modify: `src/content/inside.json` (full rewrite; structure now richer)

- [ ] **Step 1: Replace with EU-adapted schema**

Write this to `src/content/inside.json`:

```json
{
  "ru": {
    "eyebrow": "Что внутри системы",
    "title": "Шесть модулей — один рабочий контур",
    "lead": "Каждый модуль — это не иконка, а живой интерфейс. Смотрите, чем вы будете пользоваться каждый день.",
    "boq": {
      "title": "Расчёт по спецификации",
      "body": "Ведомость объёмов — сколько материалов нужно по каждой позиции, без Excel-таблиц.",
      "head": ["Материал", "Норма", "Нужно"],
      "rows": [
        ["Concrete C25/30", "2.4 m³/стена", "38.4 m³"],
        ["Rebar ⌀12 mm", "85 kg/m³", "3 264 kg"],
        ["Brick 250×120×65", "400 шт/m²", "12 800 шт"],
        ["Cement M500", "320 kg/m³", "12 288 kg"]
      ]
    },
    "shortage": {
      "title": "Отчёт о нехватке",
      "body": "Мгновенный список: что кончилось, что на исходе. Одна кнопка — заявка в закупку.",
      "items": [
        { "name": "Cement M500", "val": "−120 kg", "state": "def" },
        { "name": "Concrete C25", "val": "+840 l", "state": "ok" },
        { "name": "Rebar ⌀12", "val": "−45 kg", "state": "def" },
        { "name": "Bricks", "val": "+2 400 pc", "state": "ok" }
      ]
    },
    "flow": {
      "title": "Движение на объекте",
      "body": "Материалы проходят цепочку: поставка → приёмка → склад → использование.",
      "chips": ["Delivery", "Acceptance", "Stock", "In use"]
    },
    "docs": {
      "title": "Единый реестр документов",
      "body": "Накладные, акты приёмки, счета — в едином реестре. Экспорт в PDF / Excel.",
      "formats": [
        { "fmt": "Delivery note", "hint": "PDF · signed" },
        { "fmt": "Work acceptance", "hint": "PDF · signed" },
        { "fmt": "Invoice", "hint": "PDF / XML" }
      ]
    },
    "roles": {
      "title": "Разные роли, один контур",
      "body": "Права видимости по ролям — каждый видит своё, но работает с общими данными.",
      "pills": [
        { "label": "Owner", "color": "ok" },
        { "label": "Director", "color": "green" },
        { "label": "Site manager", "color": "accent" },
        { "label": "Procurement", "color": "accent-ink" },
        { "label": "Accounting", "color": "muted" }
      ]
    },
    "stock": {
      "title": "Остатки на складе объекта",
      "body": "Реальные цифры, не Excel-догадки. Красным — под заказ, зелёным — есть буфер.",
      "items": [
        { "name": "Concrete C25/30", "pct": 78, "val": "12.4 m³" },
        { "name": "Rebar ⌀12 mm", "pct": 65, "val": "845 kg" },
        { "name": "Cement M500", "pct": 14, "val": "120 kg", "low": true },
        { "name": "Bricks", "pct": 82, "val": "3 280 pc" },
        { "name": "Plaster mix", "pct": 38, "val": "64 kg" }
      ]
    },
    "connector": {
      "label": "Всё связано в один контур",
      "chain": ["Объект", "BoQ", "Склад", "Документы", "Отчёт"]
    }
  },
  "sk": {
    "_meta": { "needs_review": true },
    "eyebrow": "Čo je vnútri systému",
    "title": "Šesť modulov — jeden pracovný obrys",
    "lead": "Každý modul nie je ikona, ale živé rozhranie. Pozrite si, s čím budete pracovať každý deň.",
    "boq": {
      "title": "Výpočet podľa výkazu výmer",
      "body": "Zoznam objemov — koľko materiálu treba na každú položku, bez Excel-tabuliek.",
      "head": ["Materiál", "Norma", "Potreba"],
      "rows": [
        ["Concrete C25/30", "2.4 m³/stena", "38.4 m³"],
        ["Rebar ⌀12 mm", "85 kg/m³", "3 264 kg"],
        ["Brick 250×120×65", "400 ks/m²", "12 800 ks"],
        ["Cement M500", "320 kg/m³", "12 288 kg"]
      ]
    },
    "shortage": {
      "title": "Report nedostatku",
      "body": "Okamžitý zoznam: čo sa minulo, čo sa míňa. Jedno kliknutie — objednávka.",
      "items": [
        { "name": "Cement M500", "val": "−120 kg", "state": "def" },
        { "name": "Concrete C25", "val": "+840 l", "state": "ok" },
        { "name": "Rebar ⌀12", "val": "−45 kg", "state": "def" },
        { "name": "Bricks", "val": "+2 400 ks", "state": "ok" }
      ]
    },
    "flow": {
      "title": "Pohyb na stavbe",
      "body": "Materiály prechádzajú reťazou: dodanie → preberanie → sklad → použitie.",
      "chips": ["Delivery", "Acceptance", "Stock", "In use"]
    },
    "docs": {
      "title": "Jednotný register dokumentov",
      "body": "Dodacie listy, preberacie protokoly, faktúry — v jednom registri. Export do PDF / Excel.",
      "formats": [
        { "fmt": "Delivery note", "hint": "PDF · signed" },
        { "fmt": "Work acceptance", "hint": "PDF · signed" },
        { "fmt": "Invoice", "hint": "PDF / XML" }
      ]
    },
    "roles": {
      "title": "Rôzne roly, jeden obrys",
      "body": "Oprávnenia podľa role — každý vidí svoje, ale pracuje nad spoločnými dátami.",
      "pills": [
        { "label": "Owner", "color": "ok" },
        { "label": "Director", "color": "green" },
        { "label": "Site manager", "color": "accent" },
        { "label": "Procurement", "color": "accent-ink" },
        { "label": "Accounting", "color": "muted" }
      ]
    },
    "stock": {
      "title": "Zvyšky na sklade objektu",
      "body": "Reálne čísla, nie odhady z Excelu. Červené — na objednanie, zelené — je rezerva.",
      "items": [
        { "name": "Concrete C25/30", "pct": 78, "val": "12.4 m³" },
        { "name": "Rebar ⌀12 mm", "pct": 65, "val": "845 kg" },
        { "name": "Cement M500", "pct": 14, "val": "120 kg", "low": true },
        { "name": "Bricks", "pct": 82, "val": "3 280 ks" },
        { "name": "Plaster mix", "pct": 38, "val": "64 kg" }
      ]
    },
    "connector": {
      "label": "Všetko je prepojené v jednom obryse",
      "chain": ["Objekt", "BoQ", "Sklad", "Dokumenty", "Report"]
    }
  },
  "en": {
    "_meta": { "needs_review": true },
    "eyebrow": "What's inside the system",
    "title": "Six modules — one working contour",
    "lead": "Each module is not an icon but a live interface. See what you'll actually use every day.",
    "boq": {
      "title": "Bill of quantities",
      "body": "Line-by-line estimate of every material — no Excel spreadsheets.",
      "head": ["Material", "Norm", "Required"],
      "rows": [
        ["Concrete C25/30", "2.4 m³/wall", "38.4 m³"],
        ["Rebar ⌀12 mm", "85 kg/m³", "3 264 kg"],
        ["Brick 250×120×65", "400 pc/m²", "12 800 pc"],
        ["Cement M500", "320 kg/m³", "12 288 kg"]
      ]
    },
    "shortage": {
      "title": "Shortage report",
      "body": "Instant list — what's out, what's low. One click — purchase request.",
      "items": [
        { "name": "Cement M500", "val": "−120 kg", "state": "def" },
        { "name": "Concrete C25", "val": "+840 l", "state": "ok" },
        { "name": "Rebar ⌀12", "val": "−45 kg", "state": "def" },
        { "name": "Bricks", "val": "+2 400 pc", "state": "ok" }
      ]
    },
    "flow": {
      "title": "Site material flow",
      "body": "Materials travel a chain: delivery → acceptance → stock → in use.",
      "chips": ["Delivery", "Acceptance", "Stock", "In use"]
    },
    "docs": {
      "title": "Unified document register",
      "body": "Delivery notes, work acceptances, invoices — in one register. Export to PDF / Excel.",
      "formats": [
        { "fmt": "Delivery note", "hint": "PDF · signed" },
        { "fmt": "Work acceptance", "hint": "PDF · signed" },
        { "fmt": "Invoice", "hint": "PDF / XML" }
      ]
    },
    "roles": {
      "title": "Different roles, one contour",
      "body": "Role-based visibility — everyone sees their scope but works on shared data.",
      "pills": [
        { "label": "Owner", "color": "ok" },
        { "label": "Director", "color": "green" },
        { "label": "Site manager", "color": "accent" },
        { "label": "Procurement", "color": "accent-ink" },
        { "label": "Accounting", "color": "muted" }
      ]
    },
    "stock": {
      "title": "On-site stock",
      "body": "Real numbers, not Excel guesses. Red — needs ordering, green — buffer available.",
      "items": [
        { "name": "Concrete C25/30", "pct": 78, "val": "12.4 m³" },
        { "name": "Rebar ⌀12 mm", "pct": 65, "val": "845 kg" },
        { "name": "Cement M500", "pct": 14, "val": "120 kg", "low": true },
        { "name": "Bricks", "pct": 82, "val": "3 280 pc" },
        { "name": "Plaster mix", "pct": 38, "val": "64 kg" }
      ]
    },
    "connector": {
      "label": "Everything wired into one contour",
      "chain": ["Object", "BoQ", "Stock", "Documents", "Report"]
    }
  }
}
```

- [ ] **Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/content/inside.json','utf8')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add src/content/inside.json
git commit -m "content(inside): EU-adapted module schema for bento redesign

Six modules now carry structured data (BoQ table rows, shortage items,
flow chips, doc formats, role pills, stock bars) plus a connector line.
No Russian-specific docs (M-11/KB-2v) — uses universal EU terms."
```

---

## Phase 3 — Hero rebuild

### Task 9: Create `HeroBg.astro` — D-background SVG

**Files:**
- Create: `src/components/hero/HeroBg.astro`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/components/hero
```

- [ ] **Step 2: Write component**

Write to `src/components/hero/HeroBg.astro`:

```astro
---
// D-background: construction axes (A-F / 1-4) + dimension line + floor plan
// + swaying crane + static excavator. Pure SVG, scales to parent.
---
<div class="hero-bg" aria-hidden="true">
  <svg viewBox="0 0 1200 480" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="hero-mm" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0H0V40" fill="none" stroke="rgba(31,59,52,0.08)" stroke-width="0.7"/>
      </pattern>
      <pattern id="hero-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(201,142,79,0.28)" stroke-width="0.8"/>
      </pattern>
    </defs>
    <rect width="1200" height="480" fill="url(#hero-mm)"/>

    <!-- Axis letters and numbers -->
    <g font-family="JetBrains Mono" font-size="11" fill="rgba(31,59,52,0.45)">
      <text x="130" y="20">A</text><text x="290" y="20">B</text>
      <text x="450" y="20">C</text><text x="610" y="20">D</text>
      <text x="770" y="20">E</text><text x="930" y="20">F</text>
      <text x="1090" y="20">G</text>
      <text x="18" y="100">1</text><text x="18" y="220">2</text>
      <text x="18" y="340">3</text><text x="18" y="440">4</text>
    </g>
    <g stroke="rgba(31,59,52,0.12)" stroke-width="0.6" stroke-dasharray="5 5">
      <line x1="128" y1="0" x2="128" y2="480"/>
      <line x1="288" y1="0" x2="288" y2="480"/>
      <line x1="448" y1="0" x2="448" y2="480"/>
      <line x1="608" y1="0" x2="608" y2="480"/>
      <line x1="768" y1="0" x2="768" y2="480"/>
    </g>

    <!-- Dimension line top -->
    <g stroke="rgba(201,142,79,0.55)" stroke-width="0.8" fill="none">
      <line x1="60" y1="36" x2="440" y2="36"/>
      <line x1="60" y1="30" x2="60" y2="42"/>
      <line x1="440" y1="30" x2="440" y2="42"/>
    </g>
    <text x="250" y="30" font-family="JetBrains Mono" font-size="10" fill="#8a5a2a" text-anchor="middle">24 500 mm</text>

    <!-- Floor plan bottom-right -->
    <g transform="translate(900 280)">
      <rect x="0" y="0" width="220" height="140" fill="url(#hero-hatch)" stroke="rgba(31,59,52,0.4)" stroke-width="1"/>
      <line x1="90" y1="0" x2="90" y2="140" stroke="rgba(31,59,52,0.35)"/>
      <line x1="0" y1="65" x2="220" y2="65" stroke="rgba(31,59,52,0.35)"/>
      <path d="M50 140 A 38 38 0 0 1 90 102" fill="none" stroke="rgba(201,142,79,0.7)" stroke-width="1.2"/>
    </g>
    <text x="1010" y="440" font-family="JetBrains Mono" font-size="11" fill="rgba(138,90,42,0.8)" text-anchor="middle">PLAN 1:50</text>

    <!-- Swaying crane top-right -->
    <g class="hero-crane" transform="translate(1040 50) scale(0.5)" stroke="rgba(31,59,52,0.26)" stroke-width="1.3" fill="none">
      <path d="M90 260 L90 40 L110 40 L110 260"/>
      <path d="M90 260 L110 260 M90 200 L110 200 M90 140 L110 140 M90 80 L110 80"/>
      <path d="M90 40 L110 80 M110 40 L90 80 M90 80 L110 140 M110 80 L90 140"/>
      <path d="M20 40 L180 40"/>
      <path d="M20 40 L60 20 L180 40 M60 20 L100 40"/>
      <path d="M40 40 L40 130"/>
      <rect x="95" y="35" width="10" height="10"/>
    </g>

    <!-- Excavator bottom-left -->
    <g transform="translate(50 400)" stroke="rgba(31,59,52,0.3)" stroke-width="1.2" fill="none">
      <rect x="0" y="22" width="50" height="16" rx="2"/>
      <circle cx="10" cy="44" r="6"/><circle cx="40" cy="44" r="6"/>
      <rect x="10" y="6" width="26" height="18"/>
      <path d="M36 14 L75 0 L82 12 L75 20 Z"/>
    </g>
  </svg>
</div>

<style>
  .hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  .hero-bg svg { width: 100%; height: 100%; }
  .hero-crane {
    transform-origin: 100px 260px;
    animation: hero-crane-sway 6s ease-in-out infinite;
  }
  @keyframes hero-crane-sway {
    0%, 100% { transform: translate(1040px, 50px) scale(0.5) rotate(-1.2deg); }
    50% { transform: translate(1040px, 50px) scale(0.5) rotate(1.2deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-crane { animation: none; }
  }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/HeroBg.astro
git commit -m "feat(hero): add D-background SVG component

Construction axes A-F/1-4, dimension line, floor plan 1:50, swaying
crane (6s cycle, respects prefers-reduced-motion), static excavator."
```

---

### Task 10: Create `HeroKpi.astro` — interactive 5-step KPI card

**Files:**
- Create: `src/components/hero/HeroKpi.astro`

- [ ] **Step 1: Write component**

Write to `src/components/hero/HeroKpi.astro`:

```astro
---
import illus from '../../content/illus.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const steps = illus[locale].hero_steps;
---
<div class="hero-kpi" data-hero-kpi>
  <div class="kpi-head">
    <span>Рабочий контур</span>
    <span>APR · 2026</span>
  </div>
  <div class="kpi-title-row">
    <h3 class="kpi-title" data-kpi-title>{steps[0].title}</h3>
    <span class="kpi-status" data-kpi-status>● {steps[0].status}</span>
  </div>
  <div class="kpi-tiles" data-kpi-tiles>
    {steps[0].tiles.map((tile) => (
      <div class={`kpi-tile${tile.mod ? ' kpi-tile--' + tile.mod : ''}`}>
        <div class="kpi-tile-label">{tile.l}</div>
        <div class="kpi-tile-num">{tile.n}</div>
        <div class="kpi-tile-hint">{tile.h}</div>
      </div>
    ))}
  </div>
  <div class="kpi-steps" role="tablist">
    {steps.map((s, i) => (
      <button
        type="button"
        class={`kpi-step${i === 0 ? ' kpi-step--active' : ''}`}
        data-step-idx={i}
        role="tab"
        aria-selected={i === 0}
      >
        <span class="kpi-step-num">{String(i + 1).padStart(2, '0')}</span>
        <span class="kpi-step-label">{s.label}</span>
      </button>
    ))}
  </div>
</div>

<script is:inline define:vars={{ steps }}>
  (function () {
    const card = document.querySelector('[data-hero-kpi]');
    if (!card) return;
    const titleEl = card.querySelector('[data-kpi-title]');
    const statusEl = card.querySelector('[data-kpi-status]');
    const tilesEl = card.querySelector('[data-kpi-tiles]');
    const stepBtns = card.querySelectorAll('[data-step-idx]');
    let idx = 0;
    let timer = null;
    let paused = false;

    function renderStep(i) {
      const s = steps[i];
      titleEl.textContent = s.title;
      statusEl.textContent = '● ' + s.status;
      tilesEl.innerHTML = s.tiles
        .map(
          (t) =>
            '<div class="kpi-tile' +
            (t.mod ? ' kpi-tile--' + t.mod : '') +
            '">' +
            '<div class="kpi-tile-label">' + t.l + '</div>' +
            '<div class="kpi-tile-num">' + t.n + '</div>' +
            '<div class="kpi-tile-hint">' + t.h + '</div>' +
            '</div>'
        )
        .join('');
      stepBtns.forEach((btn, j) => {
        const active = j === i;
        btn.classList.toggle('kpi-step--active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function tick() {
      if (paused) return;
      idx = (idx + 1) % steps.length;
      renderStep(idx);
    }

    function start() {
      stop();
      timer = setInterval(tick, 3200);
    }
    function stop() { if (timer) clearInterval(timer); timer = null; }

    card.addEventListener('mouseenter', () => { paused = true; });
    card.addEventListener('mouseleave', () => { paused = false; });

    stepBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        idx = Number(btn.dataset.stepIdx);
        renderStep(idx);
        paused = true;
        setTimeout(() => { paused = false; }, 6000);
      });
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      start();
    }
  })();
</script>

<style>
  .hero-kpi {
    background: var(--bl-card);
    border: 1px solid var(--bl-card-stroke);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    box-shadow: 0 30px 70px -30px rgba(31, 59, 52, 0.35);
    position: relative;
  }
  .kpi-head {
    display: flex;
    justify-content: space-between;
    font-family: var(--bl-font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bl-muted);
    margin-bottom: 10px;
  }
  .kpi-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
  .kpi-title { font-family: var(--bl-font-display); font-size: 24px; font-weight: 500; letter-spacing: -0.02em; margin: 0; color: var(--bl-ink); }
  .kpi-status { padding: 4px 10px; border-radius: 999px; background: var(--bl-accent-soft); color: var(--bl-accent-ink); font-size: 11px; font-weight: 600; white-space: nowrap; }
  .kpi-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .kpi-tile { border: 1px solid var(--bl-card-stroke); border-radius: var(--radius-sm); padding: 12px 14px; background: var(--bl-paper); }
  .kpi-tile-label { font-family: var(--bl-font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--bl-muted); }
  .kpi-tile-num { font-family: var(--bl-font-display); font-size: 24px; font-weight: 500; color: var(--bl-ink); letter-spacing: -0.02em; margin: 4px 0 2px; }
  .kpi-tile-hint { font-size: 11px; color: var(--bl-muted); }
  .kpi-tile--warn .kpi-tile-num { color: var(--bl-def); }
  .kpi-tile--ok .kpi-tile-num { color: var(--bl-ok); }
  .kpi-tile--accent .kpi-tile-num { color: var(--bl-accent-ink); }
  .kpi-steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin-top: 16px; }
  .kpi-step {
    padding: 10px 8px; border-radius: 8px; border: 1px solid var(--bl-card-stroke);
    background: transparent; color: var(--bl-ink-2); cursor: pointer;
    display: flex; flex-direction: column; gap: 3px;
    transition: all 0.35s var(--bl-ease);
    text-align: left;
    font-family: inherit;
  }
  .kpi-step--active { background: var(--bl-accent-soft); border-color: var(--bl-accent); color: var(--bl-accent-ink); transform: scale(1.03); }
  .kpi-step-num { font-family: var(--bl-font-mono); font-size: 10px; color: var(--bl-muted); }
  .kpi-step--active .kpi-step-num { color: var(--bl-accent-ink); }
  .kpi-step-label { font-size: 11px; font-weight: 600; }
</style>
```

- [ ] **Step 2: Build and check**

Run: `npm run build 2>&1 | tail -20`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/hero/HeroKpi.astro
git commit -m "feat(hero): add interactive 5-step KPI card

Auto-cycles every 3.2s (paused on hover, paused 6s after manual click),
reads step data from illus.json per locale, respects prefers-reduced-motion."
```

---

### Task 11: Rewrite `Hero.astro` to compose new pieces

**Files:**
- Modify: `src/components/Hero.astro` (full rewrite)

- [ ] **Step 1: Replace file content**

Write to `src/components/Hero.astro`:

```astro
---
import hero from '../content/hero.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
import HeroBg from './hero/HeroBg.astro';
import HeroKpi from './hero/HeroKpi.astro';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = hero[locale];
---
<section class="hero section">
  <HeroBg />
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="eyebrow">{t.eyebrow}</span>
      <h1>
        {t.title_1}<br />
        <span class="hero-accent">
          {t.title_2}
          <svg class="hero-underline" viewBox="0 0 400 10" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 5 Q 100 1, 200 4 T 398 4" fill="none" stroke="var(--bl-accent)" stroke-width="3" stroke-linecap="round" />
          </svg>
        </span>
      </h1>
      <p class="hero-lead">{t.lead}</p>
      <div class="hero-actions">
        <a href="#contact" class="btn btn-primary">{t.cta_primary} →</a>
        <a href="#workflow" class="btn btn-secondary">▶ {t.cta_secondary}</a>
      </div>
      <p class="hero-note">{t.note}</p>
      <div class="hero-audience">
        <span class="hero-audience-label">{t.audience_label}</span>
        <div class="hero-chips">
          {t.audience_chips.map((c) => <span class="hero-chip">{c}</span>)}
        </div>
      </div>
    </div>
    <div class="hero-visual">
      <HeroKpi />
    </div>
  </div>
</section>

<style>
  .hero { position: relative; overflow: hidden; padding-top: 60px; }
  .hero-grid {
    position: relative; z-index: 1;
    display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: var(--space-12); align-items: center;
  }
  .hero-copy h1 { margin-top: var(--space-4); }
  .hero-accent { color: var(--bl-ink); position: relative; display: inline-block; }
  .hero-underline {
    position: absolute; left: 0; right: 0; bottom: -6px;
    width: 100%; height: 10px;
    stroke-dasharray: 400;
    animation: hero-underline-draw 1.8s ease-out forwards;
  }
  @keyframes hero-underline-draw {
    from { stroke-dashoffset: 400; }
    to { stroke-dashoffset: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-underline { animation: none; stroke-dashoffset: 0; }
  }

  .hero-lead { font-size: 18px; color: var(--bl-ink-2); margin-top: var(--space-4); line-height: 1.55; max-width: 520px; }
  .hero-actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); flex-wrap: wrap; }
  .hero-note { font-size: 13px; color: var(--bl-muted); margin-top: var(--space-4); }
  .hero-audience { margin-top: var(--space-8); }
  .hero-audience-label {
    font-family: var(--bl-font-mono); font-size: 11px; color: var(--bl-muted);
    letter-spacing: 0.15em; text-transform: uppercase;
  }
  .hero-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: var(--space-2); }
  .hero-chip {
    padding: 5px 12px; border-radius: 999px; background: var(--bl-paper-2);
    font-size: 12px; color: var(--bl-ink-2);
  }

  @media (max-width: 960px) {
    .hero-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 2: Run dev and check hero**

Run in separate terminal: `npm run dev -- --host 0.0.0.0`
Open `http://localhost:4321/ru/` in browser.
Expected: New Hero with D-background, interactive KPI card cycling, animated underline.

- [ ] **Step 3: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat(hero): rewrite Hero.astro to compose HeroBg + HeroKpi

Split title into two lines with animated ochre underline. Adds audience
chips row. New copy \"Контроль стройки в одном рабочем контуре\" per spec."
```

---

## Phase 4 — Inside bento

### Task 12: Create six Inside child components

**Files (all new):**
- Create: `src/components/inside/InsideBoq.astro`
- Create: `src/components/inside/InsideShortage.astro`
- Create: `src/components/inside/InsideFlow.astro`
- Create: `src/components/inside/InsideDocs.astro`
- Create: `src/components/inside/InsideRoles.astro`
- Create: `src/components/inside/InsideStock.astro`
- Create: `src/components/inside/InsideConnector.astro`

- [ ] **Step 1: Make directory**

```bash
mkdir -p src/components/inside
```

- [ ] **Step 2: Write `InsideBoq.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].boq;
---
<div class="mod mod--2fr">
  <div class="mod-head">
    <div class="mod-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4h10M8 11h2m3 0h3M8 14h2m3 0h3M8 17h8"/></svg>
    </div>
    <div><h3>{c.title}</h3><p>{c.body}</p></div>
  </div>
  <div class="mod-preview">
    <div class="boq-head">{c.head.map((h) => <span>{h}</span>)}</div>
    {c.rows.map((r) => (
      <div class="boq-row">
        <span class="name">{r[0]}</span>
        <span class="norm">{r[1]}</span>
        <span class="need">{r[2]}</span>
      </div>
    ))}
  </div>
</div>

<style>
  .boq-head, .boq-row { display: grid; grid-template-columns: 1.6fr 1fr 1fr; padding: 9px 14px; font-size: 12px; }
  .boq-head { font-family: var(--bl-font-mono); text-transform: uppercase; letter-spacing: 0.1em; color: var(--bl-muted); border-bottom: 1px solid var(--bl-card-stroke); font-size: 10px; }
  .boq-row { border-bottom: 1px solid var(--bl-card-stroke); }
  .boq-row:last-child { border-bottom: none; }
  .boq-row .name { color: var(--bl-ink); }
  .boq-row .norm { color: var(--bl-muted); }
  .boq-row .need { color: var(--bl-green); font-weight: 600; }
</style>
```

- [ ] **Step 3: Write `InsideShortage.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].shortage;
---
<div class="mod">
  <div class="mod-head">
    <div class="mod-icon mod-icon--alert">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 21h20L12 3Zm0 7v5m0 3h.01"/></svg>
    </div>
    <div><h3>{c.title}</h3><p>{c.body}</p></div>
  </div>
  <div class="mod-preview">
    <div class="short-list">
      {c.items.map((it) => (
        <div class={`short-item short-item--${it.state}`}>
          <span class="label"><span class="dot"/>{it.name}</span>
          <span class="val">{it.val}</span>
        </div>
      ))}
    </div>
  </div>
</div>

<style>
  .short-list { padding: 10px; display: flex; flex-direction: column; gap: 6px; }
  .short-item { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; border-radius: 8px; font-size: 12px; }
  .short-item--def { background: var(--bl-def-bg); }
  .short-item--ok { background: var(--bl-ok-bg); }
  .short-item .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 8px; }
  .short-item--def .dot { background: var(--bl-def); }
  .short-item--ok .dot { background: var(--bl-ok); }
  .short-item .label { display: flex; align-items: center; color: var(--bl-ink); }
  .short-item--def .val { color: var(--bl-def); font-weight: 600; }
  .short-item--ok .val { color: var(--bl-ok); font-weight: 600; }
</style>
```

- [ ] **Step 4: Write `InsideFlow.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].flow;
---
<div class="mod">
  <div class="mod-head">
    <div class="mod-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-6 8 6v12M9 21V13h6v8"/></svg>
    </div>
    <div><h3>{c.title}</h3><p>{c.body}</p></div>
  </div>
  <div class="mod-preview flow">
    {c.chips.map((chip, i) => (
      <>
        <span class="flow-chip">{chip}</span>
        {i < c.chips.length - 1 && <span class="flow-arrow">→</span>}
      </>
    ))}
  </div>
</div>

<style>
  .flow { padding: 18px 14px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; justify-content: center; }
  .flow-chip { padding: 6px 12px; border-radius: 999px; background: var(--bl-green); color: var(--bl-green-ink); font-size: 11px; font-weight: 500; }
  .flow-arrow { color: var(--bl-accent-ink); font-size: 13px; }
</style>
```

- [ ] **Step 5: Write `InsideDocs.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].docs;
---
<div class="mod">
  <div class="mod-head">
    <div class="mod-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5"/></svg>
    </div>
    <div><h3>{c.title}</h3><p>{c.body}</p></div>
  </div>
  <div class="mod-preview docs">
    {c.formats.map((f) => (
      <div class="doc-box">
        <div class="fmt">{f.fmt}</div>
        <div class="hint">{f.hint}</div>
      </div>
    ))}
  </div>
</div>

<style>
  .docs { padding: 16px; display: flex; gap: 8px; justify-content: center; }
  .doc-box { flex: 1 1 0; padding: 12px 8px; border: 1px solid var(--bl-card-stroke); border-radius: 8px; background: var(--bl-card); text-align: center; }
  .doc-box .fmt { font-family: var(--bl-font-display); font-size: 13px; color: var(--bl-ink); font-weight: 500; }
  .doc-box .hint { font-size: 9px; color: var(--bl-muted); margin-top: 2px; font-family: var(--bl-font-mono); text-transform: uppercase; letter-spacing: 0.08em; }
</style>
```

- [ ] **Step 6: Write `InsideRoles.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].roles;
---
<div class="mod">
  <div class="mod-head">
    <div class="mod-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"/></svg>
    </div>
    <div><h3>{c.title}</h3><p>{c.body}</p></div>
  </div>
  <div class="mod-preview roles">
    {c.pills.map((p) => (
      <span class={`role-pill role-pill--${p.color}`}>{p.label}</span>
    ))}
  </div>
</div>

<style>
  .roles { padding: 16px 14px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .role-pill { padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .role-pill--ok { background: rgba(63,138,90,0.15); color: var(--bl-ok); }
  .role-pill--green { background: rgba(42,74,66,0.15); color: var(--bl-green); }
  .role-pill--accent { background: rgba(201,142,79,0.18); color: var(--bl-accent-ink); }
  .role-pill--accent-ink { background: rgba(138,90,42,0.15); color: var(--bl-accent-ink); }
  .role-pill--muted { background: rgba(107,122,116,0.18); color: var(--bl-ink-2); }
</style>
```

- [ ] **Step 7: Write `InsideStock.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].stock;
---
<div class="mod mod--2fr">
  <div class="mod-head">
    <div class="mod-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18v4H3zM3 13h18v4H3zM5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <div><h3>{c.title}</h3><p>{c.body}</p></div>
  </div>
  <div class="mod-preview stock">
    {c.items.map((it) => (
      <div class="stock-row">
        <span class="name">{it.name}</span>
        <div class="bar"><div class={`fill${it.low ? ' low' : ''}`} style={`width:${it.pct}%`}/></div>
        <span class={`val${it.low ? ' low' : ''}`}>{it.val}</span>
      </div>
    ))}
  </div>
</div>

<style>
  .stock { padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; }
  .stock-row { display: grid; grid-template-columns: 130px 1fr auto; gap: 12px; align-items: center; font-size: 12px; }
  .stock-row .name { color: var(--bl-ink-2); }
  .stock-row .bar { height: 7px; background: var(--bl-paper-2); border-radius: 999px; overflow: hidden; }
  .stock-row .fill { height: 100%; background: var(--bl-green); }
  .stock-row .fill.low { background: var(--bl-def); }
  .stock-row .val { font-weight: 600; color: var(--bl-ink); }
  .stock-row .val.low { color: var(--bl-def); }
</style>
```

- [ ] **Step 8: Write `InsideConnector.astro`**

```astro
---
import inside from '../../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const c = inside[locale].connector;
---
<div class="inside-connector">
  <div>
    <div class="label">{c.label}</div>
    <div class="chain">
      {c.chain.map((item, i) => (
        <>
          <span class="chain-item">{item}</span>
          {i < c.chain.length - 1 && <span class="chain-sep">→</span>}
        </>
      ))}
    </div>
  </div>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bl-accent-soft)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
</div>

<style>
  .inside-connector {
    background: var(--bl-green-deep); color: var(--bl-green-ink);
    padding: 18px 24px; border-radius: var(--radius-md);
    display: flex; justify-content: space-between; align-items: center;
  }
  .label { font-family: var(--bl-font-mono); font-size: 11px; letter-spacing: 0.15em; color: var(--bl-accent-soft); text-transform: uppercase; }
  .chain { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; font-size: 13px; font-weight: 600; margin-top: 4px; }
  .chain-item { color: var(--bl-accent-soft); }
  .chain-sep { color: var(--bl-green-ink); opacity: 0.6; }
</style>
```

- [ ] **Step 9: Commit**

```bash
git add src/components/inside/
git commit -m "feat(inside): add 6 mini-interface child components + connector

Each module renders from inside.json: BoQ table, shortage list, flow
chips, document formats, role pills, stock bars. Connector bar runs
Объект → BoQ → Склад → Документы → Отчёт in dark green."
```

---

### Task 13: Rewrite `Inside.astro` as bento grid

**Files:**
- Modify: `src/components/Inside.astro` (full rewrite)

- [ ] **Step 1: Replace file content**

Write to `src/components/Inside.astro`:

```astro
---
import inside from '../content/inside.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
import InsideBoq from './inside/InsideBoq.astro';
import InsideShortage from './inside/InsideShortage.astro';
import InsideFlow from './inside/InsideFlow.astro';
import InsideDocs from './inside/InsideDocs.astro';
import InsideRoles from './inside/InsideRoles.astro';
import InsideStock from './inside/InsideStock.astro';
import InsideConnector from './inside/InsideConnector.astro';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = inside[locale];
---
<section class="section" id="inside">
  <div class="container">
    <div class="head">
      <span class="eyebrow">{t.eyebrow}</span>
      <h2>{t.title}</h2>
      <p class="lead">{t.lead}</p>
    </div>

    <div class="bento">
      <InsideBoq />
      <InsideShortage />
      <InsideFlow />
      <InsideDocs />
      <InsideRoles />
      <InsideStock />
    </div>

    <InsideConnector />
  </div>
</section>

<style>
  .head { max-width: 640px; margin: 0 auto var(--space-12); text-align: center; }
  .head h2 { margin-top: var(--space-4); }
  .head .lead { color: var(--bl-ink-2); margin-top: var(--space-3); font-size: 15px; }

  .bento {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }
  .bento :global(.mod) {
    background: var(--bl-card);
    border: 1px solid var(--bl-card-stroke);
    border-radius: var(--radius-md);
    padding: var(--space-5);
    display: flex; flex-direction: column; gap: var(--space-4);
    transition: transform 0.3s var(--bl-ease), box-shadow 0.3s var(--bl-ease);
  }
  .bento :global(.mod:hover) {
    transform: translateY(-2px);
    box-shadow: 0 40px 60px -30px rgba(31, 59, 52, 0.25);
  }
  .bento :global(.mod--2fr) { grid-column: span 2; }
  .bento :global(.mod-head) { display: flex; gap: var(--space-3); align-items: flex-start; }
  .bento :global(.mod-icon) {
    width: 36px; height: 36px; flex-shrink: 0;
    border-radius: 8px; background: var(--bl-paper-2);
    display: flex; align-items: center; justify-content: center;
    color: var(--bl-ink);
  }
  .bento :global(.mod-icon--alert) { background: var(--bl-def-bg); color: var(--bl-def); }
  .bento :global(.mod h3) {
    font-family: var(--bl-font-display);
    font-size: 17px;
    font-weight: 500;
    color: var(--bl-ink);
    letter-spacing: -0.01em;
    margin: 0;
  }
  .bento :global(.mod p) {
    font-size: 13px;
    color: var(--bl-ink-2);
    line-height: 1.5;
    margin: 2px 0 0;
  }
  .bento :global(.mod-preview) {
    border: 1px solid var(--bl-card-stroke);
    border-radius: 10px;
    background: var(--bl-paper);
    overflow: hidden;
  }

  @media (max-width: 900px) {
    .bento { grid-template-columns: 1fr; }
    .bento :global(.mod--2fr) { grid-column: span 1; }
  }
</style>
```

- [ ] **Step 2: Run dev + check in browser**

Run: `npm run dev` (if not running)
Browse to `http://localhost:4321/ru/#inside`
Expected: 6 cards in bento layout (first wide, next 3 narrow, last wide) + dark green connector.

- [ ] **Step 3: Commit**

```bash
git add src/components/Inside.astro
git commit -m "feat(inside): rebuild as bento grid composing 6 mini-interface cards

Grid 2fr/1fr/1fr × 2 rows, dark-green connector below. Each card shows
a live mini-UI instead of an icon. EU content consumed from inside.json."
```

---

## Phase 5 — Workflow sticky-preview polish

### Task 14: Update `Workflow.astro` — bigger numbers, new fonts, mm-grid bg

**Files:**
- Modify: `src/components/Workflow.astro`

- [ ] **Step 1: Add blueprint background wrapper and update styles**

Replace the `<style>` block (lines 58-96) in `src/components/Workflow.astro` with:

```css
  .section { position: relative; overflow: hidden; }
  .section::before {
    content: '';
    position: absolute; inset: 0; z-index: 0;
    background-image:
      linear-gradient(rgba(31,59,52,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(31,59,52,0.06) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }
  .container { position: relative; z-index: 1; }

  .head { max-width: 720px; margin: 0 auto var(--space-12); text-align: center; }
  .head h2 { margin-top: var(--space-4); }

  .wf-wrap { display: grid; grid-template-columns: 1fr 1.4fr; gap: var(--space-8); }
  .wf-steps { display: grid; grid-template-columns: 1fr; gap: var(--space-2); align-self: start; position: sticky; top: 100px; }
  .wf-step {
    display: grid; grid-template-columns: auto 1fr; gap: var(--space-4); align-items: center;
    padding: var(--space-4) var(--space-5); border: 1px solid transparent; border-radius: var(--radius-md);
    background: transparent; cursor: pointer; text-align: left; opacity: 0.45;
    transition: all 0.25s var(--bl-ease);
    font-family: inherit;
  }
  .wf-step:hover { opacity: 0.8; }
  .wf-step.active {
    opacity: 1;
    border-left: 3px solid var(--bl-accent);
    background: var(--bl-card);
    box-shadow: 0 12px 28px -16px rgba(31,59,52,0.2);
  }
  .wf-step b {
    font-family: var(--bl-font-display); font-size: 42px; font-weight: 500;
    color: var(--bl-ink-2); line-height: 1; letter-spacing: -0.02em;
  }
  .wf-step.active b { color: var(--bl-accent); }
  .wf-step span {
    font-family: var(--bl-font-body); font-weight: 600; font-size: 16px;
    color: var(--bl-ink);
  }

  .wf-panels { position: relative; min-height: 520px; }
  .wf-panel {
    position: absolute; inset: 0; background: var(--bl-card); border: 1px solid var(--bl-card-stroke);
    border-radius: var(--radius-lg); overflow: hidden;
    display: grid; grid-template-rows: auto 1fr;
    opacity: 0; transition: opacity 0.25s var(--bl-ease); pointer-events: none;
  }
  .wf-panel.active { opacity: 1; pointer-events: auto; }
  .wf-panel-illus {
    background: linear-gradient(135deg, var(--bl-paper) 0%, var(--bl-paper-2) 100%);
    border-bottom: 1px solid var(--bl-card-stroke);
    display: flex; align-items: center; justify-content: center;
    padding: var(--space-5);
    aspect-ratio: 9 / 5;
  }
  .wf-panel-illus :global(svg) { width: 100%; height: 100%; max-height: 260px; }
  .wf-panel-text { padding: var(--space-6) var(--space-8) var(--space-8); }
  .wf-num {
    font-family: var(--bl-font-display); font-size: 48px; color: var(--bl-accent);
    display: block; line-height: 1; font-weight: 500; letter-spacing: -0.02em;
  }
  .wf-panel h3 { margin-top: var(--space-2); color: var(--bl-ink); }
  .wf-panel p { margin-top: var(--space-3); color: var(--bl-ink-2); font-size: 15px; line-height: 1.6; }

  @media (max-width: 960px) {
    .wf-wrap { grid-template-columns: 1fr; }
    .wf-steps { position: static; }
    .wf-panels { min-height: 0; }
    .wf-panel { position: static; opacity: 1; pointer-events: auto; display: none; }
    .wf-panel.active { display: grid; }
  }
```

- [ ] **Step 2: Verify in browser**

Reload `http://localhost:4321/ru/#workflow`
Expected: Big serif numbers 01-05 on the left, sticky preview on the right. Hovering a step activates the preview on desktop.

- [ ] **Step 3: Commit**

```bash
git add src/components/Workflow.astro
git commit -m "feat(workflow): big serif step numbers + sticky preview + mm-grid bg

Switch to Fraunces 42-48px numbers, left-border accent on active step,
subtle millimetre grid behind the section, panel shadow per new palette."
```

---

## Phase 6 — Why manifesto (dark green + corner marks)

### Task 15: Update `Why.astro` — dark green bg + decorative corner marks

**Files:**
- Modify: `src/components/Why.astro` (full rewrite)

- [ ] **Step 1: Replace file content**

Write to `src/components/Why.astro`:

```astro
---
import why from '../content/why.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = why[locale];
---
<section class="section why">
  <div class="container why-grid">
    <svg class="why-corner why-corner--tl" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M1 1 L1 18 M1 1 L18 1" fill="none" stroke="var(--bl-accent)" stroke-width="1.2"/></svg>
    <svg class="why-corner why-corner--tr" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M29 1 L29 18 M29 1 L12 1" fill="none" stroke="var(--bl-accent)" stroke-width="1.2"/></svg>
    <svg class="why-corner why-corner--bl" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M1 29 L1 12 M1 29 L18 29" fill="none" stroke="var(--bl-accent)" stroke-width="1.2"/></svg>
    <svg class="why-corner why-corner--br" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><path d="M29 29 L29 12 M29 29 L12 29" fill="none" stroke="var(--bl-accent)" stroke-width="1.2"/></svg>

    <div>
      <span class="eyebrow why-eyebrow">{t.eyebrow}</span>
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
  .why {
    background: var(--bl-green-deep);
    color: var(--bl-green-ink);
    position: relative;
  }
  .why-grid {
    display: grid; grid-template-columns: 1fr 1.2fr;
    gap: var(--space-12); align-items: start;
    position: relative;
    padding: var(--space-4) 0;
  }
  .why-corner { position: absolute; opacity: 0.6; }
  .why-corner--tl { top: 0; left: 0; }
  .why-corner--tr { top: 0; right: 0; }
  .why-corner--bl { bottom: 0; left: 0; }
  .why-corner--br { bottom: 0; right: 0; }

  .why-eyebrow {
    color: var(--bl-accent-soft);
    background: transparent;
    border-color: var(--bl-accent);
  }
  .why h2 {
    margin-top: var(--space-4);
    color: var(--bl-green-ink);
  }
  .why-body { color: rgba(238,241,234,0.85); font-size: 17px; line-height: 1.65; }
  .why-list { margin-top: var(--space-6); padding: 0; list-style: none; display: grid; gap: var(--space-3); }
  .why-list li {
    padding-left: var(--space-6); position: relative;
    color: var(--bl-green-ink); font-size: 15px;
  }
  .why-list li::before {
    content: '●';
    position: absolute; left: 0; top: 0;
    color: var(--bl-accent);
    font-size: 12px;
  }
  @media (max-width: 960px) { .why-grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Verify**

Reload page, scroll to Why section.
Expected: Dark green background, ochre corner marks in 4 corners, ochre bullet points, readable contrast.

- [ ] **Step 3: Commit**

```bash
git add src/components/Why.astro
git commit -m "feat(why): dark-green manifesto + corner marks + ochre bullets

Matches spec: L-shaped angle brackets in 4 corners, ochre accent-soft
text for eyebrow, new copy \"Not ten modules\" already in why.json."
```

---

## Phase 7 — Problems iso-grid background

### Task 16: Add iso-grid background to `Problems.astro`

**Files:**
- Modify: `src/components/Problems.astro`

- [ ] **Step 1: Wrap section and add iso pattern**

Replace `src/components/Problems.astro` with:

```astro
---
import problems from '../content/problems.json';
import { type Locale, DEFAULT_LOCALE } from '../lib/i18n';
const locale = (Astro.currentLocale ?? DEFAULT_LOCALE) as Locale;
const t = problems[locale];
---
<section class="section problems" id="problem">
  <svg class="problems-bg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern id="problems-iso" width="40" height="23" patternUnits="userSpaceOnUse">
        <path d="M0 0 L20 11.5 L40 0 M0 23 L20 11.5 L40 23" fill="none" stroke="rgba(31,59,52,0.06)" stroke-width="0.8"/>
      </pattern>
    </defs>
    <rect width="1200" height="800" fill="url(#problems-iso)"/>
  </svg>

  <div class="container">
    <div class="head">
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
    </div>
    <div class="grid">
      {t.cards.map((c, i) => (
        <article class="card">
          <div class="card-num">{String(i + 1).padStart(2, '0')}</div>
          <strong>{c.title}</strong>
          <p>{c.body}</p>
        </article>
      ))}
    </div>
  </div>
</section>

<style>
  .problems { position: relative; background: var(--bl-paper-2); overflow: hidden; }
  .problems-bg { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; pointer-events: none; }
  .problems .container { position: relative; z-index: 1; }
  .head { max-width: 720px; margin: 0 auto var(--space-12); text-align: center; }
  .head h2 { margin-bottom: var(--space-4); }
  .head p { color: var(--bl-ink-2); font-size: 16px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
  .card {
    background: var(--bl-card); border: 1px solid var(--bl-card-stroke);
    padding: var(--space-6); border-radius: var(--radius-md);
    transition: transform 0.2s var(--bl-ease), box-shadow 0.2s var(--bl-ease);
    position: relative;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -20px rgba(31,59,52,0.2); }
  .card-num {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--bl-def-bg); color: var(--bl-def);
    font-weight: 700; font-family: var(--bl-font-mono); font-size: 13px;
    margin-bottom: var(--space-3);
  }
  .card strong {
    color: var(--bl-ink); font-family: var(--bl-font-display);
    font-size: 17px; font-weight: 500;
    display: block; margin-bottom: var(--space-2);
  }
  .card p { margin: 0; color: var(--bl-ink-2); font-size: 14px; line-height: 1.55; }
  @media (max-width: 960px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 2: Verify — numbers appear only if problems.json has >=6 cards**

Run: `node -e "const p = require('./src/content/problems.json'); console.log('ru cards:', p.ru.cards.length)"`
Expected: >=6. If less, that's fine — numbers still render.

- [ ] **Step 3: Commit**

```bash
git add src/components/Problems.astro
git commit -m "feat(problems): iso-grid background + red-coral numbered plates

Adds subtle isometric grid pattern behind cards and 01-0N numbered
plates (bl-def colors) per spec 4.4."
```

---

## Phase 8 — Full build, dev preview, verification

### Task 17: Full build and fix any compile errors

- [ ] **Step 1: Build**

```bash
cd /home/doclogic_www/buildlogic_www && npm run build 2>&1 | tail -40
```

Expected: "Complete!" with no errors. If there are TypeScript errors (e.g., missing `hero_steps` type), run `git status` to inspect and fix inline.

- [ ] **Step 2: Start dev server**

```bash
npm run dev -- --host 0.0.0.0 --port 4321
```

- [ ] **Step 3: Visit all three locale routes in browser and verify**

Open:
- `http://localhost:4321/ru/`
- `http://localhost:4321/en/`
- `http://localhost:4321/sk/`

Verify checklist:
- [ ] Hero: D-background visible, crane swaying, KPI card cycles 5 steps every 3.2s, underline draws on load.
- [ ] Problems: iso-grid faint behind cards, red-coral numbers `01-0N` in each.
- [ ] Workflow: big serif numbers, sticky-preview working, mm-grid bg.
- [ ] Inside: bento with 6 cards (BoQ wide, Shortage narrow, Flow narrow, Docs narrow, Roles narrow, Stock wide), dark-green connector below.
- [ ] Why: dark green bg, 4 corner marks, ochre bullets, new «Not ten modules» title.
- [ ] No «ERP» text anywhere (Ctrl+F in page source).
- [ ] All prices/numbers show EUR or universal units (no ₽, no М-11).

- [ ] **Step 4: Check console for JS errors**

Open DevTools → Console. Expected: no errors.

- [ ] **Step 5: If any issues — fix inline and commit as polish**

For each fix:
```bash
git add <changed-file>
git commit -m "fix(<section>): <what was broken>"
```

---

### Task 18: Polish secondary sections (Pricing / FAQ / Contact / Footer)

**Files (minor):**
- Modify: `src/components/Pricing.astro`
- Modify: `src/components/FAQ.astro`
- Modify: `src/components/Contact.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Check each file for hard-coded old palette colors**

Run: `grep -nE '#6C5CE7|#234f48|#1b3e38|#bf9461|Roboto Condensed' src/components/Pricing.astro src/components/FAQ.astro src/components/Contact.astro src/components/Footer.astro`

For each match, replace:
- `#234f48`, `#1b3e38`, `var(--primary)` → `var(--bl-green)`
- `#bf9461`, `var(--accent)` → `var(--bl-accent)` (already aliased, but prefer new name)
- `'Roboto Condensed', sans-serif` → `var(--bl-font-mono)`

- [ ] **Step 2: `Pricing.astro` — verify EUR currency**

Open `src/content/pricing.json`. For every price string, verify it ends with `€` not `₽`/`$`. Also verify «Без привязки карты» / «No credit card» / «Bez platobnej karty» label exists above the first CTA in all locales.

If missing, add `"no_card": "Без привязки карты"` to each locale and render it above CTA in `Pricing.astro`:

```astro
<p class="pricing-no-card">{t.no_card}</p>
```

with style:

```css
.pricing-no-card {
  font-family: var(--bl-font-mono); font-size: 11px; letter-spacing: 0.1em;
  color: var(--bl-accent-ink); text-transform: uppercase;
  text-align: center; margin-bottom: var(--space-4);
}
```

- [ ] **Step 3: `FAQ.astro` — animated +/× icon**

In the open-state toggle, replace the `+`/`−` or similar with a rotating `+`. Add this style inside the `<style>` block:

```css
.faq-item .icon {
  transition: transform 0.25s var(--bl-ease);
  display: inline-block;
}
.faq-item[open] .icon { transform: rotate(45deg); }
```

Ensure the `<button>` uses `aria-expanded` matching `open` state (Astro's `<details>` handles this automatically).

- [ ] **Step 4: `Contact.astro` — dark green bg + 2×2 form grid**

Find the root `<section>` style and set `background: var(--bl-green-deep); color: var(--bl-green-ink);`.
Find the form markup and ensure it's a `<form>` with `display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);`. Textarea should span both columns: `<textarea class="contact-textarea" ...>` with CSS `grid-column: span 2;`.

If the current form is single-column, restructure. If fields are already 4, leave order as Name / Company / Email / Phone. Otherwise adjust `src/content/contact.json` field order to match.

- [ ] **Step 5: `Footer.astro` — 3-column compact**

Replace the root `<footer>` style to: `background: var(--bl-paper-2); padding: var(--space-8) 0;`. Inside container, layout 3 columns: `grid-template-columns: 1fr 1fr auto; gap: var(--space-8); align-items: center;`. Copyright row below, separated by `border-top: 1px solid var(--bl-card-stroke); padding-top: var(--space-4); margin-top: var(--space-4);`.

- [ ] **Step 6: Full rebuild**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/Pricing.astro src/components/FAQ.astro src/components/Contact.astro src/components/Footer.astro src/content/pricing.json src/content/contact.json
git commit -m "style(secondary): migrate Pricing/FAQ/Contact/Footer to new palette

Pricing gets EUR no-card label. FAQ gets rotating + icon. Contact goes
dark-green with 2x2 form. Footer trimmed to compact 3-column layout."
```

---

### Task 19: Run existing tests and fix regressions

- [ ] **Step 1: Inventory tests**

Run: `ls tests/ 2>/dev/null && ls vitest.config.ts playwright.config.ts 2>/dev/null`

- [ ] **Step 2: Run unit tests if present**

```bash
npm test 2>&1 | tail -30
```

Expected: all pass. If failures are about visual/snapshot tests — update snapshots after confirming the new look matches spec:

```bash
npm test -- -u
```

- [ ] **Step 3: Run Playwright e2e if configured**

```bash
npx playwright test 2>&1 | tail -30
```

Expected: pass, or failures only on visual regressions that need updating.

- [ ] **Step 4: Commit any snapshot updates**

```bash
git add tests/
git commit -m "test: update snapshots after redesign"
```

---

### Task 20: Final verification — manual browser walkthrough

- [ ] **Step 1: Start dev server**

```bash
npm run dev -- --host 0.0.0.0 --port 4321
```

- [ ] **Step 2: Visit `http://localhost:4321/ru/` in browser**

Verify each section matches spec:
- [ ] Hero D-background + sway + KPI cycle + drawing underline + audience chips
- [ ] RoleStrip unchanged functionally
- [ ] Problems: iso-grid + numbered plates
- [ ] Overview: new typography
- [ ] Workflow: big serif numbers + sticky preview
- [ ] Inside: bento grid + connector
- [ ] Why: dark green + corner marks + new copy
- [ ] Pricing: EUR + popular badge + no-card label
- [ ] FAQ: rotating + icon
- [ ] Contact: dark green + 2×2 form
- [ ] Footer: compact 3-col

- [ ] **Step 3: Grep final check for forbidden tokens**

```bash
grep -rniE 'ERP|М-11|КБ-2в|1С|БАС|руб\b|RUB|₽' src/content/ src/components/
```

Expected: no output (or only in comments that can be removed).

- [ ] **Step 4: Check prefers-reduced-motion**

In DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Reload page.
Expected: crane does not sway, underline shows fully drawn, KPI does not auto-cycle (but clicking steps still works).

- [ ] **Step 5: Final commit (if any lingering tweaks)**

```bash
git add -u
git commit -m "polish: final verification fixes from walkthrough"
```

---

## Self-Review Complete

**Spec coverage:**
- §3.1 Palette → Task 1 ✓
- §3.2 Typography → Tasks 2, 3 ✓
- §3.3 Hero D-background → Task 9 ✓
- §3.4 Other section backgrounds → Tasks 14 (Workflow mm), 16 (Problems iso), 15 (Why dark green) ✓
- §4.1 Header (sticky blur, pill lang) → covered by polish step in Task 18 and existing component; header blur/pill switcher already in place per current `Header.astro` — verify during Task 20 walkthrough
- §4.2 Hero → Tasks 9, 10, 11 ✓
- §4.3 RoleStrip role rename → covered by audience chips in hero.json Task 5 — role names in `src/content/common.json` / role-strip content would need similar rename; add as sub-step in Task 18 if the existing file uses old role names
- §4.4 Problems → Task 16 ✓
- §4.5 Overview tokens → covered by Task 1 (alias tokens) + Task 3 (typography)
- §4.6 Workflow → Task 14 ✓
- §4.7 Inside → Tasks 12, 13 ✓
- §4.8 Why → Tasks 4 (content), 15 (component) ✓
- §4.9 Pricing → Task 18 ✓
- §4.10 FAQ → Task 18 ✓
- §4.11 Contact → Task 18 ✓
- §4.12 Footer → Task 18 ✓
- §5 Animations → underline draw (Task 11), sway (Task 9), cycling (Task 10), reduced-motion guards throughout
- §6 A11y → `aria-expanded`, button roles, prefers-reduced-motion — addressed in Tasks 10 (KPI roles), 18 (FAQ), 20 (manual verify)

**Placeholder scan:** checked — no TBD, TODO, "similar to" shortcuts. Every task has actual code.

**Type consistency:** `hero_steps` schema uses `label/title/status/tiles[{l,n,h,mod}]` consistently in Tasks 6 and 10.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-buildlogic-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task (or per phase), review between tasks, fast iteration. Best for 20 tasks of mostly-independent work.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints at phase boundaries.

Which approach?
