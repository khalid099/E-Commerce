# Rule — TypeORM & Persistence

This project uses **TypeORM 0.3** against **PostgreSQL**. (The example workflow that inspired this folder used Drizzle — we do not. Ignore any Drizzle guidance.)

## Entities

- Singular PascalCase class names: `User`, `Product`, `CartItem`, `OrderItem`.
- camelCase properties → snake_case columns (TypeORM default naming). Do not hand-name columns unless matching a legacy name.
- Primary keys are UUID (`@PrimaryGeneratedColumn('uuid')`).
- Timestamps: `@CreateDateColumn()` / `@UpdateDateColumn()`.
- **Money is `numeric`/`decimal`, not float.** `@Column('numeric', { precision: 10, scale: 2 })`. It deserializes as a **string** — always `Number(...)` it in the service mapper before arithmetic or before returning it.
- Secrets/PII excluded from serialization: `@Column({ select: true }) @Exclude() passwordHash`.
- Relations declared on both sides where traversed; foreign-key columns explicit (`@Column() userId` alongside `@ManyToOne`).

## Schema generation & migrations

- **`DB_SYNCHRONIZE=true` is development only.** It auto-creates tables from entities for fast local iteration. It must be `false` in `docker-compose.prod.yml` and any production runner stage. The `db-migration-reviewer` agent flags any production path that enables it.
- Production schema changes go through generated migrations, never `synchronize`. Keep migrations reversible (`up`/`down`) and reviewed.

## Querying

- One `userId` cart, enforced by a unique constraint — **upsert, never blind-create** a second cart.
- Load relations explicitly with `relations: ['items', 'items.product']`; do not rely on eager loading for list endpoints (it explodes payloads).
- **Ownership filters live in the `where` clause**: `findOne({ where: { id, userId } })`. Never fetch by id and check ownership in JS after the fact.
- **Atomic mutations over read-then-write.** Stock decrement is a single conditional `UPDATE ... WHERE stock_quantity >= :qty`; inspect `result.affected`. The same discipline applies to any counter or balance.
- Pagination uses `skip`/`take` derived from validated `page`/`limit`, and returns `PaginatedResponse<T>`.
- Multi-table writes that must be consistent run inside `dataSource.transaction()` (order creation is the canonical example).

## Seeds

- `src/database/seeds/seed.ts` is **idempotent** — re-running it must not duplicate rows. Seed 8 categories, 40 products, 1 admin, 1 customer. Match the credentials documented in `CLAUDE.md`.
