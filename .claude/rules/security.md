# Rule — Security (non-negotiable)

These mirror the hard constraints in `CLAUDE.md`. The `security-reviewer` agent blocks any diff that breaks one. There are no exceptions "to keep it simple."

## Authentication & secrets

- **Passwords:** `bcryptjs.hash(password, 12)`. Never store, log, or return plaintext. `passwordHash` is `@Exclude()`d on the `User` entity and stripped by `ClassSerializerInterceptor` — never add it back to a response DTO.
- **JWT:** signed with `process.env.JWT_SECRET` via `ConfigService`. Never hardcode a secret, never put it in a response, never default it to a literal in code.
- **Token transport:** the JWT lives in an **httpOnly cookie** set by the API. The frontend never reads it from `localStorage`. The Axios client uses `withCredentials: true`; do not add an `Authorization` header from client-side storage.
- **Secrets never touch git.** Read every secret from `ConfigService`. `.env` is git-ignored; only `.env.example` is committed. (A pre-tool hook blocks edits to `.env` — see `.claude/hooks/`.)

## Authorization

- **Ownership is derived from the JWT, never from input.** Customer endpoints filter by `user.id` from `@CurrentUser()`, never a `userId` query/body param. `findUserOrder(user.id, id)` is the reference: scoped to the owner, returns `NotFoundException` otherwise.
- **Admin surfaces are guarded at the class level.** Every `admin/*` controller carries `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` on the class, not per-route. See `AdminOrdersController`.
- **Frontend middleware mirrors the backend.** `middleware.ts` must check `role === ADMIN` for `/admin/*` (not merely "authenticated") and gate `/cart`, `/checkout`, `/orders` behind authentication. The middleware is defense-in-depth, never the only check — the API guard is authoritative.

## Data integrity (security-adjacent)

- **Totals are computed server-side** from live product prices at order time. Never trust `subtotal`/`tax`/`total` from the client.
- **Stock decrement is atomic:** `UPDATE products SET stock_quantity = stock_quantity - :qty WHERE id = :id AND stock_quantity >= :qty`; if `affected === 0` throw `ConflictException`. Never read-then-write.
- **Price snapshot:** copy `product.price → unitPrice` and `product.name → productName` onto `OrderItem` at creation. Historical orders never dereference the live product.

## Output hygiene

- The global exception filter is the only error formatter; no raw stack traces reach the client.
- Input is validated by DTOs with `whitelist`/`forbidNonWhitelisted` so unknown fields are stripped, not silently persisted.
- Stripe webhooks verify the signature against `STRIPE_WEBHOOK_SECRET` over the **raw** body — never the parsed JSON.
