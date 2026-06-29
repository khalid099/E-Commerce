# CLAUDE.md — ShopHive E-Commerce Platform

This file is the persistent context for every Claude Code session on this project.
Read it fully before touching any file. Update the **Build Status** section as work completes.

---

## Project Identity

**Name:** ShopHive
**Type:** Full-stack e-commerce — customer storefront + admin panel, single shared API
**Assessment:** Timed full-stack developer assessment (~5–6 hrs). Evaluated on agentic workflow quality, correctness, security, and design coherence. Git history is reviewed — commit after every feature.
**Repo root:** monorepo at `d:\E-Commerce\`

---

## Monorepo Layout

```
apps/backend/     @ecommerce/backend   — NestJS 10, TypeORM, PostgreSQL
apps/frontend/    @ecommerce/frontend  — Next.js 14 App Router, Tailwind, Radix UI
packages/shared-types/  @ecommerce/shared-types — TypeScript types, no runtime
docs/             architecture.md, deployment.md
NOTES.md          Agent workflow log — update after every session
README.md         Setup and run instructions — already written, do not rewrite
```

All commands run from repo root via Turborepo:
- `npm run dev` — starts both apps
- `npm run seed` — seeds the database
- `npm test` — all workspace tests

---

## Tech Stack (pinned)

| Layer | Choice | Key packages |
|---|---|---|
| Backend runtime | Node.js 20, TypeScript 5 | NestJS 10, TypeORM 0.3, pg |
| Auth | JWT, bcryptjs | @nestjs/jwt, @nestjs/passport, passport-jwt |
| Validation | class-validator + class-transformer | (backend); zod + react-hook-form (frontend) |
| Frontend | Next.js 14 App Router | React 18, TypeScript 5 |
| Styling | Tailwind CSS 3 + Radix UI | lucide-react, class-variance-authority, clsx |
| State | Zustand 4 (client) + TanStack Query 5 (server) | |
| Payments | Stripe test mode | stripe (backend), @stripe/stripe-js (frontend) |
| API docs | Swagger | @nestjs/swagger |

**Do not add packages not listed here without explicit instruction.**

---

## Non-Negotiable Rules

These are hard constraints. Never violate them regardless of how much simpler the alternative seems.

### Security
- **Passwords** — always `bcryptjs.hash(password, 12)`. Never store plain text. Never log passwords.
- **JWT** — signed with `process.env.JWT_SECRET`. Never hardcode a secret. Never expose the secret in responses.
- **httpOnly cookie** — on the frontend, store the JWT in a `httpOnly` cookie set by the API response, not `localStorage`.
- **Ownership checks** — every customer-facing endpoint that returns user data (cart, orders) must filter by `userId` from the JWT, never from a query param. A customer must never be able to read another customer's data.
- **Admin guard** — every `/admin/*` route and every admin API endpoint must be protected by both `JwtAuthGuard` and `RolesGuard(UserRole.ADMIN)`. Apply at controller level, not just route level.
- **No raw stack traces** — the global exception filter must catch all unhandled exceptions. Never let NestJS default error responses reach the client in production format with stack traces.
- **Secrets** — never commit `.env`. Never hardcode values that belong in env vars. Always read from `ConfigService`.

### Data Integrity
- **Price snapshot** — when creating an `OrderItem`, copy `product.price` into `unitPrice` and `product.name` into `productName` on the `OrderItem` entity. Never reference the product's current price for historical orders.
- **Stock decrement** — use an atomic SQL update: `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`. Check `affected` rows — if 0, throw `ConflictException('Insufficient stock')`. Never do a read-then-write.
- **Order total** — always compute `subtotal`, `tax`, `total` on the server at order creation time from the actual product prices. Never trust totals sent from the client.
- **Cart ownership** — a user has exactly one cart (unique constraint on `userId`). Upsert, never create duplicates.

### Code Quality
- **No `any`** — use proper types. Import from `@ecommerce/shared-types` for shared shapes.
- **No commented-out code** — remove it, don't comment it.
- **No `console.log` in production paths** — use NestJS `Logger` in backend, nothing in frontend components.
- **DTOs for every endpoint** — every request body and query param must go through a DTO with `class-validator` decorators on the backend.
- **Response shape** — all API responses use the `ApiResponse<T>` wrapper from `shared-types`. All paginated responses use `PaginatedResponse<T>`.
- **`DB_SYNCHRONIZE=true` is dev-only** — never reference synchronize:true in a production config or Dockerfile runner stage.

---

## Data Model Reference

Full schema is in `README.md`. Key relationships:

```
Users (1) ──── (1) Carts ──── (N) CartItems ──── (N) Products
Users (1) ──── (N) Orders ──── (N) OrderItems
Orders (1) ──── (1) Payment (via stripePaymentIntentId)
Products (N) ──── (1) Categories
Users (1) ──── (N) ProductViews ──── (N) Products
```

**Entity naming convention:** singular PascalCase (`User`, `Product`, `CartItem`, `OrderItem`).
**Column naming:** camelCase in TypeScript, snake_case in DB (TypeORM default).

---

## Backend Patterns

### Module structure (every feature follows this)
```
src/feature/
  feature.module.ts       — imports, exports, providers
  feature.controller.ts   — routes, guards, decorators only; no business logic
  feature.service.ts      — all business logic; inject repositories here
  dto/
    create-feature.dto.ts
    update-feature.dto.ts
    query-feature.dto.ts  (if GET has query params)
  entities/
    feature.entity.ts
```

### Controller pattern
```typescript
@Controller('feature')
@UseGuards(JwtAuthGuard)           // at class level if all routes need auth
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  @ApiOperation({ summary: '...' })
  findAll(@CurrentUser() user: User, @Query() query: QueryFeatureDto) {
    return this.featureService.findAll(user.id, query);
  }
}
```

### Service pattern
```typescript
@Injectable()
export class FeatureService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
  ) {}
}
```

### DTO pattern
```typescript
export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;
}
```

### Global exception filter (already planned in `src/common/filters/`)
- Catches `HttpException` → returns `{ success: false, statusCode, message, timestamp, path }`
- Catches unknown errors → returns `500` with generic message, logs full error internally
- Never expose stack traces to the client

### Custom decorators
- `@CurrentUser()` — extracts the authenticated user from `req.user` (set by JwtStrategy)
- `@Roles(UserRole.ADMIN)` — used with `RolesGuard`

---

## Frontend Patterns

### Route groups
- `(storefront)` — public + authenticated customer pages, uses `StorefrontLayout`
- `(auth)` — login/register, no auth required, no nav
- `admin` — admin-only, uses `AdminLayout`, middleware-enforced

### Middleware (`src/middleware.ts`)
```typescript
// Protect /admin/* — redirect to /login if not ADMIN
// Protect /cart, /checkout, /orders — redirect to /login if not authenticated
```

### API client (`src/lib/api.ts`)
- Single Axios instance with `baseURL = process.env.NEXT_PUBLIC_API_URL`
- Request interceptor: attach JWT from cookie to `Authorization: Bearer <token>`
- Response interceptor: on 401, clear auth store and redirect to `/login`

### Data fetching pattern
- Server Components for public read paths (catalog, product detail) — better SEO, smaller client bundle
- Client Components + TanStack Query for user-specific data (cart, orders) — needs auth state
- Zustand for cart optimistic updates and auth session

### Component file convention
```
components/storefront/ProductCard.tsx   — named export, no default
components/admin/OrderTable.tsx
components/ui/Button.tsx               — Radix primitive wrapper
```

### Form pattern
```typescript
const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

---

## API Endpoint Reference

Base: `http://localhost:3001/api`

### Auth (no guard)
- `POST /auth/register` — body: `{ email, password, firstName, lastName }`
- `POST /auth/login` — body: `{ email, password }` → sets httpOnly cookie + returns user
- `GET /auth/me` — JwtAuthGuard → returns current user

### Products (public GET, admin mutations)
- `GET /products` — query: `search`, `categoryId`, `minPrice`, `maxPrice`, `sortBy`, `page`, `limit`
- `GET /products/:id`
- `POST /admin/products` — Admin
- `PUT /admin/products/:id` — Admin
- `DELETE /admin/products/:id` — Admin
- `POST /admin/products/:id/image` — Admin, multipart

### Categories
- `GET /categories` — public
- `POST /admin/categories` — Admin

### Cart (Customer)
- `GET /cart`
- `POST /cart/items` — `{ productId, quantity }`
- `PATCH /cart/items/:itemId` — `{ quantity }`
- `DELETE /cart/items/:itemId`
- `DELETE /cart`

### Orders
- `POST /orders` — Customer, `{ shippingAddress, paymentIntentId }`
- `GET /orders` — Customer (own orders only)
- `GET /orders/:id` — Customer (ownership checked)
- `GET /admin/orders` — Admin (all orders, paginated)
- `PATCH /admin/orders/:id/status` — Admin, `{ status: OrderStatus }`

### Payments
- `POST /payments/create-intent` — Customer, `{ amount }` → `{ clientSecret, paymentIntentId }`
- `POST /payments/webhook` — raw body, Stripe signature verified

### Recommendations
- `GET /recommendations` — Customer
- `POST /recommendations/track` — optional auth, `{ productId, sessionId }`

### Admin Dashboard
- `GET /admin/dashboard` — Admin → `DashboardStats`

---

## Build Order

Work in this exact sequence. Each item is a commit. Do not skip ahead.

### Phase 1 — Foundation
- [ ] **1. Database entities** — create all TypeORM entities (`User`, `Category`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`, `ProductView`). Verify with `DB_SYNCHRONIZE=true` that tables generate correctly.
- [x] **2. Seed script** — `src/database/seeds/seed.ts`. 8 categories, 33 products (the 8 Maison design products + catalog depth), 1 admin, 1 customer. Idempotent (upsert by slug/email/name). Seeds real imagery, sale prices, ratings, colours and sizes so the storefront renders the design's data.
- [ ] **3. Config module** — `src/config/configuration.ts`. All env vars validated with Joi or class-validator at startup. App refuses to start if required vars are missing.
- [ ] **4. Common module** — global exception filter, `@CurrentUser` decorator, `JwtAuthGuard`, `RolesGuard`.

### Phase 2 — Auth
- [ ] **5. Auth module** — `register`, `login`, JWT strategy. Passwords hashed with bcryptjs 12 rounds. `login` sets httpOnly cookie and returns user object. `GET /auth/me` returns current user.

### Phase 3 — Catalog (read paths first)
- [ ] **6. Categories module** — `GET /categories`, `POST /admin/categories`.
- [x] **7. Products module** — `GET /products` with filtering/search/sort/pagination, `GET /products/:id`, admin CRUD + image upload.

### Phase 4 — Cart & Checkout
- [ ] **8. Cart module** — full CRUD, ownership enforced, line totals computed in service.
- [ ] **9. Orders module** — create order from cart (atomic stock decrement, price snapshot, clear cart on success), customer order history, admin order list + status update.
- [ ] **10. Payments module** — Stripe PaymentIntent creation, webhook handler (payment_intent.succeeded → order PROCESSING).

### Phase 5 — Admin & Recommendations
- [x] **11. Admin dashboard** — `GET /admin/dashboard` aggregates.
- [ ] **12. Recommendations module** — category affinity + co-view fallback.

### Phase 6 — Frontend
- [ ] **13. API client + auth store** — Axios instance, Zustand authStore, middleware.
- [ ] **14. Auth pages** — login, register forms.
- [ ] **15. Storefront — catalog** — product grid, search, filters, pagination.
- [ ] **16. Storefront — product detail** — full info, add to cart, "You might also like".
- [ ] **17. Storefront — cart** — line items, totals, quantity updates.
- [ ] **18. Storefront — checkout** — Stripe Elements, place order, success page.
- [ ] **19. Storefront — orders** — order history list, order detail.
- [x] **20. Admin — products** — CRUD table, create/edit form, image upload.
- [x] **21. Admin — orders** — all orders table, status update dropdown.
- [x] **22. Admin — dashboard** — stats cards + revenue line chart (Recharts).

### Phase 7 — Tests & Polish
- [ ] **23. Backend unit tests** — AuthService, OrdersService (stock validation, total), CartService.
- [ ] **24. Backend E2E tests** — register→login→profile, full checkout flow.
- [ ] **25. Frontend component tests** — ProductCard, CartSummary.
- [ ] **26. NOTES.md** — fill all sections: agent workflow, mistakes caught, design decisions.

---

## Commit Convention

```
feat: auth module — register, login, JWT guard, @CurrentUser decorator
feat: products — catalog with search, filter, sort, pagination
feat: cart — add/update/remove items, line totals, ownership guard
feat: orders — creation with atomic stock check, price snapshot
feat: payments — Stripe PaymentIntent + webhook handler
feat: admin dashboard — revenue, order counts, top products
feat: recommendations — category affinity + co-view algorithm
feat: frontend auth — login/register pages, cookie handling, middleware
feat: frontend catalog — product grid, filters, search, pagination
feat: frontend cart — cart page, optimistic updates
feat: frontend checkout — Stripe Elements, order confirmation
feat: frontend admin — product CRUD, order management, dashboard chart
test: backend unit — AuthService, OrdersService, CartService
test: backend e2e — checkout flow, auth roundtrip
test: frontend components — ProductCard, CartSummary
```

One commit per feature. Never bundle multiple features into one commit.

---

## Things the Agent Commonly Gets Wrong

Watch for these and correct them immediately:

1. **Forgetting ownership checks** — `ordersRepo.findOne({ where: { id } })` without `userId` lets any authenticated user read any order. Always add `userId: user.id` to the where clause.

2. **`DB_SYNCHRONIZE=true` in production** — must be `false` in `docker-compose.prod.yml` and the production Dockerfile runner stage.

3. **Computing totals on the client** — cart totals and order totals must be computed server-side. The client displays what the server returns.

4. **Missing `@UseGuards` on admin controllers** — applying guards only to specific routes when the entire controller should be admin-only. Apply at class level.

5. **Not clearing the cart after order creation** — after a successful order, the cart items must be deleted.

6. **Race condition on stock** — `findOne` → check stock → `save` is a read-then-write race. Always use atomic SQL update.

7. **Exposing `passwordHash` in responses** — use `@Exclude()` on the entity field and `ClassSerializerInterceptor` globally, or manually omit it in the DTO response.

8. **Frontend: storing JWT in localStorage** — must be httpOnly cookie, never localStorage.

9. **Not validating query params** — `GET /products?page=-1&limit=999` must be handled. Use `ParsePositiveIntPipe` or DTO with `@Min(1)` / `@Max(50)`.

10. **Admin routes accessible to customers on the frontend** — the Next.js middleware must check `role === ADMIN`, not just `isAuthenticated`.

---

## Environment Variables Cheat Sheet

### Backend (`apps/backend/.env`)
```
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ecommerce_db
DB_SYNCHRONIZE=true
JWT_SECRET=dev_secret_minimum_32_characters_long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
UPLOAD_DEST=./uploads
```

### Frontend (`apps/frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Seeded Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ecommerce.com` | `Admin@123456` |
| Customer | `customer@ecommerce.com` | `Customer@123456` |

---

## Stripe Test Cards

| Scenario | Card number |
|---|---|
| Success | `4242 4242 4242 4242` |
| Auth required | `4000 0025 0000 3155` |
| Declined | `4000 0000 0000 9995` |

Use any future expiry date, any CVC.

---

## What Is and Is Not Implemented

### Not yet started (as of last session)
- All feature code — entities, services, controllers, frontend pages
- The scaffold (directories, package.json, configs, Dockerfiles) is complete

### Already done — do not redo
- Monorepo structure (apps/backend, apps/frontend, packages/shared-types)
- All config files: tsconfig, eslintrc, prettierrc, nest-cli.json, next.config.ts, tailwind.config.ts
- package.json for all workspaces with correct dependencies
- Turborepo pipeline (turbo.json)
- Docker Compose dev + prod
- Dockerfiles for both apps
- README.md (complete — do not modify unless correcting errors)
- docs/architecture.md, docs/deployment.md
- NOTES.md (stub — fill sections as work progresses)
- .env.example files
- shared-types: all type definitions in packages/shared-types/src/

---

## Session Handoff Protocol

At the end of every session, before stopping:
1. Commit everything completed with a clear commit message
2. Update the **Build Order** checkboxes above (tick completed items)
3. Add a bullet to `NOTES.md` describing what was built, any agent mistakes caught, and what's next
4. Push to `origin main`
