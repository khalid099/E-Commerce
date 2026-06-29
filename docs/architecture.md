# System Architecture

## Overview

ShopHive is a full-stack e-commerce platform structured as a monorepo with three deployable units:

| Unit | Technology | Port |
|---|---|---|
| `apps/backend` | NestJS + TypeORM + PostgreSQL | 3001 |
| `apps/frontend` | Next.js 14 (App Router) | 3000 |
| `packages/shared-types` | TypeScript (types only, not deployed) | — |

## Request Flow

```
Browser
  │
  ├── GET /                → Next.js (SSR/SSG - catalog pages)
  ├── GET /admin/*         → Next.js (client-rendered, role-guarded)
  │
  └── /api/*  (proxied by Next.js rewrites)
        │
        └── NestJS API (JWT auth, RBAC)
              │
              └── PostgreSQL
```

## Authentication Flow

1. User POSTs credentials to `POST /api/auth/login`
2. Backend returns a signed JWT
3. Frontend stores token in an `httpOnly` cookie (not accessible to JS)
4. All subsequent API requests send the cookie; backend validates via `JwtAuthGuard`
5. Admin routes additionally require `RolesGuard` checking `role === ADMIN`

## Module Dependency Graph

```
AppModule
  ├── ConfigModule (global)
  ├── TypeOrmModule (global)
  ├── AuthModule
  │     └── UsersModule
  ├── ProductsModule
  │     └── CategoriesModule
  ├── CartModule
  │     └── ProductsModule
  ├── OrdersModule
  │     ├── CartModule
  │     └── ProductsModule
  ├── PaymentsModule
  │     └── OrdersModule
  ├── RecommendationsModule
  │     └── ProductsModule
  └── AdminModule
        ├── DashboardModule
        ├── ProductsModule
        └── OrdersModule
```

## Database Schema

See `README.md` → Data Model section for the full ER description.

Key design decisions:
- **Price snapshot on OrderItems** — product price is copied at order creation. Historical order totals remain accurate even if a product price is later changed.
- **Atomic stock decrement** — `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE stock_quantity >= :qty` prevents overselling under concurrent load without requiring a separate lock.
- **Soft delete not used** — products can be hard-deleted. OrderItems retain `productName` and `unitPrice` snapshots, so deletion doesn't corrupt history.

## Monorepo Structure

```
ecommerce-platform/
├── apps/
│   ├── backend/           @ecommerce/backend
│   └── frontend/          @ecommerce/frontend
├── packages/
│   └── shared-types/      @ecommerce/shared-types
├── docs/
├── docker-compose.yml     (development)
├── docker-compose.prod.yml (production + nginx)
├── turbo.json             (build pipeline)
└── package.json           (npm workspaces root)
```

### Turborepo Task Pipeline

```
build
  └── depends on: ^build  (shared-types builds before apps)

test
  └── depends on: ^build

dev
  └── persistent: true, no cache
```

## Shared Types Package

`@ecommerce/shared-types` is a TypeScript-only package (no compiled output at runtime). Both apps import directly from source via the `paths` alias. Benefits:

- Single source of truth for API contract types
- Breaking changes caught at compile time across both apps
- No versioning overhead — workspace `"*"` always resolves to local
