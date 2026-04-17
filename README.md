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
