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

## Trackers

Set `.env` values from `.env.example`. Empty values disable the respective tracker. All loading gated by user consent (Google Consent Mode v2).

## Production deployment (buildlogic.eu)

The live site runs on a Debian host behind Traefik v3 (Docker) with Let's Encrypt TLS. The landing container exposes port 80 internally and is routed via Docker labels on the `proxy` network — no host nginx, no certbot on the host.

Deploy flow:

1. Commit changes to this repo and push to `origin/main`.
2. Run `./scripts/deploy-to-prod.sh` — this syncs the production git repo (strips internal paths like `docs/`).
3. Rsync/tar the source to the server's `/opt/docker-projects/buildlogic_www/` and rebuild: `docker compose up -d --build`.

Traefik labels, network wiring, and rollback notes live in the internal ops notes (not in this repo).
