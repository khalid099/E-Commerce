# Assessment Notes

## Agent Workflow

<!-- Document which agentic tool(s) you used, how you scoped tasks, how you structured prompts,
     and any context files (CLAUDE.md, reusable prompts) you created. -->

**Tool used:** Claude Code (Anthropic CLI)

**How tasks were scoped:**
...

**Context management:**
...

## Where the Agent Helped and Where It Failed

<!-- This is one of the most important sections. Be honest and specific. -->

### Agent wins

...

### Agent mistakes / misses

...

### How mistakes were caught

...

## Supervision & Verification

<!-- How did you check output rather than accepting it blind? -->

...

## Design Workflow

<!-- Which design agent(s) used, how you directed them, how much iteration. -->

...

## Assumptions

<!-- Every decision made on anything ambiguous, including the open-ended requirement. -->

### Stack choice rationale

- **NestJS over Express** — module architecture enforces separation of concerns; Swagger integration is first-class.
- **PostgreSQL over MongoDB** — relational model fits order/cart/product relationships. ACID guarantees matter for stock and payment state.
- **JWT in httpOnly cookie** — mitigates XSS vs. localStorage. Trade-off: requires CSRF protection on state-mutating endpoints (see CSRF note in `architecture.md`).
- **npm workspaces + Turborepo** — lightweight monorepo tooling; no Nx configuration overhead. Turborepo's remote caching is available if needed.

### Open-ended requirement — Product Recommendations

**Interpretation:** "Relevant" means _behavioural similarity_ — products a customer is likely to want based on what they've looked at and ordered, not collaborative filtering across users (which requires a critical mass of data that doesn't exist on a fresh install).

**Implementation:**
1. Category affinity — rank categories by engagement (views × 1 + purchases × 3), surface products from high-affinity categories the user hasn't ordered.
2. Co-view fallback — for sparse users, surface products frequently viewed in the same session as the current product (24-hour rolling window over `product_views`).

**Why not collaborative filtering:** Cold start problem. With a seeded dataset of ~40 products and 2 users there's insufficient signal. The approach above degrades gracefully to "popular in this category" for new users.

## Trade-offs & Scope

### Fully built

...

### Simplified / mocked

- **Product image (admin)** — _both_ approaches supported, documented choice: (1) paste an **image URL** on the create/edit form, or (2) **upload a file** (`POST /admin/products/:id/image`, multipart, ≤5MB, jpeg/png/webp/gif). Uploads are stored on the local filesystem (`apps/backend/uploads/`, randomised UUID filenames to avoid collisions/traversal) and served statically at `/uploads` via the Express adapter; the stored `imageUrl` is the absolute backend URL, which is allowlisted in `next.config` `remotePatterns` so the storefront `<Image>` renders it. A selected file always wins over the URL field. Admin table/preview use a plain `<img>` so arbitrary external URLs render without next/image remote-pattern config. Note: external image URLs render in the optimized storefront `<Image>` only if their host is added to `remotePatterns`. In production: S3 presigned URL flow.
- **Delete is a soft delete** — `DELETE /admin/products/:id` sets `isActive=false` rather than removing the row, so historical orders keep referencing the product (price snapshot is on `OrderItem`, but the FK stays valid). The admin list shows inactive products with a badge and the edit form has an "Active" toggle to restore them.
- **Order status lifecycle** — admin status updates are validated server-side against an explicit transition map (`ORDER_STATUS_TRANSITIONS` in `shared-types`): `PENDING → PROCESSING → SHIPPED → DELIVERED`, with `PENDING`/`PROCESSING → CANCELLED`. `DELIVERED`/`CANCELLED` are terminal. Invalid jumps return `400`. The admin UI only offers the current status plus its allowed next states in the dropdown, so the rule is enforced on both ends rather than trusting the client. Stripe webhooks remain the only path that auto-advances `PENDING → PROCESSING`.
- **Admin dashboard** — `GET /admin/dashboard` aggregates four headline stats (total sales, orders, products, customers), order counts by status, the top 5 best-selling products, and a 14-day revenue trend. Revenue, top-sellers, and the trend **exclude CANCELLED orders** (no realised sale); the status breakdown and order count include every order so the operational view stays complete. The trend is emitted as a continuous 14-day series (gaps filled with £0) so the chart has no holes on quiet days. Frontend renders the trend as a Recharts area chart; status breakdown is a lightweight CSS bar chart and top products a ranked list. Caught one bug in self-review: date keys for the trend were built with `toISOString()` (UTC), which shifted the window back a day in non-UTC timezones and dropped today — fixed to use local date parts so the series ends on the current day and matches Postgres `TO_CHAR`. Verified end-to-end against seeded orders (cancelled-exclusion and date window both confirmed).
- **Stripe webhooks** — happy path only (payment confirmed → order moves to PROCESSING). Dispute/refund paths not handled.
- **Email** — no transactional emails. Confirmation is in-app only.
- **Refresh tokens** — 7-day JWT expiry, no rotation. A proper implementation would use short-lived access tokens + rotating refresh tokens stored in the DB.

### What I'd do with more time

1. Refresh token rotation
2. S3 image storage
3. Full-text search (PostgreSQL `tsvector` + GIN index)
4. Playwright E2E smoke tests for the checkout journey
5. Rate limiting on auth endpoints (`@nestjs/throttler`)
6. Admin audit log
