# Deployment Guide

## Local Development (No Docker)

See `README.md` → Setup sections. Requires Node.js 20+ and a local PostgreSQL instance.

## Docker Development

```bash
# Copy and populate the root .env
cp .env.example .env

# Start all services with hot-reload
npm run docker:dev

# Or directly:
docker-compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs
- PostgreSQL: localhost:5432

To seed the database after containers are running:
```bash
docker-compose exec backend npm run seed
```

## Docker Production

```bash
# Ensure .env is populated with production secrets
cp .env.example .env
# (fill in all values, especially JWT_SECRET, DB credentials, Stripe keys)

# Build and start
npm run docker:prod
```

The production compose adds an Nginx reverse proxy. Add your SSL certificates to `docs/nginx/ssl/` and configure `docs/nginx/nginx.conf` before deploying.

## Environment Variable Reference

| Variable | Dev default | Production requirement |
|---|---|---|
| `JWT_SECRET` | `dev_secret_...` | **Minimum 64 random chars** |
| `DB_SYNCHRONIZE` | `true` | **Must be `false`** — use migrations |
| `NODE_ENV` | `development` | `production` |
| `STRIPE_SECRET_KEY` | test key | Live key (when ready for real payments) |

## CI/CD Notes

Recommended pipeline stages:

1. `turbo run lint type-check` — fail fast on type errors
2. `turbo run test` — unit tests with coverage threshold
3. `turbo run build` — verify both apps build successfully
4. `turbo run test:e2e` — integration tests against a test DB
5. Docker image build + push to registry
6. Deploy (rolling update recommended)

Turborepo remote caching (`TURBO_TOKEN` + `TURBO_TEAM`) can be configured to share build artifacts across CI runs.
