# Rule — Code Style

Applies to every file in the monorepo. These are enforced; reviewers reject diffs that violate them.

## Universal

- **TypeScript everywhere, no `any`.** Shared shapes come from `@ecommerce/shared-types`. If a type is missing there and is used by both apps, add it to the package — do not redefine it locally.
- **No commented-out code.** Delete it; git is the history.
- **No dead exports.** If nothing imports it, remove it.
- **Names describe intent, not type.** `findUserOrder`, not `getOrderData`. Booleans read as predicates (`isAdmin`, `hasStock`).
- **Match the file you are editing.** Mirror its import ordering, quote style, and comment density before introducing your own.
- **Comments explain *why*, never *what*.** The atomic-stock and price-snapshot comments in `orders.service.ts` are the model: short, load-bearing, justifying a non-obvious choice.

## Backend (NestJS)

- Controllers contain **routing, guards, and decorators only** — zero business logic. All logic lives in the service.
- One feature = one module folder: `feature.module.ts`, `feature.controller.ts`, `feature.service.ts`, `dto/`, `entities/`.
- Inject repositories with `@InjectRepository(Entity)`; never `new Repository()`.
- Money columns are `numeric` in Postgres and arrive as **strings** from TypeORM — wrap with `Number(...)` in the response mapper (see `OrdersService.mapOrder`). Never do math on the raw column value.
- Every endpoint has a DTO (see [backend/dto-validation.md](backend/dto-validation.md)) and a Swagger `@ApiOperation`.

## Frontend (Next.js)

- Components use **named exports, no default** (`export function ProductCard()`), except `page.tsx`/`layout.tsx` which Next requires to default-export.
- `'use client'` only on components that need state, effects, or browser APIs. Catalog read paths stay Server Components where possible.
- Tailwind utility classes inline; compose conditional classes with the `cn()` helper in `lib/utils.ts` (clsx + tailwind-merge). Never hand-concatenate class strings.
- UI primitives in `components/ui/*` wrap Radix and use `class-variance-authority`. Reuse them — do not re-style raw `<button>`/`<input>`.

## Logging

- Backend: NestJS `Logger` only. Never `console.log` in a request path.
- Frontend: no `console.log` in committed components. Surface errors through the toast/error UI, not the console.
