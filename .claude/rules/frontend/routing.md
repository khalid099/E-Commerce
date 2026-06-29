# Rule — Routing & Middleware

App Router with route groups. Authorization is enforced twice: in middleware (UX/defense-in-depth) and in the API guards (authoritative).

## Route groups

```
app/
  (auth)/        login, register      — no nav, no auth required, uses (auth)/layout
  (storefront)/  catalog, product, cart, checkout, orders — StorefrontLayout + Navbar
  admin/         dashboard, products, orders               — AdminLayout, ADMIN only
```

- A route group `(name)` shares a layout without adding a URL segment.
- Public, customer, and admin surfaces are physically separated so guards apply to whole subtrees.

## Middleware (`src/middleware.ts`)

- `/admin/*` → require `role === ADMIN`. Checking only "authenticated" is the classic bug — a logged-in customer must be redirected, not allowed.
- `/cart`, `/checkout`, `/orders` → require authentication; redirect unauthenticated users to `/login` (preserve intended path where practical).
- Middleware reads the session/cookie; it is **not** the security boundary — the backend `RolesGuard` is. Never weaken an API guard because "the middleware already checks it."

## Navigation

- Use `next/link` for internal navigation and `next/navigation`'s `useRouter`/`redirect` for programmatic moves. No `window.location` except in the auth-failure hard-redirect already centralized in `lib/api.ts`.
- Dynamic segments (`orders/[id]`, `products/[id]/edit`) read params via the page props; validate/guard ownership on the server, never assume the URL id belongs to the user.
- After a mutation that changes server state shown elsewhere (e.g. admin status update), invalidate the relevant query cache or `router.refresh()` — do not leave stale data on screen.
