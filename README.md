# ShopHive — Full-Stack E-Commerce Platform

A complete e-commerce system built with **NestJS** and **Next.js 14**, featuring a customer storefront, an admin panel, and a single shared REST API. Built as part of a full-stack developer assessment.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack & Rationale](#tech-stack--rationale)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Prerequisites](#prerequisites)
- [Setup — Backend](#setup--backend)
- [Setup — Frontend](#setup--frontend)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Seeded Credentials](#seeded-credentials)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Features](#features)
- [Open-Ended Requirement — Product Recommendations](#open-ended-requirement--product-recommendations)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [What's Next](#whats-next)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
└──────────────┬────────────────────────────┬─────────────────────┘
               │                            │
   ┌───────────▼──────────┐    ┌────────────▼──────────┐
   │   Storefront (/)     │    │   Admin Panel (/admin) │
   │   Next.js 14 App     │    │   Next.js 14 App       │
   └───────────┬──────────┘    └────────────┬───────────┘
               │                            │
               └──────────────┬─────────────┘
                              │  REST API (JSON)
                   ┌──────────▼───────────┐
                   │   NestJS API Server  │
                   │   localhost:3001     │
                   └──────────┬───────────┘
                              │
                   ┌──────────▼───────────┐
                   │    PostgreSQL DB      │
                   │    localhost:5432     │
                   └──────────────────────┘
```

Both the storefront and admin panel are route groups within a single Next.js application (`e-commerce-fe`). They share components, state management, and the API client — but are separated by route groups and middleware-enforced role guards. The backend is a single NestJS application (`e-commerce-be`) exposing a versioned REST API with JWT authentication and role-based access control.

---

## Tech Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| **Backend** | NestJS (Node.js, TypeScript) | Module-based architecture enforces separation of concerns out of the box. Decorators make auth guards, validation pipes, and Swagger docs ergonomic. Strong TypeScript alignment with the frontend. |
| **Frontend** | Next.js 14 (App Router) | Server Components reduce client bundle size for the catalog pages. App Router's nested layouts are ideal for the admin panel shell vs. storefront shell. |
| **Database** | PostgreSQL + TypeORM | Relational model fits order/cart/product relationships well. TypeORM's decorators integrate cleanly with NestJS DI. |
| **Auth** | JWT (access token in `Authorization` header, refresh logic planned) | Stateless, scales horizontally. Stored in `httpOnly` cookies on the frontend to mitigate XSS. |
| **State** | Zustand (client) + TanStack Query (server) | Zustand for cart and auth session (small, synchronous slices). React Query for server data — caching, background refetch, and optimistic mutations for free. |
| **Payments** | Stripe Test Mode | Industry standard. Test mode means no real charges. `stripe-js` on the frontend, Stripe SDK on the backend. Webhook handling for async confirmation. |
| **Styling** | Tailwind CSS + Radix UI primitives | Tailwind for utility-first layout. Radix for accessible, unstyled component primitives — the visual identity is our own, not a UI kit's. |

---

## Data Model

```
Users
  id, email, passwordHash, firstName, lastName
  role: ADMIN | CUSTOMER
  createdAt, updatedAt

Categories
  id, name, slug, description
  createdAt, updatedAt

Products
  id, name, description, price (decimal), imageUrl
  stockQuantity (int), categoryId → Categories
  createdAt, updatedAt

Carts
  id, userId → Users (unique)
  createdAt, updatedAt

CartItems
  id, cartId → Carts, productId → Products
  quantity (int)
  createdAt, updatedAt

Orders
  id, userId → Users
  status: PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED
  subtotal, tax, shippingCost, total (all decimal)
  shippingAddress (jsonb)
  stripePaymentIntentId
  createdAt, updatedAt

OrderItems
  id, orderId → Orders, productId → Products
  productName (snapshot), unitPrice (snapshot)
  quantity (int), lineTotal (decimal)
  createdAt, updatedAt

ProductViews                ← drives the recommendation engine
  id, userId → Users, productId → Products
  sessionId (for anonymous tracking)
  viewedAt

Reviews (planned)
  id, userId, productId, rating (1–5), body
  createdAt, updatedAt
```

> **Snapshotting on `OrderItems`**: `productName` and `unitPrice` are copied at order creation time. This ensures historical orders remain accurate even if a product is later edited or deleted.

---

## API Reference

Base URL: `http://localhost:3001/api`  
Interactive docs (Swagger): `http://localhost:3001/api/docs`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new customer |
| `POST` | `/auth/login` | — | Login, returns JWT access token |
| `GET` | `/auth/me` | Bearer | Return current user profile |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/products` | — | Paginated catalog. Query: `search`, `categoryId`, `minPrice`, `maxPrice`, `sortBy` (`price_asc`, `price_desc`, `newest`), `page`, `limit` |
| `GET` | `/products/:id` | — | Single product detail |
| `POST` | `/admin/products` | Admin | Create product |
| `PUT` | `/admin/products/:id` | Admin | Update product |
| `DELETE` | `/admin/products/:id` | Admin | Delete product |
| `POST` | `/admin/products/:id/image` | Admin | Upload product image (multipart) |

### Categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | — | All categories |
| `POST` | `/admin/categories` | Admin | Create category |

### Cart

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/cart` | Customer | Get current user's cart with line totals |
| `POST` | `/cart/items` | Customer | Add item (body: `productId`, `quantity`) |
| `PATCH` | `/cart/items/:itemId` | Customer | Update quantity |
| `DELETE` | `/cart/items/:itemId` | Customer | Remove item |
| `DELETE` | `/cart` | Customer | Clear entire cart |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/orders` | Customer | Create order from cart (body: `shippingAddress`, `paymentIntentId`) |
| `GET` | `/orders` | Customer | Current user's order history |
| `GET` | `/orders/:id` | Customer | Single order detail |
| `GET` | `/admin/orders` | Admin | All orders (paginated, filterable by status) |
| `PATCH` | `/admin/orders/:id/status` | Admin | Update order status |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/create-intent` | Customer | Create Stripe PaymentIntent. Returns `clientSecret` |
| `POST` | `/payments/webhook` | — | Stripe webhook handler (raw body) |

### Recommendations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/recommendations` | Customer | Personalised product suggestions |
| `POST` | `/recommendations/track` | Optional | Record a product view (body: `productId`, `sessionId`) |

### Admin Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Admin | Aggregates: total revenue, order counts by status, top 5 products by units sold |

---

## Prerequisites

- **Node.js** >= 20.x (`node -v`)
- **npm** >= 10.x (`npm -v`)
- **PostgreSQL** >= 15 running locally (or via Docker)
- A **Stripe** account (free) with test mode keys

**Quick PostgreSQL via Docker** (optional):

```bash
docker run --name ecommerce-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

---

## Setup — Local Development (No Docker)

### 1. Install all workspace dependencies from the repo root

```bash
# From the repo root — installs deps for all apps and packages in one shot
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

Edit both files and fill in your secrets (DB credentials, Stripe keys, JWT secret).

### 3. Run both apps simultaneously (Turborepo)

```bash
# From the repo root — starts backend and frontend with hot-reload
npm run dev
```

Or run them individually:

```bash
# Backend only (terminal 1)
npm run dev --workspace=apps/backend

# Frontend only (terminal 2)
npm run dev --workspace=apps/frontend
```

The API will be available at `http://localhost:3001/api`.  
Swagger UI at `http://localhost:3001/api/docs`.  
Storefront at `http://localhost:3000`.

---

## Setup — Docker (Recommended for clean environment)

```bash
# 1. Copy and populate the root .env
cp .env.example .env

# 2. Start all services (postgres, backend, frontend) with hot-reload
npm run docker:dev
```

To seed after containers are up:

```bash
docker-compose exec backend npm run seed
```

---

## Environment Variables

### Backend (`e-commerce-be/.env`)

| Variable | Required | Example | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment |
| `PORT` | Yes | `3001` | API server port |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host |
| `DB_PORT` | Yes | `5432` | PostgreSQL port |
| `DB_USERNAME` | Yes | `postgres` | Database user |
| `DB_PASSWORD` | Yes | `your_password` | Database password |
| `DB_NAME` | Yes | `ecommerce_db` | Database name |
| `DB_SYNCHRONIZE` | Dev only | `true` | Auto-sync TypeORM schema (never use in production) |
| `JWT_SECRET` | Yes | `change_me_in_prod` | Must be a long random string in production |
| `JWT_EXPIRES_IN` | Yes | `7d` | Token lifetime |
| `STRIPE_SECRET_KEY` | Yes | `sk_test_...` | Stripe secret key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` | Stripe CLI webhook secret (for local dev) |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Allowed frontend origin |
| `UPLOAD_DEST` | Yes | `./uploads` | Local path for uploaded images |

### Frontend (`e-commerce-fe/.env.local`)

| Variable | Required | Example | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/api` | Backend API base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_test_...` | Stripe publishable key (test mode) |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Frontend URL |

---

## Database Seeding

The seed script populates the database with sample categories, products, one admin user, and one customer. Run it after the backend is configured:

```bash
cd e-commerce-be
npm run seed
```

Run from the repo root:

```bash
npm run seed
```

Or directly:

```bash
npm run seed --workspace=apps/backend
```

The seed creates:
- **8 product categories** (Electronics, Clothing, Books, Home & Garden, Sports, Beauty, Toys, Food)
- **40 sample products** spread across categories with realistic prices and stock levels
- **1 admin user** (credentials below)
- **1 customer user** with a pre-populated cart (credentials below)
- **3 sample orders** in various statuses for the customer

> Seeding is idempotent — running it twice will not create duplicates (it checks by email / name before inserting).

---

## Seeded Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ecommerce.com` | `Admin@123456` |
| **Customer** | `customer@ecommerce.com` | `Customer@123456` |

These can be overridden via the `SEED_ADMIN_*` and `SEED_CUSTOMER_*` env vars in `.env`.

---

## Running Tests

### Run all tests (from repo root)

```bash
# All unit tests across every workspace
npm test

# With coverage
npm run test:cov

# E2E tests (requires a running DB)
npm run test:e2e
```

### Run tests for a specific app

```bash
# Backend only
npm test --workspace=apps/backend
npm run test:e2e --workspace=apps/backend

# Frontend only
npm test --workspace=apps/frontend
```

**What's tested:**

| Area | Type | What's covered |
|---|---|---|
| `OrdersService` | Unit | Order creation, stock validation, total calculation |
| `AuthService` | Unit | Password hashing, JWT generation, login validation |
| `ProductsService` | Unit | Filtering, pagination logic, stock decrement |
| `CartService` | Unit | Add/update/remove, total computation |
| `RecommendationsService` | Unit | Scoring algorithm correctness |
| `POST /auth/login` | E2E | Full round-trip: register → login → get profile |
| `POST /orders` | E2E | Full checkout flow with stock validation |
| `ProductCard` | Component | Render, add-to-cart click, out-of-stock state |
| `CartSummary` | Component | Line totals, quantity updates, remove item |

---

## Project Structure

```
ecommerce-platform/                    # Monorepo root (npm workspaces + Turborepo)
│
├── apps/
│   ├── backend/                       # @ecommerce/backend — NestJS REST API
│   │   ├── src/
│   │   │   ├── auth/                  # JWT strategy, guards, login/register
│   │   │   ├── users/                 # User entity & service
│   │   │   ├── products/              # Product CRUD, filtering, pagination
│   │   │   ├── categories/            # Category management
│   │   │   ├── cart/                  # Cart & cart items
│   │   │   ├── orders/                # Order creation, status lifecycle
│   │   │   ├── payments/              # Stripe integration
│   │   │   ├── recommendations/       # Recommendation engine
│   │   │   ├── admin/dashboard/       # Analytics aggregations
│   │   │   ├── common/
│   │   │   │   ├── decorators/        # @CurrentUser, @Roles
│   │   │   │   ├── filters/           # Global exception filter
│   │   │   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   │   │   └── interceptors/      # Logging, response transform
│   │   │   ├── config/
│   │   │   └── database/seeds/        # Seed script
│   │   ├── test/                      # E2E tests
│   │   └── Dockerfile
│   │
│   └── frontend/                      # @ecommerce/frontend — Next.js 14
│       ├── src/
│       │   ├── app/
│       │   │   ├── (storefront)/      # Customer storefront route group
│       │   │   │   ├── page.tsx       # Home / product catalog
│       │   │   │   ├── products/[id]/ # Product detail
│       │   │   │   ├── cart/
│       │   │   │   ├── checkout/success/
│       │   │   │   └── orders/
│       │   │   ├── (auth)/            # Login & register pages
│       │   │   └── admin/             # Admin panel route group
│       │   │       ├── page.tsx       # Dashboard with charts
│       │   │       ├── products/      # Product management
│       │   │       └── orders/        # Order management
│       │   ├── components/
│       │   │   ├── ui/                # Radix-based design primitives
│       │   │   ├── layout/            # Header, Footer, AdminNav
│       │   │   ├── storefront/        # ProductCard, Filters, CartItem, etc.
│       │   │   └── admin/             # DataTable, StatusBadge, SalesChart
│       │   ├── hooks/                 # useAuth, useCart, useProducts
│       │   ├── lib/                   # Axios instance, auth helpers, utils
│       │   ├── store/                 # Zustand: authStore, cartStore
│       │   └── types/                 # App-specific type extensions
│       └── Dockerfile
│
├── packages/
│   └── shared-types/                  # @ecommerce/shared-types
│       └── src/                       # Consumed by both apps via workspace:*
│           ├── user.types.ts
│           ├── product.types.ts
│           ├── cart.types.ts
│           ├── order.types.ts
│           ├── api.types.ts
│           └── index.ts
│
├── docs/
│   ├── architecture.md
│   └── deployment.md
│
├── docker-compose.yml                 # Development (hot-reload, source mounts)
├── docker-compose.prod.yml            # Production (optimised images + nginx)
├── turbo.json                         # Turborepo build pipeline
├── package.json                       # npm workspaces root
├── .env.example
├── NOTES.md                           # Assessment notes (agent workflow, decisions)
└── README.md
```

---

## Features

### Customer Storefront

- [x] Product catalog with search, category filter, price range filter
- [x] Sort by price (asc/desc) and newest
- [x] Server-side pagination
- [x] Product detail page with image, stock indicator, and quantity selector
- [x] Shopping cart — add, update quantity, remove, line totals, order total
- [x] Cart persists across sessions for authenticated users
- [x] Checkout flow with Stripe test mode (card `4242 4242 4242 4242`)
- [x] Order confirmation page with order ID
- [x] Order history with status tracking
- [x] Signup and login
- [x] Protected routes — customers see only their own data

### Admin Panel

- [x] Product management — create, edit, delete, image upload
- [x] Order management — view all orders, update status through lifecycle
- [x] Dashboard — total revenue, order counts by status, top 5 products by sales
- [x] Revenue chart (line chart, last 30 days)
- [x] Role-based access control — admin routes locked at middleware and API level
- [x] Customer accounts cannot reach any `/admin/*` route or API endpoint

### Cross-Cutting

- [x] Input validation with `class-validator` (backend) and `zod` + `react-hook-form` (frontend)
- [x] Global exception filter — meaningful errors, correct HTTP codes, no stack traces in responses
- [x] Stock check at order creation — orders for out-of-stock quantities are rejected
- [x] Price snapshot on order items — historical accuracy guaranteed
- [x] Passwords hashed with `bcryptjs` (12 rounds)
- [x] JWT stored in `httpOnly` cookie — not accessible to JavaScript
- [x] Secrets in `.env` — never committed
- [x] Database seed script
- [x] Automated tests

---

## Open-Ended Requirement — Product Recommendations

**Requirement:** *Customers should be able to see product suggestions that are relevant to them.*

### Interpretation

"Relevant" was interpreted as **behavioural similarity** — products a customer is likely to want based on what they've looked at and bought, not collaborative filtering across users (which requires a critical mass of data). The algorithm has two tiers:

1. **Category affinity** — the customer's most-viewed and most-purchased categories are ranked by engagement score. Products from high-affinity categories that the customer hasn't already purchased are surfaced first.

2. **Product co-view fallback** — for new or sparse users, we surface products frequently viewed in the same session as the product the user is currently viewing. This is computed as a lightweight aggregate over the `ProductViews` table (a 24-hour rolling window).

**What tracks it:** Every product page view is recorded via `POST /recommendations/track` with the `productId` and a `sessionId` (cookie-based for anonymous users, user ID for authenticated users). The endpoint is fire-and-forget from the frontend — it does not block the page render.

**Where it surfaces:** A "You might also like" horizontal scroll tray appears below the product description on the product detail page, and a "Picked for you" section on the storefront homepage for authenticated users.

**Why not collaborative filtering?** With a small dataset and no existing user interaction history, a user-to-user similarity model would produce meaningless recommendations (cold start problem). The approach above degrades gracefully to "popular in this category" for new users and improves as they browse.

**What I'd do with more time:** Persist aggregated affinity scores asynchronously (a background job, not inline per-request), add a `Not interested` dismissal, and experiment with a lightweight matrix factorisation model once sufficient interaction data exists.

---

## Design Decisions & Trade-offs

### What's fully built
- Auth, catalog, cart, checkout, order creation, order history, admin CRUD, dashboard analytics, recommendations.

### What's simplified or mocked
- **Image upload**: stored to local filesystem (`/uploads`). In production this would be an S3 presigned URL flow. Documented in `NOTES.md`.
- **Payment webhooks**: the happy path (Stripe confirms payment → order status moves to `PROCESSING`) is wired. Dispute/refund webhooks are not handled.
- **Email notifications**: no transactional emails. Order confirmation is shown in-app only.
- **Refresh tokens**: JWTs have a 7-day expiry. A proper refresh token rotation strategy is described in `NOTES.md` but not implemented.
- **Search**: full-text search uses PostgreSQL `ILIKE`. A production system would use a dedicated search index (Elasticsearch or Postgres `tsvector` with GIN index).

### Key edge cases handled
- Ordering more than available stock → `409 Conflict`, stock is not decremented
- Product price changed between cart add and checkout → order records the price at checkout time (snapshot)
- Concurrent orders draining stock → database-level `stockQuantity` update uses an atomic decrement (`stockQuantity - quantity WHERE stockQuantity >= quantity`), not a read-then-write

---

## What's Next

Given more time, the next priorities would be:

1. **Refresh token rotation** — short-lived access tokens + rotating refresh tokens stored in the DB
2. **S3 image storage** — replace local disk with `@aws-sdk/client-s3` presigned URLs
3. **Full-text search** — PostgreSQL `tsvector` column with GIN index, or Typesense
4. **E2E test coverage** — Playwright smoke tests for the critical customer journey (register → browse → add to cart → checkout)
5. **Rate limiting** — NestJS `ThrottlerModule` on auth endpoints
6. **Admin audit log** — record who changed what and when on orders and products

---

## Notes

See `NOTES.md` for the full agent workflow documentation, design decisions, supervision approach, and session transcripts as required by the assessment brief.

---

*Built with Claude Code (Anthropic) as the primary agentic tool. See `NOTES.md` for the complete agent workflow narrative.*
