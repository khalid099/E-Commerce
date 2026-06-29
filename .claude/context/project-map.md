# Context — Project Map

Fast orientation for any agent. The authoritative spec is `CLAUDE.md`; this is the "where things live" index.

## Monorepo (Turborepo, run from root)

```
apps/backend/    @ecommerce/backend   — NestJS 10 + TypeORM 0.3 + PostgreSQL
apps/frontend/   @ecommerce/frontend  — Next.js 14 App Router + Tailwind + Radix
packages/shared-types/  @ecommerce/shared-types — shared TS types, no runtime
docs/            architecture.md, deployment.md
```

Commands: `npm run dev` (both apps), `npm run seed`, `npm test`.

## Backend (`apps/backend/src`)

| Area | Path | Notes |
|---|---|---|
| Bootstrap | `main.ts`, `app.module.ts` | global pipes/filters/interceptors wired here |
| Config | `config/configuration.ts` | env validated at startup; read via `ConfigService` |
| Common | `common/` | `guards/` (JwtAuth, Roles), `decorators/` (CurrentUser, Roles), `filters/` (HttpException), `interceptors/` (Transform) |
| Auth | `auth/` | register, login (sets httpOnly cookie), JWT strategy, `/auth/me` |
| Catalog | `categories/`, `products/` | public reads + admin CRUD; product image upload (`product-image.storage.ts`) |
| Cart | `cart/` | one cart per user; line totals in service |
| Orders | `orders/` | atomic stock, price snapshot, txn; `OrdersController` (customer) + `AdminOrdersController` |
| Dashboard | `dashboard/` | admin aggregates |
| Users | `users/entities/user.entity.ts` | `passwordHash` is `@Exclude()`d |

## Frontend (`apps/frontend/src`)

| Area | Path | Notes |
|---|---|---|
| Routing | `app/(storefront)`, `app/(auth)`, `app/admin` | route groups; `middleware.ts` enforces authz |
| API client | `lib/api.ts` | Axios, `withCredentials`, central 401 redirect |
| Errors | `lib/errors.ts` | reads the `{success,...}` error envelope |
| Catalog state | `store/productsApi.ts`, `store/store.ts` | **RTK Query** |
| Session state | `store/authStore.ts`, `store/cartStore.ts` | **Zustand** (no JWT in JS) |
| Auth reads | TanStack Query | orders, admin lists (`lib/adminOrders.ts`, `lib/adminProducts.ts`) |
| UI primitives | `components/ui/*` | Radix wrappers (button, input, select, badge, skeleton, textarea) |
| Features | `components/storefront/*`, `components/admin/*` | ProductCard, ProductForm, RevenueChart, OrderStatusBadge |

## Shared types (`packages/shared-types/src`)
`api.types.ts` (`ApiResponse`, `PaginatedResponse`), `user.types.ts`, `product.types.ts`, `cart.types.ts`, `order.types.ts`. **Single source of truth for API shapes** — both apps import from here.

## Hot spots (where bugs cluster)
Order creation (stock/total/snapshot/cart-clear), ownership filters on orders/cart, admin guards, the three-way type alignment (service ↔ shared-types ↔ frontend hook), `DB_SYNCHRONIZE` in prod config.
