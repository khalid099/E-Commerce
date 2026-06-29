# Rule — React & Next.js Components

Next.js 14 App Router, React 18, TypeScript. Server Components by default; client only where interactivity demands it.

## Server vs Client

- **Default to Server Components.** Public read paths (product catalog, product detail) render on the server for SEO and a smaller client bundle.
- Add `'use client'` only when the component needs state, effects, event handlers, or browser APIs (auth/cart stores, forms, charts, anything using `useGetProductsQuery`).
- Keep the client boundary low in the tree. A page can be a Server Component that renders a small `'use client'` island (e.g. `ProductsContent`) rather than making the whole page client.

## Component conventions

- **Named exports, no default** for components (`export function ProductCard(...)`). Only `page.tsx`/`layout.tsx` default-export (Next requirement).
- Folder by domain: `components/storefront/*`, `components/admin/*`, `components/ui/*` (Radix wrappers), `components/layout/*`.
- Props are typed with an explicit `interface`; reuse shared shapes from `@ecommerce/shared-types` (`Product`, `Order`, …) — never redefine them.
- Compose classes with `cn()` from `lib/utils.ts`. Variants come from `class-variance-authority` in the `ui/` primitive, not ad-hoc ternaries in the consumer.

## State & effects

- Derive, don't duplicate. If a value can be computed from props/store, compute it in render — don't mirror it into `useState`.
- No data fetching in `useEffect` for cacheable server data — that is RTK Query's / TanStack Query's job (see [data-fetching.md](data-fetching.md)).
- Loading and error states are mandatory for every async view. Use the `ui/skeleton` primitive for loading; render the server error message for failures.
- Keys on lists are stable entity ids, never array index.

## Accessibility (baseline; `accessibility-reviewer` enforces)

- Interactive elements are real `<button>`/`<a>`/Radix primitives — never a clickable `<div>`.
- Every input has an associated `<label>` (Radix `Label` + `htmlFor`).
- Images carry meaningful `alt`; decorative images use `alt=""`.
- Focus is visible and never trapped outside a dialog; dialogs return focus on close.
