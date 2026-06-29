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

- **Image upload** — stored to local filesystem (`apps/backend/uploads/`). In production: S3 presigned URL flow.
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
