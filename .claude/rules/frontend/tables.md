# Rule — Tables & Lists (Admin)

Admin surfaces are table-heavy (products, orders). Lists must be paginated, server-driven, and never block on the slowest row.

## Data flow

- Tables read **server-paginated** data — never fetch the whole collection and slice client-side. The backend returns `PaginatedResponse<T>` (`items`, `total`, `page`, `limit`, `totalPages`); the table renders `items` and drives a pager off `total`/`totalPages`.
- Page, page size, search, and status filters live in the **URL search params**, so a view is shareable and survives refresh. Changing a filter updates the query string, which feeds the data hook.
- Use the established fetch tool for the surface: admin lists use TanStack Query (`lib/adminOrders.ts`, `lib/adminProducts.ts`).

## Rendering

- Three explicit states, always: **loading** (skeleton rows, not a spinner that shifts layout), **empty** ("No orders yet" with context), **error** (server message + retry).
- Semantic `<table>`/`<thead>`/`<tbody>` with `<th scope="col">`. Do not fake a table with divs — it breaks screen readers and the `accessibility-reviewer` will flag it.
- Status is shown via the shared badge component (`OrderStatusBadge`), color-coded by `OrderStatus`, never a raw string.
- Row actions (status update dropdown, edit/delete) are real buttons/Radix menus with accessible names.

## Mutations from a table

- A status change or delete is optimistic-friendly but must reconcile: after the mutation resolves, invalidate the list query so totals/derived counts stay correct. On failure, roll back and toast the server message.
- Destructive actions (delete product) confirm first via a Radix dialog; never delete on a single click.
- The status dropdown only offers **legal** next states — mirror the backend `ORDER_STATUS_TRANSITIONS` so the UI can't request a transition the API will reject.
