---
name: scaffold-storefront-page
description: Scaffold a new Next.js 14 App Router page for the ShopHive storefront or admin panel, wired to the correct route group, layout, data-fetching tool, and states. Use when adding a frontend route under apps/frontend/src/app.
---

# Scaffold a Next.js page

Add a route that matches the existing pages and uses the right state tool for its data.

## Steps

1. **Pick the route group** (see `.claude/rules/frontend/routing.md`):
   - Public/customer browsing → `app/(storefront)/...`
   - Auth screens → `app/(auth)/...`
   - Admin → `app/admin/...` (and ensure `middleware.ts` gates it on `role === ADMIN`)

2. **Decide server vs client** (`.claude/rules/frontend/react.md`): page is a Server Component by default. If it needs interactivity/data hooks, render a small `'use client'` island (pattern: `ProductsContent`) rather than making the whole page client.

3. **Choose the data tool** (`.claude/rules/frontend/data-fetching.md`):
   - Catalog/category reads → RTK Query hooks (`useGetProductsQuery`, …).
   - Auth/cart session → Zustand stores.
   - Authenticated reads (orders, admin lists) → TanStack Query.
   - Mutations/auth → the Axios `api` instance.

4. **Build the three states** — every async view renders loading (skeleton matching final layout), empty (helpful), and error (server message + retry). No blank screens.

5. **Use the design system** — `components/ui/*` Radix primitives, `cn()` for classes, types from `@ecommerce/shared-types`. Forms → react-hook-form + zod (`.claude/rules/frontend/forms.md`). Tables → server-paginated, filters in URL (`.claude/rules/frontend/tables.md`).

6. **Verify** — `cd apps/frontend && npx tsc --noEmit` and `npm run build`. No `console.log`, no token in `localStorage`, no clickable `<div>`.

7. **Hand off to review** — `accessibility-reviewer`, `frontend-designer` for polish, `code-reviewer`. Do not commit; the human commits.
