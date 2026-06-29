# Rule — Data Fetching & State

This app uses **three** state tools, each for a distinct job. Picking the wrong one is the most common frontend review finding. Match the tool to the data.

| Tool | Owns | Where |
|---|---|---|
| **RTK Query** (`@reduxjs/toolkit/query`) | Cacheable public catalog reads (products, categories) | `store/productsApi.ts`, `store/store.ts` |
| **Zustand** | Client session: auth user, cart contents/optimistic updates | `store/authStore.ts`, `store/cartStore.ts` |
| **TanStack Query** | User-specific server data needing auth (orders, admin lists) | hooks colocated with the feature |
| **Axios `api`** | The transport under mutations & auth calls | `lib/api.ts` |

## RTK Query (catalog)

- Define endpoints in `productsApi`; `transformResponse: (r) => r.data` unwraps the `{ success, data }` envelope so components receive the bare payload.
- Components consume the generated hooks (`useGetProductsQuery`, `useGetProductQuery`, `useGetCategoriesQuery`). Never hand-roll a `fetch` for data RTK Query already exposes.
- Query params are passed as the hook arg object (`ProductQueryParams`); filter/sort/page state lives in the URL search params and feeds the hook.

## Zustand (session)

- `authStore`: `user`, `fetchMe()`, `logout()`. Persisted under `shophive-auth`. The JWT itself is **never** stored here — it's an httpOnly cookie. Persisted state holds the user profile only, for instant UI; `fetchMe()` is the source of truth.
- `cartStore`: cart line items + optimistic add/update/remove. The server cart is authoritative; the store reconciles after each mutation resolves.
- Stores are `'use client'`. Read them with the hook; never import the store object into a Server Component.

## TanStack Query (authenticated reads)

- Use for orders history, order detail, admin order/product lists — data scoped to the user and gated by the cookie.
- Always render `isLoading` (skeleton) and `isError` (server message + retry). Set sensible `queryKey`s that include filters/page so the cache keys correctly.
- After a mutation, `invalidateQueries` the affected key rather than mutating cache by hand.

## Mutations & the envelope

- All mutations and auth calls go through the Axios `api` instance with `withCredentials: true` (sends the cookie). The response interceptor already handles global 401 → redirect; do not re-implement it.
- Server responses are `{ success, data }` (or the error envelope). Read with the `lib/errors.ts` helper. Never assume the raw body is the payload.
