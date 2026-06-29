# Context — Data Model

Reference for entity relationships and the invariants each carries. Full column detail is in `README.md`; this captures the rules that govern correctness.

## Relationships

```
User (1) ─── (1) Cart ─── (N) CartItem ─── (N) Product
User (1) ─── (N) Order ─── (N) OrderItem
Order (1) ─── (1) Payment   (via stripePaymentIntentId)
Product (N) ─── (1) Category
User (1) ─── (N) ProductView ─── (N) Product
```

Entity names: singular PascalCase. Columns: camelCase in TS → snake_case in DB.

## Invariants (enforced in services, checked by reviewers)

| Entity | Invariant |
|---|---|
| `User` | `passwordHash` bcrypt(12), `@Exclude()`d, never in a response |
| `Cart` | exactly one per `userId` (unique constraint); upsert, never duplicate |
| `CartItem` | line total computed server-side from current product price |
| `Order` | `subtotal`/`tax`/`total` computed server-side at creation from live prices; never trusted from client |
| `OrderItem` | **price snapshot** — `unitPrice` and `productName` copied from product at creation; historical orders never dereference the live product |
| `Product` | `stockQuantity` decremented via atomic conditional `UPDATE ... WHERE stock_quantity >= :qty`; money columns are `numeric` |
| `Order.status` | transitions constrained by `ORDER_STATUS_TRANSITIONS`; illegal transition → `ConflictException` |

## Order status lifecycle

```
PENDING ──▶ PROCESSING ──▶ SHIPPED ──▶ DELIVERED
   │             │
   └─────────────┴──▶ CANCELLED
DELIVERED, CANCELLED = terminal
```

The frontend status dropdown must offer only legal next states (mirror this map); the backend rejects anything else regardless.

## Ownership boundary
`Cart`, `Order`, `OrderItem`, `ProductView` are user-scoped. Every read/write of these filters by `userId` from the JWT (`@CurrentUser().id`) — never from a request param. A cross-user read returns `NotFoundException`, not a disclosure.
