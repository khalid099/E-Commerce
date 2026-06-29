# Rule — NestJS Patterns

The shape every backend feature follows. Deviating from it is a review finding, not a style preference.

## Module anatomy

```
src/feature/
  feature.module.ts       — TypeOrmModule.forFeature([...]), providers, controllers, exports
  feature.controller.ts   — routes, guards, Swagger decorators only
  feature.service.ts      — all business logic; repositories injected here
  dto/                    — one DTO per request body / query shape
  entities/               — TypeORM entities for this feature
```

Register the module in `app.module.ts`. Export the service only if another module injects it.

## Controller

- Thin. A method body is usually a single delegating call: `return this.service.method(user.id, dto)`.
- Class-level guards when every route shares them; the public/admin split is expressed by **two controllers in one file** (see `orders.controller.ts`: `OrdersController` customer-scoped, `AdminOrdersController` admin-scoped). Prefer this over per-route guards.
- Decorate params: `@CurrentUser() user: User`, `@Body() dto`, `@Query() query: QueryDto`, `@Param('id', ParseUUIDPipe) id: string`. UUID params **always** use `ParseUUIDPipe`.
- Every route gets `@ApiOperation({ summary })`; admin routes prefix the summary with `[Admin]`. Controllers carry `@ApiTags` and `@ApiBearerAuth` where auth applies.

## Service

- Inject repositories via `@InjectRepository(Entity)`; inject `DataSource` when you need a transaction (order creation does).
- Services return **plain response shapes from `@ecommerce/shared-types`**, not raw entities. Use a private `mapEntity()` method to convert (see `OrdersService.mapOrder`) — this is where `numeric → Number()` coercion and relation-gating live.
- Multi-write operations that must be all-or-nothing run inside `dataSource.transaction(...)`: order creation decrements stock, snapshots prices, writes order + items, and clears the cart as one unit.
- Business invariants (status transitions, ownership, stock) are enforced here and nowhere else.

## Guards, decorators, filters (in `common/`)

- `JwtAuthGuard` — passport-jwt; populates `req.user`.
- `RolesGuard` + `@Roles(UserRole.ADMIN)` — reads required roles from metadata.
- `@CurrentUser()` — extracts `req.user`; the only sanctioned source of the acting user's id.
- `TransformInterceptor` (global) — wraps responses as `{ success, data }`.
- `HttpExceptionFilter` (global) — the single error formatter.
- `ClassSerializerInterceptor` (global) — honours `@Exclude()` (e.g. `passwordHash`).

## Config

- Env vars are validated at startup in `config/configuration.ts`; the app refuses to boot if a required var is missing. Read everything through `ConfigService` — never `process.env` directly in feature code.
